/**
 * KRI Definitions
 * ---------------
 * Surfaces the engine drivers tagged as Key Risk Indicators (the seven
 * client-stated KRIs plus international defaults) as standalone KRI
 * entities for the /kri module.
 *
 * Each KRI is linked back to:
 *   - the engine driver that holds its current value,
 *   - the risks that reference it via driverImpacts,
 *   - a provenance entry from DRIVER_BASELINE_PROVENANCE.
 *
 * Owner / frequency / target are illustrative placeholders that will be
 * calibrated to Aldar's actual ERM operating model during pilot.
 */

import type { DriverId } from '@/lib/engine/types'
import { RISKS } from '@/lib/engine/seedData'
import { DRIVER_BASELINE_PROVENANCE } from './driver-provenance'
import type { DataPoint } from '@/lib/provenance/types'

export type KRIFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly'

/**
 * Direction of "good" for the metric.
 *  - higher_is_better → e.g. occupancy: green when high, red when low
 *  - lower_is_better  → e.g. default rate, delay: green when low, red when high
 */
export type KRIDirection = 'higher_is_better' | 'lower_is_better'

/**
 * Default threshold suggestion (illustrative). Pilot will calibrate to
 * actual Aldar appetite & tolerance. Boundaries are inclusive on the
 * AMBER side (green strictly better, red strictly worse).
 *   For higher_is_better: green ≥ amberBoundary, amber [redBoundary, amberBoundary), red < redBoundary
 *   For lower_is_better : green ≤ amberBoundary, amber (amberBoundary, redBoundary], red > redBoundary
 */
export interface KRIThresholds {
  amberBoundary: number
  redBoundary: number
  unit: string // for display next to the threshold inputs
}

/**
 * Risk Appetite anchor for a KRI. The narrative justification for the
 * threshold values — what tolerance level was sanctioned by which body.
 *
 * D8 surfaces this so the user can see WHY the amber/red boundaries are
 * what they are. G1 (Risk Appetite Statements module) will let
 * Group ERM Head edit these centrally with approval workflow.
 */
export interface KRIRiskAppetite {
  /** One-line plain-English appetite statement. */
  statement: string
  /** Approving body (illustrative — pilot wires real governance). */
  approvedBy: string
  /** When this appetite was last reviewed. ISO date. */
  lastReviewed: string
}

export interface KRIDefinition {
  /** Stable id, e.g. "KRI-09". Mirrors the linked driver id. */
  id: string
  /** Display name. */
  name: string
  /** Which engine driver holds the current value. */
  driverId: DriverId
  /** Owner (illustrative — will be set per Aldar operating model in pilot). */
  owner: string
  frequency: KRIFrequency
  /** One-line plain English description for the KRI. */
  description: string
  /** Provenance for the KRI's baseline / source. Uses driver provenance. */
  baselineProvenance: DataPoint
  /** Risk IDs (R-001 etc.) that reference this KRI's driver in their driverImpacts. */
  linkedRiskIds: string[]
  /** Direction of "good" — used by traffic-light logic in D4. */
  direction: KRIDirection
  /** Suggested default thresholds (illustrative; user-editable in D2). */
  defaultThresholds: KRIThresholds
  /** Risk Appetite Statement that anchors the threshold (D8). */
  riskAppetite: KRIRiskAppetite
}

/**
 * Compute the list of risks that reference a given driver id.
 */
function risksReferencingDriver(driverId: DriverId): string[] {
  return RISKS.filter((r) =>
    r.driverImpacts.some((di) => di.driverId === driverId),
  ).map((r) => r.id)
}

/**
 * The 8 KRIs we surface in MVP. IDs mirror the underlying driver id for
 * traceability — if the driver is DRV-09, the KRI is KRI-09.
 */
