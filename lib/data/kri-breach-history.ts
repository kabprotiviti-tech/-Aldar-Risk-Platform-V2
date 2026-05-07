/**
 * KRI Breach History — pure derivation.
 * -------------------------------------
 * Given a KRI's chronological entries + the active thresholds + direction,
 * walk the timeline and emit a BreachEvent every time the traffic-light
 * status transitions between bands (green ↔ amber ↔ red).
 *
 * Standing rule (CLAUDE.md): no parallel store of breach events. The
 * timeline is deterministic from `entries × thresholds × direction`,
 * so a separate persisted log would only invite drift / fabrication.
 * If thresholds are edited later, the breach history visibly updates —
 * which is honest: it reflects "with today's appetite, here's where
 * this KRI breached."
 *
 * If the platform later needs a forensic-grade audit log of breaches
 * captured *at the moment they happened*, that becomes a Module 8
 * (Audit Trail) artifact, not a Module 3 helper.
 */

import type { KRIEntry } from '@/lib/context/KRIEntriesContext'
import {
  computeKRIStatus,
  type KRIStatus,
} from '@/lib/data/kri-status'
import type {
  KRIDirection,
  KRIThresholds,
} from '@/lib/data/kri-definitions'

export interface BreachEvent {
  /** Stable id derived from kriId + period — not random, so repeated computes are stable. */
  id: string
  kriId: string
  /** yyyy-mm period this transition was observed at. */
  period: string
  /** Status BEFORE this period (null for the first entry). */
  previousStatus: KRIStatus | null
  /** Status AT this period. */
  newStatus: KRIStatus
  /** The entry value that produced the new status. */
  value: number
  /** Snapshot of thresholds at compute time (for the tooltip / audit). */
  amberBoundary: number
  redBoundary: number
}

/** Severity ranking — used to pick the most-severe transition for summaries. */
const SEVERITY: Record<KRIStatus, number> = { green: 0, amber: 1, red: 2 }

export type TransitionKind =
  | 'breach_to_amber'
  | 'breach_to_red'
  | 'recover_to_amber'
  | 'recover_to_green'
  | 'no_change'

export function classifyTransition(
  prev: KRIStatus | null,
  next: KRIStatus,
): TransitionKind {
  if (prev === null) {
    // First observation — only emit if it's already amber/red
    if (next === 'red') return 'breach_to_red'
    if (next === 'amber') return 'breach_to_amber'
    return 'no_change'
  }
  if (prev === next) return 'no_change'
  const worsened = SEVERITY[next] > SEVERITY[prev]
  if (worsened) return next === 'red' ? 'breach_to_red' : 'breach_to_amber'
  return next === 'green' ? 'recover_to_green' : 'recover_to_amber'
}

/**
 * Walk the entries chronologically and emit a BreachEvent for every
 * status change (including recoveries). Entries should already be
 * filtered to a single KRI; ordering is enforced internally.
 */
export function computeBreachHistory(
  entries: KRIEntry[],
  thresholds: KRIThresholds,
  direction: KRIDirection,
): BreachEvent[] {
  if (entries.length === 0) return []
  const sorted = entries
    .slice()
    .sort((a, b) => (a.period < b.period ? -1 : a.period > b.period ? 1 : 0))
  const events: BreachEvent[] = []
  let prev: KRIStatus | null = null
  for (const e of sorted) {
    const next = computeKRIStatus(e.value, thresholds, direction)
    const kind = classifyTransition(prev, next)
    if (kind !== 'no_change') {
      events.push({
        id: `brc-${e.kriId}-${e.period}`,
        kriId: e.kriId,
        period: e.period,
        previousStatus: prev,
        newStatus: next,
        value: e.value,
        amberBoundary: thresholds.amberBoundary,
        redBoundary: thresholds.redBoundary,
      })
    }
    prev = next
  }
  return events
}

export function transitionLabel(kind: TransitionKind): string {
  switch (kind) {
    case 'breach_to_red':
      return 'Breach → Red'
    case 'breach_to_amber':
      return 'Breach → Amber'
    case 'recover_to_amber':
      return 'Recover → Amber'
    case 'recover_to_green':
      return 'Recover → Green'
    case 'no_change':
      return 'No change'
  }
}

export function transitionColor(event: BreachEvent): {
  fg: string
  bg: string
  border: string
  label: string
} {
  const kind = classifyTransition(event.previousStatus, event.newStatus)
  switch (kind) {
    case 'breach_to_red':
      return {
        fg: '#FF3B3B',
        bg: 'rgba(255,59,59,0.18)',
        border: 'rgba(255,59,59,0.55)',
        label: 'Breach → Red',
      }
    case 'breach_to_amber':
      return {
        fg: '#F5C518',
        bg: 'rgba(245,197,24,0.18)',
        border: 'rgba(245,197,24,0.55)',
        label: 'Breach → Amber',
      }
    case 'recover_to_amber':
      return {
        fg: '#F5C518',
        bg: 'rgba(245,197,24,0.10)',
        border: 'rgba(245,197,24,0.40)',
        label: 'Recover → Amber',
      }
    case 'recover_to_green':
      return {
        fg: '#22C55E',
        bg: 'rgba(34,197,94,0.18)',
        border: 'rgba(34,197,94,0.55)',
        label: 'Recover → Green',
      }
    case 'no_change':
    default:
      return {
        fg: 'var(--text-tertiary)',
        bg: 'transparent',
        border: 'var(--border-color)',
        label: 'No change',
      }
  }
}
