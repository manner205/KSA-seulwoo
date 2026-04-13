/**
 * IndexedDB 기반 파일 저장소.
 * Supabase Storage 연결 전까지 브라우저 로컬에 파일을 저장합니다.
 * 최대 20개, 각 10MB 이내.
 */

const DB_NAME = 'ksa-file-store'
const DB_VERSION = 1
const STORE_NAME = 'files'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveFile(id: string, file: File): Promise<void> {
  const db = await openDB()
  const buffer = await file.arrayBuffer()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(buffer, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getFile(id: string, filename: string, mimeType: string): Promise<File | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(id)
    req.onsuccess = () => {
      if (req.result) {
        resolve(new File([req.result], filename, { type: mimeType }))
      } else {
        resolve(null)
      }
    }
    req.onerror = () => reject(req.error)
  })
}

export async function deleteFile(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function downloadFile(id: string, filename: string, mimeType: string): Promise<void> {
  const file = await getFile(id, filename, mimeType)
  if (!file) {
    alert('파일을 찾을 수 없습니다.')
    return
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILE_COUNT = 20

export function validateFile(file: File, currentTotal: number): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `파일 크기가 10MB를 초과합니다. (${formatFileSize(file.size)})`
  }
  if (currentTotal >= MAX_FILE_COUNT) {
    return `첨부파일은 최대 ${MAX_FILE_COUNT}개까지만 저장할 수 있습니다.`
  }
  return null
}
