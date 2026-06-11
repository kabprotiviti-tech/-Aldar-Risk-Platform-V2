/**
 * Risk History — Phase 2 (illustrative)
 * Types + seed for the three Phase-2 capabilities:
 *   2.8 Review cycles  — per-risk last/next review + frequency
 *   2.6 Movement/trend — point-in-time score snapshots
 *   3.6 Mitigation→control — controls promoted from completed mitigations
 */

import { RISKS } from '@/lib/engine/seedData'

export type ReviewFrequency = 'Quarterly' | 'Semi-annual' | 'Annual'

export interface ReviewCycle {
  riskId: string
  riskName: string
  frequency: ReviewFrequency
  lastReview: string   // yyyy-mm-dd
  nextReview: string   // yyyy-mm-dd
  reviewer: string
}

export interface RiskSnapshot {
  id: string
  takenAt: string      // yyyy-mm-dd
  label: string        // e.g. "Q1 2026 freeze"
  entries: { riskId: string; score: number; rating: RiskRating }[]
}

export type RiskRating = 'Low' | 'Medium' | 'High' | 'Critical'

export interface DerivedControl {
  id: string
  name: string
  riskId: string
  owner: string
  frequency: string
  fromMitigationId: string
  fromMitigationName: string
  createdAt: string
}

/** Illustrative "today" for the demo (matches the rest of the tool). */
export const HISTORY_TODAY = '2026-06-10'

export function bandForScore(score: number): RiskRating {
  if (score >= 18) return 'Critical'
  if (score >= 12) return 'High'
  if (score >= 6) return 'Medium'
  return 'Low'
}

export const RATING_COLOR: Record<RiskRating, string> = {
  Low: '#067647', Medium: '#B54708', High: '#B42318', Critical: '#7A0019',
}

/** Live inherent score for a seed risk. */
export function liveScore(r: { baseLikelihood: number; baseImpact: number }): number {
  return r.baseLikelihood * r.baseImpact
}

// ── Seed: review cycles (some overdue, some upcoming) ──────────────────────
const FREqs: ReviewFrequency[] = ['Quarterly', 'Semi-annual', 'Annual']
const REVIEWERS = ['Omar Haddad (ERM)', 'Layla Al Mansoori (CRO)', 'Rashid Al Nuaimi (Champion)', 'Priya Nair (Champion)']

export function seedReviewCycles(): ReviewCycle[] {
  return RISKS.map((r, i) => {
    const frequency = FREqs[i % FREqs.length]
    // Deterministically spread next-review dates around "today" (2026-06-10):
    // every 3rd risk is overdue, every 3rd due-soon, rest future.
    const mod = i % 3
    const last = mod === 0 ? '2026-02-15' : mod === 1 ? '2026-03-20' : '2026-05-10'
    const next = mod === 0 ? '2026-05-15' /* overdue */ : mod === 1 ? '2026-06-20' /* due soon */ : '2026-08-30' /* future */
    return { riskId: r.id, riskName: r.name, frequency, lastReview: last, nextReview: next, reviewer: REVIEWERS[i % REVIEWERS.length] }
  })
}

// ── Seed: three quarterly snapshots with slight drift so movement shows ─────
export function seedSnapshots(): RiskSnapshot[] {
  const make = (id: string, takenAt: string, label: string, drift: number): RiskSnapshot => ({
    id, takenAt, label,
    entries: RISKS.map((r, i) => {
      // deterministic drift: alternate risks move up/down a little each quarter
      const dir = i % 2 === 0 ? 1 : -1
      const raw = liveScore(r) + dir * drift
      const score = Math.max(1, Math.min(25, raw))
      return { riskId: r.id, score, rating: bandForScore(score) }
    }),
  })
  return [
    make('SNAP-Q4', '2025-12-31', 'Q4 2025 freeze', 2),
    make('SNAP-Q1', '2026-03-31', 'Q1 2026 freeze', 1),
    make('SNAP-Q2', '2026-05-31', 'Q2 2026 freeze', 0),
  ]
}
