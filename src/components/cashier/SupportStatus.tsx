import { Check, CircleCheck, CircleX, MessageSquare, X } from 'lucide-react'
import { ManagerChip } from '@/components/shared/ManagerChip'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { WaitingTimer } from '@/components/shared/WaitingTimer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { canTransition, getRequestTitle, isActive } from '@/services/requestService'
import type { RequestStatus, SupportRequest } from '@/types/request'

interface SupportStatusProps {
  request: SupportRequest | undefined
  now: number
  onCancel: (id: string) => void
  onDismiss: (id: string) => void
}

function getSteps(request: SupportRequest): { label: string; reached: boolean }[] {
  const reached = (status: RequestStatus) =>
    request.statusHistory.some((entry) => entry.status === status)
  const isRemote = reached('REMOTE_RESOLUTION') && !reached('IN_PROGRESS')
  const isVisit = reached('IN_PROGRESS')
  return [
    { label: 'Sent', reached: true },
    { label: 'Accepted', reached: reached('ACCEPTED') },
    {
      label: isVisit ? 'Manager visiting' : isRemote ? 'Remote review' : 'Handling',
      reached: isVisit || isRemote,
    },
    { label: 'Resolved', reached: reached('RESOLVED') },
  ]
}

export function SupportStatus({ request, now, onCancel, onDismiss }: SupportStatusProps) {
  return (
    <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      {request ? (
        isActive(request) ? (
          <ActiveStatus request={request} now={now} onCancel={onCancel} />
        ) : (
          <ClosedStatus request={request} onDismiss={onDismiss} />
        )
      ) : (
        <p className="flex-1 text-sm text-muted-foreground">No open support request.</p>
      )}
      <div className="text-sm">
        <span className="mr-2 text-muted-foreground">Manager</span>
        <ManagerChip className="font-medium" />
      </div>
    </footer>
  )
}

function ActiveStatus({
  request,
  now,
  onCancel,
}: {
  request: SupportRequest
  now: number
  onCancel: (id: string) => void
}) {
  return (
    <>
      <div className="min-w-0 flex-1 basis-72">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={request.status} />
          <span className="truncate font-medium">{getRequestTitle(request)}</span>
          {request.status === 'PENDING' && <WaitingTimer request={request} now={now} />}
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MessageSquare className="size-3.5 shrink-0" aria-hidden />
          {request.managerMessage ?? 'Waiting for the manager. Stay on this screen.'}
        </p>
      </div>
      <ol className="flex items-center gap-1 text-xs max-lg:hidden">
        {getSteps(request).map((step, index) => (
          <li key={step.label} className="flex items-center gap-1">
            {index > 0 && <span className="h-px w-3 bg-border" aria-hidden />}
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1',
                step.reached ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground',
              )}
            >
              {step.reached && <Check className="size-3" aria-hidden />}
              {step.label}
            </span>
          </li>
        ))}
      </ol>
      {canTransition(request.status, 'CANCELLED') && (
        <Button variant="outline" className="h-11 px-4" onClick={() => onCancel(request.id)}>
          <X />
          Cancel request
        </Button>
      )}
    </>
  )
}

function ClosedStatus({
  request,
  onDismiss,
}: {
  request: SupportRequest
  onDismiss: (id: string) => void
}) {
  const resolved = request.status === 'RESOLVED'
  const message =
    request.managerMessage ?? (request.status === 'CANCELLED' ? 'You cancelled this request.' : '')
  return (
    <>
      <div
        role="status"
        className={cn(
          'flex min-w-0 flex-1 basis-72 items-start gap-2.5',
          resolved ? 'text-emerald-800' : 'text-foreground',
        )}
      >
        {resolved ? (
          <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
        ) : (
          <CircleX className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} />
            <span className="truncate font-medium">{getRequestTitle(request)}</span>
          </div>
          <p className="mt-0.5 text-sm">{message}</p>
        </div>
      </div>
      <Button className="h-11 px-5" onClick={() => onDismiss(request.id)}>
        Continue checkout
      </Button>
    </>
  )
}
