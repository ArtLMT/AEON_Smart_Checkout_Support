import { beforeEach, describe, expect, it } from 'vitest'
import { computeMetrics } from '@/services/analyticsService'
import type { DemoState } from '@/services/demoState'
import { computePriority } from '@/services/priorityService'
import * as requests from '@/services/requestService'
import { createInitialState, setupScenario } from '@/services/scenarioService'
import { getTotal } from '@/services/transactionService'

const T0 = 1_800_000_000_000

function submit(state: DemoState, counterId: string, category: requests.NewRequestInput['category'], now = T0) {
  const lineId = state.transactions[counterId].lines[0].lineId
  return requests.createRequest(state, { counterId, category, lineId, note: '' }, now)
}

function latestAt(state: DemoState, counterId: string) {
  return requests.getCurrentRequest(state, counterId)!
}

describe('priority rules', () => {
  let state: DemoState
  beforeEach(() => {
    state = setupScenario(createInitialState(T0), 'C')
  })

  it('assigns initial priority by category', () => {
    const withQuietQueue = { ...state, counters: state.counters.map((c) => ({ ...c, queue: 0 })) }
    const level = (category: requests.NewRequestInput['category']) => {
      const next = submit(withQuietQueue, '03', category)
      return computePriority(latestAt(next, '03'), 0, T0).level
    }
    expect(level('PAYMENT')).toBe('HIGH')
    expect(level('VOID')).toBe('MEDIUM')
    expect(level('PRICE')).toBe('MEDIUM')
    expect(level('PROMOTION')).toBe('MEDIUM')
    expect(level('OTHER')).toBe('LOW')
  })

  it('escalates a pending request at 30, 60 and 90 seconds', () => {
    const request = latestAt(submit(state, '03', 'PRICE'), '03')
    expect(computePriority(request, 2, T0 + 29_000).stage).toBe(0)
    expect(computePriority(request, 2, T0 + 30_000).stage).toBe(1)
    expect(computePriority(request, 2, T0 + 30_000).level).toBe('MEDIUM')
    expect(computePriority(request, 2, T0 + 60_000).level).toBe('HIGH')
    expect(computePriority(request, 2, T0 + 89_000).urgent).toBe(false)
    expect(computePriority(request, 2, T0 + 90_000).urgent).toBe(true)
  })

  it('stops escalating once accepted', () => {
    const submitted = submit(state, '03', 'PRICE')
    const id = latestAt(submitted, '03').id
    const accepted = latestAt(requests.acceptRequest(submitted, id, T0 + 10_000), '03')
    const result = computePriority(accepted, 2, T0 + 500_000)
    expect(result.stage).toBe(0)
    expect(result.level).toBe('MEDIUM')
    expect(result.urgent).toBe(false)
  })

  it('uses queue length as a priority factor', () => {
    const request = latestAt(submit(state, '03', 'PROMOTION'), '03')
    expect(computePriority(request, 1, T0).level).toBe('MEDIUM')
    expect(computePriority(request, 6, T0).level).toBe('HIGH')
    expect(computePriority(request, 6, T0).score).toBeGreaterThan(
      computePriority(request, 1, T0).score,
    )
  })

  it('ranks a payment issue with a long queue above a promotion with a short one', () => {
    const base = createInitialState(T0)
    const cleared = setupScenario(setupScenario(base, 'A'), 'A')
    const promo = latestAt(submit(cleared, '05', 'PROMOTION'), '05')
    const payment = latestAt(submit(cleared, '08', 'PAYMENT'), '08')
    expect(computePriority(payment, 6, T0).score).toBeGreaterThan(
      computePriority(promo, 1, T0).score,
    )
  })
})

