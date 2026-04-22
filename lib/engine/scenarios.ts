/**
 * Scenarios — visible, clickable pre-built driver configurations.
 * --------------------------------------------------------------
 * Pure data + a tiny helper. The existing simulation engine is untouched —
 * scenarios simply write values into drivers via setDriverValue().
 *
 *   Each scenario has three intensities (Mild / Moderate / Severe).
 *   An "effect" is a % delta from the driver's baseValue. For baseValue=100
 *   drivers this maps directly to the slider value (e.g. -25 → 75).
 *   For DRV-05 (days, baseValue=0) we carry absolute-value effects.
 */

import type { DriverId, Driver } from './types'

export type ScenarioIntensity = 'mild' | 'moderate' | 'severe'

export interface ScenarioEffect {
  // key: driver id. value: for baseValue>0 drivers, % delta from base.
  //                      for DRV-05 (days), absolute days to apply.
  [driverId: string]: number
}

export interface ScenarioDef {
  id: string
  name: string
  icon: string
  summary: string
  narrative: string
  driversTouched: DriverId[]
  effects: Record<ScenarioIntensity, ScenarioEffect>
}

export const INTENSITY_LABEL: Record<ScenarioIntensity, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
}

export const INTENSITY_COLOR: Record<ScenarioIntensity, string> = {
  mild: 'var(--risk-medium)',
  moderate: 'var(--risk-high)',
  severe: 'var(--risk-critical)',
}

export const SCENARIOS: ScenarioDef[] = [
  {
    id: 'RESIDENTIAL_COLLAPSE',
    name: 'Residential Price Collapse',
    icon: '🏠',
    summary: 'Residential prices fall sharply; off-plan sales seize up; defaults climb.',
    narrative:
      'A demand shock in Abu Dhabi residential — price index falls, occupancy softens, sales velocity collapses, buyer defaults spike.',
    driversTouched: ['DRV-14', 'DRV-09', 'DRV-02', 'DRV-13', 'DRV-16', 'DRV-07'],
    effects: {
      mild: {
        'DRV-14': -25, // residential price index
        'DRV-09': -10, // residential occupancy
        'DRV-02': -20, // sales volume
        'DRV-13': 40,  // domestic defaults
        'DRV-16': 70,  // international defaults move faster
        'DRV-07': -10, // liquidity squeeze
      },
      moderate: {
        'DRV-14': -35,
        'DRV-09': -18,
        'DRV-02': -32,
        'DRV-13': 90,
        'DRV-16': 140,
        'DRV-07': -20,
      },
      severe: {
        'DRV-14': -50,
        'DRV-09': -28,
        'DRV-02': -45,
        'DRV-13': 140,
        'DRV-16': 200,
        'DRV-07': -35,
      },
    },
  },
  {
    id: 'COMMERCIAL_RENTAL_DECLINE',
    name: 'Commercial Rental Decline',
    icon: '🏢',
    summary: 'Rents re-base lower, commercial occupancy softens, retail/office NOI compresses.',
    narrative:
      'Tenant consolidation, hybrid-work spillover, and new Grade-A supply push renewal rents below budget across office + retail.',
    driversTouched: ['DRV-15', 'DRV-10', 'DRV-03', 'DRV-04'],
    effects: {
      // Client calibration: commercial price/rental decline 25% / 35% / 50%.
      mild: {
        'DRV-15': -25,
        'DRV-10': -15,
        'DRV-03': -20,
        'DRV-04': -12,
      },
      moderate: {
        'DRV-15': -35,
        'DRV-10': -22,
        'DRV-03': -28,
        'DRV-04': -18,
      },
      severe: {
        'DRV-15': -50, // capped by DRV-15 slider bound of -50
        'DRV-10': -30,
        'DRV-03': -38,
        'DRV-04': -25,
      },
    },
  },
  {
    id: 'GLOBAL_FINANCIAL_STRESS',
    name: 'Global Financial Stress',
    icon: '🌐',
    summary: 'Rate shock + credit tightening: liquidity, sales, defaults and commodities all hit.',
    narrative:
      'A systemic risk-off move — capital flows reverse, refinancing costs jump, construction inputs inflate, sales freeze, defaults rise.',
    driversTouched: ['DRV-07', 'DRV-02', 'DRV-13', 'DRV-16', 'DRV-14', 'DRV-15', 'DRV-01', 'DRV-11'],
    effects: {
      mild: {
        'DRV-07': -15,
        'DRV-02': -15,
        'DRV-13': 35,  // domestic defaults
        'DRV-16': 60,  // international buyers pull out first
        'DRV-14': -10,
        'DRV-15': -8,
        'DRV-01': 10,
        'DRV-11': 20,
      },
      moderate: {
        'DRV-07': -25,
        'DRV-02': -25,
        'DRV-13': 70,
        'DRV-16': 120,
        'DRV-14': -20,
        'DRV-15': -15,
        'DRV-01': 18,
        'DRV-11': 40,
      },
      severe: {
        'DRV-07': -40,
        'DRV-02': -40,
        'DRV-13': 110,
        'DRV-16': 180,
        'DRV-14': -35,
        'DRV-15': -25,
        'DRV-01': 28,
        'DRV-11': 70,
      },
    },
  },
]

/**
 * Convert a scenario's %-delta effect map into absolute driver values,
 * based on each driver's baseValue.
 *
 * - For standard drivers (baseValue > 0): target = base × (1 + deltaPct/100)
 * - For DRV-05 (baseValue = 0, days): target = effect value directly (absolute days)
 */
export function scenarioTargetValues(
  scenario: ScenarioDef,
  intensity: ScenarioIntensity,
  drivers: Driver[],
): Array<{ driverId: DriverId; targetValue: number; deltaPct: number }> {
  const effect = scenario.effects[intensity]
  const targets: Array<{ driverId: DriverId; targetValue: number; deltaPct: number }> = []

  for (const [driverId, delta] of Object.entries(effect)) {
    const driver = drivers.find((d) => d.id === driverId)
    if (!driver) continue

    // Compute target adjustedValue
    // - DRV-05 (baseValue=0, days): delta is absolute days
    // - other drivers: delta is % change from base  → target = base × (1 + delta/100)
    let target =
      driver.baseValue === 0 ? delta : driver.baseValue * (1 + delta / 100)

    // Clamp to slider bounds
    //   - DRV-05: slider value IS the adjustedValue (absolute)
    //   - other drivers: slider value is (adjusted - base), so adjusted is in
    //     [base + sliderMin, base + sliderMax]
    const lo = driver.baseValue === 0 ? driver.sliderMin : driver.baseValue + driver.sliderMin
    const hi = driver.baseValue === 0 ? driver.sliderMax : driver.baseValue + driver.sliderMax
    target = Math.max(lo, Math.min(hi, target))

    targets.push({
      driverId: driverId as DriverId,
      targetValue: target,
      deltaPct: delta,
    })
  }
  return targets
}
