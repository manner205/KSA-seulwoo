import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/hooks/useStore'
import { daysUntil, dDayLabel, formatDate, isUrgent } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import DdayBadge from '@/components/DdayBadge'
import { Link } from 'react-router-dom'
import { Target, FlaskConical, CalendarClock, MessageSquare } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { evidenceTracks, activities, events, milestones, comments } = useStore()

  // 2028 마일스톤 카운트다운
  const applicationMs = milestones.find(m => m.title.includes('원서'))
  const interviewMs = milestones.find(m => m.title.includes('면접'))

  // 긴급 마감 (7일 이내)
  const urgentEvents = events
    .filter(e => !e.is_conditional && isUrgent(e.application_deadline))
    .sort((a, b) => (daysUntil(a.application_deadline) ?? 999) - (daysUntil(b.application_deadline) ?? 999))

  // 증빙자료 진행률
  const completedEv = evidenceTracks.filter(t => t.status === 'completed' || t.status === 'submitted').length
  const evPercent = evidenceTracks.length > 0 ? Math.round((completedEv / evidenceTracks.length) * 100) : 0

  // 결과 대기 항목
  const awaitingItems = [
    ...activities.filter(a => a.status === 'awaiting_result'),
    ...events.filter(e => e.status === 'awaiting_result'),
  ]

  // 최근 댓글
  const recentComments = [...comments].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* 인사 + 마일스톤 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-xl font-bold mb-1">
          {user?.avatar_emoji} {user?.name}님, 화이팅!
        </h1>
        <p className="text-blue-100 text-sm mb-4">KSA 장영실전형 입학 목표</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/15 rounded-xl p-4">
            <div className="text-xs text-blue-200">원서 접수까지</div>
            {applicationMs ? (
              <>
                <div className="text-2xl font-bold">{dDayLabel(applicationMs.target_date)}</div>
                <div className="text-xs text-blue-200 mt-1">{formatDate(applicationMs.target_date)}</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">D-???</div>
                <div className="text-xs text-blue-200 mt-1">2028.03.20</div>
              </>
            )}
          </div>
          <div className="bg-white/15 rounded-xl p-4">
            <div className="text-xs text-blue-200">구술 면접까지</div>
            {interviewMs ? (
              <>
                <div className="text-2xl font-bold">{dDayLabel(interviewMs.target_date)}</div>
                <div className="text-xs text-blue-200 mt-1">{formatDate(interviewMs.target_date)}</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">D-???</div>
                <div className="text-xs text-blue-200 mt-1">2028.06.23</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 증빙자료 진행률 */}
        <Link to="/roadmap" className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-3">
            <Target size={18} className="text-purple-600" />
            <h2 className="font-semibold">핵심 증빙자료 3건</h2>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
            <div
              className="bg-purple-500 h-3 rounded-full transition-all"
              style={{ width: `${evPercent}%` }}
            />
          </div>
          <div className="text-sm text-slate-500">{completedEv}/{evidenceTracks.length} 완료 ({evPercent}%)</div>
          <div className="mt-3 space-y-1.5">
            {evidenceTracks.map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span>{t.stage}단계: {t.title}</span>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </Link>

        {/* 긴급 마감 */}
        <Link to="/events" className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock size={18} className="text-red-600" />
            <h2 className="font-semibold">마감 임박</h2>
          </div>
          {urgentEvents.length === 0 ? (
            <p className="text-sm text-slate-400">7일 내 마감 항목 없음</p>
          ) : (
            <div className="space-y-2">
              {urgentEvents.map(e => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <span className="truncate mr-2">{e.title}</span>
                  <DdayBadge dateStr={e.application_deadline} />
                </div>
              ))}
            </div>
          )}
        </Link>

        {/* 결과 대기 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical size={18} className="text-fuchsia-600" />
            <h2 className="font-semibold">결과 대기</h2>
          </div>
          {awaitingItems.length === 0 ? (
            <p className="text-sm text-slate-400">대기 중인 항목 없음</p>
          ) : (
            <div className="space-y-2">
              {awaitingItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="truncate mr-2">{item.title}</span>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 최근 댓글 */}
        <Link to="/notes" className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={18} className="text-green-600" />
            <h2 className="font-semibold">최근 댓글</h2>
          </div>
          {recentComments.length === 0 ? (
            <p className="text-sm text-slate-400">댓글 없음</p>
          ) : (
            <div className="space-y-2">
              {recentComments.map(c => (
                <div key={c.id} className="text-sm">
                  <span className="font-medium">{c.author_name}</span>
                  <span className="text-slate-400 mx-1">·</span>
                  <span className="text-slate-600">{c.content.slice(0, 40)}{c.content.length > 40 ? '…' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </Link>
      </div>

      {/* 기타 활동 누적 */}
      <div className="bg-white rounded-xl p-5 border border-slate-200">
        <h2 className="font-semibold mb-3">📋 기타 활동 현황 ({activities.length}건)</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-slate-400">등록된 활동이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {activities.map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{a.title}</span>
                  <span className="text-slate-400 ml-2">{a.organization}</span>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
