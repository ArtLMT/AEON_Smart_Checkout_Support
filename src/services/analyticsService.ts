import { getCategoryLabel, getWaitMs } from '@/services/priorityService'
import { isActive } from '@/services/requestService'
import type { IssueCategory, SupportRequest } from '@/types/request'
import { RAISE_PRIORITY_MS } from '@/utils/escalationRules'

export interface SupportMetrics {
  total: number
  active: number
  resolved: number
  avgWaitMs: number | null
  avgResolutionMs: number | null
  longestPendingMs: number | null
  remoteRate: number | null
  escalationRate: number | null
  /** Resolved without the manager walking to the counter. */
  tripsAvoided: number
  byCategory: { category: IssueCategory; label: string; count: number }[]
  byHour: { hour: number; label: string; count: number }[]
  peak: { label: string; count: number } | null
}

const CATEGORIES: IssueCategory[] = ['PRICE', 'PROMOTION', 'VOID', 'PAYMENT', 'OTHER']

function average(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length
}

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

export function computeMetrics(requests: SupportRequest[], now: number): SupportMetrics {
  const accepted = requests.filter((request) => request.acceptedAt !== undefined)
  const resolved = requests.filter((request) => request.resolvedAt !== undefined)
  const pending = requests.filter((request) => request.status === 'PENDING')
  const remote = resolved.filter((request) => request.resolution === 'REMOTE')
  const escalated = requests.filter((request) => getWaitMs(request, now) >= RAISE_PRIORITY_MS)

  const hourCounts = new Map<number, number>()
  for (const request of requests) {
    const hour = new Date(request.createdAt).getHours()
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1)
  }
  const byHour = [...hourCounts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hour, count]) => ({ hour, label: hourLabel(hour), count }))

  const peakHour = byHour.reduce<(typeof byHour)[number] | null>(
    (best, entry) => (best === null || entry.count > best.count ? entry : best),
    null,
  )

  return {
    total: requests.length,
    active: requests.filter(isActive).length,
    resolved: resolved.length,
    avgWaitMs: average(accepted.map((request) => request.acceptedAt! - request.createdAt)),
    avgResolutionMs: average(resolved.map((request) => request.resolvedAt! - request.createdAt)),
    longestPendingMs:
      pending.length === 0 ? null : Math.max(...pending.map((request) => getWaitMs(request, now))),
    remoteRate: resolved.length === 0 ? null : remote.length / resolved.length,
    escalationRate: requests.length === 0 ? null : escalated.length / requests.length,
    tripsAvoided: remote.length,
    byCategory: CATEGORIES.map((category) => ({
      category,
      label: getCategoryLabel(category),
      count: requests.filter((request) => request.category === category).length,
    })),
    byHour,
    peak: peakHour && {
      label: `${peakHour.label} to ${hourLabel((peakHour.hour + 1) % 24)}`,
      count: peakHour.count,
    },
  }
}
