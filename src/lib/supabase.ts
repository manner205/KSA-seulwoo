import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.')
}

// Database 제네릭 없이 생성 — 쿼리 결과는 각 호출부에서 명시적 캐스팅
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
