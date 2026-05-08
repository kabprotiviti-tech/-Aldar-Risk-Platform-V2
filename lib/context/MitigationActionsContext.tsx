'use client'

/**
 * MitigationActionsContext
 * ------------------------
 * Per-risk mitigation actions, persisted to localStorage. Works for
 * BOTH engine risks (R-001..R-010) and user drafts (DRAFT-NNN) — keyed
 * by riskId. Status workflow (Open → In Progress → Closed) lives here;
 * Overdue is computed live from dueDate.
 *
 * Honors CLAUDE.md: every action is user-attributed, no auto-generated
 * fields. Calibration into engine sensitivities is post-pilot.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { recordAuditEventDirect } from '@/lib/context/AuditTrailContext'

const STORAGE_KEY = 'aldar-mitigation-actions-v1'

export type ActionStatus = 'open' | 'in_progress' | 'closed'

export interface MitigationAction {
  id: string
  riskId: string
  name: string
  owner: string
  /** ISO yyyy-mm-dd. */
  dueDate: string
  status: ActionStatus
  description?: string
  createdAt: string
  updatedAt: string
}

interface CtxValue {
  actions: MitigationAction[]
  actionsForRisk: (riskId: string) => MitigationAction[]
  addAction: (input: Omit<MitigationAction, 'id' | 'createdAt' | 'updatedAt'>) => MitigationAction
  updateAction: (id: string, patch: Partial<Omit<MitigationAction, 'id' | 'createdAt'>>) => MitigationAction | null
  removeAction: (id: string) => void
  /** True if action.dueDate is in the past AND status is not closed. */
  isOverdue: (a: MitigationAction) => boolean
}

const Ctx = createContext<CtxValue | null>(null)

function uuid(): string {
  // Lightweight unique id; not crypto-strength but unique enough for client storage.
  return `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function MitigationActionsProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<MitigationAction[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as MitigationAction[]
        if (Array.isArray(parsed)) setActions(parsed)
      }
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actions))
    } catch {}
  }, [actions, hydrated])

  const actionsForRisk = useCallback(
    (riskId: string) => actions.filter((a) => a.riskId === riskId),
    [actions],
  )

  const addAction = useCallback<CtxValue['addAction']>((input) => {
    const now = new Date().toISOString()
    const full: MitigationAction = {
      ...input,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    }
    setActions((prev) => [...prev, full])
    recordAuditEventDirect({
      category: 'mitigation',
      action: 'create',
      actor: full.owner || 'unknown',
      targetId: full.riskId,
      summary: `New mitigation "${full.name}" added on ${full.riskId} (due ${full.dueDate}).`,
    })
    return full
  }, [])

  const updateAction = useCallback<CtxValue['updateAction']>((id, patch) => {
    let updated: MitigationAction | null = null
    setActions((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        updated = {
          ...a,
          ...patch,
          id: a.id,
          createdAt: a.createdAt,
          updatedAt: new Date().toISOString(),
        }
        return updated
      }),
    )
    const u = updated as MitigationAction | null
    if (u) {
      const isStatus = 'status' in patch
      recordAuditEventDirect({
        category: 'mitigation',
        action: isStatus ? 'status_change' : 'update',
        actor: u.owner || 'unknown',
        targetId: u.riskId,
        summary: isStatus
          ? `Mitigation "${u.name}" on ${u.riskId} → ${u.status}.`
          : `Mitigation "${u.name}" on ${u.riskId} updated (${Object.keys(patch).join(', ')}).`,
      })
    }
    return u
  }, [])

  const removeAction = useCallback<CtxValue['removeAction']>((id) => {
    setActions((prev) => {
      const target = prev.find((a) => a.id === id)
      if (target) {
        recordAuditEventDirect({
          category: 'mitigation',
          action: 'delete',
          actor: target.owner || 'unknown',
          targetId: target.riskId,
          summary: `Mitigation "${target.name}" on ${target.riskId} removed.`,
        })
      }
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  const isOverdue = useCallback<CtxValue['isOverdue']>((a) => {
    if (a.status === 'closed') return false
    if (!a.dueDate) return false
    // Compare as YYYY-MM-DD strings to avoid timezone surprises.
    const today = new Date().toISOString().slice(0, 10)
    return a.dueDate < today
  }, [])

  const value = useMemo<CtxValue>(
    () => ({ actions, actionsForRisk, addAction, updateAction, removeAction, isOverdue }),
    [actions, actionsForRisk, addAction, updateAction, removeAction, isOverdue],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useMitigationActions(): CtxValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMitigationActions must be used inside <MitigationActionsProvider>')
  return ctx
}
