import type { IssueCategory, PriorityLevel, SupportRequest } from '@/types/request'
import { getEscalationStage, type EscalationStage } from '@/utils/escalationRules'

export type QueueRisk = 'LOW' | 'MEDIUM' | 'HIGH'

export interface PriorityResult {
  level: PriorityLevel
  /** Sort key: a higher score is shown first. */
  score: number
  stage: EscalationStage
  queueRisk: QueueRisk
  /** The urgent alert is showing: 90 seconds with nobody accepting. */
  urgent: boolean
  /** Plain-language explanation of how the level was reached. */
  reasons: string[]
}

const LEVELS: PriorityLevel[] = ['LOW', 'MEDIUM', 'HIGH']

const BASE_PRIORITY: Record<IssueCategory, PriorityLevel> = {
  PAYMENT: 'HIGH',
  VOID: 'MEDIUM',
  PRICE: 'MEDIUM',
  PROMOTION: 'MEDIUM',
  OTHER: 'LOW',
}

const CATEGORY_LABEL: Record<IssueCategory, string> = {
  PRICE: 'Price Check',
  PROMOTION: 'Promotion',
  VOID: 'Void Item',
  PAYMENT: 'Payment Issue',
  OTHER: 'Other',
}

export function getCategoryLabel(category: IssueCategory): string {
  return CATEGORY_LABEL[category]
}

export function getBasePriority(category: IssueCategory): PriorityLevel {
  return BASE_PRIORITY[category]
}

export function getQueueRisk(queue: number): QueueRisk {
  if (queue >= 5) return 'HIGH'
  if (queue >= 3) return 'MEDIUM'
  return 'LOW'
}

/** Time until acceptance, or until closure when nobody accepted. Still running while pending. */
export function getWaitMs(request: SupportRequest, now: number): number {
  const end = request.acceptedAt ?? request.closedAt ?? now
  return Math.max(0, end - request.createdAt)
}

export function computePriority(
  request: SupportRequest,
  queue: number,
  now: number,
): PriorityResult {
  const isClosed = ['RESOLVED', 'REJECTED', 'CANCELLED'].includes(request.status)
  const effectiveQueue = isClosed ? request.queueAtRequest : queue
  const waitMs = getWaitMs(request, now)
  const stage = getEscalationStage(waitMs)
  const queueRisk = getQueueRisk(effectiveQueue)

  const base = BASE_PRIORITY[request.category]
  let rank = LEVELS.indexOf(base)
  const reasons = [`${CATEGORY_LABEL[request.category]} starts at ${base.toLowerCase()} priority`]

  if (queueRisk === 'HIGH') {
    if (rank < 2) {
      rank += 1
      reasons.push(`${effectiveQueue} customers waiting raised it to ${LEVELS[rank].toLowerCase()}`)
    } else {
      reasons.push(`${effectiveQueue} customers waiting moves it up the list`)
    }
  }

  if (stage >= 2) {
    if (rank < 2) {
      rank += 1
      reasons.push(`Unaccepted for 60s raised it to ${LEVELS[rank].toLowerCase()}`)
    } else {
      reasons.push('Unaccepted for 60s; already at the highest level')
    }
  }

  const urgent = request.status === 'PENDING' && stage === 3
  if (urgent) reasons.push('Unaccepted for 90s: urgent alert showing')

  const score =
    (urgent ? 10_000 : 0) +
    (rank + 1) * 1_000 +
    effectiveQueue * 20 +
    Math.min(Math.floor(waitMs / 1000), 300)

  return { level: LEVELS[rank], score, stage, queueRisk, urgent, reasons }
}
