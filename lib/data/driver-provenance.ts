/**
 * Driver Provenance Lookup
 * ------------------------
 * Sidecar map (does NOT modify the existing Driver type / engine).
 * Lets the UI render a provenance "ⓘ" next to any driver baseline so the
 * user knows what each baseValue actually represents and how it would be
 * calibrated post-integration.
 *
 * Standing rule: most simulation drivers use a NORMALIZED baseline (=100
 * "budget / plan") rather than a measured value. This is a modeling
 * choice — we tag it explicitly as `illustrative` so nobody mistakes it
 * for a real-world measurement.
 *
 * Drivers tagged `verified` are deterministic (e.g. DRV-05 Project Delay
 * baseline of 0 days = on-schedule, by definition).
 */

import {
  illustrative,
  verified,
  placeholder,
  type DataPoint,
} from '@/lib/provenance/types'
import {
  SRC_ALDAR_FY25_RESULTS,
  SRC_ALDAR_Q1_2026,
} from '@/lib/provenance/sources'
import type { DriverId } from '@/lib/engine/types'

// Each entry describes the BASEVALUE of the driver and the calibration plan.
export const DRIVER_BASELINE_PROVENANCE: Record<DriverId, DataPoint> = {
  // ── Construction & projects ───────────────────────────────────────────
  'DRV-01': illustrative(
    100,
    '% of budget',
    'Normalized index. 100 = sanctioned budget. Pilot will calibrate to actual project cost variance from Primavera + ERP project ledger.',
  ),
  'DRV-05': verified(0, 'days', SRC_ALDAR_FY25_RESULTS, {
    confidenceNote:
      'Baseline 0 days = on-schedule by definition. Live values will sync from Primavera schedule variance reports.',
  }),
  'DRV-06': illustrative(
    100,
    '% of plan',
    'Contractor performance index. 100 = plan. Calibrate against contractor scorecard data in pilot.',
  ),
  'DRV-08': illustrative(
    100,
    '% stability',
    'Supply chain stability index. 100 = no disruption. External signal feed (e.g. Suez/global shipping) to be wired in pilot.',
  ),
  'DRV-11': illustrative(
    100,
    'idx',
    'Project delay KRI baseline. Pilot will calibrate to historical project portfolio handover variance.',
  ),
  'DRV-12': illustrative(
    100,
    'idx',
    '% of units handed over late KRI. Calibrate to handover register in pilot.',
  ),
  // ── Sales / leasing ───────────────────────────────────────────────────
  'DRV-02': illustrative(
    100,
    '% of plan',
    'Residential sales volume index. 100 = FY25 sales plan. Pilot will tie to CRM units-sold-vs-budget per project.',
  ),
  'DRV-03': illustrative(
    100,
    '% of plan',
    'Lease rate index. 100 = budget rent. Pilot calibrate to leasing system actuals.',
  ),
  'DRV-04': illustrative(
    100,
    '% of plan',
    'Occupancy index. 100 = budget occupancy. Aldar Investment retail occupancy was 97% at FY24 (Yas Mall 99%).',
  ),
  // ── KRI-based occupancy (residential / commercial) ────────────────────
  'DRV-09': placeholder(
    100,
    '% occupancy',
    'Residential occupancy KRI baseline. Aldar Investment portfolio occupancy disclosed FY24/FY25 — pilot will set the appetite-aligned threshold from internal target.',
  ),
  'DRV-10': placeholder(
    100,
    '% occupancy',
    'Commercial occupancy KRI baseline. FY24 Aldar Investment commercial sub-segment EBITDA AED 700M with strong demand for Grade A; pilot will set threshold from operating budget.',
  ),
  // ── Credit / market index drivers ─────────────────────────────────────
  'DRV-13': illustrative(
    100,
    'idx',
    'Domestic default rate uplift index. 100 = baseline UAE buyer default rate. Pilot will tie to escrow account aging from CRM.',
  ),
  'DRV-14': illustrative(
    100,
    'idx',
    'Residential price index. 100 = current ADREC/Bayut benchmark. Pilot wires live ADREC market index.',
  ),
  'DRV-15': illustrative(
    100,
    'idx',
    'Commercial rent index. 100 = current rent benchmark. Pilot wires live commercial market index.',
  ),
  'DRV-16': illustrative(
    100,
    'idx',
    'International (overseas / expat) default rate uplift index. Q1 2026: 88% of UAE sales were to overseas/expat customers (Aldar Q1 release) — pilot will calibrate this driver from segmented escrow data.',
  ),
  // ── Liquidity ─────────────────────────────────────────────────────────
  'DRV-07': verified(100, '% of plan', SRC_ALDAR_Q1_2026, {
    confidenceNote:
      'Liquidity index baseline. Aldar Q1 2026 backlog AED 72.1B provides 3-year revenue visibility — implied baseline cash position is strong. Pilot will tie to ERP Treasury cash + facilities.',
  }),
}

/**
 * Look up provenance for any driver by ID. Returns null if missing
 * (which should never happen for valid DRV-* IDs).
 */
export function getDriverProvenance(id: DriverId): DataPoint | null {
  return DRIVER_BASELINE_PROVENANCE[id] ?? null
}
