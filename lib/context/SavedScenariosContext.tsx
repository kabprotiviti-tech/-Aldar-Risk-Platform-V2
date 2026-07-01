'use client'

/**
 * SavedScenariosContext
 * ----------------------
 * Persisted library of user-named driver combinations for the Scenario
 * Analysis stress test. Leadership sets drivers, names the combination,
 * and it's saved for reuse — separate from the built-in presets, which are
 * read-only starting points.
 */

import React, { useCallback, useMemo } from 'react'
import { createPersistedContext, uid } from '@/lib/context/createPersistedContext'
import { recordAuditEventDirect } from '@/lib/context/AuditTrailContext'

export interface SavedScenario {
  id: string
  name: string
  values: Record<string, number>
  createdAt: string
  createdBy: string
}

const { Provider: StoreProvider, useStore } = createPersistedContext<SavedScenario[]>({
  storageKey: 'aldar-saved-scenarios-v1',
  defaultValue: [],
  migrate: (raw) => (Array.isArray(raw) ? (raw as SavedScenario[]) : []),
})

interface CtxValue {
  scenarios: SavedScenario[]
  saveScenario: (name: string, values: Record<string, number>) => SavedScenario
  removeScenario: (id: string) => void
}

const Ctx = React.createContext<CtxValue | null>(null)

function Inner({ children }: { children: React.ReactNode }) {
  const { state: scenarios, setState } = useStore()

  const saveScenario = useCallback<CtxValue['saveScenario']>(
    (name, values) => {
      const full: SavedScenario = {
        id: uid('savedscn'),
        name,
        values,
        createdAt: new Date().toISOString(),
        createdBy: 'AVP (demo)',
      }
      setState((prev) => [...prev, full])
      recordAuditEventDirect({
        category: 'system',
        action: 'create',
        actor: full.createdBy,
        targetId: full.id,
        summary: `Scenario "${full.name}" saved with ${Object.keys(values).length} driver(s) set.`,
      })
      return full
    },
    [setState],
  )

  const removeScenario = useCallback<CtxValue['removeScenario']>(
    (id) => {
      setState((prev) => {
        const target = prev.find((s) => s.id === id)
        if (target) {
          recordAuditEventDirect({
            category: 'system',
            action: 'delete',
            actor: target.createdBy,
            targetId: id,
            summary: `Scenario "${target.name}" removed.`,
          })
        }
        return prev.filter((s) => s.id !== id)
      })
    },
    [setState],
  )

  const value = useMemo<CtxValue>(
    () => ({ scenarios, saveScenario, removeScenario }),
    [scenarios, saveScenario, removeScenario],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function SavedScenariosProvider({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Inner>{children}</Inner>
    </StoreProvider>
  )
}

export function useSavedScenarios(): CtxValue {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('useSavedScenarios must be used inside <SavedScenariosProvider>')
  return ctx
}
