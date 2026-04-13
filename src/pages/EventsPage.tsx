import { useState, useMemo } from 'react'
import { useStore } from '@/hooks/useStore'
import { useAuth } from '@/contexts/AuthContext'
import DdayBadge from '@/components/DdayBadge'
import FileAttachment from '@/components/FileAttachment'
import LinkAdder from '@/components/LinkAdder'
import type { ItemStatus, ScienceEvent, EventLink } from '@/types/database'
import { STATUS_LABELS, formatDate, formatDateTime, generateId } from '@/lib/utils'

const ALL_STATUSES: ItemStatus[] = ['planned', 'preparing', 'submitted', 'awaiting_result', 'accepted', 'not_selected', 'completed']

export default function EventsPage() {
  const { user } = useAuth()
  const {
    events, addEvent, updateEvent, deleteEvent,
    comments, addComment, updateComment, deleteComment,
  } = useStore()

  const [showAdd, setShowAdd] = useState(false)
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const totalFileCount = useMemo(() =>
    events.reduce((s, e) => s + (Array.isArray(e.attachments) ? e.attachments.length : 0), 0)
  , [events])

  const [form, setForm] = useState({
    title: '', description: '', application_deadline: '',
    event_date: '', event_end_date: '',
    requires_video: false, preparation_notes: '',
  })
  const [formLinks, setFormLinks] = useState<EventLink[]>([{ label: '', url: '' }])

  const handleAdd = () => {
    if (!form.title.trim()) return
    const cleanLinks = formLinks.filter(l => l.url.trim())
    const item: ScienceEvent = {
      id: generateId(),
      family_id: user?.family_id ?? '',
      title: form.title,
      description: form.description,
      event_date: form.event_date || null,
      event_end_date: form.event_end_date || null,
      application_deadline: form.application_deadline || null,
      links: cleanLinks,
      status: 'planned',
      requires_video: form.requires_video,
      is_conditional: false,
      condition_parent_id: null,
      preparation_notes: form.preparation_notes,
      attachments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    addEvent(item)
    setForm({ title: '', description: '', application_deadline: '', event_date: '', event_end_date: '', requires_video: false, preparation_notes: '' })
    setFormLinks([{ label: '', url: '' }])
    setShowAdd(false)
  }

  const handleAddComment = (parentId: string) => {
    const text = newComment[parentId]?.trim()
    if (!text || !user) return
    addComment({
      id: generateId(),
      family_id: user.family_id ?? '',
      parent_type: 'science_event',
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

  const isConditionalActive = (evt: ScienceEvent) => {
    if (!evt.is_conditional || !evt.condition_parent_id) return true
    const parent = events.find(e => e.id === evt.condition_parent_id)
    return parent?.status === 'accepted'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📅 과학행사 일정</h1>
        <button onClick={() => setShowAdd(!showAdd)}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showAdd ? '취소' : '+ 행사 추가'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-blue-50 rounded-xl p-5 space-y-3">
          <input type="text" placeholder="행사명" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <textarea placeholder="설명" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500">신청 마감</label>
              <input type="datetime-local" value={form.application_deadline}
                onChange={e => setForm({ ...form, application_deadline: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500">행사 시작일</label>
              <input type="date" value={form.event_date}
                onChange={e => setForm({ ...form, event_date: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500">행사 종료일</label>
              <input type="date" value={form.event_end_date}
                onChange={e => setForm({ ...form, event_end_date: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-500 font-medium">🔗 관련 링크</label>
            {formLinks.map((link, idx) => (
              <div key={idx} className="flex gap-2">
                <input type="text" placeholder="링크 이름 (예: 공고문)"
                  value={link.label}
                  onChange={e => {
                    const updated = [...formLinks]
                    updated[idx] = { ...updated[idx], label: e.target.value }
                    setFormLinks(updated)
                  }}
                  className="w-1/3 border rounded-lg px-3 py-2 text-sm" />
                <input type="url" placeholder="https://..."
                  value={link.url}
                  onChange={e => {
                    const updated = [...formLinks]
                    updated[idx] = { ...updated[idx], url: e.target.value }
                    setFormLinks(updated)
                  }}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                {formLinks.length > 1 && (
                  <button onClick={() => setFormLinks(formLinks.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
                )}
              </div>
            ))}
            <button onClick={() => setFormLinks([...formLinks, { label: '', url: '' }])}
              className="text-xs text-blue-600 hover:text-blue-800">+ 링크 추가</button>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.requires_video}
                onChange={e => setForm({ ...form, requires_video: e.target.checked })} />
              영상 제출 필요
            </label>
          </div>
          <textarea placeholder="준비사항 메모" value={form.preparation_notes}
            onChange={e => setForm({ ...form, preparation_notes: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
          <button onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">저장</button>
        </div>
      )}

      <div className="space-y-4">
        {events.map(evt => {
          const active = isConditionalActive(evt)
          return (
            <div key={evt.id}
              className={`bg-white rounded-xl border p-5 transition
                ${evt.is_conditional && !active ? 'opacity-50 border-dashed border-slate-300' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-semibold text-lg">{evt.title}</span>
                  {evt.requires_video && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🎬 영상 제출</span>
                  )}
                  {evt.is_conditional && !active && (
                    <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">조건부 (선발 시 활성)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select value={evt.status}
                    onChange={e => updateEvent(evt.id, { status: e.target.value as ItemStatus })}
                    className="text-xs border rounded px-1.5 py-1">
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                  {!evt.is_conditional && (
                    <button onClick={() => deleteEvent(evt.id)}
                      className="text-xs text-red-400 hover:text-red-600">삭제</button>
                  )}
                </div>
              </div>

              {evt.description && <p className="text-sm text-slate-600 mb-2">{evt.description}</p>}

              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                {evt.application_deadline && (
                  <span>📋 신청 마감: {formatDateTime(evt.application_deadline)} <DdayBadge dateStr={evt.application_deadline} /></span>
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
                <div className="mt-2 text-sm bg-yellow-50 text-yellow-800 rounded-lg p-2">
                  📝 {evt.preparation_notes}
                </div>
              )}

              {/* 댓글 */}
              <div className="border-t mt-3 pt-2">
                {getComments(evt.id).map(c => (
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
                <div className="flex gap-2 mt-1">
                  <input type="text" placeholder="댓글..."
                    value={newComment[evt.id] ?? ''}
                    onChange={e => setNewComment(prev => ({ ...prev, [evt.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddComment(evt.id)}
                    className="flex-1 text-sm border rounded px-2 py-1" />
                  <button onClick={() => handleAddComment(evt.id)}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">등록</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
