import { useState } from 'react'
import { useStore } from '@/hooks/useStore'
import { useAuth } from '@/contexts/AuthContext'
import { generateId } from '@/lib/utils'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function NotesPage() {
  const { user } = useAuth()
  const { comments, addComment, updateComment, deleteComment } = useStore()
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const generalNotes = comments
    .filter(c => c.parent_type === 'general')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const handleAdd = () => {
    if (!text.trim() || !user) return
    addComment({
      id: generateId(),
      family_id: user.family_id ?? '',
      parent_type: 'general',
      parent_id: null,
      content: text,
      author_id: user.id,
      author_name: user.name,
      author_role: user.role,
      created_at: new Date().toISOString(),
    })
    setText('')
  }

  const startEdit = (id: string, content: string) => {
    setEditingId(id)
    setEditText(content)
  }

  const saveEdit = (id: string) => {
    if (editText.trim()) updateComment(id, editText.trim())
    setEditingId(null)
  }

  const roleColor: Record<string, string> = {
    student: 'bg-green-50 border-green-200',
    parent_dad: 'bg-blue-50 border-blue-200',
    parent_mom: 'bg-pink-50 border-pink-200',
  }

  return (
    <div className="space-y-6">
      {confirmId && (
        <ConfirmDialog
          message="이 메모를 삭제할까요?"
          onConfirm={() => { deleteComment(confirmId); setConfirmId(null) }}
          onCancel={() => setConfirmId(null)}
        />
      )}
      <h1 className="text-2xl font-bold">💬 공유 메모</h1>
      <p className="text-sm text-slate-500">가족 간 자유롭게 메모를 남기세요. 항목별 댓글은 각 페이지에서도 쓸 수 있습니다.</p>

      {/* 새 메모 입력 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <textarea
          placeholder={`${user?.name ?? ''}님, 메모를 남겨보세요...`}
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
          rows={3}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd() }}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-slate-400">Ctrl+Enter로 등록</span>
          <button onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            등록
          </button>
        </div>
      </div>

      {/* 메모 목록 */}
      {generalNotes.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-2">📝</p>
          <p>아직 공유 메모가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {generalNotes.map(note => (
            <div key={note.id}
              className={`rounded-xl border p-4 ${roleColor[note.author_role] ?? 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{note.author_name}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(note.created_at).toLocaleString('ko-KR')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(note.id, note.content)}
                    className="text-xs text-slate-400 hover:text-blue-600">수정</button>
                  <button onClick={() => setConfirmId(note.id)}
                    className="text-xs text-slate-400 hover:text-red-500">삭제</button>
                </div>
              </div>
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Escape') setEditingId(null) }}
                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)}
                      className="text-xs text-slate-400 px-3 py-1.5 border rounded-lg">취소</button>
                    <button onClick={() => saveEdit(note.id)}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">저장</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
