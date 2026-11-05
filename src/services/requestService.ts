import { getProduct } from '@/data/mockProducts'
import { getCounter, type DemoState } from '@/services/demoState'
import { getCategoryLabel } from '@/services/priorityService'
import { createTransaction, getItemCount, getTotal } from '@/services/transactionService'
import type { IssueCategory, RequestStatus, SupportRequest } from '@/types/request'
import type { Transaction, TransactionLine } from '@/types/transaction'
import { formatMoney } from '@/utils/format'

const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'REMOTE_RESOLUTION', 'REJECTED', 'CANCELLED'],
  IN_PROGRESS: ['RESOLVED'],
  REMOTE_RESOLUTION: ['RESOLVED', 'IN_PROGRESS', 'REJECTED'],
  RESOLVED: [],
  REJECTED: [],
  CANCELLED: [],
}

export function isActive(request: SupportRequest): boolean {
  return TRANSITIONS[request.status].length > 0
}

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

/** Remote approval is the default for simple checks; payments need someone at the terminal. */
export function canResolveRemotely(category: IssueCategory): boolean {
  return category !== 'PAYMENT'
}

export function needsItem(category: IssueCategory): boolean {
  return category === 'PRICE' || category === 'PROMOTION' || category === 'VOID'
}

export function getRecommendation(category: IssueCategory): string {
  switch (category) {
    case 'PRICE':
      return 'Compare the shelf label with the system price, then approve remotely. No trip needed.'
    case 'PROMOTION':
      return 'Check the promotion is valid for this item, then approve remotely. No trip needed.'
    case 'VOID':
      return 'Confirm the item and quantity, then approve the void remotely. No trip needed.'
    case 'PAYMENT':
      return 'Go to the counter. Terminal and payment problems need hands-on checks.'
    case 'OTHER':
      return 'Read the note and decide whether this can be handled remotely.'
  }
}

export function getActiveRequest(state: DemoState, counterId: string): SupportRequest | undefined {
  return state.requests.find((request) => request.counterId === counterId && isActive(request))
}

/** The request shown in a cashier's status bar: active, or closed but not yet cleared. */
export function getCurrentRequest(state: DemoState, counterId: string): SupportRequest | undefined {
  return (
    getActiveRequest(state, counterId) ??
    state.requests.find((request) => request.counterId === counterId && !request.dismissed)
  )
}

export function getManagerAvailability(state: DemoState): {
  kind: 'AVAILABLE' | 'TRAVELLING' | 'AT_COUNTER' | 'AWAY'
  label: string
} {
  const visiting = state.requests.find((request) => request.status === 'IN_PROGRESS')
  if (visiting) {
    const label = getCounter(state, visiting.counterId)?.label ?? visiting.counterId
    return visiting.visit?.arrivedAt
      ? { kind: 'AT_COUNTER', label: `At ${label}` }
      : { kind: 'TRAVELLING', label: `Heading to ${label}` }
  }
  if (state.managerAway) return { kind: 'AWAY', label: 'Away' }
  return { kind: 'AVAILABLE', label: 'Available' }
}

export interface ResolutionEffect {
  /** One line describing what approving will do to the transaction. */
  summary: string
  /** Sent to the cashier on resolution. */
  message: string
  changesTransaction: boolean
}

function findLine(transaction: Transaction | undefined, request: SupportRequest) {
  return transaction?.lines.find((line) => line.lineId === request.item?.lineId)
}

export function describeEffect(state: DemoState, request: SupportRequest): ResolutionEffect {
  const transaction = state.transactions[request.counterId]
  const line = findLine(transaction, request)
  const product = request.item ? getProduct(request.item.productId) : undefined
  const name = request.item?.name ?? 'item'

  switch (request.category) {
    case 'PRICE': {
      if (line && product?.shelfPrice !== undefined && line.unitPrice !== product.shelfPrice) {
        return {
          summary: `Shelf label is ${formatMoney(product.shelfPrice)}. Line changes from ${formatMoney(line.unitPrice)}.`,
          message: `Price approved: ${name} is now ${formatMoney(product.shelfPrice)}.`,
          changesTransaction: true,
        }
      }
      return {
        summary: 'Shelf label matches the system price. The line stays as it is.',
        message: `Price confirmed: ${name} is correct as scanned.`,
        changesTransaction: false,
      }
    }
    case 'PROMOTION': {
      if (line && product?.promotion && line.unitPrice !== product.promotion.promoPrice) {
        return {
          summary: `${product.promotion.label}. Line changes from ${formatMoney(line.unitPrice)} to ${formatMoney(product.promotion.promoPrice)}.`,
          message: `Promotion approved: ${name} is now ${formatMoney(product.promotion.promoPrice)}.`,
          changesTransaction: true,
        }
      }
      return {
        summary: 'No further promotion on file for this item. The line stays as it is.',
        message: `Promotion checked: no further discount applies to ${name}.`,
        changesTransaction: false,
      }
    }
    case 'VOID':
      return {
        summary: line
          ? `${line.qty} x ${name} comes off the transaction.`
          : 'This item is no longer on the transaction.',
        message: `Void approved: ${name} removed from the transaction.`,
        changesTransaction: Boolean(line),
      }
    case 'PAYMENT':
      return {
        summary: 'Clears the terminal error so payment can be retried.',
        message: 'Payment issue cleared. You can take payment again.',
        changesTransaction: Boolean(transaction?.paymentError),
      }
    case 'OTHER':
      return {
        summary: 'No change to the transaction.',
        message: 'Your request has been handled.',
        changesTransaction: false,
      }
  }
}

