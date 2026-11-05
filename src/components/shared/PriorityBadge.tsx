import { ChevronsUp, ChevronUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PriorityLevel } from '@/types/request'

const STYLES = {
  HIGH: { label: 'High', icon: ChevronsUp, className: 'bg-red-600 text-white' },
  MEDIUM: { label: 'Medium', icon: ChevronUp, className: 'bg-amber-100 text-amber-900' },
  LOW: { label: 'Low', icon: Minus, className: 'bg-slate-200 text-slate-700' },
}

export function PriorityBadge({ level }: { level: PriorityLevel }) {
  const { label, icon: Icon, className } = STYLES[level]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md py-0.5 pr-1.5 pl-1 text-xs font-semibold',
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  )
}
