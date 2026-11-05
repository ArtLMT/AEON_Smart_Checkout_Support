/** Waiting-time thresholds from the escalation workflow. */
export const REMINDER_MS = 30_000
export const RAISE_PRIORITY_MS = 60_000
export const URGENT_MS = 90_000

export type EscalationStage = 0 | 1 | 2 | 3

export const ESCALATION_STAGE_LABEL: Record<EscalationStage, string> = {
  0: 'Notified',
  1: 'Reminder sent',
  2: 'Priority raised',
  3: 'Urgent alert',
}

export function getEscalationStage(waitMs: number): EscalationStage {
  if (waitMs >= URGENT_MS) return 3
  if (waitMs >= RAISE_PRIORITY_MS) return 2
  if (waitMs >= REMINDER_MS) return 1
  return 0
}
