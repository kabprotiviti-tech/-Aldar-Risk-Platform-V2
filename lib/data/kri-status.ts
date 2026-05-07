/**
 * KRI Traffic-Light Status — pure computation.
 * --------------------------------------------
 * Given a value, the active thresholds, and the KRI's direction,
 * return one of: 'green' | 'amber' | 'red'.
 *
 * Boundaries (see KRIDefinition.direction):
 *   higher_is_better → green ≥ amberBoundary, amber [redBoundary, amberBoundary), red < redBoundary
 *   lower_is_better  → green ≤ amberBoundary, amber (amberBoundary, redBoundary], red > redBoundary
 *
 * No fabrication — given the same inputs this function always returns
 * the same output. The colour is the visual rendering of the user's
 * own threshold + their own entered value.
 */

import type {
  KRIDirection,
  KRIThresholds,
} from '@/lib/data/kri-definitions'

export type KRIStatus = 'green' | 'amber' | 'red'

export function computeKRIStatus(
  value: number,
  thresholds: KRIThresholds,
  direction: KRIDirection,
): KRIStatus {
  const { amberBoundary, redBoundary } = thresholds
  if (direction === 'higher_is_better') {
    if (value >= amberBoundary) return 'green'
    if (value >= redBoundary) return 'amber'
    return 'red'
  }
  // lower_is_better
  if (value <= amberBoundary) return 'green'
  if (value <= redBoundary) return 'amber'
  return 'red'
}

export const STATUS_META: Record<
  KRIStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  green: {
    label: 'Green',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.18)',
    border: 'rgba(34,197,94,0.55)',
  },
  amber: {
    label: 'Amber',
    color: '#F5C518',
    bg: 'rgba(245,197,24,0.18)',
    border: 'rgba(245,197,24,0.55)',
  },
  red: {
    label: 'Red',
    color: '#FF3B3B',
    bg: 'rgba(255,59,59,0.18)',
    border: 'rgba(255,59,59,0.55)',
  },
}
