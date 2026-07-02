/**
 * ERM Annual Plan — shared seed data + status derivation.
 * ----------------------------------------------------------
 * Single source of truth for "what is Aldar's ERM calendar and where does
 * each activity stand" — used by BOTH the interactive grid
 * (components/portfolio-tower/ERMAnnualPlan.tsx) and the Dashboard's
 * summary card, so the two can never show different activities or
 * disagree on counts (the old lib/data/ermAnnualPlan.ts + ErmAnnualPlan.tsx
 * widget was a second, independent hardcoded ERM calendar — retired
 * because it listed different activities with different statuses than
 * this one, which is a real drift risk, not just a visual duplicate).
 */
import type {
  PlanActivity,
  PlanActivityCategory,
  PlanActivityStatus,
} from '@/lib/context/ERMPlanActivitiesContext'
import { occurrenceKey } from '@/lib/context/ERMPlanActivitiesContext'

export interface SeedActivity {
  id: string
  title: string
  description: string
  months: number[]
  category: PlanActivityCategory
  seeded: true
}

export const SEED_ACTIVITIES: SeedActivity[] = [
  { id: 'a1', title: 'Risk Appetite Refresh', description: 'Annual review of group risk appetite & tolerance', months: [1, 2], category: 'governance', seeded: true },
  { id: 'a2', title: 'ERM Framework Update', description: 'Refresh ERM framework, taxonomy, ISO 31000 alignment', months: [3, 4], category: 'governance', seeded: true },
  { id: 'a3', title: 'KRI Monthly Reporting', description: 'Monthly KRI dashboard cycle to Group ERM Head', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], category: 'monitoring', seeded: true },
  { id: 'a4', title: 'ARC Quarterly Review', description: 'Audit & Risk Committee review of register, KRIs, breach log', months: [3, 6, 9, 12], category: 'review', seeded: true },
  { id: 'a5', title: 'Risk Champion Training', description: 'Training cycle for first-line risk champions', months: [5, 6], category: 'training', seeded: true },
  { id: 'a6', title: 'Subsidiary Register Refresh', description: 'Each subsidiary refreshes its register; cascades to Group', months: [7, 8], category: 'review', seeded: true },
  { id: 'a7', title: 'External Audit Walkthrough', description: 'External auditor walks risk register + control library', months: [10, 11], category: 'review', seeded: true },
  { id: 'a8', title: 'Board Annual Report', description: 'Year-end ERM report to the board, ARC pack', months: [12], category: 'reporting', seeded: true },
]

// ── Status derivation ────────────────────────────────────────────────────
// "Due" and "Overdue" are NOT stored — they are computed from the user-set
// lifecycle status of EACH month-occurrence vs. today's month.
export type PlanState = 'completed' | 'overdue' | 'in_progress' | 'due' | 'planned'

/** Real current month (1..12). Drives Due / Overdue everywhere it's used. */
export const CURRENT_MONTH = new Date().getMonth() + 1

/** State of ONE month-occurrence, from its stored lifecycle status + the date. */
export function deriveOccState(month: number, status: PlanActivityStatus): PlanState {
  if (status === 'completed') return 'completed'
  if (month < CURRENT_MONTH) return 'overdue' // month has passed, not completed
  if (status === 'in_progress') return 'in_progress'
  if (month === CURRENT_MONTH) return 'due' // happening this month
  return 'planned' // future month
}

const STATE_PRIORITY: PlanState[] = ['overdue', 'due', 'in_progress', 'planned', 'completed']

/** Roll up several occurrence states into one chip state for a row. */
export function rollupState(states: PlanState[]): PlanState {
  if (states.length === 0) return 'planned'
  if (states.every((s) => s === 'completed')) return 'completed'
  for (const p of STATE_PRIORITY) {
    if (states.includes(p)) return p
  }
  return 'planned'
}

export interface ErmPlanSummary {
  completed: number
  overdue: number
  inProgress: number
  due: number
  planned: number
}

/**
 * Group-wide occurrence counts across every activity (seeded + custom),
 * for "at a glance" cards like the Dashboard summary. Counts OCCURRENCES
 * (one per activity-month), matching what the interactive grid shows —
 * so a card built from this can never disagree with the grid below it.
 */
export function computeErmPlanSummary(
  customActivities: PlanActivity[],
  statuses: Record<string, PlanActivityStatus>,
): ErmPlanSummary {
  const summary: ErmPlanSummary = { completed: 0, overdue: 0, inProgress: 0, due: 0, planned: 0 }
  const rows: { id: string; months: number[] }[] = [
    ...SEED_ACTIVITIES.map((a) => ({ id: a.id, months: a.months })),
    ...customActivities.map((a) => ({ id: a.id, months: a.months })),
  ]
  for (const row of rows) {
    for (const month of row.months) {
      const status = statuses[occurrenceKey(row.id, month)] ?? 'planned'
      const state = deriveOccState(month, status)
      if (state === 'completed') summary.completed++
      else if (state === 'overdue') summary.overdue++
      else if (state === 'in_progress') summary.inProgress++
      else if (state === 'due') summary.due++
      else summary.planned++
    }
  }
  return summary
}
