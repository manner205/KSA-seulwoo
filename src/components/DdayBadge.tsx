import { dDayLabel, isUrgent } from '@/lib/utils'

interface Props {
  dateStr: string | null | undefined
  label?: string
}

export default function DdayBadge({ dateStr, label }: Props) {
  const text = dDayLabel(dateStr)
  if (!text) return null
  const urgent = isUrgent(dateStr)
  return (
    <span
      className={`inline-block rounded-full text-xs font-bold px-2 py-0.5
        ${urgent ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
    >
      {label ? `${label} ` : ''}{text}
    </span>
  )
}
