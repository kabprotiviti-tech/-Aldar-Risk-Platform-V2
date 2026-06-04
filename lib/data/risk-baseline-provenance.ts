/**
 * Risk Baseline Provenance — per-risk (R-001..R-010)
 * ---------------------------------------------------
 * Patch B4. Companion to `risk-financial-provenance.ts` (which describes
 * the engine ANCHORS) and `driver-provenance.ts` (which describes the
 * driver baselines).
 *
 * This sidecar tags every engine risk's financial baseline as
 * `verified` / `illustrative` / `placeholder` so any downstream surface
 * displaying R-001..R-010 exposure can render an ⓘ provenance card that
 * traces the number back to its source (or honestly labels it as
 * illustrative pre-pilot).
 *
 * The engine itself is NOT modified — this is a read-only lookup. Pilot
 * calibration replaces each entry's `engineDataPoint` with a sourced
 * `verified` DataPoint as the corresponding live feed is wired.
 *
 * Standing rule (CLAUDE.md): if a number is on screen, the user can
 * trace it.
 */

import {
  illustrative,
  type DataPoint,
} from '@/lib/provenance/types'
import { RISKS, FINANCIAL_ANCHORS } from '@/lib/engine/seedData'
import { getAnchorReference } from './risk-financial-provenance'

export type RiskId =
  | 'R-001'
  | 'R-002'
  | 'R-003'
  | 'R-004'
  | 'R-005'
  | 'R-006'
  | 'R-007'
  | 'R-008'
  | 'R-009'
  | 'R-010'

export interface RiskBaselineProvenance {
  /** Which engine anchor this risk's exposure derives from. */
  anchorKey: keyof typeof FINANCIAL_ANCHORS
  /** Engine-computed baseline AED mn (anchor × sensitivity × weight). */
  engineBaselineAedMn: number
  /** Tier label DataPoint for the engine baseline. */
  engineDataPoint: DataPoint
  /** Plain-English calibration plan for the pilot. */
  calibrationPlan: string
  /** The owning role (illustrative — set in the pilot RBAC). */
  ownerRole: string
}

function compute(r: (typeof RISKS)[number]): number {
  // Mirrors the engine convention: baseline exposure ≈ anchor × coefficient × weight.
  return Math.round(
    r.financialBaseAedMn * r.sensitivityCoefficient * r.financialWeight * 10,
  )
}

/**
 * Per-risk provenance map. All ten risks are tagged `illustrative`
 * because the underlying engine anchors are illustrative MVP values.
 * Pilot will progressively flip each to `verified` as live feeds wire.
 */
