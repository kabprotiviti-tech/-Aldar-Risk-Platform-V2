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

interface CtxValue {
  activities: PlanActivity[]
  addActivity: (
    input: Omit<PlanActivity, 'id' | 'createdAt'>,
  ) => PlanActivity
  removeActivity: (id: string) => void
}

const Ctx = React.createContext<CtxValue | null>(null)

function Inner({ children }: { children: React.ReactNode }) {
  const { state: activities, setState } = useStore()

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

  const value = useMemo<CtxValue>(
    () => ({ activities, addActivity, removeActivity }),
    [activities, addActivity, removeActivity],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function ERMPlanActivitiesProvider({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Inner>{children}</Inner>
    </StoreProvider>
  )
}

export function useERMPlanActivities(): CtxValue {
  const ctx = React.useContext(Ctx)
  if (!ctx)
    throw new Error('useERMPlanActivities must be used inside <ERMPlanActivitiesProvider>')
  return ctx
}
