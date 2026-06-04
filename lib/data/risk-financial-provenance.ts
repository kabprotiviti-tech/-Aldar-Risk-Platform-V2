/**
 * Risk Financial-Baseline Provenance
 * ----------------------------------
 * Sidecar map describing the FINANCIAL_ANCHOR each risk uses as its
 * exposure base, plus a side-by-side comparison with the latest sourced
 * ABC figure. Surfaces honestly that the simulation's current anchors
 * are illustrative MVP values that will be re-calibrated to actual
 * client data during pilot.
 *
 * NOTE: This is a READ-ONLY sidecar. It does NOT modify FINANCIAL_ANCHORS
 * in seedData.ts (which would change every previously-tested scenario
 * output). The engine continues to run on the existing illustrative
 * anchors; the UI just makes their provenance visible.
 *
 * Standing rule: if a number is on screen, the user can trace it.
 */

import {
  illustrative,
  placeholder,
  type DataPoint,
} from '@/lib/provenance/types'
import { FINANCIAL_ANCHORS } from '@/lib/engine/seedData'
import {
  ABC_FY25_GROUP_REVENUE,
  ABC_FY25_GROUP_SALES,
  ABC_Q1_26_BACKLOG,
  ABC_FY25_INV_REVENUE,
  ABC_FY25_INV_ADJ_EBITDA,
  ABC_HOSPITALITY_REVENUE_PLACEHOLDER,
  ABC_FY24_EDUCATION_EBITDA,
} from './aldar-financials'

/** Description of each engine anchor and the closest published ABC reference. */
export interface AnchorReference {
  /** The engine constant being described. */
  anchorKey: keyof typeof FINANCIAL_ANCHORS
  /** Current illustrative value used by the engine. */
  engineDataPoint: DataPoint
  /** Closest real public ABC number for honest side-by-side comparison. */
  aldarReference: DataPoint
  /** Why these don't match — and how the pilot will reconcile them. */
  calibrationNote: string
}

export const ANCHOR_REFERENCES: AnchorReference[] = [
  {
    anchorKey: 'portfolioRevenueAedMn',
    engineDataPoint: illustrative(
      FINANCIAL_ANCHORS.portfolioRevenueAedMn,
      'AED mn',
      'MVP simulation anchor — understates ABC Group total revenue. Pilot will re-anchor to consolidated FY revenue per audited financials.',
    ),
    aldarReference: ABC_FY25_GROUP_REVENUE,
    calibrationNote:
      'Engine anchor is conservative for MVP scenario testing. Pilot will swap to live FY/quarterly revenue.',
  },
  {
    anchorKey: 'activeProjectGdvAedMn',
    engineDataPoint: illustrative(
      FINANCIAL_ANCHORS.activeProjectGdvAedMn,
      'AED mn',
      'MVP active-project GDV anchor. Pilot will calibrate to development backlog from project ledger.',
    ),
    aldarReference: ABC_Q1_26_BACKLOG,
    calibrationNote:
      'ABC Q1 2026 development backlog reached AED 72.1bn (record). Engine value (AED 28bn) is intentionally narrower for MVP scenario sensitivity testing.',
  },
  {
    anchorKey: 'annualOffPlanSalesAedMn',
    engineDataPoint: illustrative(
      FINANCIAL_ANCHORS.annualOffPlanSalesAedMn,
      'AED mn',
      'MVP off-plan sales anchor. Pilot will tie to CRM gross sales by project.',
    ),
    aldarReference: ABC_FY25_GROUP_SALES,
    calibrationNote:
      'FY25 group sales AED 40.6bn (highest ever, +21% YoY). Engine MVP anchor is intentionally narrower.',
  },
  {
    anchorKey: 'recurringRentalNoiAedMn',
    engineDataPoint: illustrative(
      FINANCIAL_ANCHORS.recurringRentalNoiAedMn,
      'AED mn',
      'MVP recurring rental NOI anchor. Pilot will calibrate to leasing system actuals + investment property NOI report.',
    ),
    aldarReference: ABC_FY25_INV_ADJ_EBITDA,
    calibrationNote:
      'ABC Investment FY25 adjusted EBITDA AED 3.2bn covers recurring rental + retail + commercial sub-segments. Engine anchor focuses on rental NOI subset.',
  },
  {
    anchorKey: 'hospitalityRevenueAedMn',
    engineDataPoint: placeholder(
      FINANCIAL_ANCHORS.hospitalityRevenueAedMn,
      'AED mn',
      'MVP hospitality revenue anchor. ABC does not separately disclose hospitality segment revenue in current public press releases — pilot will calibrate to internal segment P&L.',
    ),
    aldarReference: ABC_HOSPITALITY_REVENUE_PLACEHOLDER,
    calibrationNote:
      'Hospitality not separately disclosed in fetched FY25 results. Engine uses an illustrative MVP anchor; pilot will replace with internal segment data.',
  },
  {
    anchorKey: 'annualCapexAedMn',
    engineDataPoint: illustrative(
      FINANCIAL_ANCHORS.annualCapexAedMn,
      'AED mn',
      'MVP capex anchor. ABC Investment AUM grew to AED 42bn FY24 (heavy investment property build-out). Pilot will calibrate to capex plan and approved budget.',
    ),
    aldarReference: ABC_FY25_INV_REVENUE,
    calibrationNote:
      'Capex magnitude is implied by ABC Investment scale (AUM AED 42bn FY24, FY25 revenue AED 8.1bn). MVP anchor pending calibration to actual capex schedule.',
  },
] as const

// Education: not currently used as an engine anchor but worth referencing.
export const EDUCATION_REFERENCE: DataPoint = ABC_FY24_EDUCATION_EBITDA

/**
 * Given an engine anchor key, return the AnchorReference describing it
 * (or null if not yet documented).
 */
export function getAnchorReference(
  anchorKey: keyof typeof FINANCIAL_ANCHORS,
): AnchorReference | null {
  return ANCHOR_REFERENCES.find((a) => a.anchorKey === anchorKey) ?? null
}
