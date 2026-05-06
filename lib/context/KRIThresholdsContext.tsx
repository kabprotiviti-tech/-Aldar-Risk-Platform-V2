'use client'

/**
 * KRIThresholdsContext
 * --------------------
 * Per-KRI threshold overrides, persisted to localStorage. If no override
 * is set for a KRI, the UI falls back to the default thresholds defined
 * in lib/data/kri-definitions.ts.
 *
 * Threshold semantics (see KRIDefinition.direction):
 *   higher_is_better → green ≥ amberBoundary, amber [redBoundary, amberBoundary), red < redBoundary
 *   lower_is_better  → green ≤ amberBoundary, amber (amberBoundary, redBoundary], red > redBoundary
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { KRIDefinition, KRIThresholds } from '@/lib/data/kri-definitions'

const STORAGE_KEY = 'aldar-kri-thresholds-v1'

interface CtxValue {
  /** Map of kriId → user-overridden thresholds. Missing means use default. */
  overrides: Record<string, KRIThresholds>
  /** Returns the effective thresholds for a KRI: override if present, else default. */
  thresholdsFor: (kri: KRIDefinition) => KRIThresholds
  /** True if the KRI is currently using a user override (not its default). */
  isOverridden: (kriId: string) => boolean
  /** Save (or replace) an override for the given KRI. */
  setThresholds: (kriId: string, t: KRIThresholds) => void
  /** Remove the override and revert to default. */
  resetThresholds: (kriId: string) => void
}

const Ctx = createContext<CtxValue | null>(null)

export function KRIThresholdsProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, KRIThresholds>>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') setOverrides(parsed)
      }
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
    } catch {}
  }, [overrides, hydrated])

  const thresholdsFor = useCallback<CtxValue['thresholdsFor']>(
    (kri) => overrides[kri.id] || kri.defaultThresholds,
    [overrides],
  )

  const isOverridden = useCallback<CtxValue['isOverridden']>(
    (kriId) => Boolean(overrides[kriId]),
    [overrides],
  )

  const setThresholds = useCallback<CtxValue['setThresholds']>((kriId, t) => {
    setOverrides((prev) => ({ ...prev, [kriId]: t }))
  }, [])

  const resetThresholds = useCallback<CtxValue['resetThresholds']>((kriId) => {
    setOverrides((prev) => {
      const next = { ...prev }
      delete next[kriId]
      return next
    })
  }, [])

  const value = useMemo<CtxValue>(
    () => ({ overrides, thresholdsFor, isOverridden, setThresholds, resetThresholds }),
    [overrides, thresholdsFor, isOverridden, setThresholds, resetThresholds],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useKRIThresholds(): CtxValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useKRIThresholds must be used inside <KRIThresholdsProvider>')
  return ctx
}

/** Re-export the type so callers don't need a separate import path. */
export type { KRIThresholds }
