// Turns simulation output into human-readable explainability blocks.
// Deterministic — no LLM, no randomness.

import type { Driver, RiskState, PortfolioState } from './types'

export interface ExplainabilityBlock {
  mode: string
  inputs: Array<{ driver: string; baseValue: number; adjustedValue: number; deltaPct: number }>
  driversChanged: string[]
  impactedRisks: Array<{
    riskId: string
    riskName: string
    from: string
    to: string
    deltaExposureAedMn: number
  }>
  calculationSummary: string[]
  exposureChange: {
    baselineAedMn: number
    scenarioAedMn: number
    deltaAedMn: number
    deltaPct: number
    ratingFrom: string
    ratingTo: string
  }
  executiveSummary: string
}

export function generateExplainability(
  mode: string,
  drivers: Driver[],
  risks: RiskState[],
  portfolio: PortfolioState,
): ExplainabilityBlock {
  const moved = drivers.filter((d) => Math.abs(d.deltaPct) > 0.001)

  const inputs = drivers.map((d) => ({
    driver: d.name,
    baseValue: d.baseValue,
    adjustedValue: d.adjustedValue,
    deltaPct: d.deltaPct * 100,
  }))

  const impactedRisks = risks
    .filter((r) => Math.abs(r.deltaExposureAedMn) > 0.1)
    .sort((a, b) => Math.abs(b.deltaExposureAedMn) - Math.abs(a.deltaExposureAedMn))
    .map((r) => ({
      riskId: r.id,
      riskName: r.name,
      from: r.ratingFrom,
      to: r.ratingTo,
      deltaExposureAedMn: r.deltaExposureAedMn,
    }))

  const calculationSummary: string[] = []
  const topRisks = risks
    .slice()
    .sort((a, b) => Math.abs(b.deltaExposureAedMn) - Math.abs(a.deltaExposureAedMn))
    .slice(0, 3)

  moved.forEach((d) => {
    const pct = (d.deltaPct * 100).toFixed(1)
    calculationSummary.push(`${d.name} changed by ${pct}%.`)
  })

  topRisks.forEach((r) => {
    const top = r.contributingDrivers[0]
    if (top) {
      calculationSummary.push(
        `${r.name}: ${top.driverName} (weight ${top.weight.toFixed(2)}, ${top.sensitivity} sensitivity) → residual ${r.baseResidual.toFixed(2)} → ${r.newResidual.toFixed(2)}, adds AED ${r.deltaExposureAedMn.toFixed(0)} mn.`,
      )
    }
  })

  if (calculationSummary.length > 6) calculationSummary.length = 6

  // Executive summary paragraph
  const topDriver = moved
    .slice()
    .sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct))[0]
  const topRisk = topRisks[0]
  let executiveSummary = ''
  if (topDriver && topRisk) {
    executiveSummary = `Portfolio exposure moved from AED ${portfolio.baselineExposureAedMn.toFixed(0)} mn to AED ${portfolio.scenarioExposureAedMn.toFixed(0)} mn (${portfolio.deltaPct >= 0 ? '+' : ''}${portfolio.deltaPct.toFixed(1)}%, ${portfolio.ratingFrom} → ${portfolio.ratingTo}). Primary driver: ${topDriver.name} (${(topDriver.deltaPct * 100).toFixed(1)}%). Most exposed: ${topRisk.name}.`
  } else {
    executiveSummary = `Portfolio at baseline — no driver movement. Exposure holds at AED ${portfolio.baselineExposureAedMn.toFixed(0)} mn (${portfolio.ratingFrom}).`
  }

  return {
    mode,
    inputs,
    driversChanged: moved.map((d) => d.name),
    impactedRisks,
    calculationSummary,
    exposureChange: {
      baselineAedMn: portfolio.baselineExposureAedMn,
      scenarioAedMn: portfolio.scenarioExposureAedMn,
      deltaAedMn: portfolio.deltaAedMn,
      deltaPct: portfolio.deltaPct,
      ratingFrom: portfolio.ratingFrom,
      ratingTo: portfolio.ratingTo,
    },
    executiveSummary,
  }
}

// Per-risk "why this changed" narrative
export function whyChanged(risk: RiskState): string {
  if (risk.contributingDrivers.length === 0) {
    return `${risk.name} is at baseline.`
  }
  const totalAbs = risk.contributingDrivers.reduce(
    (s, c) => s + Math.abs(c.contributionPoints),
    0,
  )
  const top = risk.contributingDrivers[0]
  const share = totalAbs > 0 ? (Math.abs(top.contributionPoints) / totalAbs) * 100 : 0
  const pct =
    risk.baseResidual > 0
      ? ((risk.newResidual - risk.baseResidual) / risk.baseResidual) * 100
      : 0
  return `${risk.name} moved from ${risk.ratingFrom} to ${risk.ratingTo} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%). Primary: ${top.driverName} shifted ${(top.deltaPct * 100).toFixed(1)}% (${share.toFixed(0)}% of the change).`
}
