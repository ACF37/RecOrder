import { ref, computed } from 'vue'
import {
  supabase,
  type ToppingOption,
  type HotdogEntryWithToppings,
} from '../lib/supabase'

// トッピングオプション
export const toppingOptions = ref<ToppingOption[]>([])

// ホットドッグエントリー
export const entries = ref<HotdogEntryWithToppings[]>([])

// ローディング状態
export const loading = ref(false)
export const error = ref<string | null>(null)

// 初期化: トッピングオプションを取得
export async function initializeStore() {
  loading.value = true
  error.value = null

  try {
    const { data, error: fetchError } = await supabase
      .from('topping_options')
      .select('*')
      .order('display_order', { ascending: true })

    if (fetchError) throw fetchError

    toppingOptions.value = data || []
  } catch (e) {
    error.value = e instanceof Error ? e.message : '初期化エラー'
    console.error('初期化エラー:', e)
  } finally {
    loading.value = false
  }
}

// エントリーの取得（トッピング情報も結合）
export async function fetchEntries() {
  loading.value = true
  error.value = null

  try {
    // 1. ホットドッグエントリーを取得
    const { data: entriesData, error: entriesError } = await supabase
      .from('hotdog_entries')
      .select('*')
      .order('created_at', { ascending: true })

    if (entriesError) throw entriesError

    // 2. 各エントリーのトッピング情報を取得
    const entriesWithToppings: HotdogEntryWithToppings[] = []

    for (const entry of entriesData || []) {
      const { data: toppingsData, error: toppingsError } = await supabase
        .from('entry_toppings')
        .select(
          `
          topping_id,
          topping_options (*)
        `
        )
        .eq('entry_id', entry.id)

      if (toppingsError) throw toppingsError

      const toppings: ToppingOption[] = (toppingsData || [])
        .map((et: any) => et.topping_options)
        .filter(Boolean)
        .sort((a, b) => a.display_order - b.display_order)

      entriesWithToppings.push({
        ...entry,
        toppings,
      })
    }

    entries.value = entriesWithToppings
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'エントリー取得エラー'
    console.error('エントリー取得エラー:', e)
  } finally {
    loading.value = false
  }
}

// エントリーの追加
export async function addEntry(toppingIds: string[]) {
  loading.value = true
  error.value = null

  try {
    // 1. エントリーを作成
    const { data: newEntry, error: entryError } = await supabase
      .from('hotdog_entries')
      .insert({
        completed: false,
        completed_at: null,
      })
      .select()
      .single()

    if (entryError) throw entryError

    // 2. トッピングを関連付け
    if (toppingIds.length > 0) {
      const entryToppings = toppingIds.map((toppingId) => ({
        entry_id: newEntry.id,
        topping_id: toppingId,
      }))

      const { error: toppingsError } = await supabase
        .from('entry_toppings')
        .insert(entryToppings)

      if (toppingsError) throw toppingsError
    }

    // 3. 最新のエントリーリストを再取得
    await fetchEntries()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'エントリー追加エラー'
    console.error('エントリー追加エラー:', e)
  } finally {
    loading.value = false
  }
}

// エントリーの削除
export async function deleteEntry(id: string) {
  loading.value = true
  error.value = null

  try {
    const { error: deleteError } = await supabase
      .from('hotdog_entries')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    // エントリーリストを再取得
    await fetchEntries()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'エントリー削除エラー'
    console.error('エントリー削除エラー:', e)
  } finally {
    loading.value = false
  }
}

// エントリーの完了
export async function completeEntry(id: string) {
  loading.value = true
  error.value = null

  try {
    const { error: updateError } = await supabase
      .from('hotdog_entries')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw updateError

    // エントリーリストを再取得
    await fetchEntries()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'エントリー完了エラー'
    console.error('エントリー完了エラー:', e)
  } finally {
    loading.value = false
  }
}

// エントリーの未完了化
export async function uncompleteEntry(id: string) {
  loading.value = true
  error.value = null

  try {
    const { error: updateError } = await supabase
      .from('hotdog_entries')
      .update({
        completed: false,
        completed_at: null,
      })
      .eq('id', id)

    if (updateError) throw updateError

    // エントリーリストを再取得
    await fetchEntries()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'エントリー未完了化エラー'
    console.error('エントリー未完了化エラー:', e)
  } finally {
    loading.value = false
  }
}

