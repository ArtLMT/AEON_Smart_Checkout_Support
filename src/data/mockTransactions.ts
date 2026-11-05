export interface TransactionTemplate {
  items: { productId: string; qty: number }[]
}

/** Predefined baskets, rotated through as each counter completes a sale. */
export const TRANSACTION_TEMPLATES: TransactionTemplate[] = [
  {
    items: [
      { productId: 'rice', qty: 1 },
      { productId: 'milk', qty: 2 },
      { productId: 'bananas', qty: 1 },
    ],
  },
  {
    items: [
      { productId: 'yoghurt', qty: 2 },
      { productId: 'bread', qty: 1 },
      { productId: 'coffee', qty: 1 },
    ],
  },
  {
    items: [
      { productId: 'earbuds', qty: 1 },
      { productId: 'juice', qty: 2 },
      { productId: 'chocolate', qty: 3 },
    ],
  },
  {
    items: [
      { productId: 'detergent', qty: 1 },
      { productId: 'shampoo', qty: 1 },
      { productId: 'eggs', qty: 1 },
      { productId: 'pan', qty: 1 },
    ],
  },
  {
    items: [
      { productId: 'oil', qty: 1 },
      { productId: 'bread', qty: 2 },
      { productId: 'milk', qty: 1 },
      { productId: 'bananas', qty: 2 },
    ],
  },
]

export const COUNTER_START_TEMPLATE: Record<string, number> = {
  '03': 1,
  '05': 0,
  '08': 3,
  '10': 2,
  '12': 4,
}
