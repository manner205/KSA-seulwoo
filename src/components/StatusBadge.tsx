import type { ItemStatus } from '@/types/database'
import { STATUS_LABELS, STATUS_BADGE_CLASS } from '@/lib/utils'

interface Props {
  status: ItemStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
  return (
    <span className={`inline-block rounded-full font-medium ${sizeClass} ${STATUS_BADGE_CLASS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
