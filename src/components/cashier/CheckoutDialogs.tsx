import { useState } from 'react'
import { Banknote, CreditCard, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PRODUCTS } from '@/data/mockProducts'
import type { PaymentMethod } from '@/types/transaction'
import { formatMoney } from '@/utils/format'

export function AddItemDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (productId: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add item</DialogTitle>
          <DialogDescription>Simulates scanning a barcode.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60dvh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {PRODUCTS.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onAdd(product.id)}
              className="flex min-h-16 flex-col justify-between gap-1 rounded-lg border p-2.5 text-left transition-colors hover:border-primary hover:bg-primary/5 active:bg-primary/10"
            >
              <span className="text-sm leading-tight font-medium">{product.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatMoney(product.price)}
              </span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button className="h-11 px-6" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const METHODS: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: 'CARD', label: 'Card', icon: CreditCard },
  { id: 'CASH', label: 'Cash', icon: Banknote },
  { id: 'QR', label: 'QR', icon: QrCode },
]

export function PaymentDialog({
  open,
  total,
  onOpenChange,
  onComplete,
}: {
  open: boolean
  total: number
  onOpenChange: (open: boolean) => void
  onComplete: (method: PaymentMethod) => void
}) {
  const [method, setMethod] = useState<PaymentMethod>('CARD')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
          <DialogDescription>Simulated only. No payment is processed.</DialogDescription>
        </DialogHeader>
        <p className="text-3xl font-bold tracking-tight tabular-nums">{formatMoney(total)}</p>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={method === id}
              onClick={() => setMethod(id)}
              className="flex h-16 flex-col items-center justify-center gap-1 rounded-lg border text-sm font-medium transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/5"
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button className="h-11 px-6" onClick={() => onComplete(method)}>
            Complete sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
