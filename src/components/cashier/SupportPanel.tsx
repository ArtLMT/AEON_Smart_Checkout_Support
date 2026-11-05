import { useState } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { CATEGORY_META, CATEGORY_ORDER } from '@/components/shared/categoryMeta'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { needsItem } from '@/services/requestService'
import type { IssueCategory } from '@/types/request'
import type { TransactionLine } from '@/types/transaction'
import { formatMoney } from '@/utils/format'

export interface ComposeDraft {
  category: IssueCategory
  lineId: string | null
}

interface SupportPanelProps {
  lines: TransactionLine[]
  draft: ComposeDraft | null
  disabled: boolean
  onPickCategory: (category: IssueCategory) => void
  onPickLine: (lineId: string) => void
  onClose: () => void
  onSubmit: (note: string) => void
}

export function SupportPanel({
  lines,
  draft,
  disabled,
  onPickCategory,
  onPickLine,
  onClose,
  onSubmit,
}: SupportPanelProps) {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {draft ? (
        <ComposeForm
          key={draft.category}
          lines={lines}
          draft={draft}
          onPickLine={onPickLine}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : (
        <>
          <header className="border-b px-4 py-2.5">
            <h2 className="font-semibold">Need support?</h2>
            <p className="text-xs text-muted-foreground">
              {disabled
                ? 'Your request is with the manager. Keep serving.'
                : 'Tap an issue. Counter and transaction are sent automatically.'}
            </p>
          </header>
          <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto p-3 [grid-auto-rows:minmax(5.5rem,1fr)]">
            {CATEGORY_ORDER.map((category) => {
              const { short, hint, icon: Icon } = CATEGORY_META[category]
              return (
                <button
                  key={category}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPickCategory(category)}
                  className={cn(
                    'flex flex-col items-start justify-center gap-1 rounded-xl border bg-background p-3 text-left transition-colors',
                    'outline-none hover:border-primary hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-primary/10',
                    'disabled:pointer-events-none disabled:opacity-45',
                    category === 'OTHER' && 'col-span-2',
                  )}
                >
                  <Icon className="size-6 text-primary" aria-hidden />
                  <span className="font-semibold">{short}</span>
                  <span className="text-xs leading-tight text-muted-foreground">{hint}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </aside>
  )
}

function ComposeForm({
  lines,
  draft,
  onPickLine,
  onClose,
  onSubmit,
}: {
  lines: TransactionLine[]
  draft: ComposeDraft
  onPickLine: (lineId: string) => void
  onClose: () => void
  onSubmit: (note: string) => void
}) {
  const [note, setNote] = useState('')
  const { short, icon: Icon } = CATEGORY_META[draft.category]
  const itemRequired = needsItem(draft.category)
  const billable = lines.filter((line) => !line.voided)
  const canSend = !itemRequired || billable.some((line) => line.lineId === draft.lineId)

  return (
    <>
      <header className="flex items-center gap-2 border-b px-2 py-2">
        <Button variant="ghost" className="size-10" aria-label="Back to issues" onClick={onClose}>
          <ArrowLeft />
        </Button>
        <Icon className="size-5 text-primary" aria-hidden />
        <h2 className="font-semibold">{short} support</h2>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {itemRequired && (
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Which item?</legend>
            {billable.length === 0 && (
              <p className="text-sm text-muted-foreground">No items on this transaction.</p>
            )}
            {billable.map((line) => (
              <button
                key={line.lineId}
                type="button"
                aria-pressed={line.lineId === draft.lineId}
                onClick={() => onPickLine(line.lineId)}
                className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/5"
              >
                <span className="min-w-0 truncate">{line.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatMoney(line.unitPrice)}
                </span>
              </button>
            ))}
          </fieldset>
        )}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">
            Note <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Anything the manager should know"
          />
        </label>
      </div>

      <div className="border-t p-3">
        <Button className="h-14 w-full text-base" disabled={!canSend} onClick={() => onSubmit(note)}>
          <Send className="size-5" />
          Send to manager
        </Button>
      </div>
    </>
  )
}
