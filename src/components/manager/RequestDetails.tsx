import { useState } from 'react'
import { ArrowLeft, Check, Footprints, Laptop, Lightbulb, MapPin, X } from 'lucide-react'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { QueueChip } from '@/components/shared/QueueChip'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { WaitingTimer } from '@/components/shared/WaitingTimer'
import { Button } from '@/components/ui/button'
import { getProduct } from '@/data/mockProducts'
import { getCounter, type DemoState } from '@/services/demoState'
import { computePriority, getCategoryLabel } from '@/services/priorityService'
import {
  canResolveRemotely,
  canTransition,
  describeEffect,
  getRecommendation,
  isActive,
} from '@/services/requestService'
import { getTotal } from '@/services/transactionService'
import { actions } from '@/stores/supportStore'
import type { SupportRequest } from '@/types/request'
import { REMINDER_MS, RAISE_PRIORITY_MS, URGENT_MS } from '@/utils/escalationRules'
import { formatClock, formatMoney } from '@/utils/format'

const REJECT_REASONS = ['Not eligible', 'Scanned price is correct', 'Promotion expired', 'Duplicate request']

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-card p-3 ring-1 ring-foreground/10">
      <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium tabular-nums">{children}</span>
    </div>
  )
}

/** Status changes plus the escalation points the request passed while unaccepted. */
function buildTimeline(request: SupportRequest, now: number) {
  const entries = request.statusHistory.map((entry) => ({
    at: entry.at,
    label: entry.note ?? entry.status.replace('_', ' ').toLowerCase(),
  }))
  const waitedUntil = request.acceptedAt ?? request.closedAt ?? now
  const points: [number, string][] = [
    [REMINDER_MS, 'reminder sent'],
    [RAISE_PRIORITY_MS, 'priority check at 60s'],
    [URGENT_MS, 'urgent alert shown'],
  ]
  for (const [afterMs, label] of points) {
    const at = request.createdAt + afterMs
    if (at <= waitedUntil) entries.push({ at, label })
  }
  return entries.sort((a, b) => a.at - b.at)
}

