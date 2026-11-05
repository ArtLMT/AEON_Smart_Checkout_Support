export function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/** Waiting timer format, e.g. 01:05. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/** Compact duration for statistics, e.g. 48s or 3m 12s. */
export function formatStat(ms: number | null): string {
  if (ms === null) return '-'
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const seconds = totalSeconds % 60
  return seconds === 0
    ? `${Math.floor(totalSeconds / 60)}m`
    : `${Math.floor(totalSeconds / 60)}m ${seconds}s`
}

export function formatPercent(ratio: number | null): string {
  return ratio === null ? '-' : `${Math.round(ratio * 100)}%`
}

export function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
