export interface LineAdjustment {
  kind: 'PROMOTION' | 'PRICE'
  label: string
}

export interface TransactionLine {
  lineId: string
  productId: string
  name: string
  barcode: string
  unitPrice: number
  /** System price at scan time, kept so an approved change can be shown against it. */
  originalPrice: number
  qty: number
  adjustment?: LineAdjustment
  voided?: boolean
}

export interface Transaction {
  id: string
  counterId: string
  lines: TransactionLine[]
  /** Set while a simulated card terminal failure is blocking payment. */
  paymentError?: string
}

export interface Counter {
  id: string
  label: string
  cashierName: string
  /** Simulated number of customers waiting. */
  queue: number
  /** Index of the next predefined transaction for this counter. */
  nextTemplate: number
}

export type PaymentMethod = 'CARD' | 'CASH' | 'QR'
