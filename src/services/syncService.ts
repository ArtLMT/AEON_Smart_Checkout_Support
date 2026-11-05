import type { DemoState } from '@/services/demoState'

const channel = 'BroadcastChannel' in window ? new BroadcastChannel('aeon-support-demo') : null

export function broadcastState(state: DemoState): void {
  channel?.postMessage(state)
}

export function onRemoteState(listener: (state: DemoState) => void): void {
  if (channel) channel.onmessage = (event: MessageEvent<DemoState>) => listener(event.data)
}
