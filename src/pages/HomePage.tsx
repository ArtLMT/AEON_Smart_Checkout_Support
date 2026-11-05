import { useEffect } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  ExternalLink,
  Headset,
  MonitorSmartphone,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import { Brand } from '@/components/shared/Brand'
import { PresenterPanel } from '@/components/shared/PresenterPanel'
import { QueueChip } from '@/components/shared/QueueChip'
import { useSupportStore } from '@/stores/supportStore'

const CURRENT_JOURNEY = [
  'Customer queues',
  'Cashier hits an issue',
  'Finds a radio',
  'Contacts manager',
  'Waits',
  'Manager arrives',
  'Issue resolved',
]

const PROPOSED_JOURNEY = [
  'Customer queues',
  'Cashier hits an issue',
  'One-tap support',
  'System prioritises',
  'Manager notified',
  'Checkout continues',
]

function Journey({ title, steps, accent }: { title: string; steps: string[]; accent?: boolean }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            {index > 0 && <ArrowRight className="size-3 text-muted-foreground/50" aria-hidden />}
            <span className={accent ? 'journey-step journey-step-accent' : 'journey-step'}>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function HomePage() {
  const counters = useSupportStore((state) => state.counters)
  const totalQueue = counters.reduce((sum, counter) => sum + counter.queue, 0)

  useEffect(() => {
    document.title = 'AEON Smart Checkout Support'
  }, [])

  return (
    <div className="launch-page min-h-dvh px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4 pb-8">
          <Brand subtitle="Smart Checkout Support" />
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-emerald-800 shadow-sm sm:flex">
            <span className="size-2 rounded-full bg-emerald-500" /> Demo environment
          </div>
        </header>

        <section className="launch-hero relative overflow-hidden rounded-[2rem] px-6 py-8 text-white shadow-xl sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div className="hero-orb hero-orb-one" />
          <div className="hero-orb hero-orb-two" />
          <div className="relative z-10 max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
              <Sparkles className="size-3.5" aria-hidden /> Checkout, with backup built in
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl">
              Manager help, right from the checkout.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
              A faster way for cashiers to get the right support, and for managers to keep every
              counter moving.
            </p>
            <a href="#roles" className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#77104b] shadow-lg transition hover:-translate-y-0.5 hover:bg-pink-50">
              Explore the demo <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
          <div className="relative z-10 mt-10 grid grid-cols-3 gap-3 border-t border-white/15 pt-5 sm:absolute sm:right-10 sm:bottom-9 sm:mt-0 sm:w-[310px] sm:border-t-0 sm:pt-0 lg:right-14">
            <div><p className="text-2xl font-semibold tabular-nums">{counters.length}</p><p className="mt-1 text-[11px] text-white/65 sm:text-xs">active counters</p></div>
            <div><p className="text-2xl font-semibold tabular-nums">{totalQueue}</p><p className="mt-1 text-[11px] text-white/65 sm:text-xs">customers queued</p></div>
            <div><p className="text-2xl font-semibold">1 tap</p><p className="mt-1 text-[11px] text-white/65 sm:text-xs">to request help</p></div>
          </div>
        </section>

        <section id="roles" className="mt-8 scroll-mt-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Choose a role</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Step into the demo</h2>
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block">Open both roles in separate tabs to see them sync.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="role-card overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MonitorSmartphone className="size-6" aria-hidden /></div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{counters.length} counters live</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Cashier POS</h3>
              <p className="mt-1 text-sm text-muted-foreground">Run a checkout, then call for help when an issue needs a manager.</p>
              <ul className="mt-5 divide-y divide-border/70">
                {counters.map((counter) => (
                  <li key={counter.id}>
                    <a href={`#/cashier/${counter.id}`} target="_blank" rel="noreferrer" className="counter-link group flex min-h-14 items-center justify-between gap-3">
                      <span><span className="block text-sm font-semibold">{counter.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{counter.cashierName}</span></span>
                      <span className="flex items-center gap-3"><QueueChip queue={counter.queue} /><ExternalLink className="size-4 text-muted-foreground transition group-hover:text-primary" aria-hidden /></span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="role-card flex flex-col bg-gradient-to-br from-white to-[#fff5fa]">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#fae7f1] text-primary"><Smartphone className="size-6" aria-hidden /></div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Manager dashboard</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Triage requests by urgency, resolve remotely, or head to the counter.</p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-foreground/80"><BadgeCheck className="size-4 text-primary" aria-hidden /> Prioritised support requests</div>
                <div className="flex items-center gap-2 text-foreground/80"><Headset className="size-4 text-primary" aria-hidden /> Remote approvals and guidance</div>
              </div>
              <a href="#/manager" target="_blank" rel="noreferrer" className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/90 max-lg:mt-6">
                Open manager dashboard <ExternalLink className="size-4" aria-hidden />
              </a>
            </section>
          </div>
        </section>

        <section className="journey-card mt-6 space-y-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><BadgeCheck className="size-5" aria-hidden /></div>
            <div><h2 className="font-semibold">A smoother checkout journey</h2><p className="mt-1 text-sm text-muted-foreground">See how the support flow changes the moment a cashier needs help.</p></div>
          </div>
          <Journey title="Today" steps={CURRENT_JOURNEY} />
          <Journey title="With Smart Checkout Support" steps={PROPOSED_JOURNEY} accent />
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">Demonstration prototype · Products, transactions and queues are simulated.</p>
      </div>
      <PresenterPanel />
    </div>
  )
}
