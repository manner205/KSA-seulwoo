import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import type { Profile, Family, UserRole } from '@/types/database'
import { Users, Building2, UserPlus, RefreshCw, Mail, Edit2, Check, X } from 'lucide-react'

// 관리자 전용 임시 클라이언트 (signUp 시 admin 세션 유지용)
const adminSignupClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

type Tab = 'users' | 'families' | 'create'

const ROLE_LABELS: Record<UserRole, string> = {
  student:    '학생',
  parent_dad: '아빠',
  parent_mom: '엄마',
}
const ROLE_EMOJIS: Record<UserRole, string> = {
  student:    '🧑‍🔬',
  parent_dad: '👨‍💻',
  parent_mom: '👩‍🏫',
}

export default function AdminPage() {
  const { isAdmin, refreshProfile } = useAuth()

  const [tab, setTab] = useState<Tab>('users')
  const [profiles, setProfiles]   = useState<Profile[]>([])
  const [families, setFamilies]   = useState<Family[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // ── 계정 생성 폼 ─────────────────────────────────────
  const [form, setForm] = useState({
    email: '', password: '', name: '',
    role: 'parent_dad' as UserRole,
    familyId: '',
  })
  const [creating, setCreating] = useState(false)

  // ── 신규 가족 폼 ─────────────────────────────────────
  const [newFamilyName, setNewFamilyName] = useState('')
  const [creatingFamily, setCreatingFamily] = useState(false)

  // ── 프로필 인라인 편집 ────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null)
  const [editPatch, setEditPatch] = useState<Partial<Profile>>({})

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const fetchAll = useCallback(async () => {
    setLoadingData(true)
    const [p, f] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at') as unknown as
        Promise<{ data: Profile[] | null }>,
      supabase.from('families').select('*').order('name') as unknown as
        Promise<{ data: Family[] | null }>,
    ])
    setProfiles(p.data ?? [])
    setFamilies(f.data ?? [])
    setLoadingData(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── 계정 생성 ────────────────────────────────────────
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password || !form.name) return
    setCreating(true)

    // 별도 클라이언트로 signUp (관리자 세션 유지)
    const { data, error: signUpErr } = await adminSignupClient.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          role: form.role,
          avatar_emoji: ROLE_EMOJIS[form.role],
          family_id: form.familyId || null,
        },
      },
    })

    if (signUpErr || !data.user) {
      showMsg('err', signUpErr?.message ?? '계정 생성 실패')
      setCreating(false)
      return
    }

    // 트리거가 profile을 자동 생성하지만 family_id 가 없을 수 있으므로 upsert
    if (form.familyId) {
      await supabase.from('profiles').update({
        family_id: form.familyId,
        name: form.name,
        role: form.role,
        avatar_emoji: ROLE_EMOJIS[form.role],
      } as any).eq('id', data.user.id)
    }

    showMsg('ok', `${form.name}님 계정이 생성되었습니다. 이메일 인증 후 로그인 가능합니다.`)
    setForm({ email: '', password: '', name: '', role: 'parent_dad', familyId: '' })
    setCreating(false)
    await fetchAll()
  }

  // ── 가족 생성 ────────────────────────────────────────
  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFamilyName.trim()) return
    setCreatingFamily(true)
    const { error } = await supabase.from('families').insert({ name: newFamilyName.trim() } as any)
    if (error) showMsg('err', error.message)
    else {
      showMsg('ok', `'${newFamilyName}' 가족이 생성되었습니다.`)
      setNewFamilyName('')
      await fetchAll()
    }
    setCreatingFamily(false)
  }

  // ── 프로필 편집 저장 ──────────────────────────────────
  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase.from('profiles').update(editPatch as any).eq('id', id)
    if (error) {
      showMsg('err', `저장 실패: ${error.message}`)
    } else {
      await fetchAll()  // DB에서 최신 데이터 재로드
      if (editPatch.family_id !== undefined) await refreshProfile()
      showMsg('ok', '저장되었습니다.')
      setEditId(null)
      setEditPatch({})
    }
  }

  // ── 비밀번호 재설정 메일 ────────────────────────────────
  const handleResetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) showMsg('err', error.message)
    else showMsg('ok', `${email} 으로 비밀번호 재설정 메일을 발송했습니다.`)
  }

  // 관리자 아닌 경우 리다이렉트 (모든 hooks 선언 이후에 위치)
  if (!isAdmin) return <Navigate to="/" replace />

  const familyName = (fid: string | null) =>
    families.find(f => f.id === fid)?.name ?? '미배정'

  const TAB_CONFIG: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'users',    icon: <Users size={18} />,     label: '계정 목록' },
    { id: 'families', icon: <Building2 size={18} />, label: '가족 관리' },
    { id: 'create',   icon: <UserPlus size={18} />,  label: '신규 계정' },
  ]

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">🛡️ 관리자 패널</h1>
        <button
          onClick={fetchAll}
          disabled={loadingData}
          className="flex items-center gap-1.5 text-sm text-slate-500
                     hover:text-blue-600 transition disabled:opacity-40"
        >
          <RefreshCw size={15} className={loadingData ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {/* 메시지 */}
      {msg && (
        <div className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
          msg.type === 'ok'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {msg.text}
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {TAB_CONFIG.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5
                        text-sm font-medium py-2 rounded-lg transition
                        ${tab === t.id
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── 계정 목록 ── */}
      {tab === 'users' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">총 {profiles.length}개 계정</p>
          {profiles.map(p => (
            <div key={p.id}
              className="bg-white rounded-xl border border-slate-200 p-4">
              {editId === p.id ? (
                /* 편집 모드 */
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editPatch.name ?? p.name}
                      onChange={e => setEditPatch(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="이름"
                      className="border rounded-lg px-2 py-1.5 text-sm"
                    />
                    <select
                      value={editPatch.role ?? p.role}
                      onChange={e => setEditPatch(prev => ({
                        ...prev,
                        role: e.target.value as UserRole,
                        avatar_emoji: ROLE_EMOJIS[e.target.value as UserRole],
                      }))}
                      className="border rounded-lg px-2 py-1.5 text-sm"
                    >
                      {Object.entries(ROLE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={editPatch.family_id ?? p.family_id ?? ''}
                    onChange={e => setEditPatch(prev => ({
                      ...prev, family_id: e.target.value || null
                    }))}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="">가족 미배정</option>
                    {families.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(p.id)}
                      className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg"
                    >
                      <Check size={13} /> 저장
                    </button>
                    <button
                      onClick={() => { setEditId(null); setEditPatch({}) }}
                      className="flex items-center gap-1 text-xs border px-3 py-1.5 rounded-lg text-slate-500"
                    >
                      <X size={13} /> 취소
                    </button>
                  </div>
                </div>
              ) : (
                /* 보기 모드 */
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0">{p.avatar_emoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm">{p.name}</span>
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          {ROLE_LABELS[p.role]}
                        </span>
                        {p.is_admin && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                            관리자
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{p.email}</div>
                      <div className="text-xs text-slate-400">{familyName(p.family_id)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditId(p.id)
                        setEditPatch({ name: p.name, role: p.role, family_id: p.family_id })
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition"
                      title="편집"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleResetPassword(p.email)}
                      className="p-1.5 text-slate-400 hover:text-orange-500 rounded transition"
                      title="비밀번호 재설정 메일"
                    >
                      <Mail size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 가족 관리 ── */}
      {tab === 'families' && (
        <div className="space-y-4">
          {/* 신규 가족 생성 */}
          <form onSubmit={handleCreateFamily}
            className="bg-blue-50 rounded-xl p-4 space-y-3">
            <h2 className="font-semibold text-sm text-blue-800">새 가족 그룹 생성</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFamilyName}
                onChange={e => setNewFamilyName(e.target.value)}
                placeholder="가족 이름 (예: 홍길동 가족)"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={creatingFamily || !newFamilyName.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm
                           hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
              >
                생성
              </button>
            </div>
          </form>

          {/* 가족 목록 */}
          <div className="space-y-2">
            {families.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">
                생성된 가족 그룹이 없습니다.
              </p>
            )}
            {families.map(f => {
              const members = profiles.filter(p => p.family_id === f.id)
              return (
                <div key={f.id}
                  className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="font-semibold text-sm mb-2">{f.name}</div>
                  {members.length === 0 ? (
                    <p className="text-xs text-slate-400">구성원 없음</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {members.map(m => (
                        <span key={m.id}
                          className="flex items-center gap-1 text-xs
                                     bg-slate-50 border border-slate-200
                                     px-2 py-1 rounded-full">
                          {m.avatar_emoji} {m.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 신규 계정 생성 ── */}
      {tab === 'create' && (
        <form onSubmit={handleCreateUser}
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-800">신규 계정 생성</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">이름</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="홍길동"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                임시 비밀번호
              </label>
              <input
                type="text"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="최소 6자"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                minLength={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">역할</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{ROLE_EMOJIS[k as UserRole]} {v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">가족 배정</label>
                <select
                  value={form.familyId}
                  onChange={e => setForm({ ...form, familyId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">미배정</option>
                  {families.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold
                       rounded-lg py-2.5 text-sm transition disabled:opacity-50"
          >
            {creating ? '생성 중...' : '계정 생성'}
          </button>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            <strong>안내:</strong> 이메일 인증이 활성화된 경우, 새 사용자는 이메일을 확인해야
            로그인할 수 있습니다. 이메일 인증 없이 바로 로그인하려면 Supabase 대시보드 →
            Authentication → Settings → <strong>Enable email confirmations</strong>를 해제하세요.
          </div>
        </form>
      )}
    </div>
  )
}