export function RequestDetails({
  state,
  request,
  now,
  onBack,
}: {
  state: DemoState
  request: SupportRequest
  now: number
  onBack: () => void
}) {
  const [rejecting, setRejecting] = useState(false)
  const counter = getCounter(state, request.counterId)
  const priority = computePriority(request, counter?.queue ?? 0, now)
  const effect = describeEffect(state, request)
  const product = request.item ? getProduct(request.item.productId) : undefined
  const liveTransaction = state.transactions[request.counterId]
  const transaction = liveTransaction?.id === request.transactionId ? liveTransaction : undefined

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-1 border-b bg-card py-1.5 pr-3 pl-1.5">
        <Button variant="ghost" className="size-10" aria-label="Back to requests" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{counter?.label}</h2>
          <p className="text-xs text-muted-foreground tabular-nums">{request.id}</p>
        </div>
        <StatusBadge status={request.status} />
      </header>

      <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto bg-muted p-3">
        <section className="rounded-xl bg-card p-3 ring-1 ring-foreground/10">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">{getCategoryLabel(request.category)}</span>
            <PriorityBadge level={priority.level} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <WaitingTimer request={request} now={now} />
            <QueueChip queue={isActive(request) ? (counter?.queue ?? 0) : request.queueAtRequest} />
          </div>
          <ul className="mt-2 space-y-0.5 border-t pt-2 text-xs text-muted-foreground">
            {priority.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>

        {isActive(request) && (
          <section className="flex gap-2 rounded-xl bg-primary/5 p-3 text-sm ring-1 ring-primary/20">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <p>{getRecommendation(request.category)}</p>
          </section>
        )}

        {request.note && (
          <Section title="Cashier note">
            <p className="text-sm">{request.note}</p>
          </Section>
        )}

        {request.item && (
          <Section title="Product">
            <p className="text-sm font-semibold">{request.item.name}</p>
            <Row label="Barcode">{request.item.barcode}</Row>
            <Row label="Scanned price">{formatMoney(request.item.unitPrice)}</Row>
            <Row label="Quantity">{request.item.qty}</Row>
            {product?.shelfPrice !== undefined && (
              <Row label="Shelf label">{formatMoney(product.shelfPrice)}</Row>
            )}
            {product?.promotion && (
              <>
                <Row label="Promotion">{product.promotion.label}</Row>
                <Row label="Promo price">{formatMoney(product.promotion.promoPrice)}</Row>
                <Row label="Valid until">{product.promotion.validUntil}</Row>
              </>
            )}
          </Section>
        )}

        <Section title="Transaction">
          <Row label="Cashier">{request.cashierName}</Row>
          <Row label="Transaction">{request.transactionId}</Row>
          <Row label="Total">
            {formatMoney(transaction ? getTotal(transaction) : request.transactionTotal)}
          </Row>
          {transaction?.paymentError && (
            <p className="mt-1 text-sm font-medium text-red-700">{transaction.paymentError}</p>
          )}
        </Section>

        {request.status === 'REMOTE_RESOLUTION' && (
          <section className="rounded-xl bg-violet-50 p-3 text-sm text-violet-950 ring-1 ring-violet-200">
            <p className="font-semibold">If you approve</p>
            <p className="mt-0.5">{effect.summary}</p>
          </section>
        )}

        {!isActive(request) && request.managerMessage && (
          <Section title="Outcome">
            <p className="text-sm">{request.managerMessage}</p>
          </Section>
        )}

        <Section title="Timeline">
          <ol className="space-y-0.5 text-xs">
            {buildTimeline(request, now).map((entry) => (
              <li key={`${entry.at}-${entry.label}`} className="flex gap-2">
                <span className="text-muted-foreground tabular-nums">{formatClock(entry.at)}</span>
                <span className="first-letter:uppercase">{entry.label}</span>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      {isActive(request) && (
        <footer className="space-y-2 border-t bg-card p-3">
          {rejecting ? (
            <RejectChooser
              onChoose={(reason) => {
                actions.reject(request.id, reason)
                setRejecting(false)
              }}
              onClose={() => setRejecting(false)}
            />
          ) : (
            <ManagerActions
              request={request}
              onReject={() => setRejecting(true)}
            />
          )}
        </footer>
      )}
    </div>
  )
}

function ManagerActions({
  request,
  onReject,
}: {
  request: SupportRequest
  onReject: () => void
}) {
  const remoteAllowed = canResolveRemotely(request.category)
  const prefersRemote = remoteAllowed && request.category !== 'OTHER'
  const rejectButton = canTransition(request.status, 'REJECTED') && (
    <Button variant="ghost" className="h-10 w-full text-muted-foreground" onClick={onReject}>
      <X />
      Reject request
    </Button>
  )

  switch (request.status) {
    case 'PENDING':
      return (
        <>
          <Button className="h-12 w-full text-base" onClick={() => actions.accept(request.id)}>
            <Check className="size-5" />
            Accept
          </Button>
          {rejectButton}
        </>
      )
    case 'ACCEPTED':
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={prefersRemote ? 'default' : 'outline'}
              className="h-12"
              disabled={!remoteAllowed}
              onClick={() => actions.startRemote(request.id)}
            >
              <Laptop />
              Handle remotely
            </Button>
            <Button
              variant={prefersRemote ? 'outline' : 'default'}
              className="h-12"
              onClick={() => actions.goToCounter(request.id)}
            >
              <Footprints />
              Go to counter
            </Button>
          </div>
          {!remoteAllowed && (
            <p className="text-center text-xs text-muted-foreground">
              Payment issues need someone at the terminal.
            </p>
          )}
          {rejectButton}
        </>
      )
    case 'REMOTE_RESOLUTION':
      return (
        <>
          <Button
            className="h-12 w-full text-base"
            onClick={() => actions.approveRemote(request.id)}
          >
            <Check className="size-5" />
            Approve remotely
          </Button>
          <Button
            variant="outline"
            className="h-10 w-full"
            onClick={() => actions.goToCounter(request.id)}
          >
            <Footprints />
            Go to counter instead
          </Button>
          {rejectButton}
        </>
      )
    case 'IN_PROGRESS':
      return request.visit?.arrivedAt ? (
        <Button
          className="h-12 w-full text-base"
          onClick={() => actions.resolveAtCounter(request.id)}
        >
          <Check className="size-5" />
          Resolve
        </Button>
      ) : (
        <Button className="h-12 w-full text-base" onClick={() => actions.markArrived(request.id)}>
          <MapPin className="size-5" />
          Arrived at counter
        </Button>
      )
    default:
      return null
  }
}

function RejectChooser({
  onChoose,
  onClose,
}: {
  onChoose: (reason: string) => void
  onClose: () => void
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Reason for rejecting</p>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Keep request
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {REJECT_REASONS.map((reason) => (
          <Button
            key={reason}
            variant="outline"
            className="h-auto min-h-10 whitespace-normal"
            onClick={() => onChoose(reason.toLowerCase())}
          >
            {reason}
          </Button>
        ))}
      </div>
    </>
  )
}
