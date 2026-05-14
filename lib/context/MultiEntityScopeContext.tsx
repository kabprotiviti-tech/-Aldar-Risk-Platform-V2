'use client'

/**
 * MultiEntityScopeContext — Batch E
 * ----------------------------------
 * Lets a single logged-in user filter dashboards/registers across
 * multiple subsidiary entities at once. Sub-CEO of two entities,
 * Group ERM Head running a multi-sub view, ARC Chair doing a
 * cross-sub deep-dive all benefit.
 *
 * Sits alongside PersonaContext rather than mutating it — single-entity
 * consumers (EntityScopePicker, /portfolio-tower, /risk-register entity
 * filter) keep working unchanged. When this provider is empty/null,
 * `inScope()` falls back to "everything in scope" so single-entity
 * surfaces are unaffected.
 *
 * Persistence: localStorage key 'aldar-multi-entity-scope-v1'.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { usePersona } from '@/lib/context/PersonaContext'
import { entityForRisk } from '@/lib/data/risk-entity-mapping'
import type { EntityId } from '@/lib/data/risk-entity-mapping'

const STORAGE = 'aldar-multi-entity-scope-v1'

interface MultiEntityScopeCtx {
  /** Selected entity IDs. Empty = "see everything". */
  scopes: EntityId[]
  /** True iff a multi-select is currently active (i.e. scopes.length > 0). */
  isMultiActive: boolean
  /** Replace the entire selection. */
  setScopes: (next: EntityId[]) => void
  /** Toggle one entity in / out. */
  toggle: (id: EntityId) => void
  /** Clear — return to "see everything". */
  clear: () => void
  /**
   * In-scope predicate. Returns true if:
   *   - no multi-scope is active (everything visible)
   *   - the risk's primary entity is in the selected set
   *   - the risk maps to 'aldar-group' (cross-portfolio risks are
   *     always visible when filtering subs, since they cascade to all)
   */
  inScopeRisk: (riskId: string) => boolean
  inScopeEntity: (entityId: EntityId) => boolean
}

const Ctx = React.createContext<MultiEntityScopeCtx | null>(null)

function loadScopes(): EntityId[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as EntityId[]) : []
  } catch {
    return []
  }
}

export function MultiEntityScopeProvider({ children }: { children: React.ReactNode }) {
  const { session } = usePersona()
  const [scopes, setScopesState] = useState<EntityId[]>([])

  // Hydrate from storage on mount. If a single entityScope is set on
  // the session and no multi-scope has been chosen, seed with the
  // single scope so existing single-entity logins feel consistent.
  useEffect(() => {
    const saved = loadScopes()
    if (saved.length > 0) {
      setScopesState(saved)
    } else if (session.entityScope && session.entityScope !== 'aldar-group') {
      setScopesState([session.entityScope])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setScopes = useCallback((next: EntityId[]) => {
    setScopesState(next)
    try {
      localStorage.setItem(STORAGE, JSON.stringify(next))
    } catch {
      /* quota / disabled — silent */
    }
  }, [])

  const toggle = useCallback(
    (id: EntityId) => {
      setScopes(scopes.includes(id) ? scopes.filter((s) => s !== id) : [...scopes, id])
    },
    [scopes, setScopes],
  )

  const clear = useCallback(() => setScopes([]), [setScopes])

  const inScopeRisk = useCallback(
    (riskId: string) => {
      if (scopes.length === 0) return true
      const e = entityForRisk(riskId)
      if (e === 'aldar-group') return true
      return scopes.includes(e)
    },
    [scopes],
  )

  const inScopeEntity = useCallback(
    (entityId: EntityId) => {
      if (scopes.length === 0) return true
      if (entityId === 'aldar-group') return true
      return scopes.includes(entityId)
    },
    [scopes],
  )

  const value = useMemo<MultiEntityScopeCtx>(
    () => ({
      scopes,
      isMultiActive: scopes.length > 0,
      setScopes,
      toggle,
      clear,
      inScopeRisk,
      inScopeEntity,
    }),
    [scopes, setScopes, toggle, clear, inScopeRisk, inScopeEntity],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useMultiEntityScope(): MultiEntityScopeCtx {
  const ctx = React.useContext(Ctx)
  if (!ctx) {
    // Graceful fallback for unwrapped consumers — never throws so any
    // page can opt in without a provider migration.
    return {
      scopes: [],
      isMultiActive: false,
      setScopes: () => {},
      toggle: () => {},
      clear: () => {},
      inScopeRisk: () => true,
      inScopeEntity: () => true,
    }
  }
  return ctx
}
