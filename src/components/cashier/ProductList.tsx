import { Lock, Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getProduct } from '@/data/mockProducts'
import type { TransactionLine } from '@/types/transaction'
import { formatMoney } from '@/utils/format'

interface ProductListProps {
  lines: TransactionLine[]
  selectedLineId: string | null
  /** The line an open support request refers to. */
  supportLineId?: string
  onSelect: (lineId: string) => void
  onChangeQty: (lineId: string, delta: number) => void
  onRemove: (line: TransactionLine) => void
}

export function ProductList({
  lines,
  selectedLineId,
  supportLineId,
  onSelect,
  onChangeQty,
  onRemove,
}: ProductListProps) {
  if (lines.length === 0) {
    return (
      <p className="flex h-full items-center justify-center p-8 text-muted-foreground">
        No items yet. Add an item to start the sale.
      </p>
    )
  }

  return (
    <ul className="divide-y">
      {lines.map((line) => {
        const isPriced = line.unitPrice !== line.originalPrice
        const isSupportLine = line.lineId === supportLineId
        const needsVoid = getProduct(line.productId)?.voidRequiresApproval
        return (
          <li
            key={line.lineId}
            data-selected={line.lineId === selectedLineId}
            className={cn(
              'flex flex-wrap items-center gap-2 py-2 pr-3 pl-1 data-[selected=true]:bg-primary/5 sm:flex-nowrap',
              line.voided && 'opacity-60',
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(line.lineId)}
              disabled={line.voided}
              className="min-h-12 min-w-0 flex-1 rounded-md px-2 text-left max-sm:basis-full"
            >
              <span className={cn('block truncate font-medium', line.voided && 'line-through')}>
                {line.name}
              </span>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span className="tabular-nums">{line.barcode}</span>
                {line.adjustment && (
                  <span className="font-medium text-emerald-700">{line.adjustment.label}</span>
                )}
                {line.voided && <span className="font-medium text-red-700">Voided</span>}
                {isSupportLine && (
                  <span className="font-medium text-primary">With manager</span>
                )}
              </span>
            </button>

            {!line.voided && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  className="size-10"
                  aria-label={`One less ${line.name}`}
                  disabled={line.qty <= 1 || isSupportLine}
                  onClick={() => onChangeQty(line.lineId, -1)}
                >
                  <Minus />
                </Button>
                <span className="w-7 text-center font-medium tabular-nums">{line.qty}</span>
                <Button
                  variant="outline"
                  className="size-10"
                  aria-label={`One more ${line.name}`}
                  disabled={isSupportLine}
                  onClick={() => onChangeQty(line.lineId, 1)}
                >
                  <Plus />
                </Button>
              </div>
            )}

            <div className="ml-auto w-32 text-right tabular-nums">
              <div className={cn('font-semibold', line.voided && 'line-through')}>
                {formatMoney(line.unitPrice * line.qty)}
              </div>
              <div className="text-xs text-muted-foreground">
                {isPriced && (
                  <span className="mr-1 line-through">{formatMoney(line.originalPrice)}</span>
                )}
                {formatMoney(line.unitPrice)} ea
              </div>
            </div>

            {line.voided ? (
              <div className="size-10" />
            ) : (
              <Button
                variant="ghost"
                className="size-10 text-muted-foreground"
                aria-label={
                  needsVoid ? `Request a void for ${line.name}` : `Remove ${line.name}`
                }
                title={needsVoid ? 'High-value item: removal needs a manager void' : 'Remove item'}
                disabled={isSupportLine}
                onClick={() => onRemove(line)}
              >
                {needsVoid ? <Lock /> : <Trash2 />}
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
