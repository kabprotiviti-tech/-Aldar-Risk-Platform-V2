// Pure simulation engine — no side effects, no state.
// Inputs: driver adjustments. Outputs: updated risks + portfolio.

import type { Driver, DriverId, RiskDef, RiskState, PortfolioState, Rating } from './types'
import { RISKS, SCALE_CONSTANT, SENSITIVITY_FACTOR } from './seedData'

// -----------------------------------------------------------------------------
// Driver delta normalisation
// -----------------------------------------------------------------------------
export function computeDriverDeltaPct(driver: Driver): number {
  // Days driver (DRV-05): 90 days = 100% shift
  if (driver.id === 'DRV-05') {
    return driver.adjustedValue / 90
  }
  if (driver.baseValue === 0) return 0
  return (driver.adjustedValue - driver.baseValue) / driver.baseValue
}

export function applyDriverChange(driver: Driver, newValue: number): Driver {
  const next = { ...driver, adjustedValue: newValue }
  next.deltaPct = computeDriverDeltaPct(next)
  return next
}

// -----------------------------------------------------------------------------
// Rating bands
// -----------------------------------------------------------------------------
export function bandForScore(score: number): Rating {
  if (score <= 4) return 'Low'
  if (score <= 9) return 'Medium'
  if (score <= 16) return 'High'
  return 'Critical'
}

export function portfolioBand(exposureIndex: number): PortfolioState['ratingTo'] {
  if (exposureIndex <= 2.0) return 'Stable'
  if (exposureIndex <= 4.0) return 'Elevated'
  if (exposureIndex <= 7.0) return 'Stressed'
  return 'Distressed'
}

// -----------------------------------------------------------------------------
// Control composite effectiveness: 1 - Π(1 - eᵢ)
// -----------------------------------------------------------------------------
function compositeEffectiveness(risk: RiskDef): number {
  let prod = 1
  for (const c of risk.controls) prod *= 1 - c.effectiveness
  return 1 - prod
}

// -----------------------------------------------------------------------------
// Propagate drivers → one risk
// -----------------------------------------------------------------------------
export function recomputeRisk(risk: RiskDef, drivers: Driver[]): RiskState {
  const baseInherent = risk.baseLikelihood * risk.baseImpact

  const driversById = new Map<DriverId, Driver>()
  drivers.forEach((d) => driversById.set(d.id, d))

  const contributingDrivers: RiskState['contributingDrivers'] = []
  let contributionSum = 0

  for (const impact of risk.driverImpacts) {
    const d = driversById.get(impact.driverId)
    if (!d) continue
    const sens = SENSITIVITY_FACTOR[impact.sensitivity]
    const points = d.deltaPct * impact.weight * sens * SCALE_CONSTANT
    contributionSum += points
    if (Math.abs(points) > 0.001) {
      contributingDrivers.push({
        driverId: d.id,
        driverName: d.name,
        deltaPct: d.deltaPct,
        weight: impact.weight,
        sensitivity: impact.sensitivity,
        contributionPoints: points,
      })
    }
  }

  const newInherent = Math.max(1, Math.min(25, baseInherent + contributionSum))
  const eff = compositeEffectiveness(risk)
  const baseResidual = baseInherent * (1 - eff)
  const newResidual = newInherent * (1 - eff)

  const baseExposure =
    risk.financialBaseAedMn * risk.sensitivityCoefficient * (baseResidual / 25)
  const newExposure =
    risk.financialBaseAedMn * risk.sensitivityCoefficient * (newResidual / 25)

  return {
    id: risk.id,
    name: risk.name,
    category: risk.category,
    baseInherent,
    newInherent,
    baseResidual,
    newResidual,
    ratingFrom: bandForScore(baseInherent),
    ratingTo: bandForScore(newInherent),
    exposureAedMn: newExposure,
    baseExposureAedMn: baseExposure,
    deltaExposureAedMn: newExposure - baseExposure,
    compositeEffectiveness: eff,
    contributingDrivers: contributingDrivers.sort(
      (a, b) => Math.abs(b.contributionPoints) - Math.abs(a.contributionPoints),
    ),
    owner: risk.owner,
  }
}

// -----------------------------------------------------------------------------
// Run full simulation
// -----------------------------------------------------------------------------
export function runSimulation(drivers: Driver[]): {
  risks: RiskState[]
  portfolio: PortfolioState
} {
  const risks = RISKS.map((r) => recomputeRisk(r, drivers))

  // Portfolio exposure index = Σ (residual × financialWeight)
  const baselineIndex = RISKS.reduce(
    (sum, r, i) => sum + risks[i].baseResidual * r.financialWeight,
    0,
  )
  const scenarioIndex = RISKS.reduce(
    (sum, r, i) => sum + risks[i].newResidual * r.financialWeight,
    0,
  )

  // Concurrency amplifier: ≥3 risks at High/Critical → ×1.25
  const highOrCritical = risks.filter(
    (r) => r.ratingTo === 'High' || r.ratingTo === 'Critical',
  ).length
  const amplifier = highOrCritical >= 3 ? 1.25 : 1.0

  const baselineAed = risks.reduce((s, r) => s + r.baseExposureAedMn, 0)
  const scenarioAed = risks.reduce((s, r) => s + r.exposureAedMn, 0) * amplifier

  return {
    risks,
    portfolio: {
      baselineExposureAedMn: baselineAed,
      scenarioExposureAedMn: scenarioAed,
      deltaAedMn: scenarioAed - baselineAed,
      deltaPct: baselineAed > 0 ? ((scenarioAed - baselineAed) / baselineAed) * 100 : 0,
      ratingFrom: portfolioBand(baselineIndex),
      ratingTo: portfolioBand(scenarioIndex * amplifier),
    },
  }
}
