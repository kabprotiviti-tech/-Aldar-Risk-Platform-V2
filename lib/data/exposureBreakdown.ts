/**
 * Exposure breakdown — the canonical split of the AED 2.35Bn gross figure.
 * --------------------------------------------------------------------------
 * The dashboard headline (BASELINE_RISK_POSTURE.totalFinancialExposure) is
 * GROSS financial exposure: AED 2.35Bn. This module is the single source of
 * truth for HOW that 2.35Bn is composed — by portfolio segment — and how it
 * reduces to the AED 900M net-unhedged figure shown against appetite.
 *
 * Note the distinction (this is what caused the "two different numbers"
 * confusion): the per-risk figures on the Portfolio Summary are RESIDUAL
 * exposure (after controls) — a finer, much smaller measure — NOT this gross
 * figure. Both are correct; they answer different questions.
 *
 * The segment grosses sum to exactly 2,350 AED M = AED 2.35Bn.
 */

import { BASELINE_RISK_POSTURE } from './baselineRiskPosture'

export interface ExposureSegment {
  key: string
  label: string
  grossAedM: number
}

export const EXPOSURE_SEGMENTS: ExposureSegment[] = [
  { key: 'real-estate', label: 'Real Estate (residential + commercial)', grossAedM: 1150 },
  { key: 'hospitality', label: 'Hospitality (hotels + leisure)', grossAedM: 480 },
  { key: 'retail', label: 'Retail (malls)', grossAedM: 380 },
  { key: 'education', label: 'Education', grossAedM: 200 },
  { key: 'facilities', label: 'Facilities Management', grossAedM: 140 },
]

/** Sum of segment grosses — equals BASELINE totalFinancialExposure (2,350 AED M). */
export const EXPOSURE_GROSS_AED_M = EXPOSURE_SEGMENTS.reduce((s, x) => s + x.grossAedM, 0)

export const EXPOSURE_HEDGED_AED_M = Math.round(BASELINE_RISK_POSTURE.hedgedExposure / 1e6) // 1450
export const EXPOSURE_NET_AED_M = Math.round(BASELINE_RISK_POSTURE.netUnhedgedExposure / 1e6) // 900
export const EXPOSURE_APPETITE_AED_M = Math.round(BASELINE_RISK_POSTURE.netUnhedgedAppetiteCeiling / 1e6) // 600

/** Format an AED-millions value as a short string (Bn over 1000). */
export function aedM(m: number): string {
  if (Math.abs(m) >= 1000) return `AED ${(m / 1000).toFixed(2)}Bn`
  return `AED ${Math.round(m)}M`
}
