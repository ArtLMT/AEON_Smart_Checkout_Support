import { Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWaitMs } from '@/services/priorityService'
import type { SupportRequest } from '@/types/request'
import { getEscalationStage } from '@/utils/escalationRules'
import { formatDuration } from '@/utils/format'

const STAGE_COLOR = ['text-foreground', 'text-amber-700', 'text-orange-700', 'text-red-700']

/** Time waiting for acceptance. Derived from timestamps, so every tab shows the same value. */
export function WaitingTimer({
  request,
  now,
  className,
}: {
  request: SupportRequest
  now: number
  className?: string
}) {
  const waitMs = getWaitMs(request, now)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold tabular-nums',
        STAGE_COLOR[getEscalationStage(waitMs)],
        className,
      )}
    >
      <Timer className="size-3.5" aria-hidden />
      {formatDuration(waitMs)}
    </span>
  )
}
