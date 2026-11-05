import { INITIAL_COUNTERS } from '@/data/mockCounters'
import { generateSeedHistory } from '@/data/seedHistory'
import { SCHEMA_VERSION, type DemoState } from '@/services/demoState'
import { getProduct } from '@/data/mockProducts'
import {
  acceptRequest,
  createRequest,
  getActiveRequest,
  isActive,
  needsItem,
} from '@/services/requestService'
import { createTransaction, getStartTemplate } from '@/services/transactionService'
import type { IssueCategory } from '@/types/request'

export interface ScenarioDefinition {
  id: string
  title: string
  summary: string
  counterId: string
  queue: number
  template: number
  paymentError?: string
}

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'A',
    title: 'Remote promotion',
    summary: 'Counter 05 asks for a promotion check. Approve it remotely.',
    counterId: '05',
    queue: 1,
    template: 0,
  },
  {
    id: 'B',
    title: 'High-priority payment',
    summary: 'Counter 08 has a terminal error and six customers waiting. Visit the counter.',
    counterId: '08',
    queue: 6,
    template: 3,
    paymentError: 'Card terminal error E-205: payment declined',
  },
  {
    id: 'C',
    title: 'Smart escalation',
    summary: 'Counter 03 asks for a price check. Leave it unanswered and watch it escalate.',
    counterId: '03',
    queue: 2,
    template: 1,
  },
]

export function createInitialState(now: number): DemoState {
  const history = generateSeedHistory(now)
  let state: DemoState = {
    schemaVersion: SCHEMA_VERSION,
    rev: 0,
    counters: INITIAL_COUNTERS.map((counter) => ({ ...counter })),
    transactions: {},
    requests: history,
    nextRequestNumber: 1000 + history.length + 1,
    nextTransactionNumber: 20431,
    nextLineNumber: 1,
    clockOffsetMs: 0,
    managerAway: false,
    scenario: null,
  }
  for (const counter of state.counters) {
    state = createTransaction(state, counter.id, getStartTemplate(counter.id))
  }
  return seedActiveRequests(state, now)
}

/** Two requests in flight so the dashboard looks busy from the first load. */
function seedActiveRequests(state: DemoState, now: number): DemoState {
  const accepted = createBackgroundRequest(state, '12', 'OTHER', 'Customer asking about a refund receipt.', now - 22_000)
  const withAccepted = acceptRequest(accepted, accepted.requests[0].id, now - 9_000)
  return createBackgroundRequest(withAccepted, '10', 'VOID', '', now - 6_000)
}

function createBackgroundRequest(
  state: DemoState,
  counterId: string,
  category: IssueCategory,
  note: string,
  now: number,
): DemoState {
  const lines = state.transactions[counterId]?.lines ?? []
  const line =
    category === 'PROMOTION'
      ? (lines.find((candidate) => getProduct(candidate.productId)?.promotion) ?? lines[0])
      : lines[0]
  const lineId = needsItem(category) ? line?.lineId : undefined
  return createRequest(state, { counterId, category, lineId, note }, now)
}

/** Clears in-flight requests and sets one counter up for a scenario. Closed history is kept. */
export function setupScenario(state: DemoState, scenarioId: string): DemoState {
  const scenario = SCENARIOS.find((candidate) => candidate.id === scenarioId)
  if (!scenario) return state

  const cleared: DemoState = {
    ...state,
    requests: state.requests
      .filter((request) => !isActive(request))
      .map((request) => ({ ...request, dismissed: true })),
    managerAway: false,
    counters: state.counters.map((counter) =>
      counter.id === scenario.counterId ? { ...counter, queue: scenario.queue } : counter,
    ),
    scenario: {
      id: scenario.id,
      counterId: scenario.counterId,
      nonce: (state.scenario?.nonce ?? 0) + 1,
    },
  }
  return createTransaction(cleared, scenario.counterId, scenario.template, scenario.paymentError)
}

/** Presenter tool: requests from other counters, to show the list reordering by priority. */
export function addBusyPeriodRequests(state: DemoState, now: number): DemoState {
  const free = state.counters.filter((counter) => !getActiveRequest(state, counter.id))
  const samples: { category: IssueCategory; note: string }[] = [
    { category: 'OTHER', note: 'Customer asking about a loyalty card.' },
    { category: 'PROMOTION', note: '' },
    { category: 'PAYMENT', note: 'Voucher will not scan at the terminal.' },
  ]
  return free
    .slice(0, samples.length)
    .reduce(
      (next, counter, index) =>
        createBackgroundRequest(next, counter.id, samples[index].category, samples[index].note, now),
      state,
    )
}

export function setQueue(state: DemoState, counterId: string, delta: number): DemoState {
  return {
    ...state,
    counters: state.counters.map((counter) =>
      counter.id === counterId
        ? { ...counter, queue: Math.min(12, Math.max(0, counter.queue + delta)) }
        : counter,
    ),
  }
}
