import { create } from 'zustand'
import type { DemoState } from '@/services/demoState'
import * as requests from '@/services/requestService'
import * as scenarios from '@/services/scenarioService'
import { loadState, saveState } from '@/services/storageService'
import { broadcastState, onRemoteState } from '@/services/syncService'
import * as transactions from '@/services/transactionService'
import { REMINDER_MS } from '@/utils/escalationRules'

const initialState = loadState() ?? scenarios.createInitialState(Date.now())

export const useSupportStore = create<DemoState>(() => initialState)

// First tab to open owns the seed, so a second tab finds it in storage.
saveState(initialState)

onRemoteState((remote) => {
  if (remote.rev >= useSupportStore.getState().rev) useSupportStore.setState(remote, true)
})

/**
 * All writes go through here. Starting from storage rather than this tab's copy means
 * a write can never overwrite a change another tab has just made.
 */
function commit(change: (state: DemoState, now: number) => DemoState): void {
  const latest = loadState() ?? useSupportStore.getState()
  const next = { ...change(latest, Date.now() + latest.clockOffsetMs), rev: latest.rev + 1 }
  saveState(next)
  useSupportStore.setState(next, true)
  broadcastState(next)
}

export const actions = {
  // Cashier
  submitRequest: (input: requests.NewRequestInput) =>
    commit((state, now) => requests.createRequest(state, input, now)),
  cancelRequest: (id: string) => commit((state, now) => requests.cancelRequest(state, id, now)),
  dismissRequest: (id: string) => commit((state) => requests.dismissRequest(state, id)),
  addItem: (counterId: string, productId: string) =>
    commit((state) => transactions.addItem(state, counterId, productId)),
  changeQty: (counterId: string, lineId: string, delta: number) =>
    commit((state) => transactions.changeQty(state, counterId, lineId, delta)),
  removeLine: (counterId: string, lineId: string) =>
    commit((state) => transactions.removeLine(state, counterId, lineId)),
  completeSale: (counterId: string) => commit((state) => requests.completeSale(state, counterId)),

  // Manager
  accept: (id: string) => commit((state, now) => requests.acceptRequest(state, id, now)),
  startRemote: (id: string) =>
    commit((state, now) => requests.startRemoteResolution(state, id, now)),
  approveRemote: (id: string) => commit((state, now) => requests.approveRemotely(state, id, now)),
  goToCounter: (id: string) => commit((state, now) => requests.goToCounter(state, id, now)),
  markArrived: (id: string) => commit((state, now) => requests.markArrived(state, id, now)),
  resolveAtCounter: (id: string) =>
    commit((state, now) => requests.resolveAtCounter(state, id, now)),
  reject: (id: string, reason: string) =>
    commit((state, now) => requests.rejectRequest(state, id, reason, now)),
  setManagerAway: (away: boolean) => commit((state) => ({ ...state, managerAway: away })),

  // Presenter
  setupScenario: (id: string) => commit((state) => scenarios.setupScenario(state, id)),
  addBusyPeriod: () => commit((state, now) => scenarios.addBusyPeriodRequests(state, now)),
  changeQueue: (counterId: string, delta: number) =>
    commit((state) => scenarios.setQueue(state, counterId, delta)),
  skipAhead: () =>
    commit((state) => ({ ...state, clockOffsetMs: state.clockOffsetMs + REMINDER_MS })),
  resetDemo: () => commit(() => scenarios.createInitialState(Date.now())),
}
