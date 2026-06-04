/**
 * ABC-Specific Strategic Metrics — Block 2 P9
 * ----------------------------------------------
 * The 4 must-have metrics flagged by BCG-partner reviews as
 * non-negotiable for an ADX-listed UAE real-estate group's CRO/CEO
 * cockpit — metrics you wouldn't see on a bank/telco platform.
 *
 *   1. Sales backlog / unbooked revenue (AED bn)
 *   2. Land bank inventory + GFA pipeline (split by emirate)
 *   3. Recurring revenue mix % (Investment + Education + Hospitality
 *      vs Development — the de-risking equity story)
 *   4. Escrow compliance status (RERA / DLD / ADREC)
 *
 * All figures derive from ABC's published FY25 + Q1 26 results where
 * disclosed; the remainder are illustrative pre-pilot and tagged.
 */

import {
  verified,
  illustrative,
  placeholder,
  type DataPoint,
} from '@/lib/provenance/types'
import {
  SRC_ABC_FY25_RESULTS,
  SRC_ABC_Q1_2026,
  SRC_ADREC_MARKET,
} from '@/lib/provenance/sources'
import {
  ABC_FY25_DEV_REVENUE,
  ABC_FY25_INV_REVENUE,
  ABC_FY25_SODIC_REVENUE,
  ABC_FY25_LONDON_SQUARE_REVENUE,
  ABC_FY24_EDUCATION_EBITDA,
} from './aldar-financials'

// ============================================================
// 1. Sales backlog / unbooked revenue
// ============================================================

export const SALES_BACKLOG_Q1_26: DataPoint = verified(
  72_100,
  'AED mn',
  SRC_ABC_Q1_2026,
  {
    confidenceNote:
      'Group development revenue backlog at end of March 2026 — record level. Analysts watch this as the strongest leading indicator for the next 18 months of revenue.',
  },
)

export const SALES_BACKLOG_FY25_YEAREND: DataPoint = verified(
  71_700,
  'AED mn',
  SRC_ABC_FY25_RESULTS,
  {
    confidenceNote:
      'Group development revenue backlog at end of Dec 2025; AED 61.0bn UAE-attributable; AED 10.7bn international.',
  },
)

// ============================================================
// 2. Land bank inventory + GFA pipeline
// ============================================================
// ABC's land bank is reported in aggregate; specific GFA splits per
// emirate are illustrative pre-pilot.

export const LAND_BANK_GFA_TOTAL_MSQM: DataPoint = illustrative(
  85,
  'mn sqm GFA',
  'Aggregated land bank GFA across UAE + international subsidiaries (illustrative MVP). Pilot wires actual land-bank registry.',
)

export const LAND_BANK_COMMITTED_PCT: DataPoint = illustrative(
  68,
  '% committed',
  '% of land bank already committed to active projects vs uncommitted future pipeline. Pilot calibrates to project ledger.',
)

export const LAND_BANK_UAE_PCT: DataPoint = illustrative(
  82,
  '% UAE share',
  'Share of land bank held in UAE entities (Abu Dhabi + Dubai) vs international subsidiaries (SODIC Egypt, London Square UK).',
)

// ============================================================
// 3. Recurring revenue mix %
// ============================================================
// Derived from FY25 segment revenues — Investment + International recurring
// share of total revenue vs Development.

const FY25_TOTAL_REVENUE_AED_MN =
  ABC_FY25_DEV_REVENUE.value +
  ABC_FY25_INV_REVENUE.value +
  ABC_FY25_SODIC_REVENUE.value +
  ABC_FY25_LONDON_SQUARE_REVENUE.value

const FY25_RECURRING_AED_MN = ABC_FY25_INV_REVENUE.value // Investment + Education + Hospitality treated as recurring

export const RECURRING_MIX_PCT: DataPoint = verified(
  Math.round((FY25_RECURRING_AED_MN / FY25_TOTAL_REVENUE_AED_MN) * 100),
  '%',
  SRC_ABC_FY25_RESULTS,
  {
    confidenceNote:
      'Recurring (Investment FY25 AED 8.1bn) ÷ total disclosed segment revenue (AED 36.1bn). ABC Hospitality + ABC Education segment revenues are not separately broken out in FY25 press release — recurring share is therefore conservative.',
  },
)

export const RECURRING_MIX_TARGET_PCT: DataPoint = illustrative(
  35,
  '%',
  'Strategic target for recurring-revenue share in 5-year plan (illustrative). Pilot wires ABC published guidance.',
)

// ============================================================
// 4. Escrow compliance status
// ============================================================
// Snapshot status for the 3 regulators that supervise off-plan escrow:
// ADREC (Abu Dhabi), DLD (Dubai), RERA (Dubai).

export type EscrowStatus = 'compliant' | 'remediation' | 'breach'

export interface EscrowRegulatorState {
  regulator: string
  status: EscrowStatus
  /** Last reconciliation date. */
  lastReconciled: string
  /** Free-text current state. */
  note: string
  /** Source citation. */
  source: DataPoint
}

export const ESCROW_COMPLIANCE: EscrowRegulatorState[] = [
  {
    regulator: 'ADREC (Abu Dhabi)',
    status: 'compliant',
    lastReconciled: '2026-04-30',
    note: 'All Abu Dhabi off-plan project escrow accounts reconciled; no open observations.',
    source: illustrative(
      0,
      'observations',
      'ADREC reconciliation status — illustrative MVP. Pilot wires Mollak / ADREC escrow agent feed.',
    ),
  },
  {
    regulator: 'DLD (Dubai)',
    status: 'compliant',
    lastReconciled: '2026-04-28',
    note: 'Mollak / DLD escrow compliant on Dubai-attributable projects (JV exposure).',
    source: illustrative(
      0,
      'observations',
      'DLD Mollak reconciliation status — illustrative. Pilot wires DLD feed.',
    ),
  },
  {
    regulator: 'RERA (Dubai)',
    status: 'compliant',
    lastReconciled: '2026-04-15',
    note: 'RERA project registration current; FY25 escrow audit cleared without management points.',
    source: illustrative(
      0,
      'observations',
      'RERA project register status — illustrative.',
    ),
  },
]

export function escrowSummary() {
  return ESCROW_COMPLIANCE.reduce(
    (acc, e) => {
      acc[e.status]++
      acc.total++
      return acc
    },
    { compliant: 0, remediation: 0, breach: 0, total: 0 },
  )
}

// ============================================================
// Bonus: ADREC residential price index (KRI-14 anchor)
// ============================================================

export const ADREC_PRICE_INDEX_LATEST: DataPoint = placeholder(
  100,
  'index',
  'ADREC residential price index for Abu Dhabi (Apr 2026) — placeholder until live ADREC API integration in pilot.',
)
