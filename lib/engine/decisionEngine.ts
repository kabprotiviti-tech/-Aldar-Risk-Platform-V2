// Decision layer: urgency, priority, cost of delay, recommended actions, impact simulation.
// Uses the SAME simulation engine for action impact — no parallel math.

import type { Driver, RiskState, Urgency } from './types'
import { ACTIONS, RISKS } from './seedData'
import { runSimulation, applyDriverChange } from './simulationEngine'

// -----------------------------------------------------------------------------
// Urgency
// -----------------------------------------------------------------------------
export function urgencyFor(risk: RiskState): Urgency {
  const delta = Math.abs(risk.deltaExposureAedMn)
  if (risk.ratingTo === 'Critical' || delta > 100) return 'Critical'
  if (risk.ratingTo === 'High' || delta > 50) return 'High'
  if (risk.ratingTo === 'Medium' || delta > 10) return 'Medium'
  return 'Low'
}

export function timeToAct(urgency: Urgency): string {
  return { Critical: '0-7 days', High: '7-30 days', Medium: '30-60 days', Low: '60-90 days' }[urgency]
}

// -----------------------------------------------------------------------------
// Cost of delay
// -----------------------------------------------------------------------------
const TIME_FACTOR: Record<number, number> = { 7: 0.04, 14: 0.09, 30: 0.22, 60: 0.45, 90: 0.72 }
const GROWTH_SENS: Record<Urgency, number> = { Critical: 1.5, High: 1.0, Medium: 0.6, Low: 0.3 }

export function costOfDelay(risk: RiskState) {
  const urg = urgencyFor(risk)
  const sens = GROWTH_SENS[urg]
  const current = risk.exposureAedMn
  const at = (days: number) => Math.min(current * TIME_FACTOR[days] * sens, current * 2)
  return {
    urgency: urg,
    current_exposure_aed_mn: current,
    growth_rate_pct_weekly: TIME_FACTOR[7] * sens * 100,
    at_7d_aed_mn: at(7),
    at_30d_aed_mn: at(30),
    at_90d_aed_mn: at(90),
  }
}

// -----------------------------------------------------------------------------
// Priority score
// -----------------------------------------------------------------------------
const URG_WEIGHT: Record<Urgency, number> = { Critical: 1.5, High: 1.2, Medium: 1.0, Low: 0.7 }

export function priorityScore(risk: RiskState): number {
  const urg = urgencyFor(risk)
  const growth = TIME_FACTOR[7] * GROWTH_SENS[urg]
  return Math.abs(risk.deltaExposureAedMn) * URG_WEIGHT[urg] * (1 + growth)
}

// -----------------------------------------------------------------------------
// Recommended actions for one risk
// -----------------------------------------------------------------------------
const EFFORT_WEIGHT = { Low: 1, Medium: 1.5, High: 2.5 } as const

export function recommendedActions(riskId: string, top = 3) {
  return ACTIONS.filter((a) => a.appliesTo.includes(riskId))
    .slice()
    .sort(
      (a, b) =>
        b.expectedReductionPct / EFFORT_WEIGHT[b.effort] -
        a.expectedReductionPct / EFFORT_WEIGHT[a.effort],
    )
    .slice(0, top)
}

// -----------------------------------------------------------------------------
// Action impact simulation: apply driver deltas to current sim state
// -----------------------------------------------------------------------------
export function simulateActionImpact(
  actionId: string,
  currentDrivers: Driver[],
): { beforeAed: number; afterAed: number; reductionAed: number; reductionPct: number } {
  const act = ACTIONS.find((a) => a.id === actionId)
  if (!act) return { beforeAed: 0, afterAed: 0, reductionAed: 0, reductionPct: 0 }

  const before = runSimulation(currentDrivers)
  const adjusted = currentDrivers.map((d) => {
    const delta = act.driverDeltas.find((x) => x.driverId === d.id)
    if (!delta) return d
    // Apply delta as % shift on adjusted value
    const newVal = d.adjustedValue * (1 + delta.deltaPct / 100)
    return applyDriverChange(d, newVal)
  })
  const after = runSimulation(adjusted)

  const reductionAed = before.portfolio.scenarioExposureAedMn - after.portfolio.scenarioExposureAedMn
  const reductionPct =
    before.portfolio.scenarioExposureAedMn > 0
      ? (reductionAed / before.portfolio.scenarioExposureAedMn) * 100
      : 0

  return {
    beforeAed: before.portfolio.scenarioExposureAedMn,
    afterAed: after.portfolio.scenarioExposureAedMn,
    reductionAed,
    reductionPct,
  }
}

// -----------------------------------------------------------------------------
// CEO summary
// -----------------------------------------------------------------------------
export function ceoSummary(drivers: Driver[], risks: RiskState[]) {
  const totalExposure = risks.reduce((s, r) => s + r.exposureAedMn, 0)

  // Top 3 risks by priority
  const top3 = risks
    .slice()
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, 3)
    .map((r) => {
      const actions = recommendedActions(r.id, 1)
      const action = actions[0]
      const impact = action ? simulateActionImpact(action.id, drivers) : null
      return {
        rank: 0,
        riskId: r.id,
        riskName: r.name,
        urgency: urgencyFor(r),
        timeToAct: timeToAct(urgencyFor(r)),
        ownerRole: action?.ownerRole || r.owner,
        actionName: action?.name || 'No auto-recommendation',
        reductionAedMn: impact?.reductionAed || 0,
      }
    })
    .map((t, i) => ({ ...t, rank: i + 1 }))

  const protectedAed = top3.reduce((s, t) => s + Math.max(0, t.reductionAedMn), 0)

  // 30-day no-action exposure
  const noActionAt30d = risks.reduce((s, r) => s + costOfDelay(r).at_30d_aed_mn, 0)

  const keyMessage =
    top3.length > 0 && top3[0].reductionAedMn > 0
      ? `AED ${protectedAed.toFixed(0)} mn of exposure is protectable in the next 30 days. ${top3[0].riskName} is the largest driver — act within ${top3[0].timeToAct}.`
      : `Portfolio exposure holds at AED ${totalExposure.toFixed(0)} mn. No critical action required.`

  return {
    totalExposureAedMn: totalExposure,
    exposureIfNoAction30dAedMn: totalExposure + noActionAt30d,
    exposureIfActionsTakenAedMn: Math.max(0, totalExposure - protectedAed),
    exposureProtectedAedMn: protectedAed,
    top3Priorities: top3,
    keyMessage,
  }
}

// -----------------------------------------------------------------------------
// Action timeline view
// -----------------------------------------------------------------------------
export function actionTimeline() {
  return {
    immediate: ACTIONS.filter((a) => a.horizon === 'immediate'),
    shortTerm: ACTIONS.filter((a) => a.horizon === 'short'),
    strategic: ACTIONS.filter((a) => a.horizon === 'strategic'),
  }
}
