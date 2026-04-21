// AI Risk Register Intelligence Engine — deterministic scoring layer.
// The Claude-powered reasoning (missing risks, contextual recommendations)
// lives in /app/api/register-critic/route.ts and is called on demand.

import type { RiskDef } from './types'
import { RISKS } from './seedData'

// -----------------------------------------------------------------------------
// 1. Clarity of risk definition (cause-event-impact)
// -----------------------------------------------------------------------------
export function clarityScore(risk: RiskDef): {
  score: number // 0..100
  flags: string[]
} {
  const flags: string[] = []
  const MIN = 25
  if (!risk.cause || risk.cause.length < MIN) flags.push('Cause too thin')
  if (!risk.event || risk.event.length < MIN) flags.push('Event under-specified')
  if (!risk.impact || risk.impact.length < MIN) flags.push('Impact unclear')
  const base = 100 - flags.length * 20
  return { score: Math.max(0, base), flags }
}

// -----------------------------------------------------------------------------
// 2. Control presence
// -----------------------------------------------------------------------------
export function controlPresence(risk: RiskDef): 'None' | 'Weak' | 'Adequate' | 'Strong' {
  const n = risk.controls.length
  if (n === 0) return 'None'
  if (n === 1) return 'Weak'
  if (n === 2) return 'Adequate'
  return 'Strong'
}

export function compositeEffectiveness(risk: RiskDef): number {
  let prod = 1
  for (const c of risk.controls) prod *= 1 - c.effectiveness
  return 1 - prod
}

// -----------------------------------------------------------------------------
// 3. Control adequacy — compares effectiveness to inherent severity
// -----------------------------------------------------------------------------
export function controlAdequacy(risk: RiskDef): {
  sufficient: boolean
  gap: string
} {
  const inherent = risk.baseLikelihood * risk.baseImpact
  const eff = compositeEffectiveness(risk)
  const residual = inherent * (1 - eff)

  // Rule: residual > 9 (Medium+) despite controls → gap
  if (residual > 9 && risk.controls.length < 3) {
    return { sufficient: false, gap: 'High residual despite limited control stack — add a preventive control' }
  }
  if (inherent >= 16 && eff < 0.75) {
    return { sufficient: false, gap: 'Critical inherent risk with <75% composite effectiveness — strengthen controls' }
  }
  if (inherent >= 12 && eff < 0.60) {
    return { sufficient: false, gap: 'High inherent risk with moderate controls only — add detective layer' }
  }
  const controlTypes = new Set(risk.controls.map((c) => c.type))
  if (inherent >= 12 && !controlTypes.has('Detective')) {
    return { sufficient: false, gap: 'Missing detective control — cannot identify drift early' }
  }
  return { sufficient: true, gap: '' }
}

// -----------------------------------------------------------------------------
// 4. External signal → control impact (rule-based correlation)
// -----------------------------------------------------------------------------
export interface ExternalSignal {
  headline: string
  source?: string
  category: 'commodity' | 'market' | 'regulatory' | 'geopolitical' | 'supply' | 'liquidity' | 'other'
}

export interface ExternalCorrelation {
  signal: string
  signal_category: string
  impacted_drivers: string[]
  affected_risks: string[]
  impact_on_control_effectiveness: 'increase' | 'decrease' | 'no change'
  impact_on_residual_risk: 'increase' | 'decrease' | 'no change'
  explanation: string
}

// Keyword-based classifier for fallback when AI classification not available
export function classifySignal(headline: string): ExternalSignal['category'] {
  const h = headline.toLowerCase()
  if (/steel|cement|copper|commodity|oil|gas/.test(h)) return 'commodity'
  if (/rate|liquidity|funding|refinanc|bond|sukuk|cash/.test(h)) return 'liquidity'
  if (/sales|demand|price|lease|occupancy|rent/.test(h)) return 'market'
  if (/regulat|rera|esg|adx|disclosure|compliance/.test(h)) return 'regulatory'
  if (/supply|shipping|port|freight|red sea|logistic/.test(h)) return 'supply'
  if (/sanction|war|tension|geopolit|conflict/.test(h)) return 'geopolitical'
  return 'other'
}

const CATEGORY_TO_DRIVERS: Record<ExternalSignal['category'], string[]> = {
  commodity:     ['DRV-01'],
  market:        ['DRV-02', 'DRV-03', 'DRV-04'],
  regulatory:    ['DRV-05', 'DRV-07'],
  geopolitical:  ['DRV-08', 'DRV-01'],
  supply:        ['DRV-08'],
  liquidity:     ['DRV-07'],
  other:         [],
}

