import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { getManagerAvailability } from '@/services/requestService'
import { useSupportStore } from '@/stores/supportStore'

const DOT = {
  AVAILABLE: 'bg-emerald-500',
  TRAVELLING: 'bg-indigo-500',
  AT_COUNTER: 'bg-indigo-500',
  AWAY: 'bg-slate-400',
}

export function ManagerChip({ className }: { className?: string }) {
  const { kind, label } = useSupportStore(useShallow(getManagerAvailability))
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', className)}>
      <span className={cn('size-2 rounded-full', DOT[kind])} aria-hidden />
      {label}
    </span>
  )
}
