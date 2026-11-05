export type IssueCategory = 'PRICE' | 'PROMOTION' | 'VOID' | 'PAYMENT' | 'OTHER'

export type RequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'REMOTE_RESOLUTION'
  | 'RESOLVED'
  | 'REJECTED'
  | 'CANCELLED'

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type ResolutionMethod = 'REMOTE' | 'COUNTER'

export interface StatusHistoryEntry {
  status: RequestStatus
  at: number
  note?: string
}

export interface ItemSnapshot {
  lineId: string
  productId: string
  name: string
  barcode: string
  unitPrice: number
  qty: number
}

export interface SupportRequest {
  id: string
  counterId: string
  cashierName: string
  transactionId: string
  transactionTotal: number
  transactionItemCount: number
  category: IssueCategory
  item?: ItemSnapshot
  note: string
  status: RequestStatus
  statusHistory: StatusHistoryEntry[]
  createdAt: number
  acceptedAt?: number
  resolvedAt?: number
  /** When the request reached REJECTED or CANCELLED. */
  closedAt?: number
  resolution?: ResolutionMethod
  managerMessage?: string
  /** Queue length captured on submission, used for closed requests. */
  queueAtRequest: number
  visit?: { startedAt: number; arrivedAt?: number }
  /** The cashier has cleared this request from the status bar. */
  dismissed?: boolean
}
