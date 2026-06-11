'use client'

/**
 * ScenarioLibraryContext — Phase 3 (P2.3 scenario save / version / compare)
 * Save a named what-if scenario with its parameters + headline outcome,
 * version it, and compare any two. Browser-persisted. Demo-real.
 */

import React from 'react'
import { createPersistedContext, uid } from '@/lib/context/createPersistedContext'
import { recordAuditEventDirect } from '@/lib/context/AuditTrailContext'

export interface SavedScenario {
  id: string
  name: string
  version: number
  createdAt: string
  intensity: 'mild' | 'moderate' | 'severe'
  note: string
  outcome: { criticalCount: number; highCount: number; exposureAedM: number; appetiteBreaches: number }
}

const ctx = createPersistedContext<SavedScenario[]>({
  storageKey: 'aldar-scenario-library-v1',
  defaultValue: [],
  migrate: (raw) => (Array.isArray(raw) ? (raw as SavedScenario[]) : []),
  seed: () => [
    { id: 'SCN-BASE', name: 'Baseline (current posture)', version: 1, createdAt: '2026-06-01T00:00:00.000Z', intensity: 'mild', note: 'Current risk profile, no stress applied.', outcome: { criticalCount: 3, highCount: 6, exposureAedM: 900, appetiteBreaches: 1 } },
    { id: 'SCN-OIL', name: 'Oil price decline 20%', version: 1, createdAt: '2026-06-02T00:00:00.000Z', intensity: 'moderate', note: 'Sustained 20% decline in oil; demand + liquidity pressure.', outcome: { criticalCount: 5, highCount: 8, exposureAedM: 1180, appetiteBreaches: 3 } },
  ],
  seedSentinelKey: 'aldar-scenario-library-seeded-v1',
})

export function ScenarioLibraryProvider({ children }: { children: React.ReactNode }) {
  return <ctx.Provider>{children}</ctx.Provider>
}

export function useScenarioLibrary() {
  const { state, setState, hydrated } = ctx.useStore()
  const save = (rec: Omit<SavedScenario, 'id' | 'createdAt' | 'version'>) => {
    // version = how many scenarios already share this name + 1
    const version = state.filter((s) => s.name === rec.name).length + 1
    const full: SavedScenario = { ...rec, id: uid('SCN').toUpperCase(), createdAt: new Date().toISOString(), version }
    setState((prev) => [full, ...prev])
    recordAuditEventDirect({ category: 'system', action: 'create', actor: 'Risk Analyst', targetId: full.id, summary: `Scenario saved: "${rec.name}" v${version} (${rec.intensity}).` })
    return full
  }
  const remove = (id: string) => setState((prev) => prev.filter((s) => s.id !== id))
  return { scenarios: state, hydrated, save, remove }
}
