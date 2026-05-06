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