describe('request lifecycle', () => {
  it('Scenario A: approves a promotion remotely and updates the transaction', () => {
    let state = setupScenario(createInitialState(T0), 'A')
    const before = getTotal(state.transactions['05'])
    state = submit(state, '05', 'PROMOTION')
    const { id } = latestAt(state, '05')

    state = requests.acceptRequest(state, id, T0 + 5_000)
    state = requests.startRemoteResolution(state, id, T0 + 8_000)
    expect(latestAt(state, '05').status).toBe('REMOTE_RESOLUTION')
    state = requests.approveRemotely(state, id, T0 + 12_000)

    const resolved = latestAt(state, '05')
    expect(resolved.status).toBe('RESOLVED')
    expect(resolved.resolution).toBe('REMOTE')
    expect(resolved.acceptedAt).toBe(T0 + 5_000)
    expect(resolved.resolvedAt).toBe(T0 + 12_000)
    expect(resolved.statusHistory.map((entry) => entry.status)).toEqual([
      'PENDING',
      'ACCEPTED',
      'REMOTE_RESOLUTION',
      'RESOLVED',
    ])
    expect(before - getTotal(state.transactions['05'])).toBeCloseTo(2.7)
  })

  it('Scenario B: resolves a payment issue at the counter and clears the error', () => {
    let state = setupScenario(createInitialState(T0), 'B')
    expect(state.transactions['08'].paymentError).toBeTruthy()
    state = submit(state, '08', 'PAYMENT')
    const { id } = latestAt(state, '08')
    expect(computePriority(latestAt(state, '08'), 6, T0).level).toBe('HIGH')

    state = requests.acceptRequest(state, id, T0 + 3_000)
    // Payment issues cannot take the remote route.
    expect(latestAt(requests.startRemoteResolution(state, id, T0), '08').status).toBe('ACCEPTED')

    state = requests.goToCounter(state, id, T0 + 5_000)
    expect(latestAt(state, '08').status).toBe('IN_PROGRESS')
    expect(requests.getManagerAvailability(state).kind).toBe('TRAVELLING')

    // Cannot resolve before arriving.
    expect(latestAt(requests.resolveAtCounter(state, id, T0 + 6_000), '08').status).toBe('IN_PROGRESS')

    state = requests.markArrived(state, id, T0 + 30_000)
    expect(requests.getManagerAvailability(state).kind).toBe('AT_COUNTER')
    state = requests.resolveAtCounter(state, id, T0 + 60_000)
    expect(latestAt(state, '08').resolution).toBe('COUNTER')
    expect(state.transactions['08'].paymentError).toBeUndefined()
  })

  it('applies a void and a shelf price correction', () => {
    let state = setupScenario(createInitialState(T0), 'C')
    state = submit(state, '03', 'PRICE')
    let { id } = latestAt(state, '03')
    state = requests.acceptRequest(state, id, T0)
    state = requests.startRemoteResolution(state, id, T0)
    state = requests.approveRemotely(state, id, T0)
    expect(state.transactions['03'].lines[0].unitPrice).toBe(3.9)

    state = submit(state, '03', 'VOID')
    id = latestAt(state, '03').id
    state = requests.acceptRequest(state, id, T0)
    state = requests.startRemoteResolution(state, id, T0)
    state = requests.approveRemotely(state, id, T0)
    expect(state.transactions['03'].lines[0].voided).toBe(true)
  })

  it('rejects invalid moves and a second open request', () => {
    let state = setupScenario(createInitialState(T0), 'A')
    state = submit(state, '05', 'PROMOTION')
    const { id } = latestAt(state, '05')

    expect(requests.approveRemotely(state, id, T0)).toBe(state)
    expect(requests.resolveAtCounter(state, id, T0)).toBe(state)
    expect(submit(state, '05', 'PRICE')).toBe(state)

    state = requests.cancelRequest(state, id, T0 + 1_000)
    expect(latestAt(state, '05').status).toBe('CANCELLED')
    expect(requests.acceptRequest(state, id, T0 + 2_000)).toBe(state)
  })

  it('blocks payment during an open request and moves to the next customer after a sale', () => {
    let state = setupScenario(createInitialState(T0), 'A')
    const transactionId = state.transactions['05'].id
    const withRequest = submit(state, '05', 'PROMOTION')
    expect(requests.completeSale(withRequest, '05')).toBe(withRequest)

    state = requests.completeSale(state, '05')
    expect(state.transactions['05'].id).not.toBe(transactionId)
    expect(state.counters.find((counter) => counter.id === '05')?.queue).toBe(0)
  })
})

describe('analytics', () => {
  it('computes rates from request timestamps', () => {
    let state = setupScenario(createInitialState(T0), 'A')
    state = { ...state, requests: [] }
    state = submit(state, '05', 'PROMOTION')
    const { id } = latestAt(state, '05')
    state = requests.acceptRequest(state, id, T0 + 70_000)
    state = requests.startRemoteResolution(state, id, T0 + 71_000)
    state = requests.approveRemotely(state, id, T0 + 100_000)

    const metrics = computeMetrics(state.requests, T0 + 200_000)
    expect(metrics.active).toBe(0)
    expect(metrics.avgWaitMs).toBe(70_000)
    expect(metrics.avgResolutionMs).toBe(100_000)
    expect(metrics.remoteRate).toBe(1)
    expect(metrics.escalationRate).toBe(1)
    expect(metrics.tripsAvoided).toBe(1)
  })
})
