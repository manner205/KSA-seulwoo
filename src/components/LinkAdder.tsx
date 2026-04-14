import { useState } from 'react'
import type { EventLink } from '@/types/database'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Props {
  currentLinks: EventLink[] | undefined
  onUpdate: (links: EventLink[]) => void
}

export default function LinkAdder({ currentLinks, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null)

  const links = Array.isArray(currentLinks) ? currentLinks : []

  const handleDelete = (idx: number) => {
    onUpdate(links.filter((_, i) => i !== idx))
    setConfirmIdx(null)
  }

  const handleSave = () => {
    if (!url.trim()) return
    onUpdate([...links, { label: label.trim() || '관련 링크', url: url.trim() }])
    setLabel('')
    setUrl('')
    setOpen(false)
  }

  return (
    <div className="mt-1">
      {confirmIdx !== null && (
        <ConfirmDialog
          message={`'${links[confirmIdx]?.label || '관련 링크'}'\n링크를 삭제할까요?`}
          onConfirm={() => handleDelete(confirmIdx)}
          onCancel={() => setConfirmIdx(null)}
        />
      )}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {links.map((link, idx) => (
            <span key={idx}
              className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="hover:underline">
                🔗 {link.label || '관련 링크'}
              </a>
              <button onClick={() => setConfirmIdx(idx)}
                className="text-red-400 hover:text-red-600 leading-none ml-0.5">✕</button>
            </span>
          ))}
        </div>
      )}
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="text-xs text-slate-400 hover:text-blue-600">+ 링크 추가</button>
      ) : (
        <div className="flex gap-2 items-center mt-1">
          <input type="text" placeholder="이름" value={label}
            onChange={e => setLabel(e.target.value)}
            className="w-24 text-xs border rounded px-2 py-1" />
          <input type="url" placeholder="https://..." value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="flex-1 text-xs border rounded px-2 py-1" />
          <button onClick={handleSave}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded">저장</button>
          <button onClick={() => setOpen(false)}
            className="text-xs text-slate-400">취소</button>
        </div>
      )}
    </div>
  )
}
