import { useEffect, useRef, useState } from 'react'
import { AddItemDialog, PaymentDialog } from '@/components/cashier/CheckoutDialogs'
import { SupportPanel, type ComposeDraft } from '@/components/cashier/SupportPanel'
import { SupportStatus } from '@/components/cashier/SupportStatus'
import { TransactionPanel } from '@/components/cashier/TransactionPanel'
import { Brand } from '@/components/shared/Brand'
import { PresenterPanel } from '@/components/shared/PresenterPanel'
import { QueueChip } from '@/components/shared/QueueChip'
import { cn } from '@/lib/utils'
import { getProduct } from '@/data/mockProducts'
import { useSimNow } from '@/hooks/useSimNow'
import { getActiveRequest, getCurrentRequest, needsItem } from '@/services/requestService'
import { getTotal } from '@/services/transactionService'
import { actions, useSupportStore } from '@/stores/supportStore'
import type { IssueCategory } from '@/types/request'
import type { Transaction, TransactionLine } from '@/types/transaction'

/** Starting suggestion for the item picker: the selected line, or the likeliest candidate. */
function suggestLine(
  category: IssueCategory,
  transaction: Transaction,
  selectedLineId: string | null,
): string | null {
  if (!needsItem(category)) return null
  const lines = transaction.lines.filter((line) => !line.voided)
  if (lines.some((line) => line.lineId === selectedLineId)) return selectedLineId
  const likely = lines.find((line) => {
    const product = getProduct(line.productId)
    if (category === 'PROMOTION') return product?.promotion
    if (category === 'PRICE') return product?.shelfPrice !== undefined
    return product?.voidRequiresApproval
  })
  return likely?.lineId ?? null
}

export function CashierPage({ counterId }: { counterId: string }) {
  const counters = useSupportStore((state) => state.counters)
  const counter = counters.find((candidate) => candidate.id === counterId)
  const transaction = useSupportStore((state) => state.transactions[counterId])
  const activeRequest = useSupportStore((state) => getActiveRequest(state, counterId))
  const currentRequest = useSupportStore((state) => getCurrentRequest(state, counterId))
  const scenario = useSupportStore((state) => state.scenario)
  const now = useSimNow()

  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ComposeDraft | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [saleMessage, setSaleMessage] = useState<string | null>(null)

  useEffect(() => {
    document.title = counter ? `POS ${counter.label}` : 'POS'
  }, [counter])

  // Follow the presenter when a scenario is set up from any tab.
  const lastNonce = useRef(scenario?.nonce)
  useEffect(() => {
    if (!scenario || scenario.nonce === lastNonce.current) return
    lastNonce.current = scenario.nonce
    window.location.hash = `#/cashier/${scenario.counterId}`
  }, [scenario])

  // Per-counter working state does not carry over when the transaction changes.
  const transactionId = transaction?.id
  useEffect(() => {
    setDraft(null)
    setSelectedLineId(null)
  }, [transactionId, counterId])

  useEffect(() => {
    if (!saleMessage) return
    const timer = window.setTimeout(() => setSaleMessage(null), 4000)
    return () => window.clearTimeout(timer)
  }, [saleMessage])

  if (!counter || !transaction) {
    return <p className="p-8">This counter does not exist in the demo.</p>
  }

  const openCompose = (category: IssueCategory, lineId?: string) => {
    setDraft({ category, lineId: lineId ?? suggestLine(category, transaction, selectedLineId) })
  }

  const handleRemove = (line: TransactionLine) => {
    if (getProduct(line.productId)?.voidRequiresApproval) openCompose('VOID', line.lineId)
    else actions.removeLine(counterId, line.lineId)
  }

  const handleSubmit = (note: string) => {
    if (!draft) return
    actions.submitRequest({
      counterId,
      category: draft.category,
      lineId: draft.lineId ?? undefined,
      note,
    })
    setDraft(null)
  }

  const handleCompleteSale = () => {
    actions.completeSale(counterId)
    setPayOpen(false)
    setSaleMessage('Sale complete. Next customer loaded.')
  }

  return (
    <div className="cashier-stage flex min-h-dvh flex-col lg:h-dvh">
      <header className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/70 bg-white px-4 py-3 pr-32 shadow-[0_2px_12px_rgba(37,18,31,0.035)] max-md:pr-4">
        <Brand subtitle="POS (simulation)" />
        <nav aria-label="Counters" className="flex gap-1">
          {counters.map((candidate) => (
            <a
              key={candidate.id}
              href={`#/cashier/${candidate.id}`}
              aria-current={candidate.id === counterId ? 'page' : undefined}
              className={cn(
                'flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular-nums transition-colors',
                candidate.id === counterId
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {candidate.id}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm max-md:ml-0">
          <span className="text-muted-foreground">Cashier <span className="font-semibold text-foreground">{counter.cashierName}</span></span>
          <QueueChip queue={counter.queue} />
        </div>
      </header>

      <main className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <TransactionPanel
          transaction={transaction}
          selectedLineId={selectedLineId}
          supportLineId={activeRequest?.item?.lineId}
          hasOpenRequest={Boolean(activeRequest)}
          saleMessage={saleMessage}
          onSelect={setSelectedLineId}
          onChangeQty={(lineId, delta) => actions.changeQty(counterId, lineId, delta)}
          onRemove={handleRemove}
          onAddItem={() => setAddOpen(true)}
          onPay={() => setPayOpen(true)}
        />
        <SupportPanel
          lines={transaction.lines}
          draft={activeRequest ? null : draft}
          disabled={Boolean(activeRequest)}
          onPickCategory={openCompose}
          onPickLine={(lineId) => draft && setDraft({ ...draft, lineId })}
          onClose={() => setDraft(null)}
          onSubmit={handleSubmit}
        />
      </main>

      <div className="px-3 pb-3">
        <SupportStatus
          request={currentRequest}
          now={now}
          onCancel={actions.cancelRequest}
          onDismiss={actions.dismissRequest}
        />
      </div>

      <AddItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={(productId) => actions.addItem(counterId, productId)}
      />
      <PaymentDialog
        open={payOpen}
        total={getTotal(transaction)}
        onOpenChange={setPayOpen}
        onComplete={handleCompleteSale}
      />
      <PresenterPanel />
    </div>
  )
}
