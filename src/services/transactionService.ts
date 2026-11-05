import { COUNTER_START_TEMPLATE, TRANSACTION_TEMPLATES } from '@/data/mockTransactions'
import { getProduct } from '@/data/mockProducts'
import type { DemoState } from '@/services/demoState'
import type { Product } from '@/types/product'
import type { Transaction, TransactionLine } from '@/types/transaction'

export function getBillableLines(transaction: Transaction): TransactionLine[] {
  return transaction.lines.filter((line) => !line.voided)
}

export function getTotal(transaction: Transaction): number {
  return getBillableLines(transaction).reduce((sum, line) => sum + line.unitPrice * line.qty, 0)
}

export function getSavings(transaction: Transaction): number {
  return getBillableLines(transaction).reduce(
    (sum, line) => sum + (line.originalPrice - line.unitPrice) * line.qty,
    0,
  )
}

export function getItemCount(transaction: Transaction): number {
  return getBillableLines(transaction).reduce((sum, line) => sum + line.qty, 0)
}

function makeLine(state: DemoState, product: Product, qty: number): [DemoState, TransactionLine] {
  const line: TransactionLine = {
    lineId: `L${state.nextLineNumber}`,
    productId: product.id,
    name: product.name,
    barcode: product.barcode,
    unitPrice: product.price,
    originalPrice: product.price,
    qty,
  }
  return [{ ...state, nextLineNumber: state.nextLineNumber + 1 }, line]
}

/** Builds a transaction for a counter from a predefined basket. */
export function createTransaction(
  state: DemoState,
  counterId: string,
  templateIndex: number,
  paymentError?: string,
): DemoState {
  const template = TRANSACTION_TEMPLATES[templateIndex % TRANSACTION_TEMPLATES.length]
  let next = state
  const lines: TransactionLine[] = []
  for (const item of template.items) {
    const product = getProduct(item.productId)
    if (!product) continue
    const [withLine, line] = makeLine(next, product, item.qty)
    next = withLine
    lines.push(line)
  }
  const transaction: Transaction = {
    id: `TX-${next.nextTransactionNumber}`,
    counterId,
    lines,
    paymentError,
  }
  return {
    ...next,
    nextTransactionNumber: next.nextTransactionNumber + 1,
    transactions: { ...next.transactions, [counterId]: transaction },
    counters: next.counters.map((counter) =>
      counter.id === counterId ? { ...counter, nextTemplate: templateIndex + 1 } : counter,
    ),
  }
}

export function getStartTemplate(counterId: string): number {
  return COUNTER_START_TEMPLATE[counterId] ?? 0
}

export function addItem(state: DemoState, counterId: string, productId: string): DemoState {
  const transaction = state.transactions[counterId]
  const product = getProduct(productId)
  if (!transaction || !product) return state

  const existing = transaction.lines.find(
    (line) => line.productId === productId && !line.voided && !line.adjustment,
  )
  if (existing) return changeQty(state, counterId, existing.lineId, 1)

  const [next, line] = makeLine(state, product, 1)
  return {
    ...next,
    transactions: {
      ...next.transactions,
      [counterId]: { ...transaction, lines: [...transaction.lines, line] },
    },
  }
}

export function changeQty(
  state: DemoState,
  counterId: string,
  lineId: string,
  delta: number,
): DemoState {
  const transaction = state.transactions[counterId]
  if (!transaction) return state
  return {
    ...state,
    transactions: {
      ...state.transactions,
      [counterId]: {
        ...transaction,
        lines: transaction.lines.map((line) =>
          line.lineId === lineId ? { ...line, qty: Math.max(1, line.qty + delta) } : line,
        ),
      },
    },
  }
}

export function removeLine(state: DemoState, counterId: string, lineId: string): DemoState {
  const transaction = state.transactions[counterId]
  if (!transaction) return state
  return {
    ...state,
    transactions: {
      ...state.transactions,
      [counterId]: {
        ...transaction,
        lines: transaction.lines.filter((line) => line.lineId !== lineId),
      },
    },
  }
}
