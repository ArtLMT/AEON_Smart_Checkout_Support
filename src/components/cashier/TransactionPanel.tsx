import { CheckCircle2, CreditCard, Plus, TriangleAlert } from 'lucide-react'
import { ProductList } from '@/components/cashier/ProductList'
import { Button } from '@/components/ui/button'
import { getItemCount, getSavings, getTotal } from '@/services/transactionService'
import type { Transaction, TransactionLine } from '@/types/transaction'
import { formatMoney } from '@/utils/format'

interface TransactionPanelProps {
  transaction: Transaction
  selectedLineId: string | null
  supportLineId?: string
  hasOpenRequest: boolean
  saleMessage: string | null
  onSelect: (lineId: string) => void
  onChangeQty: (lineId: string, delta: number) => void
  onRemove: (line: TransactionLine) => void
  onAddItem: () => void
  onPay: () => void
}

export function TransactionPanel({
  transaction,
  selectedLineId,
  supportLineId,
  hasOpenRequest,
  saleMessage,
  onSelect,
  onChangeQty,
  onRemove,
  onAddItem,
  onPay,
}: TransactionPanelProps) {
  const total = getTotal(transaction)
  const savings = getSavings(transaction)
  const itemCount = getItemCount(transaction)
  const canPay = itemCount > 0 && !hasOpenRequest && !transaction.paymentError

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="min-w-0">
          <h1 className="font-semibold">Current transaction</h1>
          <p className="text-xs text-muted-foreground tabular-nums">
            {transaction.id} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Button variant="outline" className="h-11 px-4 text-sm" onClick={onAddItem}>
          <Plus />
          Add item
        </Button>
      </header>

      {transaction.paymentError && (
        <div className="flex items-center gap-2 bg-red-50 px-4 py-2 text-sm font-medium text-red-800">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          {transaction.paymentError}
        </div>
      )}
      {saleMessage && (
        <div
          role="status"
          className="flex items-center gap-2 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {saleMessage}
        </div>
      )}

      <div className="min-h-40 flex-1 overflow-y-auto">
        <ProductList
          lines={transaction.lines}
          selectedLineId={selectedLineId}
          supportLineId={supportLineId}
          onSelect={onSelect}
          onChangeQty={onChangeQty}
          onRemove={onRemove}
        />
      </div>

      <footer className="flex items-center justify-between gap-4 border-t bg-muted/40 px-4 py-3">
        <div>
          {savings > 0 && (
            <p className="text-sm font-medium text-emerald-700 tabular-nums">
              Savings {formatMoney(savings)}
            </p>
          )}
          <p className="text-3xl font-bold tracking-tight tabular-nums">{formatMoney(total)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button className="h-14 px-8 text-base" disabled={!canPay} onClick={onPay}>
            <CreditCard className="size-5" />
            Take payment
          </Button>
          {hasOpenRequest && (
            <span className="text-xs text-muted-foreground">
              Available once the manager has responded
            </span>
          )}
        </div>
      </footer>
    </section>
  )
}
