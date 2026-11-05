import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getQueueRisk } from '@/services/priorityService'

const RISK_STYLE = {
  LOW: 'text-muted-foreground',
  MEDIUM: 'text-amber-800',
  HIGH: 'text-red-700 font-semibold',
}

export function QueueChip({ queue, className }: { queue: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap tabular-nums',
        RISK_STYLE[getQueueRisk(queue)],
        className,
      )}
    >
      <Users className="size-3.5" aria-hidden />
      {queue} waiting
    </span>
  )
}
