import type { Product } from '@/types/product'

export const PRODUCTS: Product[] = [
  { id: 'milk', name: 'Whole Milk 1L', barcode: '4901234500011', price: 3.6 },
  { id: 'bread', name: 'Sourdough Loaf', barcode: '4901234500028', price: 4.25 },
  { id: 'eggs', name: 'Free-Range Eggs 12pk', barcode: '4901234500035', price: 5.4 },
  {
    id: 'yoghurt',
    name: 'Greek Yoghurt 500g',
    barcode: '4901234500042',
    price: 4.8,
    shelfPrice: 3.9,
  },
  {
    id: 'rice',
    name: 'Jasmine Rice 5kg',
    barcode: '4901234500059',
    price: 13.5,
    promotion: { label: 'Weekend Saver: 20% off', promoPrice: 10.8, validUntil: 'Sunday' },
  },
  {
    id: 'oil',
    name: 'Olive Oil 750ml',
    barcode: '4901234500066',
    price: 11.9,
    promotion: { label: 'Member price', promoPrice: 9.5, validUntil: 'End of month' },
  },
  {
    id: 'detergent',
    name: 'Laundry Detergent 2L',
    barcode: '4901234500073',
    price: 9.75,
    promotion: { label: 'Home Care Week', promoPrice: 7.95, validUntil: 'Friday' },
  },
  { id: 'bananas', name: 'Bananas 1kg', barcode: '4901234500080', price: 1.95 },
  { id: 'coffee', name: 'Instant Coffee 200g', barcode: '4901234500097', price: 8.4 },
  { id: 'juice', name: 'Cold-Pressed Juice 1L', barcode: '4901234500103', price: 5.2 },
  { id: 'shampoo', name: 'Shampoo 400ml', barcode: '4901234500110', price: 6.3 },
  {
    id: 'chocolate',
    name: 'Dark Chocolate 100g',
    barcode: '4901234500127',
    price: 3.1,
    promotion: { label: 'Snack Deal', promoPrice: 2.5, validUntil: 'Sunday' },
  },
  {
    id: 'earbuds',
    name: 'Wireless Earbuds',
    barcode: '4901234500134',
    price: 39,
    voidRequiresApproval: true,
  },
  {
    id: 'pan',
    name: 'Non-Stick Frying Pan 28cm',
    barcode: '4901234500141',
    price: 32,
    voidRequiresApproval: true,
  },
]

export function getProduct(productId: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === productId)
}