function applyLineChange(
  transaction: Transaction,
  lineId: string | undefined,
  change: (line: TransactionLine) => TransactionLine,
): Transaction {
  return {
    ...transaction,
    lines: transaction.lines.map((line) => (line.lineId === lineId ? change(line) : line)),
  }
}

/** Applies the simulated result of a resolved request. No real POS is touched. */
function applyEffect(state: DemoState, request: SupportRequest): DemoState {
  const transaction = state.transactions[request.counterId]
  // Only touch the transaction the request was raised against.
  if (!transaction || transaction.id !== request.transactionId) return state

  const product = request.item ? getProduct(request.item.productId) : undefined
  const lineId = request.item?.lineId
  let updated = transaction

  if (request.category === 'PRICE' && product?.shelfPrice !== undefined) {
    const shelfPrice = product.shelfPrice
    updated = applyLineChange(transaction, lineId, (line) => ({
      ...line,
      unitPrice: shelfPrice,
      adjustment: { kind: 'PRICE', label: 'Price approved' },
    }))
  } else if (request.category === 'PROMOTION' && product?.promotion) {
    const promotion = product.promotion
    updated = applyLineChange(transaction, lineId, (line) => ({
      ...line,
      unitPrice: promotion.promoPrice,
      adjustment: { kind: 'PROMOTION', label: promotion.label },
    }))
  } else if (request.category === 'VOID') {
    updated = applyLineChange(transaction, lineId, (line) => ({ ...line, voided: true }))
  } else if (request.category === 'PAYMENT') {
    updated = { ...transaction, paymentError: undefined }
  }

  return { ...state, transactions: { ...state.transactions, [request.counterId]: updated } }
}

function updateRequest(
  state: DemoState,
  requestId: string,
  change: (request: SupportRequest) => SupportRequest,
): DemoState {
  return {
    ...state,
    requests: state.requests.map((request) => (request.id === requestId ? change(request) : request)),
  }
}

function moveTo(
  request: SupportRequest,
  status: RequestStatus,
  now: number,
  note?: string,
): SupportRequest {
  return {
    ...request,
    status,
    statusHistory: [...request.statusHistory, { status, at: now, note }],
  }
}

function findMovable(state: DemoState, requestId: string, to: RequestStatus) {
  const request = state.requests.find((candidate) => candidate.id === requestId)
  return request && canTransition(request.status, to) ? request : undefined
}

export interface NewRequestInput {
  counterId: string
  category: IssueCategory
  lineId?: string
  note: string
}

export function createRequest(state: DemoState, input: NewRequestInput, now: number): DemoState {
  const counter = getCounter(state, input.counterId)
  const transaction = state.transactions[input.counterId]
  if (!counter || !transaction || getActiveRequest(state, input.counterId)) return state

  const line = transaction.lines.find((candidate) => candidate.lineId === input.lineId)
  if (needsItem(input.category) && !line) return state

  const request: SupportRequest = {
    id: `REQ-${state.nextRequestNumber}`,
    counterId: counter.id,
    cashierName: counter.cashierName,
    transactionId: transaction.id,
    transactionTotal: getTotal(transaction),
    transactionItemCount: getItemCount(transaction),
    category: input.category,
    item: line && {
      lineId: line.lineId,
      productId: line.productId,
      name: line.name,
      barcode: line.barcode,
      unitPrice: line.unitPrice,
      qty: line.qty,
    },
    note: input.note.trim(),
    status: 'PENDING',
    statusHistory: [{ status: 'PENDING', at: now }],
    createdAt: now,
    queueAtRequest: counter.queue,
  }

  return {
    ...state,
    nextRequestNumber: state.nextRequestNumber + 1,
    // Older closed requests at this counter leave the status bar.
    requests: [
      request,
      ...state.requests.map((existing) =>
        existing.counterId === counter.id ? { ...existing, dismissed: true } : existing,
      ),
    ],
  }
}

