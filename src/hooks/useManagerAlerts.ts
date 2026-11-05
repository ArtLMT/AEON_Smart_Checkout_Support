import { useCallback, useEffect, useRef, useState } from 'react'
import { getCounter, type DemoState } from '@/services/demoState'
import { playAlert, type AlertTone } from '@/services/notificationService'
import { computePriority, getCategoryLabel } from '@/services/priorityService'
import type { SupportRequest } from '@/types/request'
import type { EscalationStage } from '@/utils/escalationRules'

export interface ManagerToast {
  id: string
  requestId: string
  tone: AlertTone
  title: string
  body: string
}

const TOAST_LIFETIME_MS: Record<AlertTone, number> = {
  info: 5000,
  warning: 7000,
  urgent: 10000,
}

function buildToast(
  request: SupportRequest,
  counterLabel: string,
  stage: EscalationStage,
  isNew: boolean,
  isHigh: boolean,
): Omit<ManagerToast, 'id' | 'requestId'> | null {
  const issue = getCategoryLabel(request.category)
  if (isNew) {
    return isHigh
      ? { tone: 'urgent', title: `High priority: ${counterLabel}`, body: `${issue} needs you now.` }
      : { tone: 'info', title: `New request: ${counterLabel}`, body: issue }
  }
  if (stage === 1) {
    return {
      tone: 'warning',
      title: `Reminder: ${counterLabel}`,
      body: `${issue} has waited 30 seconds.`,
    }
  }
  if (stage === 2) {
    return {
      tone: 'warning',
      title: `Priority raised: ${counterLabel}`,
      body: `${issue} has waited 60 seconds.`,
    }
  }
  if (stage === 3) {
    return {
      tone: 'urgent',
      title: `Urgent: ${counterLabel}`,
      body: `${issue} has waited 90 seconds with nobody accepting.`,
    }
  }
  return null
}

/**
 * Raises notifications from the same derived stages the dashboard shows, so the
 * escalation rules live only in priorityService and nothing extra is stored.
 */
export function useManagerAlerts(state: DemoState, now: number, muted: boolean) {
  const [toasts, setToasts] = useState<ManagerToast[]>([])
  const seenStages = useRef<Map<string, EscalationStage> | null>(null)
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  useEffect(() => {
    const isFirstRun = seenStages.current === null
    const seen = (seenStages.current ??= new Map())
    const fresh: ManagerToast[] = []

    for (const request of state.requests) {
      if (request.status !== 'PENDING') continue
      const counter = getCounter(state, request.counterId)
      const priority = computePriority(request, counter?.queue ?? 0, now)
      const key = `${request.id}:${request.createdAt}`
      const previous = seen.get(key)

      // Anything already waiting when the tab opened is on screen; only changes are news.
      const isNew = previous === undefined && !isFirstRun
      if (isNew || (previous !== undefined && priority.stage > previous)) {
        const content = buildToast(
          request,
          counter?.label ?? request.counterId,
          priority.stage,
          isNew && priority.stage === 0,
          priority.level === 'HIGH',
        )
        if (content) {
          fresh.push({ ...content, id: `${key}:${priority.stage}`, requestId: request.id })
        }
      }
      seen.set(key, priority.stage)
    }

    if (fresh.length === 0) return
    setToasts((current) => [...fresh, ...current].slice(0, 3))
    if (!mutedRef.current) {
      const tones = fresh.map((toast) => toast.tone)
      playAlert(tones.includes('urgent') ? 'urgent' : tones.includes('warning') ? 'warning' : 'info')
    }
    for (const toast of fresh) {
      window.setTimeout(() => dismissToast(toast.id), TOAST_LIFETIME_MS[toast.tone])
    }
  }, [state, now, dismissToast])

  return { toasts, dismissToast }
}
