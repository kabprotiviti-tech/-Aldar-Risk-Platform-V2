/**
 * Aldar Risk Propagation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Models how external macro/contextual signals cascade through Aldar's business
 * units via causal dependency pathways, producing dynamic risk scores and
 * context-aware AI explanations.
 *
 * Current reference date: April 2026 (shoulder season — post-peak, pre-summer)
 */

import type { Portfolio, PortfolioMetrics, RiskTrend } from './simulated-data'

// ─── Signal Type Definitions ──────────────────────────────────────────────────

export type SignalLevel = 'low' | 'medium' | 'high'
export type Season      = 'peak' | 'shoulder' | 'low'
export type Capacity    = 'high' | 'medium' | 'low'
export type Trend       = 'increasing' | 'stable' | 'declining'
export type RateEnv     = 'accommodative' | 'moderate' | 'restrictive'

export interface PropagationSignals {
  // ─ Geopolitical
  geopolitical_risk_level: SignalLevel
  geopolitical_note: string

  // ─ Tourism
  tourism_index: number           // 0–100 composite
  tourism_trend: Trend
  tourism_note: string

  // ─ Abu Dhabi Events Calendar
  event_density: SignalLevel
  major_event_flag: boolean
  next_major_event: string
  event_note: string

  // ─ Seasonality
  season: Season
  season_note: string

  // ─ Aviation / Airline Capacity
  flight_capacity: Capacity
  flight_disruption: boolean
  aviation_note: string

  // ─ Hospitality
  hotel_occupancy_rate: number    // % (68% = below 70% threshold)
  adr_trend: Trend                // average daily rate
  revpar_yoy_pct: number          // % change YoY

  // ─ Retail
  footfall_index: number          // 0–100
  tenant_stress_level: SignalLevel

  // ─ Macro
  consumer_spending_index: number // 0–100
  employment_trend: Trend
  interest_rate_env: RateEnv
  uae_rate_delta_bps: number      // cumulative hike from base (positive = tighter)

