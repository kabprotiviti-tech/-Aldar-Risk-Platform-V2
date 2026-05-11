'use client'

/**
 * RiskAppetiteContext — Module 9 (G1 + G2)
 * -----------------------------------------
 * Persisted overrides on top of the seeded GROUP_APPETITE_STATEMENTS.
 *
 * G2 adds an APPROVAL WORKFLOW:
 *   propose-change → 'pending' override → ARC Chair / Group ERM Head
 *   → 'approved' OR rejected (override removed).
 *
 * Only `approved` overrides flow through `effectiveFor`. `pending`
 * proposals are surfaced in a separate queue. Every transition emits a
 * `recordAuditEventDirect` event.
 *
 * Backward compat: pre-G2 overrides (no `status` field) are migrated as
 * `approved` so the historical demo data shines through unchanged.
 */

import React, { useCallback, useMemo } from 'react'
import { createPersistedContext } from '@/lib/context/createPersistedContext'
import { recordAuditEventDirect } from '@/lib/context/AuditTrailContext'
import {
  GROUP_APPETITE_STATEMENTS,
  type AppetiteLevel,
  type GroupAppetiteStatement,
} from '@/lib/data/group-appetite-statements'

export type AppetiteOverrideStatus = 'pending' | 'approved'

export interface AppetiteOverride {
  statement?: string
  level?: AppetiteLevel
  approvedBy?: string
  lastReviewed?: string
  /** G2 workflow status. `approved` = effective; `pending` = awaiting decision. */
  status?: AppetiteOverrideStatus
  /** Free-text who proposed the change. */
  proposedBy?: string
  /** ISO timestamp of the proposal. */
  proposedAt?: string
  /** Free-text who approved. */
  approvedByActor?: string
  /** ISO timestamp of approval. */
  approvedAt?: string
}

const STORAGE_KEY = 'aldar-risk-appetite-overrides-v1'

const { Provider: StoreProvider, useStore } = createPersistedContext<
  Record<string, AppetiteOverride>
>({
  storageKey: STORAGE_KEY,
  defaultValue: {},
  migrate: (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const out: Record<string, AppetiteOverride> = {}
    for (const [k, v] of Object.entries(raw)) {
      if (v && typeof v === 'object') {
        // Pre-G2 overrides had no `status` field. Treat them as approved so
        // the existing demo state continues to flow through `effectiveFor`.
        out[k] = { ...(v as AppetiteOverride), status: (v as AppetiteOverride).status ?? 'approved' }
      }
    }
    return out
  },
})

interface CtxValue {
  /** Raw store. */
  overrides: Record<string, AppetiteOverride>
  /** Effective statement (default merged with approved override only). */
  effectiveFor: (id: string) => GroupAppetiteStatement | undefined
  allEffective: () => GroupAppetiteStatement[]
  /** True iff an APPROVED override exists. */
  isOverridden: (id: string) => boolean
  /** True iff a PENDING proposal exists. */
  hasPending: (id: string) => boolean
  /** All pending proposals (id + override patch). */
  pendingProposals: () => Array<{ id: string; override: AppetiteOverride }>
  /** Submit a proposed change. Creates / replaces a pending override. */
  proposeChange: (
    id: string,
    patch: Pick<AppetiteOverride, 'statement' | 'level' | 'approvedBy' | 'lastReviewed'>,
    proposedBy?: string,
  ) => void
  /** Approve the pending proposal — flips status to `approved`. */
  approveProposal: (id: string, approvedBy?: string) => void
  /** Reject the pending proposal — removes the override. */
  rejectProposal: (id: string, approvedBy?: string, reason?: string) => void
  /** Remove the override entirely and revert to default. */
  resetOverride: (id: string, actor?: string) => void
}

const Ctx = React.createContext<CtxValue | null>(null)

function isApproved(o: AppetiteOverride | undefined): o is AppetiteOverride {
  return Boolean(o && o.status === 'approved')
}

