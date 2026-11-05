import { getCategoryLabel } from '@/services/priorityService'
import { INITIAL_COUNTERS } from '@/data/mockCounters'
import type { IssueCategory, RequestStatus, ResolutionMethod, SupportRequest } from '@/types/request'

/** Small deterministic generator so every reset produces the same shift history. */
function createRandom(seed: number) {
  let value = seed
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

const HOUR_MS = 3_600_000
const SHIFT_HOURS = 8
/** Share of the request volume in each hour of the shift, oldest first, peaking mid-shift. */
const HOUR_WEIGHTS = [2, 3, 3, 6, 8, 4, 3, 4]

const CATEGORY_POOL: IssueCategory[] = [
  'PROMOTION', 'PROMOTION', 'PROMOTION', 'PROMOTION', 'PRICE', 'PRICE', 'PRICE',
  'VOID', 'VOID', 'PAYMENT', 'PAYMENT', 'OTHER',
]

/** Closed requests from earlier in the shift, so analytics are populated immediately. */
export function generateSeedHistory(now: number): SupportRequest[] {
  const random = createRandom(20261104)
  const between = (min: number, max: number) => Math.round(min + random() * (max - min))
  const requests: SupportRequest[] = []
  let sequence = 1001

  HOUR_WEIGHTS.forEach((count, hourIndex) => {
    for (let i = 0; i < count; i += 1) {
      const counter = INITIAL_COUNTERS[between(0, INITIAL_COUNTERS.length - 1)]
      const category = CATEGORY_POOL[between(0, CATEGORY_POOL.length - 1)]
      const hoursAgo = SHIFT_HOURS - hourIndex
      const createdAt = now - hoursAgo * HOUR_MS + between(60_000, HOUR_MS - 300_000)
      const queueAtRequest = between(0, 7)
      const waitMs = between(8, random() < 0.15 ? 95 : 48) * 1000

      const roll = random()
      const status: RequestStatus = roll < 0.05 ? 'CANCELLED' : roll < 0.1 ? 'REJECTED' : 'RESOLVED'
      const remote = category !== 'PAYMENT' && random() < 0.8
      const resolution: ResolutionMethod | undefined =
        status === 'RESOLVED' ? (remote ? 'REMOTE' : 'COUNTER') : undefined
      const handlingMs = (remote ? between(15, 70) : between(90, 240)) * 1000

      const request: SupportRequest = {
        id: `REQ-${sequence}`,
        counterId: counter.id,
        cashierName: counter.cashierName,
        transactionId: `TX-${19000 + sequence}`,
        transactionTotal: between(600, 9000) / 100,
        transactionItemCount: between(1, 14),
        category,
        note: '',
        status,
        statusHistory: [{ status: 'PENDING', at: createdAt }],
        createdAt,
        queueAtRequest,
        dismissed: true,
      }

      if (status === 'CANCELLED') {
        request.closedAt = createdAt + waitMs
        request.statusHistory.push({ status, at: request.closedAt, note: 'Cancelled by cashier' })
      } else {
        const acceptedAt = createdAt + waitMs
        request.acceptedAt = acceptedAt
        request.statusHistory.push({ status: 'ACCEPTED', at: acceptedAt })
        const doneAt = acceptedAt + handlingMs
        if (status === 'REJECTED') {
          request.closedAt = doneAt
          request.managerMessage = 'Request declined: not eligible.'
          request.statusHistory.push({ status, at: doneAt, note: 'Not eligible' })
        } else {
          request.resolvedAt = doneAt
          request.resolution = resolution
          request.managerMessage = `${getCategoryLabel(category)} handled.`
          request.statusHistory.push(
            { status: remote ? 'REMOTE_RESOLUTION' : 'IN_PROGRESS', at: acceptedAt + 4_000 },
            { status, at: doneAt },
          )
        }
      }

      requests.push(request)
      sequence += 1
    }
  })

  return requests.sort((a, b) => b.createdAt - a.createdAt)
}