export function correlateSignal(signal: ExternalSignal): ExternalCorrelation {
  const drivers = CATEGORY_TO_DRIVERS[signal.category]

  // Which risks reference any of these drivers?
  const affectedRisks = RISKS.filter((r) =>
    r.driverImpacts.some((di) => drivers.includes(di.driverId)),
  ).map((r) => r.name)

  let ctrlImpact: ExternalCorrelation['impact_on_control_effectiveness'] = 'no change'
  let residualImpact: ExternalCorrelation['impact_on_residual_risk'] = 'no change'
  let explanation = ''

  switch (signal.category) {
    case 'commodity':
      ctrlImpact = 'decrease'
      residualImpact = 'increase'
      explanation = 'Commodity spikes erode cost-control effectiveness (GMP margins compress, hedge coverage insufficient).'
      break
    case 'market':
      ctrlImpact = 'decrease'
      residualImpact = 'increase'
      explanation = 'Demand weakness weakens revenue-related controls (dynamic pricing, broker incentives reach diminishing returns).'
      break
    case 'regulatory':
      ctrlImpact = 'decrease'
      residualImpact = 'increase'
      explanation = 'New rules create compliance gap until controls are rebuilt; horizon-scanning coverage tested.'
      break
    case 'supply':
      ctrlImpact = 'decrease'
      residualImpact = 'increase'
      explanation = 'Dual-sourcing and stockholding controls lose effectiveness when disruption is systemic rather than point-source.'
      break
    case 'liquidity':
      ctrlImpact = 'decrease'
      residualImpact = 'increase'
      explanation = 'Refinancing controls (RCF, sukuk) lose headroom; cashflow forecasting accuracy falls as variance widens.'
      break
    case 'geopolitical':
      ctrlImpact = 'decrease'
      residualImpact = 'increase'
      explanation = 'Systemic shock bypasses project-level controls; forces reliance on balance-sheet buffers.'
      break
    default:
      ctrlImpact = 'no change'
      residualImpact = 'no change'
      explanation = 'Signal category not mapped to risk drivers.'
  }

  return {
    signal: signal.headline,
    signal_category: signal.category,
    impacted_drivers: drivers,
    affected_risks: affectedRisks,
    impact_on_control_effectiveness: ctrlImpact,
    impact_on_residual_risk: residualImpact,
    explanation,
  }
}

// -----------------------------------------------------------------------------
// 5. Per-risk evaluation envelope
// -----------------------------------------------------------------------------
export interface RiskAnalysis {
  risk_id: string
  risk_name: string
  clarity: ReturnType<typeof clarityScore>
  control_presence: ReturnType<typeof controlPresence>
  composite_effectiveness: number
  adequacy: ReturnType<typeof controlAdequacy>
  inherent_score: number
  residual_score: number
  recommendation: string
}

export function analyseRisk(risk: RiskDef): RiskAnalysis {
  const clarity = clarityScore(risk)
  const presence = controlPresence(risk)
  const eff = compositeEffectiveness(risk)
  const adequacy = controlAdequacy(risk)
  const inherent = risk.baseLikelihood * risk.baseImpact
  const residual = inherent * (1 - eff)

  let rec = ''
  if (!adequacy.sufficient) rec = adequacy.gap
  else if (clarity.flags.length > 0) rec = `Tighten definition: ${clarity.flags.join('; ')}`
  else if (presence === 'Weak') rec = 'Add a second control of a different type'
  else rec = 'Risk is well-structured — maintain testing cadence'

  return {
    risk_id: risk.id,
    risk_name: risk.name,
    clarity,
    control_presence: presence,
    composite_effectiveness: eff,
    adequacy,
    inherent_score: inherent,
    residual_score: residual,
    recommendation: rec,
  }
}

// -----------------------------------------------------------------------------
// 6. Register quality score (0..100)
// -----------------------------------------------------------------------------
export function registerQualityScore(): {
  total: number
  components: { completeness: number; controlStrength: number; adaptability: number }
  weakControls: Array<{ risk: string; reason: string }>
} {
  const analyses = RISKS.map(analyseRisk)

  // Completeness: average clarity score
  const completeness =
    analyses.reduce((s, a) => s + a.clarity.score, 0) / analyses.length

  // Control strength: average composite effectiveness × 100
  const controlStrength =
    (analyses.reduce((s, a) => s + a.composite_effectiveness, 0) / analyses.length) * 100

  // Adaptability: % of drivers covered by at least one risk × % of categories covered
  const driversCovered = new Set<string>()
  const categoriesCovered = new Set<string>()
  RISKS.forEach((r) => {
    r.driverImpacts.forEach((d) => driversCovered.add(d.driverId))
    categoriesCovered.add(r.category)
  })
  const driverCoverage = (driversCovered.size / 8) * 100
  const categoryCoverage = (categoriesCovered.size / 6) * 100
  const adaptability = (driverCoverage + categoryCoverage) / 2

  const weakControls = analyses
    .filter((a) => !a.adequacy.sufficient || a.control_presence === 'None' || a.control_presence === 'Weak')
    .map((a) => ({ risk: a.risk_name, reason: a.adequacy.gap || `Control presence: ${a.control_presence}` }))

  const total = Math.round(completeness * 0.3 + controlStrength * 0.35 + adaptability * 0.35)

  return {
    total,
    components: {
      completeness: Math.round(completeness),
      controlStrength: Math.round(controlStrength),
      adaptability: Math.round(adaptability),
    },
    weakControls,
  }
}

// -----------------------------------------------------------------------------
// 7. Full deterministic envelope (no AI call)
// -----------------------------------------------------------------------------
export function criticReport(signals: ExternalSignal[] = []) {
  return {
    risk_analysis: RISKS.map(analyseRisk),
    external_correlations: signals.map(correlateSignal),
    quality: registerQualityScore(),
    generated_at: new Date().toISOString(),
    source: 'deterministic',
  }
}
