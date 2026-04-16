import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, Map, CalendarDays,
  MessageSquare, LogOut, ShieldCheck
} from 'lucide-react'

export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth()

  const NAV = [
    { to: '/',        icon: LayoutDashboard, label: '대시보드', end: true },
    { to: '/roadmap', icon: Map,             label: '포트폴리오', end: false },
    { to: '/events',  icon: CalendarDays,    label: '행사 일정', end: false },
    { to: '/notes',   icon: MessageSquare,   label: '공유 메모', end: false },
    { to: '/admin',   icon: ShieldCheck,     label: '관리', end: false },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* 상단 헤더 */}
      <header className="bg-white border-b border-slate-200 px-4 py-3
                          flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-blue-600">🚀 KSA 준비</span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            이슬우 · 장영실전형
          </span>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm hidden sm:inline">
              {user.avatar_emoji} {user.name}
            </span>
            {isAdmin && (
              <span className="text-xs bg-yellow-100 text-yellow-700
                               px-1.5 py-0.5 rounded font-medium hidden sm:inline">
                관리자
              </span>
            )}
            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-500 transition"
              title="로그아웃"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </header>

      <div className="flex flex-1">
        {/* 사이드 네비 (데스크톱) */}
        <nav className="hidden md:flex flex-col w-56 bg-white
                        border-r border-slate-200 p-4 gap-1">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                 font-medium transition
                 ${isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* 하단 네비 (모바일) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white
                      border-t border-slate-200 flex justify-around py-2 z-30">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-xs px-2
               ${isActive ? 'text-blue-600' : 'text-slate-400'}`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
