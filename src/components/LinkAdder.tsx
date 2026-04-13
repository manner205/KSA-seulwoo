import { useState } from 'react'
import type { EventLink, ScienceEvent } from '@/types/database'

interface Props {
  eventId: string
  currentLinks: EventLink[] | undefined
  onUpdate: (id: string, patch: Partial<ScienceEvent>) => void
}

export default function LinkAdder({ eventId, currentLinks, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (!url.trim()) return
    const existing = Array.isArray(currentLinks) ? currentLinks : []
    onUpdate(eventId, {
      links: [...existing, { label: label.trim() || '관련 링크', url: url.trim() }]
    })
    setLabel('')
    setUrl('')
    setSaved(true)
    setTimeout(() => { setSaved(false); setOpen(false) }, 800)
  }

  return (
    <div className="mt-1">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="text-xs text-slate-400 hover:text-blue-600">+ 링크 추가</button>
      ) : saved ? (
        <span className="text-xs text-green-600 font-medium">✓ 저장됨</span>
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
