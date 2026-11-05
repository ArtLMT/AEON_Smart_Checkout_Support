import { useState } from 'react'
import { FastForward, Minus, Plus, Presentation, RotateCcw, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SCENARIOS } from '@/services/scenarioService'
import { actions, useSupportStore } from '@/stores/supportStore'

/** Demo controls, kept apart from the cashier and manager interfaces they drive. */
export function PresenterPanel() {
  const [open, setOpen] = useState(false)
  const counters = useSupportStore((state) => state.counters)
  const clockOffsetMs = useSupportStore((state) => state.clockOffsetMs)
  const activeScenario = useSupportStore((state) => state.scenario?.id)

  return (
    <div className="fixed top-2.5 right-3 z-40 flex flex-col items-end gap-2 max-md:top-auto max-md:bottom-20">
      <Button
        variant={open ? 'default' : 'outline'}
        className="h-9 px-3 shadow-sm"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {open ? <X /> : <Presentation />}
        Presenter
      </Button>

      {open && (
        <div className="max-h-[calc(100dvh-5rem)] w-80 space-y-4 overflow-y-auto rounded-xl bg-popover p-4 text-sm shadow-xl ring-1 ring-foreground/10 max-md:max-h-[calc(100dvh-9rem)]">
          <section className="space-y-2">
            <h2 className="font-semibold">Set up a scenario</h2>
            <p className="text-xs text-muted-foreground">
              Clears open requests and moves any open cashier tab to the right counter.
            </p>
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => actions.setupScenario(scenario.id)}
                className="block w-full rounded-lg border p-2.5 text-left transition-colors hover:bg-muted data-[active=true]:border-primary data-[active=true]:bg-primary/5"
                data-active={activeScenario === scenario.id}
              >
                <span className="font-medium">
                  {scenario.id}. {scenario.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {scenario.summary}
                </span>
              </button>
            ))}
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">Clock</h2>
            <Button variant="outline" className="h-9 w-full" onClick={actions.skipAhead}>
              <FastForward />
              Skip ahead 30 seconds
            </Button>
            <p className="text-xs text-muted-foreground">
              Moves every timer forward in all tabs. Total skipped:{' '}
              {Math.round(clockOffsetMs / 1000)}s.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">Customer queues</h2>
            <ul className="space-y-1">
              {counters.map((counter) => (
                <li key={counter.id} className="flex items-center justify-between">
                  <span>{counter.label}</span>
                  <span className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Fewer customers at ${counter.label}`}
                      onClick={() => actions.changeQueue(counter.id, -1)}
                    >
                      <Minus />
                    </Button>
                    <span className="w-5 text-center tabular-nums">{counter.queue}</span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`More customers at ${counter.label}`}
                      onClick={() => actions.changeQueue(counter.id, 1)}
                    >
                      <Plus />
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-9" onClick={actions.addBusyPeriod}>
              <Users />
              Busy period
            </Button>
            <Button variant="destructive" className="h-9" onClick={actions.resetDemo}>
              <RotateCcw />
              Reset demo
            </Button>
          </section>
        </div>
      )}
    </div>
  )
}
