import { ManagerChip } from '@/components/shared/ManagerChip'
import type { SupportMetrics } from '@/services/analyticsService'
import { formatStat } from '@/utils/format'

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card p-2.5 ring-1 ring-foreground/10">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">{children}</div>
    </div>
  )
}

export function DashboardOverview({ metrics }: { metrics: SupportMetrics }) {
  return (
    <section aria-label="Overview" className="grid grid-cols-2 gap-2">
      <Tile label="Active requests">{metrics.active}</Tile>
      <Tile label="Manager">
        <ManagerChip className="text-sm" />
      </Tile>
      <Tile label="Average wait">{formatStat(metrics.avgWaitMs)}</Tile>
      <Tile label="Longest waiting now">{formatStat(metrics.longestPendingMs)}</Tile>
    </section>
  )
}