export const KRI_DEFINITIONS: KRIDefinition[] = [
  {
    id: 'KRI-09',
    name: 'Residential Occupancy',
    driverId: 'DRV-09',
    owner: 'Head of Aldar Investment',
    frequency: 'monthly',
    description:
      'Occupied residential units (under Aldar Investment portfolio) as % of available stock. Trips amber/red as occupancy drops below appetite.',
    baselineProvenance: DRIVER_BASELINE_PROVENANCE['DRV-09'],
    linkedRiskIds: risksReferencingDriver('DRV-09'),
    direction: 'higher_is_better',
    defaultThresholds: { amberBoundary: 90, redBoundary: 80, unit: 'index' },
    riskAppetite: {
      statement:
        'Minimum residential occupancy 90% across the investment portfolio; below 80% triggers a top-of-house review.',
      approvedBy: 'Group ERM Head (illustrative)',
      lastReviewed: '2026-01-15',
    },
  },
  {
    id: 'KRI-10',
    name: 'Commercial Occupancy',
    driverId: 'DRV-10',
    owner: 'Head of Aldar Investment',
    frequency: 'monthly',
    description:
      'Leased commercial GLA as % of total leasable area across investment portfolio. Aldar FY24 retail occupancy was 97% (Yas Mall 99%).',
    baselineProvenance: DRIVER_BASELINE_PROVENANCE['DRV-10'],
    linkedRiskIds: risksReferencingDriver('DRV-10'),
    direction: 'higher_is_better',
    defaultThresholds: { amberBoundary: 90, redBoundary: 80, unit: 'index' },
    riskAppetite: {
      statement:
        'Minimum commercial leased GLA 90% per investment property mandate; sustained drop below 80% requires re-pricing strategy review.',
      approvedBy: 'Group ERM Head (illustrative)',
      lastReviewed: '2026-01-15',
    },
  },
  {
    id: 'KRI-11',
    name: 'Project Delay (Phases)',
    driverId: 'DRV-11',
    owner: 'Chief Development Officer',
    frequency: 'monthly',
    description:
      '% of project phases delayed beyond contractual milestones across active development portfolio.',
    baselineProvenance: DRIVER_BASELINE_PROVENANCE['DRV-11'],
    linkedRiskIds: risksReferencingDriver('DRV-11'),
    direction: 'lower_is_better',
    defaultThresholds: { amberBoundary: 110, redBoundary: 130, unit: 'index' },
    riskAppetite: {
      statement:
        'Project phase delay tolerance ≤10% above plan; sustained ≥30% above plan triggers ARC escalation.',
      approvedBy: 'Audit & Risk Committee (illustrative)',
      lastReviewed: '2025-11-20',
    },
  },
  {
    id: 'KRI-12',
    name: 'Handover Delay (Units)',
    driverId: 'DRV-12',
    owner: 'Chief Development Officer',
    frequency: 'monthly',
    description:
      '% of units handed over beyond contractual handover date — directly tied to DLD penalties and revenue deferral.',
    baselineProvenance: DRIVER_BASELINE_PROVENANCE['DRV-12'],
    linkedRiskIds: risksReferencingDriver('DRV-12'),
    direction: 'lower_is_better',
    defaultThresholds: { amberBoundary: 110, redBoundary: 130, unit: 'index' },
    riskAppetite: {
      statement:
        'Handover delay tolerance ≤10% above contractual milestones to limit DLD penalty exposure and revenue deferral.',
      approvedBy: 'Audit & Risk Committee (illustrative)',
      lastReviewed: '2025-11-20',
    },
  },
  {
    id: 'KRI-13',
    name: 'Domestic Default Rate',
    driverId: 'DRV-13',
    owner: 'Head of Sales',
    frequency: 'monthly',
    description:
      'Default rate uplift on UAE-resident buyer escrow installments vs. baseline.',
    baselineProvenance: DRIVER_BASELINE_PROVENANCE['DRV-13'],
    linkedRiskIds: risksReferencingDriver('DRV-13'),
    direction: 'lower_is_better',
    defaultThresholds: { amberBoundary: 130, redBoundary: 170, unit: 'index' },
    riskAppetite: {
      statement:
        'UAE-resident buyer default uplift ≤30% above baseline acceptable; >70% requires Treasury-led collection action.',
      approvedBy: 'Group Treasury (illustrative)',
      lastReviewed: '2026-02-10',
    },
  },
  {
    id: 'KRI-14',
    name: 'Residential Price Index',
    driverId: 'DRV-14',
    owner: 'Head of Aldar Development',
    frequency: 'monthly',
    description:
      'ADREC / Bayut benchmark residential price index vs. budget. -25% / -35% / -50% map to Mild / Moderate / Severe scenario intensities.',
    baselineProvenance: DRIVER_BASELINE_PROVENANCE['DRV-14'],
    linkedRiskIds: risksReferencingDriver('DRV-14'),
    direction: 'higher_is_better',
    defaultThresholds: { amberBoundary: 90, redBoundary: 75, unit: 'index' },
    riskAppetite: {
      statement:
        'Residential price index tolerance ≥90% of plan; sustained <75% triggers GDV reforecast and project mix review.',
      approvedBy: 'Group ERM Head (illustrative)',
      lastReviewed: '2026-01-15',
    },
  },
  {
    id: 'KRI-15',
    name: 'Commercial Rent Index',
    driverId: 'DRV-15',
    owner: 'Head of Aldar Investment',
    frequency: 'monthly',
    description:
      'Commercial rent re-basing index vs. budget. Tracks rental market softness on renewals.',
    baselineProvenance: DRIVER_BASELINE_PROVENANCE['DRV-15'],
    linkedRiskIds: risksReferencingDriver('DRV-15'),
    direction: 'higher_is_better',
    defaultThresholds: { amberBoundary: 90, redBoundary: 75, unit: 'index' },
    riskAppetite: {
      statement:
        'Commercial rent index tolerance ≥90% of budget on renewals; <75% requires NOI reforecast and tenant-mix review.',
      approvedBy: 'Group ERM Head (illustrative)',
      lastReviewed: '2026-01-15',
    },
  },
  {
    id: 'KRI-16',
    name: 'International Default Rate',
    driverId: 'DRV-16',
    owner: 'Head of Sales',
    frequency: 'monthly',
    description:
      'Default rate uplift on overseas / expat buyer escrow installments. Q1 2026: 88% of UAE sales were to overseas/expat customers — KRI is high-leverage.',
    baselineProvenance: DRIVER_BASELINE_PROVENANCE['DRV-16'],
    linkedRiskIds: risksReferencingDriver('DRV-16'),
    direction: 'lower_is_better',
    defaultThresholds: { amberBoundary: 130, redBoundary: 170, unit: 'index' },
    riskAppetite: {
      statement:
        'Overseas / expat buyer default uplift ≤30% above baseline; >70% triggers ARC review given 88% of FY26 UAE sales are overseas-resident.',
      approvedBy: 'Audit & Risk Committee (illustrative)',
      lastReviewed: '2026-02-10',
    },
  },
]

/** Look up a KRI by id. */
export function getKRI(id: string): KRIDefinition | undefined {
  return KRI_DEFINITIONS.find((k) => k.id === id)
}

/** All KRIs that reference a given driver. */
export function kriByDriver(driverId: DriverId): KRIDefinition | undefined {
  return KRI_DEFINITIONS.find((k) => k.driverId === driverId)
}

/**
 * Reverse-lookup: given a risk id, return every KRI whose underlying
 * driver appears in that risk's driverImpacts. Used by the risk detail
 * drawer to surface the bidirectional KRI <-> Risk linkage.
 */
export function linkedKRIsForRiskId(riskId: string): KRIDefinition[] {
  const risk = RISKS.find((r) => r.id === riskId)
  if (!risk) return []
  const driverIds = new Set(risk.driverImpacts.map((di) => di.driverId))
  return KRI_DEFINITIONS.filter((k) => driverIds.has(k.driverId))
}
