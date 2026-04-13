import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await login(email.trim(), password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-sm w-full">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚀</div>
          <h1 className="text-2xl font-bold text-blue-700">KSA 준비</h1>
          <p className="text-slate-500 text-sm mt-1">
            이슬우 · 장영실전형 포트폴리오 매니지먼트
          </p>
        </div>

        {/* 로그인 폼 */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              autoComplete="email"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700
                            rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold
                       rounded-lg py-2.5 text-sm transition disabled:opacity-50
                       disabled:cursor-not-allowed"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          목표: 2028.03.20 원서 접수 · 2028.06.23 심층 구술 면접
        </p>
      </div>
    </div>
  )
}
