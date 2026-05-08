'use client'

/**
 * EscalationsContext
 * ------------------
 * Persisted log of risks escalated from a Risk Champion / Subsidiary
 * ERM Head up to the Group Cockpit. The "Escalate to Group" button on
 * the risk detail drawer creates an entry here; the Portfolio Tower
 * surfaces the open escalations to the Group ERM Head / CEO.
 *
 * E10 of Module 7 — implements the demo storyteller's WOW moment #2:
 * operational risk → Group view in 8 seconds with auto-drafted
 * board narrative.
 *
 * First production consumer of:
 *   - Tier-B #5: createPersistedContext (typed Provider + useStore)
 *   - Tier-B #6: <Modal> primitive (used by EscalateToGroupModal)
 *
 * Honors CLAUDE.md: every escalation is user-attributed; the auto-
 * drafted narrative is labelled as such and editable before save.
 */

import React, { useCallback, useMemo } from 'react'
import {
  createPersistedContext,
  uid,
} from '@/lib/context/createPersistedContext'
import { recordAuditEventDirect } from '@/lib/context/AuditTrailContext'

export type EscalationStatus = 'pending' | 'acknowledged' | 'closed'

export interface Escalation {
  id: string
  riskId: string
  riskName: string
  /** Brief justification entered by the escalator. */
  justification: string
  /** Board-style narrative — auto-drafted, then user-editable. */
  narrative: string
  /** Free-text who escalated (no real RBAC yet — Module 1 MVP). */
  escalatedBy: string
  /** ISO timestamp the escalation was created. */
  escalatedAt: string
  status: EscalationStatus
  /** Snapshot of risk numerics at escalation time (for the audit log). */
  snapshot: {
    inherentScore: number
    residualScore: number
    rating: string
    exposureAedMn: number
  }
}

const { Provider: EscStoreProvider, useStore } = createPersistedContext<
  Escalation[]
>({
  storageKey: 'aldar-escalations-v1',
  defaultValue: [],
  migrate: (raw) => (Array.isArray(raw) ? (raw as Escalation[]) : []),
})

interface CtxValue {
  escalations: Escalation[]
  pendingFor: (riskId: string) => Escalation | null
  /** All escalations sorted by escalatedAt desc. */
  recent: () => Escalation[]
  /** All escalations whose status is 'pending'. */
  pending: () => Escalation[]
  addEscalation: (
    input: Omit<Escalation, 'id' | 'escalatedAt' | 'status'>,
  ) => Escalation
  setStatus: (id: string, status: EscalationStatus) => void
  removeEscalation: (id: string) => void
}

const Ctx = React.createContext<CtxValue | null>(null)

function EscalationsInner({ children }: { children: React.ReactNode }) {
  const { state: escalations, setState } = useStore()

  const pendingFor = useCallback<CtxValue['pendingFor']>(
    (riskId) => escalations.find((e) => e.riskId === riskId && e.status !== 'closed') ?? null,
    [escalations],
  )

  const recent = useCallback<CtxValue['recent']>(
    () =>
      escalations
        .slice()
        .sort((a, b) => (a.escalatedAt < b.escalatedAt ? 1 : -1)),
    [escalations],
  )

  const pending = useCallback<CtxValue['pending']>(
    () =>
      escalations
        .filter((e) => e.status === 'pending')
        .sort((a, b) => (a.escalatedAt < b.escalatedAt ? 1 : -1)),
    [escalations],
  )

  const addEscalation = useCallback<CtxValue['addEscalation']>(
    (input) => {
      const now = new Date().toISOString()
      const full: Escalation = {
        ...input,
        id: uid('esc'),
        escalatedAt: now,
        status: 'pending',
      }
      setState((prev) => [...prev, full])
      recordAuditEventDirect({
        category: 'escalation',
        action: 'create',
        actor: full.escalatedBy || 'unknown',
        targetId: full.riskId,
        summary: `Escalated ${full.riskId} ${full.riskName} to Group (residual ${full.snapshot.residualScore.toFixed(1)}, rating ${full.snapshot.rating}).`,
      })
      return full
    },
    [setState],
  )

  const setStatus = useCallback<CtxValue['setStatus']>(
    (id, status) => {
      setState((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, status } : e))
        const target = prev.find((e) => e.id === id)
        if (target) {
          recordAuditEventDirect({
            category: 'escalation',
            action: 'status_change',
            actor: 'group_erm',
            targetId: target.riskId,
            summary: `Escalation ${id} for ${target.riskId} marked ${status}.`,
          })
        }
        return next
      })
    },
    [setState],
  )

  const removeEscalation = useCallback<CtxValue['removeEscalation']>(
    (id) => {
      setState((prev) => {
        const target = prev.find((e) => e.id === id)
        if (target) {
          recordAuditEventDirect({
            category: 'escalation',
            action: 'delete',
            actor: 'group_erm',
            targetId: target.riskId,
            summary: `Escalation ${id} for ${target.riskId} removed.`,
          })
        }
        return prev.filter((e) => e.id !== id)
      })
    },
    [setState],
  )

  const value = useMemo<CtxValue>(
    () => ({
      escalations,
      pendingFor,
      recent,
      pending,
      addEscalation,
      setStatus,
      removeEscalation,
    }),
    [escalations, pendingFor, recent, pending, addEscalation, setStatus, removeEscalation],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function EscalationsProvider({ children }: { children: React.ReactNode }) {
  return (
    <EscStoreProvider>
      <EscalationsInner>{children}</EscalationsInner>
    </EscStoreProvider>
  )
}

export function useEscalations(): CtxValue {
  const ctx = React.useContext(Ctx)
  if (!ctx)
    throw new Error('useEscalations must be used inside <EscalationsProvider>')
  return ctx
}
