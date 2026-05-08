'use client'

/**
 * RiskAppetiteContext — Module 9 (G)
 * -----------------------------------
 * Persisted overrides on top of the seeded GROUP_APPETITE_STATEMENTS.
 * Group ERM Head can edit statement / level / approvedBy / lastReviewed
 * for any group-level appetite. Defaults shine through when there is no
 * override.
 *
 * Built on Tier-B createPersistedContext. Records audit events on every
 * edit + reset via recordAuditEventDirect.
 */

import React, { useCallback, useMemo } from 'react'
import { createPersistedContext } from '@/lib/context/createPersistedContext'
import { recordAuditEventDirect } from '@/lib/context/AuditTrailContext'
import {
  GROUP_APPETITE_STATEMENTS,
  type AppetiteLevel,
  type GroupAppetiteStatement,
} from '@/lib/data/group-appetite-statements'

export interface AppetiteOverride {
  statement?: string
  level?: AppetiteLevel
  approvedBy?: string
  lastReviewed?: string
}

const { Provider: StoreProvider, useStore } = createPersistedContext<
  Record<string, AppetiteOverride>
>({
  storageKey: 'aldar-risk-appetite-overrides-v1',
  defaultValue: {},
  migrate: (raw) =>
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, AppetiteOverride>)
      : {},
})

interface CtxValue {
  /** Map of statementId → override patch. */
  overrides: Record<string, AppetiteOverride>
  /** Returns the effective statement (default merged with override). */
  effectiveFor: (id: string) => GroupAppetiteStatement | undefined
  /** All effective statements, in seed order. */
  allEffective: () => GroupAppetiteStatement[]
  /** True when an override exists for the given id. */
  isOverridden: (id: string) => boolean
  /** Save a partial override patch. */
  setOverride: (id: string, patch: AppetiteOverride, actor?: string) => void
  /** Remove the override and revert to default. */
  resetOverride: (id: string, actor?: string) => void
}

const Ctx = React.createContext<CtxValue | null>(null)

function Inner({ children }: { children: React.ReactNode }) {
  const { state: overrides, setState } = useStore()

  const effectiveFor = useCallback<CtxValue['effectiveFor']>(
    (id) => {
      const base = GROUP_APPETITE_STATEMENTS.find((s) => s.id === id)
      if (!base) return undefined
      const o = overrides[id]
      if (!o) return base
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
    (id) => Boolean(overrides[id]),
    [overrides],
  )

  const setOverride = useCallback<CtxValue['setOverride']>(
    (id, patch, actor = 'Group ERM Head (demo)') => {
      setState((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }))
      recordAuditEventDirect({
        category: 'system',
        action: 'update',
        actor,
        targetId: id,
        summary: `Risk Appetite ${id} updated (${Object.keys(patch).join(', ')}).`,
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
    () => ({ overrides, effectiveFor, allEffective, isOverridden, setOverride, resetOverride }),
    [overrides, effectiveFor, allEffective, isOverridden, setOverride, resetOverride],
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
