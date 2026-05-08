'use client'

/**
 * AuditTrailContext — Module 8 (F)
 * ---------------------------------
 * Append-only event log of every meaningful action across the platform.
 * Persisted to localStorage. Built on Tier-B createPersistedContext.
 *
 * The CRO's killer question: "Show me who set R-008 residual at 0.3,
 * when, against which control evidence, and when last challenged."
 * Audit Trail answers exactly that — every change is timestamped,
 * actor-attributed, scoped to a target (riskId / kriId / actionId /
 * escalationId), and carries a brief description of what changed.
 *
 * Honors CLAUDE.md: every audit event is captured at the moment of
 * action with a server-side-style timestamp (Date.now() at write time).
 * Events are append-only — no edit, no delete from the UI (admin can
 * clear from devtools localStorage if absolutely needed for the demo).
 *
 * Pilot will move this to a tamper-proof immutable store with SIEM
 * integration, per Module 8 Phase-2 scope.
 */

import React, { useCallback, useMemo } from 'react'
import {
  createPersistedContext,
  uid,
} from '@/lib/context/createPersistedContext'

export type AuditCategory =
  | 'risk'
  | 'mitigation'
  | 'kri_entry'
  | 'kri_threshold'
  | 'escalation'
  | 'system'

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'login'
  | 'export'

export interface AuditEvent {
  id: string
  /** ISO timestamp captured at write. */
  at: string
  category: AuditCategory
  action: AuditAction
  /** Free-text actor (no real RBAC yet — comes from form fields). */
  actor: string
  /** Target entity id where applicable (riskId, kriId, actionId, escalationId, ...). */
  targetId: string | null
  /** Short human-readable description. */
  summary: string
  /** Optional structured diff payload — keeps the event compact. */
  details?: Record<string, unknown>
}

const STORAGE_KEY = 'aldar-audit-trail-v1'

const { Provider: StoreProvider, useStore } = createPersistedContext<AuditEvent[]>({
  storageKey: STORAGE_KEY,
  defaultValue: [],
  migrate: (raw) => (Array.isArray(raw) ? (raw as AuditEvent[]) : []),
})

/**
 * Vanilla recorder — writes directly to localStorage without requiring
 * a React provider in scope. Use this from contexts/components that
 * sit outside the AuditTrailProvider tree. The provider re-reads
 * localStorage on mount, so events recorded this way appear on the
 * /audit-trail page on next render.
 *
 * Safe on the server (no-op when window is undefined).
 */
export function recordAuditEventDirect(
  input: Omit<AuditEvent, 'id' | 'at'> & { at?: string },
): void {
  if (typeof window === 'undefined') return
  try {
    const at = input.at || new Date().toISOString()
    const full: AuditEvent = {
      id: uid('aud'),
      at,
      category: input.category,
      action: input.action,
      actor: input.actor,
      targetId: input.targetId ?? null,
      summary: input.summary,
      details: input.details,
    }
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const list: AuditEvent[] = raw ? (JSON.parse(raw) as AuditEvent[]) : []
    if (!Array.isArray(list)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([full]))
      return
    }
    list.push(full)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // quota / private-mode / parse error — non-fatal
  }
}

interface CtxValue {
  events: AuditEvent[]
  recordEvent: (
    input: Omit<AuditEvent, 'id' | 'at'> & { at?: string },
  ) => AuditEvent
  /** Full export of events as a CSV string (header + rows). */
  exportCSV: () => string
  /** Clear all events — only intended for demo reset. */
  clear: () => void
}

const Ctx = React.createContext<CtxValue | null>(null)

function escapeCSV(s: string): string {
  if (/[,"\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function AuditInner({ children }: { children: React.ReactNode }) {
  const { state: events, setState } = useStore()

  const recordEvent = useCallback<CtxValue['recordEvent']>(
    (input) => {
      const at = input.at || new Date().toISOString()
      const full: AuditEvent = {
        id: uid('aud'),
        at,
        category: input.category,
        action: input.action,
        actor: input.actor,
        targetId: input.targetId ?? null,
        summary: input.summary,
        details: input.details,
      }
      setState((prev) => [...prev, full])
      return full
    },
    [setState],
  )

  const exportCSV = useCallback<CtxValue['exportCSV']>(() => {
    const header = ['Timestamp', 'Category', 'Action', 'Actor', 'Target', 'Summary'].join(',')
    const rows = events
      .slice()
      .sort((a, b) => (a.at < b.at ? -1 : 1))
      .map((e) =>
        [
          escapeCSV(e.at),
          escapeCSV(e.category),
          escapeCSV(e.action),
          escapeCSV(e.actor),
          escapeCSV(e.targetId || ''),
          escapeCSV(e.summary),
        ].join(','),
      )
    return [header, ...rows].join('\n')
  }, [events])

  const clear = useCallback<CtxValue['clear']>(() => setState([]), [setState])

  const value = useMemo<CtxValue>(
    () => ({ events, recordEvent, exportCSV, clear }),
    [events, recordEvent, exportCSV, clear],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function AuditTrailProvider({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AuditInner>{children}</AuditInner>
    </StoreProvider>
  )
}

export function useAuditTrail(): CtxValue {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('useAuditTrail must be used inside <AuditTrailProvider>')
  return ctx
}
