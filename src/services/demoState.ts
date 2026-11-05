import type { SupportRequest } from '@/types/request'
import type { Counter, Transaction } from '@/types/transaction'

/** Everything shared between tabs. Persisted to localStorage as one document. */
export interface DemoState {
  schemaVersion: number
  /** Incremented on each write so tabs can ignore stale broadcasts. */
  rev: number
  counters: Counter[]
  transactions: Record<string, Transaction>
  requests: SupportRequest[]
  nextRequestNumber: number
  nextTransactionNumber: number
  nextLineNumber: number
  /** Presenter fast-forward: added to the wall clock everywhere. */
  clockOffsetMs: number
  managerAway: boolean
  /** Latest scenario set up by the presenter. Open cashier tabs jump to its counter. */
  scenario: { id: string; counterId: string; nonce: number } | null
}

export const SCHEMA_VERSION = 1

export function getCounter(state: DemoState, counterId: string): Counter | undefined {
  return state.counters.find((counter) => counter.id === counterId)
}