export function acceptRequest(state: DemoState, requestId: string, now: number): DemoState {
  if (!findMovable(state, requestId, 'ACCEPTED')) return state
  return updateRequest(state, requestId, (request) => ({
    ...moveTo(request, 'ACCEPTED', now),
    acceptedAt: now,
    managerMessage: 'Manager has your request.',
  }))
}

export function startRemoteResolution(state: DemoState, requestId: string, now: number): DemoState {
  const target = findMovable(state, requestId, 'REMOTE_RESOLUTION')
  if (!target || !canResolveRemotely(target.category)) return state
  return updateRequest(state, requestId, (request) => ({
    ...moveTo(request, 'REMOTE_RESOLUTION', now),
    managerMessage: 'Manager is reviewing this remotely. Keep serving; no visit needed yet.',
  }))
}

export function approveRemotely(state: DemoState, requestId: string, now: number): DemoState {
  const target = findMovable(state, requestId, 'RESOLVED')
  if (!target || target.status !== 'REMOTE_RESOLUTION') return state
  const { message } = describeEffect(state, target)
  return updateRequest(applyEffect(state, target), requestId, (request) => ({
    ...moveTo(request, 'RESOLVED', now, 'Approved remotely'),
    resolvedAt: now,
    resolution: 'REMOTE',
    managerMessage: message,
  }))
}

export function goToCounter(state: DemoState, requestId: string, now: number): DemoState {
  const target = findMovable(state, requestId, 'IN_PROGRESS')
  if (!target) return state
  const label = getCounter(state, target.counterId)?.label ?? target.counterId
  return updateRequest(state, requestId, (request) => ({
    ...moveTo(request, 'IN_PROGRESS', now, 'Manager heading to counter'),
    visit: { startedAt: now },
    managerMessage: `Manager is on the way to ${label}.`,
  }))
}

export function markArrived(state: DemoState, requestId: string, now: number): DemoState {
  return updateRequest(state, requestId, (request) =>
    request.status === 'IN_PROGRESS' && request.visit
      ? {
          ...request,
          visit: { ...request.visit, arrivedAt: now },
          managerMessage: 'Manager is at the counter.',
          statusHistory: [
            ...request.statusHistory,
            { status: 'IN_PROGRESS', at: now, note: 'Manager arrived at counter' },
          ],
        }
      : request,
  )
}

export function resolveAtCounter(state: DemoState, requestId: string, now: number): DemoState {
  const target = findMovable(state, requestId, 'RESOLVED')
  if (!target || target.status !== 'IN_PROGRESS' || !target.visit?.arrivedAt) return state
  const { message } = describeEffect(state, target)
  return updateRequest(applyEffect(state, target), requestId, (request) => ({
    ...moveTo(request, 'RESOLVED', now, 'Resolved at counter'),
    resolvedAt: now,
    resolution: 'COUNTER',
    managerMessage: message,
  }))
}

export function rejectRequest(
  state: DemoState,
  requestId: string,
  reason: string,
  now: number,
): DemoState {
  if (!findMovable(state, requestId, 'REJECTED')) return state
  return updateRequest(state, requestId, (request) => ({
    ...moveTo(request, 'REJECTED', now, reason),
    closedAt: now,
    managerMessage: `Request declined: ${reason}.`,
  }))
}

export function cancelRequest(state: DemoState, requestId: string, now: number): DemoState {
  if (!findMovable(state, requestId, 'CANCELLED')) return state
  return updateRequest(state, requestId, (request) => ({
    ...moveTo(request, 'CANCELLED', now, 'Cancelled by cashier'),
    closedAt: now,
    managerMessage: undefined,
  }))
}

export function dismissRequest(state: DemoState, requestId: string): DemoState {
  return updateRequest(state, requestId, (request) => ({ ...request, dismissed: true }))
}

export function completeSale(state: DemoState, counterId: string): DemoState {
  const transaction = state.transactions[counterId]
  const counter = getCounter(state, counterId)
  if (!transaction || !counter) return state
  if (getActiveRequest(state, counterId) || transaction.paymentError) return state
  if (getItemCount(transaction) === 0) return state

  const withServed: DemoState = {
    ...state,
    counters: state.counters.map((candidate) =>
      candidate.id === counterId
        ? { ...candidate, queue: Math.max(0, candidate.queue - 1) }
        : candidate,
    ),
    requests: state.requests.map((request) =>
      request.counterId === counterId ? { ...request, dismissed: true } : request,
    ),
  }
  return createTransaction(withServed, counterId, counter.nextTemplate)
}

export function getRequestTitle(request: SupportRequest): string {
  return request.item
    ? `${getCategoryLabel(request.category)}: ${request.item.name}`
    : getCategoryLabel(request.category)
}