// 全データの削除
export async function clearAllData() {
  loading.value = true
  error.value = null

  try {
    const { error: deleteError } = await supabase
      .from('hotdog_entries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 全件削除

    if (deleteError) throw deleteError

    entries.value = []
  } catch (e) {
    error.value = e instanceof Error ? e.message : '全削除エラー'
    console.error('全削除エラー:', e)
  } finally {
    loading.value = false
  }
}

// カスタムトッピングの追加
export async function addCustomTopping(name: string, emoji: string) {
  loading.value = true
  error.value = null

  try {
    // 最大のdisplay_orderを取得
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from('topping_options')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    if (maxOrderError && maxOrderError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw maxOrderError
    }

    const nextOrder = maxOrderData ? maxOrderData.display_order + 1 : 1

    // 新しいトッピングを追加
    const { error: insertError } = await supabase
      .from('topping_options')
      .insert({
        name,
        emoji,
        display_order: nextOrder,
      })

    if (insertError) throw insertError

    // トッピングリストを再取得
    await initializeStore()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'トッピング追加エラー'
    console.error('トッピング追加エラー:', e)
  } finally {
    loading.value = false
  }
}

// ===== Computed Properties =====

// ソート済みエントリー（未完了が上）
export const sortedEntries = computed(() => {
  return [...entries.value].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
})

// 合計ホットドッグ数
export const totalHotdogs = computed(() => entries.value.length)

// トッピングの出現頻度
export const toppingFrequency = computed(() => {
  const frequency: Record<string, number> = {}

  entries.value.forEach((entry) => {
    if (entry.toppings.length === 0) {
      frequency['🌭 ノーマル'] = (frequency['🌭 ノーマル'] || 0) + 1
    } else {
      entry.toppings.forEach((topping) => {
        const key = `${topping.emoji} ${topping.name}`
        frequency[key] = (frequency[key] || 0) + 1
      })
    }
  })

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
})

// 時間ごとの売上（24時間）
export const hourlySales = computed(() => {
  const sales = Array(24).fill(0)

  entries.value.forEach((entry) => {
    const hour = new Date(entry.created_at).getHours()
    sales[hour]++
  })

  return sales
})

// ===== Real-time Subscriptions =====

// リアルタイム更新の購読
export function subscribeToEntries() {
  const channel = supabase
    .channel('hotdog_entries_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'hotdog_entries',
      },
      () => {
        // エントリーが変更されたら再取得
        fetchEntries()
      }
    )
    .subscribe()

  return channel
}

// LocalStorage からのマイグレーション（初回のみ）
export async function migrateFromLocalStorage() {
  const v2Data = localStorage.getItem('recorder.hotdogs.v2')
  const v1Data = localStorage.getItem('recorder.hotdogs.v1')

  if (!v2Data && !v1Data) {
    return // マイグレーション不要
  }

  loading.value = true
  error.value = null

  try {
    let localEntries: any[] = []

    if (v2Data) {
      localEntries = JSON.parse(v2Data)
    } else if (v1Data) {
      const v1Entries = JSON.parse(v1Data)
      localEntries = v1Entries.map((entry: any) => ({
        ...entry,
        completed: true,
        completedAt: entry.createdAt,
      }))
    }

    // Supabase にマイグレーション
    for (const localEntry of localEntries) {
      // トッピング名からIDを解決
      const toppingIds = localEntry.toppings
        .map((toppingName: string) => {
          const option = toppingOptions.value.find(
            (opt) => opt.name === toppingName
          )
          return option?.id
        })
        .filter(Boolean)

      // エントリーを作成
      const { data: newEntry, error: entryError } = await supabase
        .from('hotdog_entries')
        .insert({
          created_at: localEntry.createdAt,
          completed: localEntry.completed || false,
          completed_at: localEntry.completedAt || null,
        })
        .select()
        .single()

      if (entryError) throw entryError

      // トッピングを関連付け
      if (toppingIds.length > 0) {
        const entryToppings = toppingIds.map((toppingId: string) => ({
          entry_id: newEntry.id,
          topping_id: toppingId,
        }))

        const { error: toppingsError } = await supabase
          .from('entry_toppings')
          .insert(entryToppings)

        if (toppingsError) throw toppingsError
      }
    }

    // マイグレーション完了後、LocalStorageをクリア
    localStorage.removeItem('recorder.hotdogs.v2')
    localStorage.removeItem('recorder.hotdogs.v1')

    console.log('LocalStorageからSupabaseへのマイグレーション完了')

    // エントリーを再取得
    await fetchEntries()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'マイグレーションエラー'
    console.error('マイグレーションエラー:', e)
  } finally {
    loading.value = false
  }
}