export const RISK_BASELINE_PROVENANCE: Record<RiskId, RiskBaselineProvenance> = {
  'R-001': {
    anchorKey: 'activeProjectGdvAedMn',
    engineBaselineAedMn: compute(RISKS.find((r) => r.id === 'R-001')!),
    engineDataPoint: illustrative(
      compute(RISKS.find((r) => r.id === 'R-001')!),
      'AED mn',
      'R-001 Construction Cost Overrun — exposure derives from active-project GDV anchor (illustrative MVP). Pilot will calibrate against Primavera cost-variance reports + ERP project ledger.',
    ),
    calibrationPlan:
      'Wire Primavera P6 + SAP project ledger feeds; replace illustrative GDV anchor with quarterly cost-to-complete actual.',
    ownerRole: 'Chief Development Officer',
  },
  'R-002': {
    anchorKey: 'activeProjectGdvAedMn',
    engineBaselineAedMn: compute(RISKS.find((r) => r.id === 'R-002')!),
    engineDataPoint: illustrative(
      compute(RISKS.find((r) => r.id === 'R-002')!),
      'AED mn',
      'R-002 Project Delivery Delay — exposure derives from active-project GDV anchor (illustrative MVP). Pilot calibrates to handover register + DLD penalty schedule.',
    ),
    calibrationPlan:
      'Wire handover-register feed; replace anchor with actual at-risk DLD penalty + buyer-refund liability.',
    ownerRole: 'Head of Project Delivery',
  },
  'R-003': {
    anchorKey: 'annualOffPlanSalesAedMn',
    engineBaselineAedMn: compute(RISKS.find((r) => r.id === 'R-003')!),
    engineDataPoint: illustrative(
      compute(RISKS.find((r) => r.id === 'R-003')!),
      'AED mn',
      'R-003 Off-Plan Sales Slowdown — exposure derives from annual off-plan sales anchor (illustrative MVP). Pilot calibrates to CRM weekly velocity vs underwriting.',
    ),
    calibrationPlan:
      'Wire CRM + Salesforce off-plan pipeline; calibrate against actual weekly sales velocity vs underwriting plan.',
    ownerRole: 'Chief Commercial Officer',
  },
  'R-004': {
    anchorKey: 'recurringRentalNoiAedMn',
    engineBaselineAedMn: compute(RISKS.find((r) => r.id === 'R-004')!),
    engineDataPoint: illustrative(
      compute(RISKS.find((r) => r.id === 'R-004')!),
      'AED mn',
      'R-004 Lease Revenue Decline — exposure derives from recurring rental NOI anchor (illustrative MVP). Pilot calibrates to leasing system actuals.',
    ),
    calibrationPlan:
      'Wire Yardi leasing + tenant-mix data; replace anchor with rolling 12-month renewal yield.',
    ownerRole: 'Head of Asset Management',
  },
  'R-005': {
    anchorKey: 'hospitalityRevenueAedMn',
    engineBaselineAedMn: compute(RISKS.find((r) => r.id === 'R-005')!),
    engineDataPoint: illustrative(
      compute(RISKS.find((r) => r.id === 'R-005')!),
      'AED mn',
      'R-005 Occupancy Decline — exposure derives from hospitality revenue anchor (placeholder per ABC disclosure gap). Pilot calibrates to internal segment P&L.',
    ),
    calibrationPlan:
      'Wire hotel PMS + residential occupancy systems; replace placeholder anchor with actual segment revenue.',
    ownerRole: 'Head of Hospitality',
  },
  'R-006': {
    anchorKey: 'activeProjectGdvAedMn',
    engineBaselineAedMn: compute(RISKS.find((r) => r.id === 'R-006')!),
    engineDataPoint: illustrative(
      compute(RISKS.find((r) => r.id === 'R-006')!),
      'AED mn',
      'R-006 Contractor Default — exposure derives from active-project GDV anchor (illustrative MVP). Pilot calibrates to contractor performance bond exposure.',
    ),
    calibrationPlan:
      'Wire contractor scorecard + performance-bond register; calibrate to re-tender cost premium.',
    ownerRole: 'Head of Procurement',
  },
  'R-007': {
    anchorKey: 'annualCapexAedMn',
    engineBaselineAedMn: compute(RISKS.find((r) => r.id === 'R-007')!),
    engineDataPoint: illustrative(
      compute(RISKS.find((r) => r.id === 'R-007')!),
      'AED mn',
      'R-007 Supply Chain Disruption — exposure derives from annual capex anchor (illustrative MVP). Pilot calibrates to expedited-freight + critical-path slack budget.',
    ),
    calibrationPlan:
      'Wire procurement system + commodity tracker; replace anchor with at-risk capex schedule.',
    ownerRole: 'Chief Procurement Officer',
  },
  'R-008': {
    anchorKey: 'portfolioRevenueAedMn',
    engineBaselineAedMn: compute(RISKS.find((r) => r.id === 'R-008')!),
    engineDataPoint: illustrative(
      compute(RISKS.find((r) => r.id === 'R-008')!),
      'AED mn',
      'R-008 Cash Flow / Liquidity Stress — exposure derives from portfolio revenue anchor (illustrative MVP, understates actual ABC group revenue). Pilot calibrates to 13-week cash forecast + RCF headroom.',
    ),
    calibrationPlan:
      'Wire Group Treasury feed + 13-week rolling cash forecast; calibrate to actual liquidity headroom against covenants.',
    ownerRole: 'Group CFO',
  },
  'R-009': {
    anchorKey: 'portfolioRevenueAedMn',
    engineBaselineAedMn: compute(RISKS.find((r) => r.id === 'R-009')!),
    engineDataPoint: illustrative(
      compute(RISKS.find((r) => r.id === 'R-009')!),
      'AED mn',
      'R-009 Regulatory Change RERA/ESG — exposure derives from portfolio revenue anchor (illustrative MVP). Pilot calibrates to legal & regulatory horizon scan + restatement-cost estimates.',
    ),
    calibrationPlan:
      'Wire legal horizon-scan service + GRC obligations register; calibrate to recent peer restatement-cost benchmarks.',
    ownerRole: 'General Counsel',
  },
  'R-010': {
    anchorKey: 'activeProjectGdvAedMn',
    engineBaselineAedMn: compute(RISKS.find((r) => r.id === 'R-010')!),
    engineDataPoint: illustrative(
      compute(RISKS.find((r) => r.id === 'R-010')!),
      'AED mn',
      'R-010 HSE / Safety Incident — exposure derives from active-project GDV anchor (illustrative MVP). Pilot calibrates to insurance loss-frequency × severity model.',
    ),
    calibrationPlan:
      'Wire HSE incident system + insurance loss-history; replace anchor with actuarial expected-loss estimate.',
    ownerRole: 'Head of HSE',
  },
}

/**
 * Lookup helper. Returns the provenance + a link to the underlying
 * AnchorReference (or null if the anchor isn't documented yet).
 */
export function getRiskBaselineProvenance(riskId: RiskId): RiskBaselineProvenance & {
  anchorReference: ReturnType<typeof getAnchorReference>
} {
  const base = RISK_BASELINE_PROVENANCE[riskId]
  return { ...base, anchorReference: getAnchorReference(base.anchorKey) }
}

/** All risk IDs with provenance — useful for the future Risk Register provenance browser. */
export const ALL_RISK_IDS: RiskId[] = Object.keys(
  RISK_BASELINE_PROVENANCE,
) as RiskId[]
