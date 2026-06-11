'use client'

/**
 * GovernanceRecordsContext — Phase 1
 * Browser-persisted stores for Incidents (7.5), Risk Acceptances (7.6) and
 * Lessons Learned (7.7), built on the shared createPersistedContext helper.
 * One combined Provider mounts all three; thin hooks expose add/remove and
 * record an audit-trail event on each change.
 */

import React from 'react'
import { createPersistedContext, uid } from '@/lib/context/createPersistedContext'
import { recordAuditEventDirect } from '@/lib/context/AuditTrailContext'
import {
  type Incident,
  type RiskAcceptance,
  type LessonLearned,
  seedIncidents,
  seedAcceptances,
  seedLessons,
} from '@/lib/data/governance-records'

const incidentsCtx = createPersistedContext<Incident[]>({
  storageKey: 'aldar-incidents-v1',
  defaultValue: [],
  migrate: (raw) => (Array.isArray(raw) ? (raw as Incident[]) : []),
  seed: seedIncidents,
  seedSentinelKey: 'aldar-incidents-seeded-v1',
})

const acceptancesCtx = createPersistedContext<RiskAcceptance[]>({
  storageKey: 'aldar-acceptances-v1',
  defaultValue: [],
  migrate: (raw) => (Array.isArray(raw) ? (raw as RiskAcceptance[]) : []),
  seed: seedAcceptances,
  seedSentinelKey: 'aldar-acceptances-seeded-v1',
})

const lessonsCtx = createPersistedContext<LessonLearned[]>({
  storageKey: 'aldar-lessons-v1',
  defaultValue: [],
  migrate: (raw) => (Array.isArray(raw) ? (raw as LessonLearned[]) : []),
  seed: seedLessons,
  seedSentinelKey: 'aldar-lessons-seeded-v1',
})

export function GovernanceRecordsProvider({ children }: { children: React.ReactNode }) {
  return (
    <incidentsCtx.Provider>
      <acceptancesCtx.Provider>
        <lessonsCtx.Provider>{children}</lessonsCtx.Provider>
      </acceptancesCtx.Provider>
    </incidentsCtx.Provider>
  )
}

// ── Incidents ──────────────────────────────────────────────────────────────
export function useIncidents() {
  const { state, setState, hydrated } = incidentsCtx.useStore()
  const add = (rec: Omit<Incident, 'id' | 'createdAt'>) => {
    const full: Incident = { ...rec, id: uid('INC').toUpperCase(), createdAt: new Date().toISOString() }
    setState((prev) => [full, ...prev])
    recordAuditEventDirect({ category: 'risk', action: 'create', actor: rec.owner || 'ERM', targetId: full.id, summary: `Incident logged: ${full.title}${full.linkedRiskIds.length ? ` (linked to ${full.linkedRiskIds.join(', ')})` : ''}.` })
    return full
  }
  const update = (id: string, patch: Partial<Incident>) =>
    setState((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const remove = (id: string) => setState((prev) => prev.filter((r) => r.id !== id))
  return { incidents: state, hydrated, add, update, remove }
}

// ── Risk acceptances ────────────────────────────────────────────────────────
export function useRiskAcceptances() {
  const { state, setState, hydrated } = acceptancesCtx.useStore()
  const add = (rec: Omit<RiskAcceptance, 'id' | 'createdAt'>) => {
    const full: RiskAcceptance = { ...rec, id: uid('ACC').toUpperCase(), createdAt: new Date().toISOString() }
    setState((prev) => [full, ...prev])
    recordAuditEventDirect({ category: 'risk', action: 'status_change', actor: rec.approver || 'ARC', targetId: rec.riskId, summary: `Residual risk accepted for ${rec.riskId} by ${rec.approver}. Review by ${rec.reviewBy}.` })
    return full
  }
  const remove = (id: string) => setState((prev) => prev.filter((r) => r.id !== id))
  return { acceptances: state, hydrated, add, remove }
}

// ── Lessons learned ──────────────────────────────────────────────────────────
export function useLessons() {
  const { state, setState, hydrated } = lessonsCtx.useStore()
  const add = (rec: Omit<LessonLearned, 'id' | 'createdAt'>) => {
    const full: LessonLearned = { ...rec, id: uid('LL').toUpperCase(), createdAt: new Date().toISOString() }
    setState((prev) => [full, ...prev])
    recordAuditEventDirect({ category: 'risk', action: 'create', actor: rec.author || 'ERM', targetId: full.id, summary: `Lesson learned captured: ${full.title}.` })
    return full
  }
  const remove = (id: string) => setState((prev) => prev.filter((r) => r.id !== id))
  return { lessons: state, hydrated, add, remove }
}
