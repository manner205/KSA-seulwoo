import { useState, useMemo } from 'react'
import { useStore } from '@/hooks/useStore'
import { useAuth } from '@/contexts/AuthContext'
import DdayBadge from '@/components/DdayBadge'
import LinkAdder from '@/components/LinkAdder'
import FileAttachment from '@/components/FileAttachment'
import type { ItemStatus, ActivityRecord, ActivityCategory } from '@/types/database'
import { STATUS_LABELS, generateId, formatDate, formatDateTime } from '@/lib/utils'

const ALL_STATUSES: ItemStatus[] = ['planned', 'preparing', 'submitted', 'awaiting_result', 'accepted', 'not_selected', 'completed']
const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  school_research: '교내 탐구',
  science_event: '과학행사',
  gifted_education: '영재교육원',
  reading_presentation: '독서/발표',
  other: '기타',
}

export default function RoadmapPage() {
  const { user } = useAuth()
  const {
    evidenceTracks, updateEvidenceTrack,
    activities, addActivity, updateActivity, deleteActivity,
    events, updateEvent,
    comments, addComment, updateComment, deleteComment,
  } = useStore()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const totalFileCount = useMemo(() => {
    const etCount  = evidenceTracks.reduce((s, t) => s + (Array.isArray(t.attachments) ? t.attachments.length : 0), 0)
    const actCount = activities.reduce((s, a) => s + (Array.isArray(a.attachments) ? a.attachments.length : 0), 0)
    const evtCount = events.reduce((s, e) => s + (Array.isArray(e.attachments) ? e.attachments.length : 0), 0)
    return etCount + actCount + evtCount
  }, [evidenceTracks, activities, events])

  const [newAct, setNewAct] = useState({
    title: '', category: 'school_research' as ActivityCategory,
    organization: '', period: '', purpose: '',
  })

  const handleAddActivity = () => {
    if (!newAct.title.trim()) return
    const item: ActivityRecord = {
      id: generateId(),
      family_id: user?.family_id ?? '',
      title: newAct.title,
      category: newAct.category,
      organization: newAct.organization,
      period: newAct.period,
      result: '',
      can_use_as_evidence: false,
      purpose: newAct.purpose,
      status: 'planned',
      attachments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    addActivity(item)
    setNewAct({ title: '', category: 'school_research', organization: '', period: '', purpose: '' })
    setShowAddForm(false)
  }

  const handleAddComment = (parentType: 'evidence_track' | 'activity_record' | 'science_event', parentId: string) => {
    const text = newComment[parentId]?.trim()
    if (!text || !user) return
    addComment({
      id: generateId(),
      family_id: user.family_id ?? '',
      parent_type: parentType,
      parent_id: parentId,
      content: text,
      author_id: user.id,
      author_name: user.name,
      author_role: user.role,
      created_at: new Date().toISOString(),
    })
    setNewComment(prev => ({ ...prev, [parentId]: '' }))
  }

  const startEdit = (id: string, content: string) => {
    setEditingComment(id)
    setEditText(content)
  }

  const saveEdit = (id: string) => {
    if (editText.trim()) updateComment(id, editText.trim())
    setEditingComment(null)
  }

  const getComments = (parentId: string) =>
    comments.filter(c => c.parent_id === parentId).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

  const renderComments = (parentType: 'evidence_track' | 'activity_record' | 'science_event', parentId: string) => (
    <div className="border-t pt-3 mt-3">
      {getComments(parentId).map(c => (
        <div key={c.id} className="mb-1.5">
          {editingComment === c.id ? (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') setEditingComment(null) }}
                className="flex-1 text-sm border rounded px-2 py-1"
                autoFocus
              />
              <button onClick={() => saveEdit(c.id)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">저장</button>
              <button onClick={() => setEditingComment(null)} className="text-xs text-slate-400">취소</button>
            </div>
          ) : (
            <div className="flex items-start justify-between group">
              <div className="text-sm">
                <span className="font-medium">{c.author_name}</span>
                <span className="text-slate-400 mx-1">·</span>
                <span>{c.content}</span>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                <button onClick={() => startEdit(c.id, c.content)} className="text-xs text-slate-400 hover:text-blue-600">수정</button>
                <button onClick={() => deleteComment(c.id)} className="text-xs text-slate-400 hover:text-red-500">삭제</button>
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          placeholder="댓글 입력..."
          value={newComment[parentId] ?? ''}
          onChange={e => setNewComment(prev => ({ ...prev, [parentId]: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleAddComment(parentType, parentId)}
          className="flex-1 text-sm border rounded-lg px-3 py-1.5"
        />
        <button
          onClick={() => handleAddComment(parentType, parentId)}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
        >
          등록
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">📋 포트폴리오 로드맵</h1>

      {/* ── 핵심 증빙자료 3건 ── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-purple-700">🎯 핵심 증빙자료 (탐구활동 3건)</h2>
        <div className="space-y-4">
          {evidenceTracks.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-purple-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs font-bold text-purple-500 mr-2">{t.stage}단계</span>
                  <span className="font-semibold text-lg">{t.title}</span>
                </div>
                <select
                  value={t.status}
                  onChange={e => updateEvidenceTrack(t.id, { status: e.target.value as ItemStatus })}
                  className="text-sm border rounded-lg px-2 py-1"
                >
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="text-sm text-slate-500 mb-1">📅 {t.target_period}</div>
              <div className="text-sm text-slate-500 mb-1">🔬 연구 주제: {t.research_topic}</div>
              <div className="text-sm text-slate-600 mb-3">{t.description}</div>

              <LinkAdder
                currentLinks={t.links}
                onUpdate={links => updateEvidenceTrack(t.id, { links })}
              />

              <FileAttachment
                attachments={t.attachments}
                onUpdate={atts => updateEvidenceTrack(t.id, { attachments: atts })}
                totalFileCount={totalFileCount}
              />

              {renderComments('evidence_track', t.id)}
            </div>
          ))}
        </div>
      </section>

      {/* ── 기타 활동 ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-700">📚 기타 활동</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showAddForm ? '취소' : '+ 활동 추가'}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-blue-50 rounded-xl p-5 mb-4 space-y-3">
            <input type="text" placeholder="활동명" value={newAct.title}
              onChange={e => setNewAct({ ...newAct, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <select value={newAct.category}
                onChange={e => setNewAct({ ...newAct, category: e.target.value as ActivityCategory })}
                className="border rounded-lg px-3 py-2 text-sm">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="text" placeholder="기관/학교" value={newAct.organization}
                onChange={e => setNewAct({ ...newAct, organization: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <input type="text" placeholder="기간 (예: 2026년 5월)" value={newAct.period}
              onChange={e => setNewAct({ ...newAct, period: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input type="text" placeholder="서류 활용 목적" value={newAct.purpose}
              onChange={e => setNewAct({ ...newAct, purpose: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
            <button onClick={handleAddActivity}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              저장
            </button>
          </div>
        )}

        <div className="space-y-3">
          {activities.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 mr-2">{CATEGORY_LABELS[a.category]}</span>
                  <span className="font-semibold">{a.title}</span>
                  {a.can_use_as_evidence && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">증빙가능</span>}
                </div>
                <div className="flex items-center gap-2">
                  <select value={a.status}
                    onChange={e => updateActivity(a.id, { status: e.target.value as ItemStatus })}
                    className="text-xs border rounded px-1.5 py-1">
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                  <button onClick={() => deleteActivity(a.id)}
                    className="text-xs text-red-400 hover:text-red-600">삭제</button>
                </div>
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {a.organization && <span>{a.organization} · </span>}
                {a.period}
                {a.result && <span> · {a.result}</span>}
              </div>
              {a.purpose && <div className="text-xs text-slate-400 mt-1">목적: {a.purpose}</div>}

              <FileAttachment
                attachments={a.attachments}
                onUpdate={atts => updateActivity(a.id, { attachments: atts })}
                totalFileCount={totalFileCount}
              />

              {renderComments('activity_record', a.id)}
            </div>
          ))}
        </div>
      </section>

      {/* ── 과학행사 ── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-teal-700">🌟 과학행사</h2>
        <p className="text-sm text-slate-500 mb-3">행사 일정 페이지에서 등록한 행사가 자동으로 표시됩니다.</p>
        {events.length === 0 ? (
          <div className="text-sm text-slate-400 bg-white rounded-xl border border-slate-200 p-5 text-center">
            등록된 행사가 없습니다. 행사 일정 페이지에서 추가해보세요.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(evt => {
              const isActive = !evt.is_conditional || (() => {
                if (!evt.condition_parent_id) return true
                const parent = events.find(e => e.id === evt.condition_parent_id)
                return parent?.status === 'accepted'
              })()
              return (
                <div key={evt.id}
                  className={`bg-white rounded-xl border p-4 transition
                    ${evt.is_conditional && !isActive ? 'opacity-50 border-dashed border-slate-300' : 'border-teal-200'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-semibold">{evt.title}</span>
                      {evt.requires_video && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🎬 영상 제출</span>
                      )}
                      {evt.is_conditional && !isActive && (
                        <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">조건부</span>
                      )}
                    </div>
                    <select value={evt.status}
                      onChange={e => updateEvent(evt.id, { status: e.target.value as ItemStatus })}
                      className="text-xs border rounded px-1.5 py-1">
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-500 mt-1">
                    {evt.application_deadline && (
                      <span>📋 마감: {formatDateTime(evt.application_deadline)} <DdayBadge dateStr={evt.application_deadline} /></span>
                    )}
                    {evt.event_date && (
                      <span>📅 행사: {formatDate(evt.event_date)}{evt.event_end_date ? ` ~ ${formatDate(evt.event_end_date)}` : ''}</span>
                    )}
                  </div>

                  <LinkAdder
                    currentLinks={evt.links}
                    onUpdate={links => updateEvent(evt.id, { links })}
                  />

                  <FileAttachment
                    attachments={evt.attachments}
                    onUpdate={atts => updateEvent(evt.id, { attachments: atts })}
                    totalFileCount={totalFileCount}
                  />

                  {evt.preparation_notes && (
                    <div className="mt-1 text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1">
                      📝 {evt.preparation_notes}
                    </div>
                  )}

                  {renderComments('science_event', evt.id)}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
