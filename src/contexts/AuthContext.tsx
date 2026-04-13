import {
  createContext, useContext, useState,
  useEffect, type ReactNode
} from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

const ADMIN_EMAIL = 'manner205@gmail.com'

interface AuthContextType {
  user: Profile | null
  isAdmin: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  familyMembers: Profile[]
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [familyMembers, setFamilyMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.is_admin === true || user?.email === ADMIN_EMAIL

  async function loadProfile(authUserId: string) {
    const { data: raw, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .single()

    if (error || !raw) {
      setUser(null)
      setFamilyMembers([])
      return
    }

    const data = raw as unknown as Profile
    setUser(data)

    if (data.family_id) {
      const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('family_id', data.family_id)
      setFamilyMembers((members ?? []) as unknown as Profile[])
    } else {
      setFamilyMembers([data])
    }
  }

  async function refreshProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await loadProfile(session.user.id)
  }

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // 로그인/로그아웃 이벤트 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          loadProfile(session.user.id).finally(() => setLoading(false))
        } else {
          setUser(null)
          setFamilyMembers([])
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message.includes('Invalid login credentials')
        ? '이메일 또는 비밀번호가 올바르지 않습니다.'
        : error.message.includes('Email not confirmed')
        ? '이메일 인증이 필요합니다. 받은 편지함을 확인하세요.'
        : error.message
      return { error: msg }
    }
    return { error: null }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setFamilyMembers([])
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🚀</div>
          <p className="text-slate-400 text-sm">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, loading, login, logout, familyMembers, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
