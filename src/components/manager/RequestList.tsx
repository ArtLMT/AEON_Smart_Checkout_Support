import { BellRing, CheckCircle2, ChevronRight, Siren } from 'lucide-react'
import { CATEGORY_META } from '@/components/shared/categoryMeta'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { QueueChip } from '@/components/shared/QueueChip'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { WaitingTimer } from '@/components/shared/WaitingTimer'
import { cn } from '@/lib/utils'
import { getCounter, type DemoState } from '@/services/demoState'
import { computePriority, getCategoryLabel } from '@/services/priorityService'
import { isActive } from '@/services/requestService'

const EDGE = {
  HIGH: 'border-l-red-600',
  MEDIUM: 'border-l-amber-400',
  LOW: 'border-l-slate-300',
}

export function RequestList({
  state,
  now,
  onOpen,
}: {
  state: DemoState
  now: number
  onOpen: (requestId: string) => void
}) {
  const active = state.requests
    .filter(isActive)
    .map((request) => {
      const queue = getCounter(state, request.counterId)?.queue ?? 0
      return { request, queue, priority: computePriority(request, queue, now) }
    })
    .sort((a, b) => b.priority.score - a.priority.score)

  const urgent = active.filter(({ priority }) => priority.urgent)

  return (
    <section aria-label="Active requests" className="space-y-2">
      {urgent.map(({ request }) => (
        <button
          key={request.id}
          type="button"
          onClick={() => onOpen(request.id)}
          className="urgent-pulse flex w-full items-center gap-2 rounded-xl bg-red-600 p-3 text-left text-sm font-semibold text-white"
        >
          <Siren className="size-5 shrink-0" aria-hidden />
          <span className="flex-1">
            Urgent: {getCounter(state, request.counterId)?.label}{' '}
            {getCategoryLabel(request.category).toLowerCase()} is unanswered
          </span>
          <ChevronRight className="size-4 shrink-0" aria-hidden />
        </button>
      ))}

      {active.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-card p-8 text-center ring-1 ring-foreground/10">
          <CheckCircle2 className="size-7 text-emerald-600" aria-hidden />
          <p className="font-medium">All counters running</p>
          <p className="text-sm text-muted-foreground">New requests appear here by priority.</p>
        </div>
      )}

      <ul className="space-y-2">
        {active.map(({ request, queue, priority }) => {
          const { icon: Icon } = CATEGORY_META[request.category]
          return (
            <li key={request.id}>
              <button
                type="button"
                onClick={() => onOpen(request.id)}
                className={cn(
                  'w-full rounded-xl border-l-4 bg-card p-3 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted/60',
                  EDGE[priority.level],
                  priority.urgent && 'ring-2 ring-red-600',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold tabular-nums">
                    {getCounter(state, request.counterId)?.label}
                  </span>
                  <PriorityBadge level={priority.level} />
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-sm">
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                  {getCategoryLabel(request.category)}
                  <span className="ml-auto">
                    <StatusBadge status={request.status} />
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                  <WaitingTimer request={request} now={now} className="text-xs" />
                  {request.status === 'PENDING' && priority.stage >= 1 && (
                    <span className="inline-flex items-center gap-1 text-amber-800">
                      <BellRing className="size-3" aria-hidden />
                      Reminded
                    </span>
                  )}
                  <QueueChip queue={queue} />
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
