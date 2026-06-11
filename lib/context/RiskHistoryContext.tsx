'use client'

/**
 * RiskHistoryContext — Phase 2
 * Three browser-persisted stores behind one provider:
 *   - Review cycles (2.8)
 *   - Score snapshots (2.6) — movement = latest vs previous
 *   - Derived controls (3.6) — promoted from completed mitigations
 */

import React from 'react'
import { createPersistedContext, uid } from '@/lib/context/createPersistedContext'
import { recordAuditEventDirect } from '@/lib/context/AuditTrailContext'
import {
  type ReviewCycle,
  type RiskSnapshot,
  type DerivedControl,
  type ReviewFrequency,
  seedReviewCycles,
  seedSnapshots,
  bandForScore,
} from '@/lib/data/risk-history'

const cyclesCtx = createPersistedContext<ReviewCycle[]>({
  storageKey: 'aldar-review-cycles-v1',
  defaultValue: [],
  migrate: (raw) => (Array.isArray(raw) ? (raw as ReviewCycle[]) : []),
  seed: seedReviewCycles,
  seedSentinelKey: 'aldar-review-cycles-seeded-v1',
})

const snapsCtx = createPersistedContext<RiskSnapshot[]>({
  storageKey: 'aldar-snapshots-v1',
  defaultValue: [],
  migrate: (raw) => (Array.isArray(raw) ? (raw as RiskSnapshot[]) : []),
  seed: seedSnapshots,
  seedSentinelKey: 'aldar-snapshots-seeded-v1',
})

const derivedCtx = createPersistedContext<DerivedControl[]>({
  storageKey: 'aldar-derived-controls-v1',
  defaultValue: [],
  migrate: (raw) => (Array.isArray(raw) ? (raw as DerivedControl[]) : []),
})

export function RiskHistoryProvider({ children }: { children: React.ReactNode }) {
  return (
    <cyclesCtx.Provider>
      <snapsCtx.Provider>
        <derivedCtx.Provider>{children}</derivedCtx.Provider>
      </snapsCtx.Provider>
    </cyclesCtx.Provider>
  )
}

function addMonths(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 10)
}

const FREQ_MONTHS: Record<ReviewFrequency, number> = { Quarterly: 3, 'Semi-annual': 6, Annual: 12 }

export function useReviewCycles() {
  const { state, setState, hydrated } = cyclesCtx.useStore()
  /** Mark a risk reviewed today → advances next-review by its frequency. */
  const markReviewed = (riskId: string, today: string, reviewer: string) =>
    setState((prev) => prev.map((c) => {
      if (c.riskId !== riskId) return c
      recordAuditEventDirect({ category: 'risk', action: 'status_change', actor: reviewer, targetId: riskId, summary: `Periodic review completed for ${riskId}. Next review ${addMonths(today, FREQ_MONTHS[c.frequency])}.` })
      return { ...c, lastReview: today, nextReview: addMonths(today, FREQ_MONTHS[c.frequency]) }
    }))
  return { cycles: state, hydrated, markReviewed }
}

export function useRiskSnapshots() {
  const { state, setState, hydrated } = snapsCtx.useStore()
  /** Freeze the supplied live scores as a new snapshot. */
  const takeSnapshot = (label: string, takenAt: string, entries: { riskId: string; score: number }[]) => {
    const snap: RiskSnapshot = {
      id: uid('SNAP').toUpperCase(),
      takenAt,
      label,
      entries: entries.map((e) => ({ riskId: e.riskId, score: e.score, rating: bandForScore(e.score) })),
    }
    setState((prev) => [...prev, snap])
    recordAuditEventDirect({ category: 'system', action: 'export', actor: 'ERM', targetId: snap.id, summary: `Risk posture snapshot frozen: ${label} (${entries.length} risks).` })
    return snap
  }
  return { snapshots: state, hydrated, takeSnapshot }
}

export function useDerivedControls() {
  const { state, setState, hydrated } = derivedCtx.useStore()
  const promote = (rec: Omit<DerivedControl, 'id' | 'createdAt'>) => {
    const full: DerivedControl = { ...rec, id: uid('DCTL').toUpperCase(), createdAt: new Date().toISOString() }
    setState((prev) => [full, ...prev])
    recordAuditEventDirect({ category: 'risk', action: 'create', actor: rec.owner, targetId: rec.riskId, summary: `Mitigation "${rec.fromMitigationName}" promoted to a standing control on ${rec.riskId}.` })
    return full
  }
  const remove = (id: string) => setState((prev) => prev.filter((c) => c.id !== id))
  return { derivedControls: state, hydrated, promote, remove }
}
