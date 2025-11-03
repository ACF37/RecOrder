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

// LocalStorage のキー（マイグレーション用）
const STORAGE_KEY = 'recorder.hotdogs.v2'
const OLD_STORAGE_KEY = 'recorder.hotdogs.v1'

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
    // 1回のクエリで全てを取得（JOIN使用）
    const { data, error: fetchError } = await supabase
      .from('hotdog_entries')
      .select(
        `
        *,
        entry_toppings (
          topping_options (*)
        )
      `
      )
      .order('created_at', { ascending: true })

    if (fetchError) throw fetchError

    // データを正しい型に変換
    entries.value = (data || []).map((entry: any) => ({
      ...entry,
      toppings: entry.entry_toppings?.map((et: any) => et.topping_options) || [],
    }))
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
    const { data: newEntry, error: insertError } = await supabase
      .from('hotdog_entries')
      .insert({
        completed: false,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // 2. トッピングの関連を作成
    if (toppingIds.length > 0) {
      const entryToppings = toppingIds.map((toppingId) => ({
        entry_id: newEntry.id,
        topping_id: toppingId,
      }))

      const { error: toppingError } = await supabase
        .from('entry_toppings')
        .insert(entryToppings)

      if (toppingError) throw toppingError
    }

    // 3. 即座に再取得（自分の変更は即反映）
    await fetchEntries()

    // 4. 他のクライアントに通知（Broadcast）
    await broadcastChange('INSERT', newEntry.id)
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
    // 1. entry_toppings を削除（外部キー制約のため先に削除）
    const { error: deleteToppingsError } = await supabase
      .from('entry_toppings')
      .delete()
      .eq('entry_id', id)

    if (deleteToppingsError) throw deleteToppingsError

    // 2. エントリーを削除
    const { error: deleteError } = await supabase
      .from('hotdog_entries')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    // 3. 即座に再取得
    await fetchEntries()

    // 4. 他のクライアントに通知
    await broadcastChange('DELETE', id)
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

    // 即座に再取得
    await fetchEntries()

    // 他のクライアントに通知
    await broadcastChange('UPDATE', id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'エントリー完了エラー'
    console.error('エントリー完了エラー:', e)
  } finally {
    loading.value = false
  }
}

// エントリーの完了解除
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

    // 即座に再取得
    await fetchEntries()

    // 他のクライアントに通知
    await broadcastChange('UPDATE', id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'エントリー完了解除エラー'
    console.error('エントリー完了解除エラー:', e)
  } finally {
    loading.value = false
  }
}

// カスタムトッピングの追加
export async function addCustomTopping(name: string, emoji: string) {
  loading.value = true
  error.value = null

  try {
    const displayOrder =
      toppingOptions.value.length > 0
        ? Math.max(...toppingOptions.value.map((t) => t.display_order)) + 1
        : 0

    const { data, error: insertError } = await supabase
      .from('topping_options')
      .insert({
        name,
        emoji,
        display_order: displayOrder,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // ローカルに即座に追加
    toppingOptions.value.push(data)

    // 他のクライアントに通知（トッピング追加は少ないので直接通知）
    await broadcastToppingChange()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'トッピング追加エラー'
    console.error('トッピング追加エラー:', e)
  } finally {
    loading.value = false
  }
}

// 全エントリーをクリア
export async function clearAllEntries() {
  loading.value = true
  error.value = null

  try {
    // 1. すべての entry_toppings を削除
    const { error: deleteToppingsError } = await supabase
      .from('entry_toppings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 全削除

    if (deleteToppingsError) throw deleteToppingsError

    // 2. すべての hotdog_entries を削除
    const { error: deleteEntriesError } = await supabase
      .from('hotdog_entries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 全削除

    if (deleteEntriesError) throw deleteEntriesError

    // 即座にローカルをクリア
    entries.value = []

    // 他のクライアントに通知
    await broadcastChange('DELETE', 'ALL')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '全クリアエラー'
    console.error('全クリアエラー:', e)
  } finally {
    loading.value = false
  }
}

// 完了済みエントリーのみソート（上部に表示）
export const sortedEntries = computed(() => {
  const completed = entries.value
    .filter((e) => e.completed)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

  const pending = entries.value
    .filter((e) => !e.completed)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

  return [...completed, ...pending]
})

// 統計用の計算プロパティ
export const stats = computed(() => {
  const total = entries.value.length
  const completed = entries.value.filter((e) => e.completed).length
  const pending = total - completed

  // トッピングの頻度を計算
  const toppingFrequency: Record<string, number> = {}
  entries.value.forEach((entry) => {
    entry.toppings.forEach((topping) => {
      const key = `${topping.emoji} ${topping.name}`
      toppingFrequency[key] = (toppingFrequency[key] || 0) + 1
    })
  })

  // 頻度順にソート
  const sortedToppings = Object.entries(toppingFrequency)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }))

  return {
    total,
    completed,
    pending,
    toppingFrequency: sortedToppings,
  }
})

// ===== Broadcast 型リアルタイム =====
let realtimeChannel: any = null

// デバウンス用タイマー
let debounceTimer: number | null = null

function debouncedFetchEntries() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = window.setTimeout(() => {
    console.log('🔄 他デバイスの変更を検知 → データ再取得')
    fetchEntries()
  }, 300)
}

