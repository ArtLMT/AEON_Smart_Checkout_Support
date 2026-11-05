import { BadgePercent, CircleHelp, CreditCard, Tag, Undo2, type LucideIcon } from 'lucide-react'
import type { IssueCategory } from '@/types/request'

export const CATEGORY_META: Record<IssueCategory, { short: string; hint: string; icon: LucideIcon }> =
  {
    PRICE: { short: 'Price', hint: 'Verify a price', icon: Tag },
    PROMOTION: { short: 'Promotion', hint: 'Check a discount', icon: BadgePercent },
    VOID: { short: 'Void', hint: 'Remove a scanned item', icon: Undo2 },
    PAYMENT: { short: 'Payment', hint: 'Terminal or payment problem', icon: CreditCard },
    OTHER: { short: 'Other', hint: 'Anything else', icon: CircleHelp },
  }

export const CATEGORY_ORDER: IssueCategory[] = ['PRICE', 'PROMOTION', 'VOID', 'PAYMENT', 'OTHER']
