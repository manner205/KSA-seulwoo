/**
 * Supabase Storage 기반 파일 저장소.
 * 버킷: ksa-attachments (public)
 * 경로 형식: {userId}/{uuid}.{ext}
 */

import { supabase } from './supabase'

const BUCKET = 'ksa-attachments'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILE_COUNT = 20

/** 파일을 Supabase Storage에 업로드하고 storage_path를 반환 */
export async function saveFile(userId: string, id: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const storagePath = `${userId}/${id}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type || 'application/octet-stream' })

  if (error) throw error
  return storagePath
}

/** Public URL로 파일 다운로드 트리거 */
export function downloadFile(storagePath: string, filename: string): void {
  if (!storagePath) {
    alert('파일을 찾을 수 없습니다.\n(이전 버전에서 등록된 파일은 다시 첨부해야 합니다.)')
    return
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  const a = document.createElement('a')
  a.href = data.publicUrl
  a.download = filename
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/** Storage에서 파일 삭제 */
export async function deleteFile(storagePath: string): Promise<void> {
  if (!storagePath) return // 구버전 IndexedDB 항목은 그냥 무시
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath])
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
