'use client'

/**
 * ERMPlanActivitiesContext — Patch E3
 * ------------------------------------
 * User-added ERM annual plan activities. Lives ALONGSIDE the seeded
 * illustrative activities baked into the component. Persisted via
 * Tier-B createPersistedContext; audit-trailed via recordAuditEventDirect.
 *
 * Spec test (from B-E plan): "Add activity → appears in correct month".
 */

import React, { useCallback, useMemo } from 'react'
import {
  createPersistedContext,
  uid,
} from '@/lib/context/createPersistedContext'
import { recordAuditEventDirect } from '@/lib/context/AuditTrailContext'

export type PlanActivityCategory =
  | 'governance'
  | 'review'
  | 'training'
  | 'monitoring'
  | 'reporting'

/**
 * Lifecycle status the user sets on a plan activity. "Due" and "Overdue"
 * are NOT stored here — they are derived in the component from this status
 * plus the activity's scheduled months against today's date.
 */
export type PlanActivityStatus = 'planned' | 'in_progress' | 'completed'

export interface PlanActivity {
  id: string
  title: string
  description: string
  /** Months 1..12 covered by this activity (Jan = 1). */
  months: number[]
  category: PlanActivityCategory
  /** ISO date created. */
  createdAt: string
  /** Free-text author (no real RBAC). */
  createdBy: string
}

const { Provider: StoreProvider, useStore } = createPersistedContext<PlanActivity[]>({
  storageKey: 'aldar-erm-plan-activities-v1',
  defaultValue: [],
  migrate: (raw) => (Array.isArray(raw) ? (raw as PlanActivity[]) : []),
})

/**
 * Status map keyed PER OCCURRENCE — key is `${activityId}|${month}` so an
 * activity that recurs across several months (e.g. monthly KRI reporting,
 * quarterly ARC review) can have each month marked independently. Covers
 * both seeded and user-added activities. Absent key ⇒ 'planned' default.
 */
const { Provider: StatusProvider, useStore: useStatusStore } =
  createPersistedContext<Record<string, PlanActivityStatus>>({
    storageKey: 'aldar-erm-plan-status-v2',
    defaultValue: {},
    migrate: (raw) =>
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, PlanActivityStatus>)
        : {},
  })

/** Stable key for one activity-month occurrence. */
export function occurrenceKey(id: string, month: number): string {
  return `${id}|${month}`
}

interface CtxValue {
  activities: PlanActivity[]
  addActivity: (
    input: Omit<PlanActivity, 'id' | 'createdAt'>,
  ) => PlanActivity
  removeActivity: (id: string) => void
  /** Lifecycle status keyed by `${activityId}|${month}` ('planned' when absent). */
  statuses: Record<string, PlanActivityStatus>
  /** Set/update the status of ONE month-occurrence of an activity. */
  setStatus: (
    id: string,
    month: number,
    status: PlanActivityStatus,
    title?: string,
  ) => void
}

const Ctx = React.createContext<CtxValue | null>(null)

const STATUS_LABELS: Record<PlanActivityStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function Inner({ children }: { children: React.ReactNode }) {
  const { state: activities, setState } = useStore()
  const { state: statuses, setState: setStatuses } = useStatusStore()

  const addActivity = useCallback<CtxValue['addActivity']>(
    (input) => {
      const now = new Date().toISOString()
      const full: PlanActivity = {
        ...input,
        id: uid('plan'),
        createdAt: now,
      }
      setState((prev) => [...prev, full])
      recordAuditEventDirect({
        category: 'system',
        action: 'create',
        actor: full.createdBy || 'AVP (demo)',
        targetId: full.id,
        summary: `ERM Annual Plan activity "${full.title}" added across months ${full.months.join('/')}.`,
      })
      return full
    },
    [setState],
  )

  const removeActivity = useCallback<CtxValue['removeActivity']>(
    (id) => {
      setState((prev) => {
        const target = prev.find((a) => a.id === id)
        if (target) {
          recordAuditEventDirect({
            category: 'system',
            action: 'delete',
            actor: target.createdBy || 'AVP (demo)',
            targetId: id,
            summary: `ERM Annual Plan activity "${target.title}" removed.`,
          })
        }
        return prev.filter((a) => a.id !== id)
      })
    },
    [setState],
  )

  const setStatus = useCallback<CtxValue['setStatus']>(
    (id, month, status, title) => {
      const key = occurrenceKey(id, month)
      setStatuses((prev) => {
        if (prev[key] === status) return prev
        return { ...prev, [key]: status }
      })
      recordAuditEventDirect({
        category: 'system',
        action: 'update',
        actor: 'AVP (demo)',
        targetId: key,
        summary: `ERM Annual Plan activity "${title ?? id}" (${MONTH_ABBR[month - 1] ?? month}) status set to ${STATUS_LABELS[status]}.`,
      })
    },
    [setStatuses],
  )

  const value = useMemo<CtxValue>(
    () => ({ activities, addActivity, removeActivity, statuses, setStatus }),
    [activities, addActivity, removeActivity, statuses, setStatus],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function ERMPlanActivitiesProvider({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <StatusProvider>
        <Inner>{children}</Inner>
      </StatusProvider>
    </StoreProvider>
  )
}

export function useERMPlanActivities(): CtxValue {
  const ctx = React.useContext(Ctx)
  if (!ctx)
    throw new Error('useERMPlanActivities must be used inside <ERMPlanActivitiesProvider>')
  return ctx
}
