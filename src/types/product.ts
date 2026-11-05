export interface Promotion {
  label: string
  promoPrice: number
  validUntil: string
}

export interface Product {
  id: string
  name: string
  barcode: string
  /** Price held by the POS system. */
  price: number
  /** Price on the shelf label, when it differs from the system price. */
  shelfPrice?: number
  promotion?: Promotion
  /** High-value items cannot be removed by the cashier without a manager void. */
  voidRequiresApproval?: boolean
}