function Inner({ children }: { children: React.ReactNode }) {
  const { state: overrides, setState } = useStore()

  const effectiveFor = useCallback<CtxValue['effectiveFor']>(
    (id) => {
      const base = GROUP_APPETITE_STATEMENTS.find((s) => s.id === id)
      if (!base) return undefined
      const o = overrides[id]
      if (!isApproved(o)) return base
      return {
        ...base,
        statement: o.statement ?? base.statement,
        level: o.level ?? base.level,
        approvedBy: o.approvedBy ?? base.approvedBy,
        lastReviewed: o.lastReviewed ?? base.lastReviewed,
      }
    },
    [overrides],
  )

  const allEffective = useCallback<CtxValue['allEffective']>(
    () => GROUP_APPETITE_STATEMENTS.map((s) => effectiveFor(s.id) || s),
    [effectiveFor],
  )

  const isOverridden = useCallback<CtxValue['isOverridden']>(
    (id) => isApproved(overrides[id]),
    [overrides],
  )

  const hasPending = useCallback<CtxValue['hasPending']>(
    (id) => overrides[id]?.status === 'pending',
    [overrides],
  )

  const pendingProposals = useCallback<CtxValue['pendingProposals']>(
    () =>
      Object.entries(overrides)
        .filter(([, v]) => v.status === 'pending')
        .map(([id, override]) => ({ id, override })),
    [overrides],
  )

  const proposeChange = useCallback<CtxValue['proposeChange']>(
    (id, patch, proposedBy = 'Subsidiary CEO (demo)') => {
      const now = new Date().toISOString()
      setState((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          ...patch,
          status: 'pending',
          proposedBy,
          proposedAt: now,
          // Clear any prior approval markers when re-proposing
          approvedByActor: undefined,
          approvedAt: undefined,
        },
      }))
      recordAuditEventDirect({
        category: 'system',
        action: 'create',
        actor: proposedBy,
        targetId: id,
        summary: `Risk Appetite ${id} change proposed (${Object.keys(patch).join(', ')}). Awaiting approval.`,
      })
    },
    [setState],
  )

  const approveProposal = useCallback<CtxValue['approveProposal']>(
    (id, approvedBy = 'Group ERM Head (demo)') => {
      const now = new Date().toISOString()
      setState((prev) => {
        const cur = prev[id]
        if (!cur || cur.status !== 'pending') return prev
        return {
          ...prev,
          [id]: { ...cur, status: 'approved', approvedByActor: approvedBy, approvedAt: now },
        }
      })
      recordAuditEventDirect({
        category: 'system',
        action: 'status_change',
        actor: approvedBy,
        targetId: id,
        summary: `Risk Appetite ${id} proposal APPROVED — change is now effective.`,
      })
    },
    [setState],
  )

  const rejectProposal = useCallback<CtxValue['rejectProposal']>(
    (id, approvedBy = 'Group ERM Head (demo)', reason) => {
      setState((prev) => {
        const cur = prev[id]
        if (!cur || cur.status !== 'pending') return prev
        const next = { ...prev }
        delete next[id]
        return next
      })
      recordAuditEventDirect({
        category: 'system',
        action: 'delete',
        actor: approvedBy,
        targetId: id,
        summary: `Risk Appetite ${id} proposal REJECTED${reason ? ` — ${reason}` : ''}.`,
      })
    },
    [setState],
  )

  const resetOverride = useCallback<CtxValue['resetOverride']>(
    (id, actor = 'Group ERM Head (demo)') => {
      setState((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      recordAuditEventDirect({
        category: 'system',
        action: 'delete',
        actor,
        targetId: id,
        summary: `Risk Appetite ${id} reset to default.`,
      })
    },
    [setState],
  )

  const value = useMemo<CtxValue>(
    () => ({
      overrides,
      effectiveFor,
      allEffective,
      isOverridden,
      hasPending,
      pendingProposals,
      proposeChange,
      approveProposal,
      rejectProposal,
      resetOverride,
    }),
    [
      overrides,
      effectiveFor,
      allEffective,
      isOverridden,
      hasPending,
      pendingProposals,
      proposeChange,
      approveProposal,
      rejectProposal,
      resetOverride,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function RiskAppetiteProvider({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Inner>{children}</Inner>
    </StoreProvider>
  )
}

export function useRiskAppetite(): CtxValue {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('useRiskAppetite must be used inside <RiskAppetiteProvider>')
  return ctx
}