// Broadcast でリアルタイム通知を購読
export function subscribeToEntries() {
  console.log('🔵 Realtime: Broadcast モード開始...')

  realtimeChannel = supabase
    .channel('hotdog_changes', {
      config: {
        broadcast: { self: false }, // 自分の送信は受信しない
      },
    })
    .on('broadcast', { event: 'entry_change' }, (payload) => {
      console.log('🟢 他デバイスから変更通知:', payload)
      debouncedFetchEntries()
    })
    .on('broadcast', { event: 'topping_change' }, () => {
      console.log('🟢 トッピング変更通知')
      initializeStore() // トッピングを再取得
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime: Broadcast接続成功（Replication不要）')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Realtime: 接続エラー')
      } else if (status === 'TIMED_OUT') {
        console.error('⏱️ Realtime: タイムアウト')
      } else {
        console.log('🔵 Realtime ステータス:', status)
      }
    })

  return realtimeChannel
}

// 他のクライアントに変更を通知（Broadcast送信）
async function broadcastChange(eventType: string, entryId: string) {
  if (!realtimeChannel) return

  await realtimeChannel.send({
    type: 'broadcast',
    event: 'entry_change',
    payload: { eventType, entryId, timestamp: Date.now() },
  })

  console.log('📤 変更通知を送信:', eventType, entryId)
}

// トッピング変更を通知
async function broadcastToppingChange() {
  if (!realtimeChannel) return

  await realtimeChannel.send({
    type: 'broadcast',
    event: 'topping_change',
    payload: { timestamp: Date.now() },
  })

  console.log('📤 トッピング変更通知を送信')
}

// チャンネルのクリーンアップ
export function unsubscribeFromEntries() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
    console.log('🔌 Realtime: 切断')
  }
}

// ===== LocalStorage からの移行 =====
export async function migrateFromLocalStorage() {
  try {
    // v2 のデータを確認
    const v2Data = localStorage.getItem(STORAGE_KEY)
    if (v2Data) {
      console.log('📦 LocalStorage v2 データ検出 → Supabase に移行開始')
      await migrateV2Data(v2Data)
      localStorage.removeItem(STORAGE_KEY)
      console.log('✅ v2 データ移行完了')
      return
    }

    // v1 のデータを確認
    const v1Data = localStorage.getItem(OLD_STORAGE_KEY)
    if (v1Data) {
      console.log('📦 LocalStorage v1 データ検出 → Supabase に移行開始')
      await migrateV1Data(v1Data)
      localStorage.removeItem(OLD_STORAGE_KEY)
      console.log('✅ v1 データ移行完了')
      return
    }

    console.log('ℹ️ LocalStorage に移行データなし')
  } catch (e) {
    console.error('移行エラー:', e)
  }
}

async function migrateV2Data(jsonData: string) {
  try {
    const data = JSON.parse(jsonData)

    // 各エントリーを Supabase に挿入
    for (const entry of data.entries || []) {
      const { data: newEntry, error: insertError } = await supabase
        .from('hotdog_entries')
        .insert({
          created_at: entry.createdAt,
          completed: entry.completed || false,
          completed_at: entry.completedAt || null,
        })
        .select()
        .single()

      if (insertError) {
        console.error('エントリー移行エラー:', insertError)
        continue
      }

      // トッピングを挿入（既存のトッピングとマッチング）
      for (const toppingName of entry.toppings || []) {
        const matchedTopping = toppingOptions.value.find(
          (t) => t.name === toppingName
        )

        if (matchedTopping) {
          await supabase.from('entry_toppings').insert({
            entry_id: newEntry.id,
            topping_id: matchedTopping.id,
          })
        }
      }
    }

    console.log('✅ v2 データ移行完了')
  } catch (e) {
    console.error('v2 データ移行エラー:', e)
  }
}

async function migrateV1Data(jsonData: string) {
  try {
    const data = JSON.parse(jsonData)

    for (const entry of data || []) {
      const { data: newEntry, error: insertError } = await supabase
        .from('hotdog_entries')
        .insert({
          created_at: entry.createdAt,
          completed: false, // v1 には completed フィールドがない
          completed_at: null,
        })
        .select()
        .single()

      if (insertError) {
        console.error('エントリー移行エラー:', insertError)
        continue
      }

      for (const toppingName of entry.toppings || []) {
        const matchedTopping = toppingOptions.value.find(
          (t) => t.name === toppingName
        )

        if (matchedTopping) {
          await supabase.from('entry_toppings').insert({
            entry_id: newEntry.id,
            topping_id: matchedTopping.id,
          })
        }
      }
    }

    console.log('✅ v1 データ移行完了')
  } catch (e) {
    console.error('v1 データ移行エラー:', e)
  }
}
