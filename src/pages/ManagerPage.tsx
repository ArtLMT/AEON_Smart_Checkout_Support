import { useEffect, useState } from 'react'
import { BarChart3, Bell, ListChecks, Siren, Volume2, VolumeX, X } from 'lucide-react'
import { AnalyticsPanel } from '@/components/manager/AnalyticsPanel'
import { DashboardOverview } from '@/components/manager/DashboardOverview'
import { RequestDetails } from '@/components/manager/RequestDetails'
import { RequestList } from '@/components/manager/RequestList'
import { Brand } from '@/components/shared/Brand'
import { PresenterPanel } from '@/components/shared/PresenterPanel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useManagerAlerts, type ManagerToast } from '@/hooks/useManagerAlerts'
import { useSimNow } from '@/hooks/useSimNow'
import { computeMetrics } from '@/services/analyticsService'
import { setTabBadge } from '@/services/notificationService'
import { actions, useSupportStore } from '@/stores/supportStore'

type Tab = 'requests' | 'analytics'

const TABS: { id: Tab; label: string; icon: typeof ListChecks }[] = [
  { id: 'requests', label: 'Requests', icon: ListChecks },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

export function ManagerPage() {
  const state = useSupportStore()
  const now = useSimNow()
  const [tab, setTab] = useState<Tab>('requests')
  const [openRequestId, setOpenRequestId] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)

  const metrics = computeMetrics(state.requests, now)
  const { toasts, dismissToast } = useManagerAlerts(state, now, muted)
  const openRequest = state.requests.find((request) => request.id === openRequestId)
  const pendingCount = state.requests.filter((request) => request.status === 'PENDING').length

  useEffect(() => {
    setTabBadge('Manager Dashboard', pendingCount)
  }, [pendingCount])

  // A new scenario starts from the request list, not a leftover details screen.
  const scenarioNonce = state.scenario?.nonce
  useEffect(() => {
    setOpenRequestId(null)
  }, [scenarioNonce])

  const openFromToast = (toast: ManagerToast) => {
    setTab('requests')
    setOpenRequestId(toast.requestId)
    dismissToast(toast.id)
  }

  return (
    <div className="manager-stage flex min-h-dvh items-center justify-center">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#f7f6f8] md:h-[min(860px,calc(100dvh-32px))] md:w-[420px] md:rounded-[38px] md:border-[8px] md:border-[#24151f] md:shadow-[0_30px_100px_rgba(22,7,17,0.35)]">
        {openRequest ? (
          <RequestDetails
            key={openRequest.id}
            state={state}
            request={openRequest}
            now={now}
            onBack={() => setOpenRequestId(null)}
          />
        ) : (
          <>
            <header className="flex items-center justify-between gap-2 border-b border-border/70 bg-white py-3 pr-3 pl-4 md:pt-5">
              <Brand subtitle="Manager" />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-pressed={state.managerAway}
                  onClick={() => actions.setManagerAway(!state.managerAway)}
                  className="h-8 rounded-md border px-2 text-xs font-medium transition-colors hover:bg-muted aria-pressed:bg-slate-200"
                >
                  {state.managerAway ? 'Set available' : 'Set away'}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={muted ? 'Turn alert sound on' : 'Turn alert sound off'}
                  onClick={() => setMuted(!muted)}
                >
                  {muted ? <VolumeX /> : <Volume2 />}
                </Button>
              </div>
            </header>

            <main className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f7f6f8] p-3.5">
              {tab === 'requests' ? (
                <>
                  <DashboardOverview metrics={metrics} />
                  <RequestList state={state} now={now} onOpen={setOpenRequestId} />
                </>
              ) : (
                <AnalyticsPanel state={state} metrics={metrics} />
              )}
            </main>

            <nav
              aria-label="Manager sections"
              className="grid grid-cols-2 bg-card ring-1 ring-foreground/10 md:pb-2"
            >
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-current={tab === id ? 'page' : undefined}
                  onClick={() => setTab(id)}
                  className={cn(
                    'relative flex h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium',
                    tab === id ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                  {id === 'requests' && pendingCount > 0 && (
                    <span className="absolute top-1.5 left-1/2 ml-2 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] leading-4 text-white tabular-nums">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </>
        )}

        <ToastStack toasts={toasts} onOpen={openFromToast} onDismiss={dismissToast} />
      </div>
      <PresenterPanel />
    </div>
  )
}

const TOAST_STYLE = {
  info: 'bg-card text-foreground ring-foreground/15',
  warning: 'bg-amber-100 text-amber-950 ring-amber-300',
  urgent: 'bg-red-600 text-white ring-red-700',
}

function ToastStack({
  toasts,
  onOpen,
  onDismiss,
}: {
  toasts: ManagerToast[]
  onOpen: (toast: ManagerToast) => void
  onDismiss: (id: string) => void
}) {
  return (
    <div
      aria-live="assertive"
      className="pointer-events-none absolute inset-x-2 top-2 z-30 space-y-1.5 md:top-4"
    >
      {toasts.map((toast) => {
        const Icon = toast.tone === 'urgent' ? Siren : Bell
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start rounded-xl shadow-lg ring-1 animate-in fade-in slide-in-from-top-2',
              TOAST_STYLE[toast.tone],
            )}
          >
            <button
              type="button"
              onClick={() => onOpen(toast)}
              className="flex min-w-0 flex-1 items-start gap-2 p-2.5 text-left"
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{toast.title}</span>
                <span className="block text-xs">{toast.body}</span>
              </span>
            </button>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(toast.id)}
              className="p-2.5"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        )
      })}
    </div>
  )
}
