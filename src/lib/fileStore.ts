/**
 * Supabase Storage 기반 파일 저장소.
 * 버킷: ksa-attachments (public)
 * 경로 형식: {userId}/{uuid}.{ext}
 *
 * Storage 업로드/삭제는 service_role 클라이언트 사용 (RLS 우회).
 * 다운로드는 public URL 사용.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string
const BUCKET = 'ksa-attachments'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILE_COUNT = 20

// Storage 전용 admin 클라이언트 (RLS 우회)
const storageAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** 파일을 Supabase Storage에 업로드하고 storage_path를 반환 */
export async function saveFile(userId: string, id: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const storagePath = `${userId}/${id}.${ext}`

  const { error } = await storageAdmin.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type || 'application/octet-stream' })

  if (error) throw error
  return storagePath
}

/** Blob으로 받아 로컬 URL로 다운로드 (크로스 오리진 파일명/iOS 문제 해결) */
export async function downloadFile(storagePath: string, filename: string): Promise<void> {
  if (!storagePath) {
    alert('파일을 찾을 수 없습니다.\n(이전 버전에서 등록된 파일은 다시 첨부해야 합니다.)')
    return
  }
  const { data } = storageAdmin.storage.from(BUCKET).getPublicUrl(storagePath)
  try {
    const res = await fetch(data.publicUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000)
  } catch (err) {
    alert('파일 다운로드 중 오류가 발생했습니다.')
    console.error(err)
  }
}

/** Storage에서 파일 삭제 */
export async function deleteFile(storagePath: string): Promise<void> {
  if (!storagePath) return
  const { error } = await storageAdmin.storage.from(BUCKET).remove([storagePath])
  if (error) throw error
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function validateFile(file: File, currentTotal: number): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `파일 크기가 10MB를 초과합니다. (${formatFileSize(file.size)})`
  }
  if (currentTotal >= MAX_FILE_COUNT) {
    return `첨부파일은 최대 ${MAX_FILE_COUNT}개까지만 저장할 수 있습니다.`
  }
  return null
}
