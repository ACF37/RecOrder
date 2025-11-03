import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase環境変数が設定されていません。.envファイルを確認してください。'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 型定義
export interface ToppingOption {
  id: string
  name: string
  emoji: string
  display_order: number
  created_at: string
}

export interface HotdogEntry {
  id: string
  created_at: string
  completed: boolean
  completed_at: string | null
  user_id: string | null
}

export interface EntryTopping {
  id: string
  entry_id: string
  topping_id: string
  created_at: string
}

// トッピング情報を含むエントリー（結合結果）
export interface HotdogEntryWithToppings extends HotdogEntry {
  toppings: ToppingOption[]
}
