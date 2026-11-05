import { SCHEMA_VERSION, type DemoState } from '@/services/demoState'

const STORAGE_KEY = 'aeon-support-demo'

export function loadState(): DemoState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoState
    return parsed.schemaVersion === SCHEMA_VERSION ? parsed : null
  } catch {
    return null
  }
}

export function saveState(state: DemoState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be blocked; the demo keeps working from memory and BroadcastChannel.
  }
}