  // ─ Construction & Supply Chain
  construction_cost_index: number // 100 = baseline; >100 = inflation
  supply_chain_stress: SignalLevel
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRENT SIGNAL STATE — April 2026
// ─────────────────────────────────────────────────────────────────────────────

export const CURRENT_SIGNALS: PropagationSignals = {
  // Geopolitical: regional tensions remain elevated (Houthi disruptions, Iran-West tensions)
  geopolitical_risk_level: 'medium',
  geopolitical_note: 'Ongoing Red Sea shipping disruptions and regional tensions sustaining moderate risk premium. UAE safe-haven positioning partially absorbs impact but HNI investor sentiment is cautious.',

  // Tourism: shoulder season (Apr), moderate index. F1 not until November.
  tourism_index: 61,
  tourism_trend: 'declining',
  tourism_note: 'Transitioning from post-winter peak to summer low. International arrivals down 9% MoM vs. February peak. GCC domestic tourism partially offsetting international softness.',

  // Events: no major events in April. F1 GP (Nov), Yasalam (Nov), Abu Dhabi Art (Nov).
  event_density: 'low',
  major_event_flag: false,
  next_major_event: 'F1 Abu Dhabi Grand Prix (November 2026)',
  event_note: 'Low event density in April–September. Next major demand catalyst is F1 GP (Nov 2026). Summer months historically 35–40% below peak occupancy.',

  // Seasonality: shoulder → transitioning to summer low (May–September)
  season: 'shoulder',
  season_note: 'April is late shoulder. Summer (Jun–Sep) will further depress leisure demand. Business travel partially compensates but insufficient to offset leisure decline.',

  // Aviation: Etihad + Emirates operating at healthy capacity. No major disruptions.
  flight_capacity: 'high',
  flight_disruption: false,
  aviation_note: 'Etihad and Emirates reporting strong capacity utilisation to Abu Dhabi/Dubai. No significant route cuts. Aviation headwinds are demand-side (bookings), not supply-side (capacity).',

  // Hospitality: occupancy 68% — below 70% risk threshold. RevPAR -6% YoY.
  hotel_occupancy_rate: 68,
  adr_trend: 'declining',
  revpar_yoy_pct: -6.2,

  // Retail: footfall moderate. Tenant stress medium (7 stressed tenants on watchlist).
  footfall_index: 69,
  tenant_stress_level: 'medium',

  // Macro: US Fed hold, UAE rates moderately elevated. Consumer spending cautious.
  consumer_spending_index: 66,
  employment_trend: 'stable',
  interest_rate_env: 'restrictive',
  uae_rate_delta_bps: 175,   // cumulative hikes from 2022 baseline

  // Construction: Red Sea disruptions driving steel/cement cost inflation.
  construction_cost_index: 118,  // 18% above 2023 baseline
  supply_chain_stress: 'medium',
}

// ─────────────────────────────────────────────────────────────────────────────
// CAUSAL DEPENDENCY MODEL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Step 1: Compute derived tourism index incorporating all upstream signals.
 * Base index is adjusted by geopolitical, events, seasonality, aviation.
 */
function deriveEffectiveTourismIndex(s: PropagationSignals): number {
  let idx = s.tourism_index

  // Geopolitical penalty
  if (s.geopolitical_risk_level === 'high')   idx -= 18
  if (s.geopolitical_risk_level === 'medium') idx -= 8

  // Events boost
  if (s.major_event_flag)                     idx += 22
  if (s.event_density === 'high')             idx += 12
  if (s.event_density === 'medium')           idx += 5

  // Seasonality
  if (s.season === 'peak')                    idx += 15
  if (s.season === 'low')                     idx -= 18
  if (s.season === 'shoulder')                idx -= 5

  // Aviation
  if (s.flight_capacity === 'low')            idx -= 14
  if (s.flight_disruption)                    idx -= 10

  return Math.max(0, Math.min(100, idx))
}

/**
 * Step 2: Derive occupancy rate from effective tourism index.
 * Hospitality occupancy is a downstream function of tourism.
 */
function deriveOccupancyRate(effectiveTourism: number, baseOccupancy: number): number {
  // Tourism index < 50 suppresses occupancy significantly
  const tourismFactor = (effectiveTourism - 50) / 50  // -1 to +1
  const adj = tourismFactor * 12  // ±12pp swing
  return Math.max(40, Math.min(95, baseOccupancy + adj))
}

/**
 * Step 3: Derive retail footfall from occupancy and consumer spending.
 * Hospitality → Retail is the key downstream propagation path.
 */
function deriveFootfallIndex(occupancy: number, consumerSpending: number): number {
  const occupancyContrib = (occupancy / 100) * 55
  const spendingContrib  = (consumerSpending / 100) * 45
  return Math.max(0, Math.min(100, occupancyContrib + spendingContrib))
}

/**
 * Step 4: Derive tenant stress from footfall and base stress level.
 */
function deriveTenantStress(footfall: number, baseTenantStress: SignalLevel): SignalLevel {
  if (footfall < 45 || baseTenantStress === 'high') return 'high'
  if (footfall < 62 || baseTenantStress === 'medium') return 'medium'
  return 'low'
}

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO RISK SCORE COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────

interface DerivedState {
  effectiveTourism: number
  derivedOccupancy: number
  derivedFootfall: number
  derivedTenantStress: SignalLevel
}

function buildDerivedState(s: PropagationSignals): DerivedState {
  const effectiveTourism = deriveEffectiveTourismIndex(s)
  const derivedOccupancy = deriveOccupancyRate(effectiveTourism, s.hotel_occupancy_rate)
  const derivedFootfall  = deriveFootfallIndex(derivedOccupancy, s.consumer_spending_index)
  const derivedTenantStress = deriveTenantStress(derivedFootfall, s.tenant_stress_level)
  return { effectiveTourism, derivedOccupancy, derivedFootfall, derivedTenantStress }
}

function scoreRealEstate(s: PropagationSignals): number {
  let score = 60  // structural base

  // Interest rate environment is primary driver
  if (s.interest_rate_env === 'restrictive') score += 12
  if (s.interest_rate_env === 'moderate')    score += 5
  if (s.uae_rate_delta_bps > 150)            score += 5
  if (s.uae_rate_delta_bps > 200)            score += 3

  // Construction cost inflation
  if (s.construction_cost_index > 115)       score += 5
  if (s.construction_cost_index > 125)       score += 3

  // Supply chain
  if (s.supply_chain_stress === 'high')      score += 6
  if (s.supply_chain_stress === 'medium')    score += 3

  // Geopolitical (HNI investor sentiment)
  if (s.geopolitical_risk_level === 'high')  score += 8
  if (s.geopolitical_risk_level === 'medium')score += 3

  return Math.min(100, score)
}

function scoreHospitality(s: PropagationSignals, d: DerivedState): number {
  let score = 38  // structural base

  // Effective tourism is the dominant driver
  if (d.effectiveTourism < 40)  score += 22
  else if (d.effectiveTourism < 55) score += 15
  else if (d.effectiveTourism < 65) score += 8
  else if (d.effectiveTourism < 75) score += 3

  // Occupancy below 70% threshold
  if (d.derivedOccupancy < 60)  score += 12
  else if (d.derivedOccupancy < 70) score += 7
  else if (d.derivedOccupancy < 80) score += 2

  // RevPAR decline
  if (s.revpar_yoy_pct < -10)   score += 8
  else if (s.revpar_yoy_pct < -5) score += 4
  else if (s.revpar_yoy_pct < 0)  score += 2

  // No major events amplifies concentration risk
  if (!s.major_event_flag && s.event_density === 'low') score += 5

  // Seasonality
  if (s.season === 'low')       score += 10
  if (s.season === 'shoulder')  score += 4

  // Geopolitical
  if (s.geopolitical_risk_level === 'high')  score += 6
  if (s.geopolitical_risk_level === 'medium') score += 2

  return Math.min(100, score)
}

function scoreRetail(s: PropagationSignals, d: DerivedState): number {
  let score = 42  // structural base

  // Footfall is the primary driver (downstream from hospitality)
  if (d.derivedFootfall < 50)  score += 20
  else if (d.derivedFootfall < 62) score += 12
  else if (d.derivedFootfall < 72) score += 6
  else if (d.derivedFootfall < 80) score += 2

  // Tenant stress amplifier
  if (d.derivedTenantStress === 'high')   score += 15
  if (d.derivedTenantStress === 'medium') score += 7

  // Consumer spending
  if (s.consumer_spending_index < 55)  score += 10
  else if (s.consumer_spending_index < 68) score += 5
  else if (s.consumer_spending_index < 78) score += 2

  // Interest rates compress retail spending
  if (s.interest_rate_env === 'restrictive') score += 4

  return Math.min(100, score)
}

function scoreEducation(_s: PropagationSignals): number {
  // Education is structurally defensive — ADEK regulation provides stable demand
  // Minor sensitivity to macro/employment
  let score = 32
  // Enrollment risk tied to residential community sequencing
  score += 4  // ADEK compliance gap (ongoing)
  score += 2  // New campus enrollment shortfall
  return Math.min(100, score)
}

function scoreFacilities(s: PropagationSignals): number {
  let score = 36  // structural base

  // Cyber risk is growing (IoT expansion)
  score += 8  // permanent cyber risk component from smart building expansion

  // FM outsourcing performance
  score += 4  // ongoing SLA decline

  // Supply chain affects maintenance
  if (s.supply_chain_stress === 'high')   score += 4
  if (s.supply_chain_stress === 'medium') score += 2

  return Math.min(100, score)
}

function deriveRiskCounts(score: number, portfolio: Portfolio): PortfolioMetrics['riskCount'] {
  // Deterministic mapping from composite score + known portfolio characteristics
  const COUNTS: Record<Portfolio, (s: number) => PortfolioMetrics['riskCount']> = {
    'real-estate': (s) => ({
      critical: s >= 80 ? 1 : 0,
      high: s >= 75 ? 5 : s >= 68 ? 4 : 3,
      medium: s >= 70 ? 4 : 3,
      low: 1,
    }),
    retail: (s) => ({
      critical: 0,
      high: s >= 65 ? 3 : s >= 58 ? 2 : 1,
      medium: s >= 58 ? 3 : 2,
      low: 0,
    }),
    hospitality: (s) => ({
      critical: s >= 70 ? 1 : 0,
      high: s >= 65 ? 3 : s >= 55 ? 2 : 0,
      medium: s >= 50 ? 3 : 2,
      low: s < 50 ? 1 : 0,
    }),
    education: (_s) => ({
      critical: 0,
      high: 1,
      medium: 1,
      low: 1,
    }),
    facilities: (s) => ({
      critical: 0,
      high: s >= 50 ? 2 : 1,
      medium: s >= 48 ? 3 : 2,
      low: 0,
    }),
  }
  return COUNTS[portfolio](score)
}

function deriveFinancialExposure(score: number, portfolio: Portfolio): number {
  const BASE: Record<Portfolio, number> = {
    'real-estate': 1200,
    retail: 140,
    hospitality: 140,
    education: 55,
    facilities: 200,
  }
  const scaleFactor = 0.8 + (score / 100) * 0.8
  return Math.round(BASE[portfolio] * scaleFactor / 10) * 10
}

function deriveTrend(score: number, baselineScore: number): RiskTrend {
  const delta = score - baselineScore
  if (delta > 3) return 'increasing'
  if (delta < -3) return 'decreasing'
  return 'stable'
}

// Baseline scores (6 months ago) for trend computation
const BASELINE_SCORES: Record<Portfolio, number> = {
  'real-estate': 67,
  retail: 55,
  hospitality: 50,
  education: 37,
  facilities: 44,
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPUTE PROPAGATED PORTFOLIO METRICS
// ─────────────────────────────────────────────────────────────────────────────

export function computePortfolioMetrics(
  signals: PropagationSignals = CURRENT_SIGNALS
): Record<Portfolio, PortfolioMetrics> {
  const d = buildDerivedState(signals)

  const scores: Record<Portfolio, number> = {
    'real-estate': scoreRealEstate(signals),
    retail:        scoreRetail(signals, d),
    hospitality:   scoreHospitality(signals, d),
    education:     scoreEducation(signals),
    facilities:    scoreFacilities(signals),
  }

  const result = {} as Record<Portfolio, PortfolioMetrics>
  const portfolios: Portfolio[] = ['real-estate', 'retail', 'hospitality', 'education', 'facilities']

  for (const p of portfolios) {
    const s = scores[p]
    result[p] = {
      riskScore: s,
      riskCount: deriveRiskCounts(s, p),
      financialExposure: deriveFinancialExposure(s, p),
      trend: deriveTrend(s, BASELINE_SCORES[p]),
    }
  }

  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// 12-MONTH HISTORICAL SIMULATION WITH SEASONALITY
// ─────────────────────────────────────────────────────────────────────────────

// Monthly signal snapshots — May 2025 → April 2026
// Models real seasonality: summer low, F1/event peak, shoulder transitions

interface MonthlySignalSnapshot {
  month: string
  tourism_index: number
  season: Season
  event_density: SignalLevel
  major_event: boolean
  geopolitical: SignalLevel
  rate_env: RateEnv
  construction_cost: number
}

const MONTHLY_SNAPSHOTS: MonthlySignalSnapshot[] = [
  // Summer 2025 — low season, no major events
  { month: 'May',  tourism_index: 58, season: 'shoulder', event_density: 'low',    major_event: false, geopolitical: 'low',    rate_env: 'restrictive', construction_cost: 112 },
  { month: 'Jun',  tourism_index: 48, season: 'low',      event_density: 'low',    major_event: false, geopolitical: 'low',    rate_env: 'restrictive', construction_cost: 114 },
  { month: 'Jul',  tourism_index: 43, season: 'low',      event_density: 'low',    major_event: false, geopolitical: 'medium', rate_env: 'restrictive', construction_cost: 115 },
  { month: 'Aug',  tourism_index: 41, season: 'low',      event_density: 'low',    major_event: false, geopolitical: 'medium', rate_env: 'restrictive', construction_cost: 116 },
  // Recovery — cooling weather, approaching F1
  { month: 'Sep',  tourism_index: 52, season: 'shoulder', event_density: 'low',    major_event: false, geopolitical: 'medium', rate_env: 'restrictive', construction_cost: 116 },
  { month: 'Oct',  tourism_index: 64, season: 'shoulder', event_density: 'medium', major_event: false, geopolitical: 'medium', rate_env: 'moderate',    construction_cost: 117 },
  // Peak season — F1, Yasalam, Abu Dhabi Art Fair
  { month: 'Nov',  tourism_index: 82, season: 'peak',     event_density: 'high',   major_event: true,  geopolitical: 'low',    rate_env: 'moderate',    construction_cost: 117 },
  { month: 'Dec',  tourism_index: 85, season: 'peak',     event_density: 'high',   major_event: true,  geopolitical: 'low',    rate_env: 'moderate',    construction_cost: 117 },
  { month: 'Jan',  tourism_index: 80, season: 'peak',     event_density: 'medium', major_event: false, geopolitical: 'low',    rate_env: 'moderate',    construction_cost: 117 },
  // Post-peak decline + geopolitical tensions resurface
  { month: 'Feb',  tourism_index: 72, season: 'shoulder', event_density: 'medium', major_event: false, geopolitical: 'medium', rate_env: 'restrictive', construction_cost: 118 },
  { month: 'Mar',  tourism_index: 66, season: 'shoulder', event_density: 'low',    major_event: false, geopolitical: 'medium', rate_env: 'restrictive', construction_cost: 118 },
  // Current — April 2026 (shoulder, no events, moderate geo risk)
  { month: 'Apr',  tourism_index: 61, season: 'shoulder', event_density: 'low',    major_event: false, geopolitical: 'medium', rate_env: 'restrictive', construction_cost: 118 },
]

function snapshotToSignals(snap: MonthlySignalSnapshot): PropagationSignals {
  const rateEnv = snap.rate_env
  const geo = snap.geopolitical
  // Derive occupancy from tourism signal
  const baseOcc = snap.tourism_index < 50 ? 62 : snap.tourism_index < 65 ? 68 : snap.tourism_index < 80 ? 76 : 84
  return {
    ...CURRENT_SIGNALS,
    geopolitical_risk_level: geo,
    tourism_index: snap.tourism_index,
    tourism_trend: 'stable',
    event_density: snap.event_density,
    major_event_flag: snap.major_event,
    season: snap.season,
    interest_rate_env: rateEnv,
    uae_rate_delta_bps: rateEnv === 'restrictive' ? 175 : rateEnv === 'moderate' ? 100 : 25,
    hotel_occupancy_rate: baseOcc,
    revpar_yoy_pct: snap.tourism_index > 70 ? 4 : snap.tourism_index > 55 ? -2 : -8,
    construction_cost_index: snap.construction_cost,
    supply_chain_stress: geo === 'high' ? 'high' : geo === 'medium' ? 'medium' : 'low',
  }
}

export function computeHistoricalScores(): {
  months: string[]
  portfolioRiskScores: Record<Portfolio, number[]>
  overallRiskScore: number[]
  financialExposure: number[]
} {
  const portfolios: Portfolio[] = ['real-estate', 'retail', 'hospitality', 'education', 'facilities']
  const months = MONTHLY_SNAPSHOTS.map(s => s.month)
  const portfolioRiskScores = {} as Record<Portfolio, number[]>
  const overallArr: number[] = []
  const exposureArr: number[] = []

  for (const p of portfolios) portfolioRiskScores[p] = []

  for (const snap of MONTHLY_SNAPSHOTS) {
    const sigs = snapshotToSignals(snap)
    const metrics = computePortfolioMetrics(sigs)
    let totalScore = 0
    let totalExposure = 0
    for (const p of portfolios) {
      portfolioRiskScores[p].push(metrics[p].riskScore)
      totalScore += metrics[p].riskScore
      totalExposure += metrics[p].financialExposure
    }
    overallArr.push(Math.round(totalScore / portfolios.length))
    exposureArr.push(totalExposure)
  }

  return { months, portfolioRiskScores, overallRiskScore: overallArr, financialExposure: exposureArr }
}

// Pre-compute for export (avoids recomputation on every import)
export const COMPUTED_HISTORY = computeHistoricalScores()
export const PROPAGATED_METRICS = computePortfolioMetrics(CURRENT_SIGNALS)

// ─────────────────────────────────────────────────────────────────────────────
// DERIVED STATE EXPORT (for UI signal display)
// ─────────────────────────────────────────────────────────────────────────────

export const DERIVED_STATE = buildDerivedState(CURRENT_SIGNALS)

// ─────────────────────────────────────────────────────────────────────────────
// AI EXPLANATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface PropagationExplanation {
  headline: string        // one-line summary
  rootCauses: string[]    // signal drivers
  propagationPath: string // narrative causality chain
  businessImpact: string  // quantified impact on this BU
  watchIndicators: string[] // what to monitor next
  scenarioWorstCase: string // what happens if signals worsen
}

export const PROPAGATION_EXPLANATIONS: Record<Portfolio, PropagationExplanation> = {
  'real-estate': {
    headline: 'Pipeline cost inflation and rate headwinds are converging to suppress margins and absorption rates.',
    rootCauses: [
      `Interest rate environment is restrictive (+${CURRENT_SIGNALS.uae_rate_delta_bps}bps cumulative): mortgage affordability declining`,
      `Construction cost index at ${CURRENT_SIGNALS.construction_cost_index} (+18% vs. 2023): active AED 8.2Bn pipeline under margin pressure`,
      `Red Sea supply chain disruptions driving steel/cement cost volatility (supply_chain_stress: medium)`,
      `Geopolitical risk level (${CURRENT_SIGNALS.geopolitical_risk_level}) softening HNI investor sentiment — Russia/CIS buyers (~22% of premium sales) cautious`,
    ],
    propagationPath:
      'US Fed restrictive stance → UAE CBUAE follows (+175bps) → mortgage affordability down ~18% → off-plan absorption rate declining → revenue collection rate 88.5% vs. 95% target → → separate path: Red Sea disruptions → construction material supply shortages → cost overrun exposure on AED 8.2Bn pipeline → margin compression.',
    businessImpact:
      `Portfolio risk score ${PROPAGATED_METRICS['real-estate'].riskScore}/100 (elevated). Financial exposure AED ${PROPAGATED_METRICS['real-estate'].financialExposure}M. Off-plan sales running at 71% of target. Three projects with cost overruns above AED 15M each.`,
    watchIndicators: [
      'Fed rate decision cadence (next FOMC signal)',
      'Monthly off-plan absorption rate vs. 200-unit target',
      'Construction cost index vs. 120 trigger threshold',
      'HNI buyer origination by nationality (Russia/CIS/Iran share)',
    ],
    scenarioWorstCase:
      'A further +100bps rate hike combined with escalating regional conflict could push portfolio risk score to 88/100 and financial exposure above AED 2.4Bn.',
  },

  retail: {
    headline: `Downstream footfall pressure from shoulder-season tourism decline (index: ${DERIVED_STATE.derivedFootfall.toFixed(0)}/100) is amplifying tenant stress.`,
    rootCauses: [
      `Tourism index declined to ${CURRENT_SIGNALS.tourism_index} (shoulder season, no major events until F1 in November)`,
      `Hotel occupancy at ${DERIVED_STATE.derivedOccupancy.toFixed(0)}% → fewer visitors in retail catchments`,
      `Consumer spending index ${CURRENT_SIGNALS.consumer_spending_index}/100: rate headwinds dampening discretionary spend`,
      `Tenant stress level: ${CURRENT_SIGNALS.tenant_stress_level} — 7 tenants on active watchlist, 2 anchor lease renewals pending Q4 2026`,
    ],
    propagationPath:
      `Tourism shock (shoulder season + no events) → effective tourism index ${DERIVED_STATE.effectiveTourism.toFixed(0)}/100 → hotel occupancy ${DERIVED_STATE.derivedOccupancy.toFixed(0)}% → Yas Island foot-traffic decline → retail footfall index ${DERIVED_STATE.derivedFootfall.toFixed(0)}/100 → turnover rent clauses trigger for 4 tenants → covenant stress rises → anchor tenant renewal negotiations weakened.`,
    businessImpact:
      `Portfolio risk score ${PROPAGATED_METRICS.retail.riskScore}/100. Financial exposure AED ${PROPAGATED_METRICS.retail.financialExposure}M. Community retail vacancy at 8.5% vs. 5.2% benchmark. Base rent compression of 12% forecast for 2026.`,
    watchIndicators: [
      'Monthly footfall by asset (Yas Mall, Abu Dhabi Mall, community centres)',
      'Tenant sales performance vs. turnover rent thresholds',
      'Number of tenants entering covenant breach',
      'Tourism index recovery trajectory approaching F1 season',
    ],
    scenarioWorstCase:
      'If tourism index falls below 45 (summer low) AND a major anchor tenant defaults, retail risk score could reach 78/100 with exposure exceeding AED 380M.',
  },

  hospitality: {
    headline: `Shoulder season + no major events has suppressed effective tourism to ${DERIVED_STATE.effectiveTourism.toFixed(0)}/100, pushing occupancy below the 70% risk threshold.`,
    rootCauses: [
      `Effective tourism index: ${DERIVED_STATE.effectiveTourism.toFixed(0)}/100 (base ${CURRENT_SIGNALS.tourism_index} adjusted for shoulder season, no events, moderate geopolitics)`,
      `No major events scheduled until F1 GP (November 2026) — 7-month demand valley`,
      `Hotel occupancy ${DERIVED_STATE.derivedOccupancy.toFixed(0)}% is below 70% risk threshold — compressed RevPAR (${CURRENT_SIGNALS.revpar_yoy_pct}% YoY)`,
      `Saudi Vision 2030 hospitality pipeline intensifying regional competition from 2027`,
      `Event revenue concentration risk: F1 + Yasalam account for ~28% of annual EBITDA`,
    ],
    propagationPath:
      `Seasonal transition to shoulder (April) → international leisure arrivals -9% MoM → effective tourism index ${DERIVED_STATE.effectiveTourism.toFixed(0)}/100 → occupancy drops to ${DERIVED_STATE.derivedOccupancy.toFixed(0)}% → ADR pressure as hotels compete for reduced demand → RevPAR declining ${Math.abs(CURRENT_SIGNALS.revpar_yoy_pct)}% YoY → EBITDA margin compression → downstream retail footfall reduction in Yas Island catchment.`,
    businessImpact:
      `Portfolio risk score ${PROPAGATED_METRICS.hospitality.riskScore}/100. Financial exposure AED ${PROPAGATED_METRICS.hospitality.financialExposure}M. RevPAR AED 420 (vs. AED 480 peak-season). Event-revenue dependency creates a binary risk: F1 disruption would crystallise ~AED 85M impact.`,
    watchIndicators: [
      'Weekly occupancy rate vs. 70% threshold',
      'F1 GP advance booking pace (Oct/Nov signal)',
      'Saudi Giga-project hotel inventory additions (2027 pipeline)',
      'Etihad/Emirates Abu Dhabi passenger volumes (leading indicator)',
    ],
    scenarioWorstCase:
      'Extended summer low (geopolitical disruption + airline capacity cuts) could push occupancy to 55% and risk score to 72/100, triggering covenant reviews on hotel-level financing.',
  },

  education: {
    headline: 'Education portfolio remains structurally resilient — ADEK regulation and community enrollment linkage provide stable demand base.',
    rootCauses: [
      'ADEK curriculum compliance gap in 2 schools — remediation plan in execution',
      'Three new campus openings in 2026 requiring 850+ enrollment to breakeven (currently 62% of target)',
      'Macro signals have low transmission into education (stable employment, community-driven demand)',
      'Residential community handover sequencing is the primary enrollment variable',
    ],
    propagationPath:
      'Macro interest rate environment → marginal impact on new residential unit handovers → slight delay in captive enrollment pipeline → new campus enrollment ramp slower than projected. (Weak propagation — education is largely insulated from tourism/retail signals.)',
    businessImpact:
      `Portfolio risk score ${PROPAGATED_METRICS.education.riskScore}/100 (lowest across all BUs). Financial exposure AED ${PROPAGATED_METRICS.education.financialExposure}M. ADEK compliance cost ~AED 12M. Enrollment shortfall risk in new campuses ~AED 42M revenue impact in Year 1.`,
    watchIndicators: [
      'New campus pre-registration vs. 850-student target',
      'ADEK inspection outcomes for compliance gap schools',
      'Residential handover sequencing vs. school catchment zones',
      'UAE expat population retention rate (longer-term)',
    ],
    scenarioWorstCase:
      'Mass expat exodus scenario (severe geopolitical event + economic shock) could suppress enrollment across existing campuses by 12–18%, but this is a low-probability tail risk.',
  },

  facilities: {
    headline: 'Cyber risk is the fastest-growing component — IoT expansion has tripled the attack surface while FM outsourcing performance decline adds operational pressure.',
    rootCauses: [
      'Smart building IoT fleet expanded +340 endpoints in 12 months: cyber attack surface expanding faster than security controls',
      'UAE NCA advisories highlight elevated nation-state threat actor activity targeting real estate operators',
      'FM outsourcing partner CSAT scores declined from 87% → 79% in Q1 2026',
      'AI/proptech disruption risk: competitors achieving 22% FM cost reductions via digitisation',
      `Supply chain stress (${CURRENT_SIGNALS.supply_chain_stress}) affecting maintenance parts availability`,
    ],
    propagationPath:
      'IoT fleet expansion → OT/IT network boundary erosion → nation-state threat actor opportunity window widens → BMS/SCADA vulnerability exposure → potential service disruption across 40+ assets → tenant CSAT impact → retention risk → compounded by FM partner SLA decline → double deterioration in operational delivery KPIs.',
    businessImpact:
      `Portfolio risk score ${PROPAGATED_METRICS.facilities.riskScore}/100. Financial exposure AED ${PROPAGATED_METRICS.facilities.financialExposure}M. Cyber incident exposure estimated AED 180M. FM opex inefficiency ~AED 55M annually vs. AI-enabled benchmark.`,
    watchIndicators: [
      'IoT device fleet cyber scan results (monthly)',
      'FM outsourcing partner SLA performance (quarterly)',
      'NCA threat advisory level for UAE real estate sector',
      'AI/BMS pilot programme ROI metrics (H1 2026)',
    ],
    scenarioWorstCase:
      'A coordinated cyber attack on BMS infrastructure across flagship assets could cause AED 180M+ in direct losses plus reputational damage, with 6–9 month recovery cycle.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO SIGNAL ADJUSTMENTS
// ─────────────────────────────────────────────────────────────────────────────

export type ScenarioId = 'tourism_drop' | 'interest_rate_hike' | 'tenant_default_spike' | 'cyber_attack' | 'construction_shock'

export function computeScenarioSignals(
  scenarioId: ScenarioId,
  intensity: 'mild' | 'moderate' | 'severe' = 'moderate'
): PropagationSignals {
  const base = { ...CURRENT_SIGNALS }
  const mult = intensity === 'severe' ? 1.5 : intensity === 'moderate' ? 1.0 : 0.6

  switch (scenarioId) {
    case 'tourism_drop':
      return {
        ...base,
        geopolitical_risk_level: 'high',
        tourism_index: Math.max(20, base.tourism_index - Math.round(30 * mult)),
        tourism_trend: 'declining',
        event_density: 'low',
        major_event_flag: false,
        season: 'low',
        flight_capacity: intensity === 'severe' ? 'low' : 'medium',
        flight_disruption: intensity === 'severe',
        hotel_occupancy_rate: Math.max(38, base.hotel_occupancy_rate - Math.round(20 * mult)),
        adr_trend: 'declining',
        revpar_yoy_pct: -18 * mult,
        footfall_index: Math.max(30, base.footfall_index - Math.round(20 * mult)),
        tenant_stress_level: intensity === 'severe' ? 'high' : 'medium',
        consumer_spending_index: Math.max(40, base.consumer_spending_index - Math.round(15 * mult)),
      }

    case 'interest_rate_hike':
      return {
        ...base,
        interest_rate_env: 'restrictive',
        uae_rate_delta_bps: base.uae_rate_delta_bps + Math.round(150 * mult),
        construction_cost_index: base.construction_cost_index + Math.round(8 * mult),
        supply_chain_stress: 'high',
        consumer_spending_index: Math.max(40, base.consumer_spending_index - Math.round(12 * mult)),
        employment_trend: intensity === 'severe' ? 'declining' : 'stable',
      }

    case 'tenant_default_spike':
      return {
        ...base,
        tenant_stress_level: 'high',
        footfall_index: Math.max(35, base.footfall_index - Math.round(18 * mult)),
        consumer_spending_index: Math.max(40, base.consumer_spending_index - Math.round(10 * mult)),
      }

    case 'cyber_attack':
      return {
        ...base,
        geopolitical_risk_level: 'high',
        // Cyber attack doesn't directly affect tourism/retail signals
        // but reputational damage impacts occupancy and confidence
        hotel_occupancy_rate: Math.max(50, base.hotel_occupancy_rate - Math.round(8 * mult)),
        consumer_spending_index: Math.max(50, base.consumer_spending_index - Math.round(5 * mult)),
      }

    case 'construction_shock':
      return {
        ...base,
        construction_cost_index: base.construction_cost_index + Math.round(20 * mult),
        supply_chain_stress: intensity === 'severe' ? 'high' : 'medium',
        geopolitical_risk_level: intensity === 'severe' ? 'high' : 'medium',
      }

    default:
      return base
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNAL DISPLAY LABELS (for UI rendering)
// ─────────────────────────────────────────────────────────────────────────────

export interface SignalDisplayItem {
  category: string
  label: string
  value: string
  level: 'positive' | 'neutral' | 'warning' | 'critical'
  note: string
}

export function getSignalDisplayItems(s: PropagationSignals = CURRENT_SIGNALS): SignalDisplayItem[] {
  const d = buildDerivedState(s)
  const tourismLevel = d.effectiveTourism < 45 ? 'critical' : d.effectiveTourism < 60 ? 'warning' : d.effectiveTourism < 75 ? 'neutral' : 'positive'
  const occupancyLevel = d.derivedOccupancy < 60 ? 'critical' : d.derivedOccupancy < 70 ? 'warning' : d.derivedOccupancy < 80 ? 'neutral' : 'positive'
  const footfallLevel = d.derivedFootfall < 50 ? 'critical' : d.derivedFootfall < 65 ? 'warning' : d.derivedFootfall < 78 ? 'neutral' : 'positive'
  const rateLevel = s.interest_rate_env === 'restrictive' ? 'warning' : s.interest_rate_env === 'moderate' ? 'neutral' : 'positive'

  return [
    {
      category: 'Macro',
      label: 'Interest Rate Environment',
      value: s.interest_rate_env.charAt(0).toUpperCase() + s.interest_rate_env.slice(1),
      level: rateLevel,
      note: `+${s.uae_rate_delta_bps}bps cumulative. Mortgage affordability under pressure.`,
    },
    {
      category: 'Geopolitical',
      label: 'Regional Risk Level',
      value: s.geopolitical_risk_level.charAt(0).toUpperCase() + s.geopolitical_risk_level.slice(1),
      level: s.geopolitical_risk_level === 'high' ? 'critical' : s.geopolitical_risk_level === 'medium' ? 'warning' : 'positive',
      note: s.geopolitical_note.split('.')[0],
    },
    {
      category: 'Tourism',
      label: 'Effective Tourism Index',
      value: `${d.effectiveTourism.toFixed(0)}/100`,
      level: tourismLevel,
      note: `${s.season} season · ${s.major_event_flag ? 'Major event active' : `Next event: ${s.next_major_event}`}`,
    },
    {
      category: 'Hospitality',
      label: 'Hotel Occupancy Rate',
      value: `${d.derivedOccupancy.toFixed(0)}%`,
      level: occupancyLevel,
      note: d.derivedOccupancy < 70 ? 'Below 70% risk threshold. RevPAR under pressure.' : 'Within acceptable range.',
    },
    {
      category: 'Retail',
      label: 'Footfall Index',
      value: `${d.derivedFootfall.toFixed(0)}/100`,
      level: footfallLevel,
      note: `Tenant stress: ${d.derivedTenantStress}. Consumer spending index: ${s.consumer_spending_index}/100.`,
    },
    {
      category: 'Construction',
      label: 'Cost Index',
      value: `${s.construction_cost_index}`,
      level: s.construction_cost_index > 120 ? 'critical' : s.construction_cost_index > 112 ? 'warning' : 'neutral',
      note: `${((s.construction_cost_index - 100)).toFixed(0)}% above 2023 baseline. Red Sea supply chain impact.`,
    },
    {
      category: 'Events',
      label: 'Event Density',
      value: s.event_density.charAt(0).toUpperCase() + s.event_density.slice(1),
      level: s.major_event_flag ? 'positive' : s.event_density === 'high' ? 'positive' : s.event_density === 'medium' ? 'neutral' : 'warning',
      note: s.event_note.split('.')[0],
    },
    {
      category: 'Aviation',
      label: 'Flight Capacity',
      value: `${s.flight_capacity.charAt(0).toUpperCase() + s.flight_capacity.slice(1)}${s.flight_disruption ? ' ⚠ Disruption' : ''}`,
      level: s.flight_disruption ? 'critical' : s.flight_capacity === 'low' ? 'warning' : 'positive',
      note: s.aviation_note.split('.')[0],
    },
  ]
}
