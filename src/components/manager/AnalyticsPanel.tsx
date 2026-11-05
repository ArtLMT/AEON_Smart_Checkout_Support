import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis } from 'recharts'
import { ResponsiveContainer } from 'recharts'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { SupportMetrics } from '@/services/analyticsService'
import { getCategoryLabel } from '@/services/priorityService'
import type { DemoState } from '@/services/demoState'
import { getCounter } from '@/services/demoState'
import { isActive } from '@/services/requestService'
import { formatClock, formatPercent, formatStat } from '@/utils/format'

const CHART_COLOR = 'var(--chart-1)'
const AXIS_TICK = { fontSize: 11, fill: 'var(--muted-foreground)' }

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-card p-2.5 ring-1 ring-foreground/10">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: readonly { value?: unknown }[]
  label?: unknown
}) {
  if (!active || !payload?.length) return null
  const count = Number(payload[0].value)
  return (
    <div className="rounded-md bg-popover px-2 py-1 text-xs shadow-md ring-1 ring-foreground/10">
      <span className="text-muted-foreground">{String(label)}</span>{' '}
      <span className="font-semibold tabular-nums">
        {count} {count === 1 ? 'request' : 'requests'}
      </span>
    </div>
  )
}

export function AnalyticsPanel({
  state,
  metrics,
}: {
  state: DemoState
  metrics: SupportMetrics
}) {
  const history = state.requests.filter((request) => !isActive(request)).slice(0, 15)

  return (
    <div className="space-y-2">
      <section aria-label="Key statistics" className="grid grid-cols-2 gap-2">
        <Stat label="Average wait" value={formatStat(metrics.avgWaitMs)} hint="to acceptance" />
        <Stat
          label="Average resolution"
          value={formatStat(metrics.avgResolutionMs)}
          hint="request to resolved"
        />
        <Stat
          label="Remote resolution"
          value={formatPercent(metrics.remoteRate)}
          hint={`${metrics.tripsAvoided} counter trips avoided`}
        />
        <Stat
          label="Escalation rate"
          value={formatPercent(metrics.escalationRate)}
          hint="waited 60s or longer"
        />
      </section>

      <section className="rounded-xl bg-card p-3 ring-1 ring-foreground/10">
        <h3 className="text-sm font-semibold">Requests by category</h3>
        <div className="mt-1 h-44" role="img" aria-label="Bar chart of requests by issue category">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics.byCategory}
              layout="vertical"
              margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
            >
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={104}
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
              />
              <Tooltip content={ChartTip} cursor={{ fill: 'var(--muted)' }} />
              <Bar
                dataKey="count"
                fill={CHART_COLOR}
                barSize={14}
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="count"
                  position="right"
                  style={{ fontSize: 11, fill: 'var(--foreground)' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl bg-card p-3 ring-1 ring-foreground/10">
        <h3 className="text-sm font-semibold">Requests by hour</h3>
        {metrics.peak && (
          <p className="text-xs text-muted-foreground tabular-nums">
            Peak support period {metrics.peak.label}, {metrics.peak.count} requests
          </p>
        )}
        <div className="mt-2 h-36" role="img" aria-label="Bar chart of requests by hour of day">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.byHour} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
              <XAxis
                dataKey="label"
                tickFormatter={(value: string) => value.slice(0, 2)}
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
                interval={0}
              />
              <YAxis
                width={20}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
              />
              <Tooltip content={ChartTip} cursor={{ fill: 'var(--muted)' }} />
              <Bar
                dataKey="count"
                fill={CHART_COLOR}
                maxBarSize={18}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl bg-card p-3 ring-1 ring-foreground/10">
        <h3 className="text-sm font-semibold">Request history</h3>
        <p className="text-xs text-muted-foreground">
          {metrics.total} requests this shift, {metrics.resolved} resolved
        </p>
        <ul className="mt-2 divide-y">
          {history.map((request) => (
            <li key={request.id} className="flex items-center gap-2 py-1.5 text-sm">
              <span className="w-16 shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatClock(request.createdAt)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {getCategoryLabel(request.category)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {getCounter(state, request.counterId)?.label}
                  {request.resolution === 'REMOTE' && ' · remote'}
                  {request.resolution === 'COUNTER' && ' · at counter'}
                </span>
              </span>
              <StatusBadge status={request.status} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
