import { differenceInDays, format, parseISO, isValid } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ItemStatus } from '@/types/database'

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = parseISO(dateStr)
  if (!isValid(d)) return dateStr
  return format(d, 'yyyy.MM.dd', { locale: ko })
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = parseISO(dateStr)
  if (!isValid(d)) return dateStr
  return format(d, 'yyyy.MM.dd HH:mm', { locale: ko })
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const d = parseISO(dateStr)
  if (!isValid(d)) return null
  return differenceInDays(d, new Date())
}

export function dDayLabel(dateStr: string | null | undefined): string {
  const days = daysUntil(dateStr)
  if (days === null) return ''
  if (days < 0) return `D+${Math.abs(days)}`
  if (days === 0) return 'D-Day'
  return `D-${days}`
}

export function isUrgent(dateStr: string | null | undefined): boolean {
  const days = daysUntil(dateStr)
  if (days === null) return false
  return days >= 0 && days <= 7
}

export const STATUS_LABELS: Record<ItemStatus, string> = {
  planned: '예정',
  preparing: '준비 중',
  submitted: '제출 완료',
  awaiting_result: '결과 대기',
  accepted: '선발/합격',
  not_selected: '미선발',
  completed: '완료',
}

export const STATUS_BADGE_CLASS: Record<ItemStatus, string> = {
  planned: 'badge-planned',
  preparing: 'badge-preparing',
  submitted: 'badge-submitted',
  awaiting_result: 'badge-awaiting',
  accepted: 'badge-accepted',
  not_selected: 'badge-not-selected',
  completed: 'badge-completed',
}

export function generateId(): string {
  return crypto.randomUUID()
}
