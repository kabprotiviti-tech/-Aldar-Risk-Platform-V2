'use client'

/**
 * RiskDraftContext
 * ----------------
 * Holds user-created and user-edited risks (drafts) in React state with
 * automatic persistence to localStorage. Lives ALONGSIDE the engine's
 * built-in seed risks — drafts are not yet wired into the simulation
 * engine (calibration of new risks against drivers happens in pilot).
 *
 * The Risk Register page merges seed risks + drafts for display.
 * Drafts show a "DRAFT" badge so the demo audience never confuses
 * unpersisted user input with engine-calibrated risks.
 *
 * Honors CLAUDE.md: drafts contain only fields the user provided. We
 * do NOT auto-generate scores or financial anchors — every value is
 * user-attributed.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { RiskDef } from '@/lib/engine/types'

const STORAGE_KEY = 'aldar-risk-drafts-v1'

/**
 * A draft contains the full RiskDef shape PLUS metadata about its
 * provenance and edit history. Only the static fields are user-set;
 * driverImpacts / controls default to empty until the pilot wires them.
 */
export interface RiskDraft extends RiskDef {
  /** ISO timestamp of creation. */
  createdAt: string
  /** ISO timestamp of last edit. */
  updatedAt: string
  /** Display author (free text — no real RBAC yet, comes in Patch F). */
  createdBy: string
}

interface RiskDraftContextValue {
  drafts: RiskDraft[]
  addDraft: (draft: Omit<RiskDraft, 'createdAt' | 'updatedAt' | 'createdBy'>, author?: string) => RiskDraft
  updateDraft: (id: string, patch: Partial<RiskDef>, author?: string) => RiskDraft | null
  removeDraft: (id: string) => void
  /** Generate the next available DRAFT-NNN id given existing drafts. */
  nextDraftId: () => string
}

const Ctx = createContext<RiskDraftContextValue | null>(null)

export function RiskDraftProvider({ children }: { children: React.ReactNode }) {
  const [drafts, setDrafts] = useState<RiskDraft[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as RiskDraft[]
        if (Array.isArray(parsed)) setDrafts(parsed)
      }
    } catch {
      // ignore — corrupt storage just resets to empty
    }
    setHydrated(true)
  }, [])

  // Persist on change (only after hydration to avoid wiping on first render)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
    } catch {
      // storage full / blocked — UI will still work in-memory
    }
  }, [drafts, hydrated])

  const nextDraftId = useCallback(() => {
    let n = drafts.length + 1
    let id = `DRAFT-${String(n).padStart(3, '0')}`
    const used = new Set(drafts.map((d) => d.id))
    while (used.has(id)) {
      n += 1
      id = `DRAFT-${String(n).padStart(3, '0')}`
    }
    return id
  }, [drafts])

  const addDraft = useCallback<RiskDraftContextValue['addDraft']>(
    (draft, author = 'Risk Champion (demo)') => {
      const now = new Date().toISOString()
      const full: RiskDraft = {
        ...draft,
        createdAt: now,
        updatedAt: now,
        createdBy: author,
      }
      setDrafts((prev) => [...prev, full])
      return full
    },
    [],
  )

  const updateDraft = useCallback<RiskDraftContextValue['updateDraft']>(
    (id, patch, author = 'Risk Champion (demo)') => {
      let updated: RiskDraft | null = null
      setDrafts((prev) =>
        prev.map((d) => {
          if (d.id !== id) return d
          updated = {
            ...d,
            ...patch,
            id: d.id, // never overwrite id
            createdAt: d.createdAt,
            updatedAt: new Date().toISOString(),
            createdBy: d.createdBy || author,
          }
          return updated
        }),
      )
      return updated
    },
    [],
  )

  const removeDraft = useCallback<RiskDraftContextValue['removeDraft']>((id) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const value = useMemo<RiskDraftContextValue>(
    () => ({ drafts, addDraft, updateDraft, removeDraft, nextDraftId }),
    [drafts, addDraft, updateDraft, removeDraft, nextDraftId],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRiskDrafts(): RiskDraftContextValue {
  const ctx = useContext(Ctx)
  if (!ctx)
    throw new Error('useRiskDrafts must be used inside <RiskDraftProvider>')
  return ctx
}
