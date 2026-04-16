import { useRef, useState } from 'react'
import type { Attachment } from '@/types/database'
import { saveFile, downloadFile, deleteFile, formatFileSize, validateFile } from '@/lib/fileStore'
import { generateId } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Paperclip, Download, Trash2 } from 'lucide-react'

interface Props {
  attachments: Attachment[] | undefined
  onUpdate: (attachments: Attachment[]) => void
  totalFileCount: number
}

const EXT_ICONS: Record<string, string> = {
  hwp: '📄', hwpx: '📄',
  doc: '📝', docx: '📝',
  ppt: '📊', pptx: '📊',
  pdf: '📕',
  xls: '📗', xlsx: '📗',
}

function getIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return EXT_ICONS[ext] ?? '📎'
}

export default function FileAttachment({ attachments, onUpdate, totalFileCount }: Props) {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const list = Array.isArray(attachments) ? attachments : []

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const error = validateFile(file, totalFileCount)
    if (error) {
      alert(error)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      const id = generateId()
      const storagePath = await saveFile(user.id, id, file)
      const attachment: Attachment = {
        id,
        filename: file.name,
        size: file.size,
        mime_type: file.type || 'application/octet-stream',
        storage_path: storagePath,
        created_at: new Date().toISOString(),
      }
      onUpdate([...list, attachment])
    } catch (err) {
      alert('파일 업로드 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async (att: Attachment) => {
    if (!confirm(`"${att.filename}" 파일을 삭제할까요?`)) return
    try {
      await deleteFile(att.storage_path)
      onUpdate(list.filter(a => a.id !== att.id))
    } catch (err) {
      alert('파일 삭제 중 오류가 발생했습니다.')
      console.error(err)
    }
  }

  const handleDownload = (att: Attachment) => {
    downloadFile(att.storage_path, att.filename)
  }

  return (
    <div className="mt-2">
      {list.length > 0 && (
        <div className="space-y-1 mb-2">
          {list.map(att => (
            <div key={att.id}
              className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 text-sm">
              <span>{getIcon(att.filename)}</span>
              <span className="font-medium truncate flex-1">{att.filename}</span>
              <span className="text-xs text-slate-400">{formatFileSize(att.size)}</span>
              <button onClick={() => handleDownload(att)}
                className="text-blue-500 hover:text-blue-700" title="다운로드">
                <Download size={14} />
              </button>
              <button onClick={() => handleDelete(att)}
                className="text-red-400 hover:text-red-600" title="삭제">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".hwp,.hwpx,.doc,.docx,.ppt,.pptx,.pdf,.xls,.xlsx,.txt,.zip"
        onChange={handleUpload}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 disabled:opacity-50"
      >
        <Paperclip size={12} />
        {uploading ? '업로드 중...' : '파일 첨부'}
        <span className="text-slate-300">({list.length})</span>
      </button>
    </div>
  )
}
