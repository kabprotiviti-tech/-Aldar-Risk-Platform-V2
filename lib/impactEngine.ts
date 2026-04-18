// lib/impactEngine.ts
// Maps fusion signals + internal data to per-portfolio impact assessments.
// Baseline scores are seeded from the Risk Propagation Engine (signal-driven)
// so that the impact layer compounds on top of the current macro/seasonal state.

import type { PortfolioKey } from './portfolioData'
import type { FusionResult } from '@/app/api/fusion/route'
import type { InternalDataSnapshot } from './internalData'
import { PROPAGATED_METRICS, CURRENT_SIGNALS, DERIVED_STATE } from './riskPropagationEngine'

export interface PortfolioImpact {
  portfolio: PortfolioKey
  name: string
  impactLevel: 'critical' | 'high' | 'medium' | 'low'
  impactScore: number      // 0–100
  revenueAtRisk: number    // AED M (point estimate)
  primaryDriver: string
  contributingFactors: string[]
  amplified: boolean
}

export interface CauseEffectLink {
  cause: string
  effect: string
  portfolio: PortfolioKey
  severity: 'high' | 'medium' | 'low'
}

export interface ImpactEngineResult {
  portfolioImpacts: PortfolioImpact[]
  causeEffectChain: CauseEffectLink[]
  overallAmplified: boolean
  systemicRisk: boolean  // true if 3+ portfolios affected at high+
}

// ─── Keyword → portfolio affinity weights ────────────────────────────────────
const KEYWORD_WEIGHTS: { keywords: string[]; weights: Partial<Record<PortfolioKey, number>> }[] = [
  {
    keywords: ['interest rate', 'mortgage', 'property', 'real estate', 'housing', 'off-plan', 'residential'],
    weights: { 'real-estate': 0.9, retail: 0.3, hospitality: 0.2, education: 0.1, facilities: 0.1 },
  },
  {
    keywords: ['retail', 'consumer', 'spending', 'mall', 'tenant', 'footfall', 'e-commerce', 'shopping'],
    weights: { 'real-estate': 0.2, retail: 0.9, hospitality: 0.3, education: 0.1, facilities: 0.2 },
  },
  {
    keywords: ['tourism', 'hotel', 'travel', 'hospitality', 'occupancy', 'airline', 'visitor', 'theme park'],
    weights: { 'real-estate': 0.2, retail: 0.4, hospitality: 0.9, education: 0.1, facilities: 0.2 },
  },
  {
    keywords: ['education', 'school', 'student', 'enrollment', 'curriculum', 'teacher', 'university'],
    weights: { 'real-estate': 0.1, retail: 0.1, hospitality: 0.1, education: 0.9, facilities: 0.1 },
  },
  {
    keywords: ['facility', 'maintenance', 'fm', 'building', 'smart building', 'iot', 'cyber', 'infrastructure'],
    weights: { 'real-estate': 0.3, retail: 0.3, hospitality: 0.3, education: 0.2, facilities: 0.9 },
  },
  {
    keywords: ['oil', 'energy', 'economy', 'gdp', 'recession', 'inflation', 'uae', 'aed', 'federal'],
    weights: { 'real-estate': 0.7, retail: 0.6, hospitality: 0.6, education: 0.4, facilities: 0.3 },
  },
  {
    keywords: ['regulation', 'compliance', 'policy', 'law', 'government', 'tax'],
    weights: { 'real-estate': 0.5, retail: 0.5, hospitality: 0.4, education: 0.7, facilities: 0.5 },
  },
  {
    keywords: ['supply chain', 'construction', 'materials', 'labour', 'cost', 'project'],
    weights: { 'real-estate': 0.8, retail: 0.2, hospitality: 0.3, education: 0.2, facilities: 0.6 },
  },
]

// Revenue base per portfolio (AED M, annual)
const REVENUE_BASE: Record<PortfolioKey, number> = {
  'real-estate': 1200,
  retail: 800,
  hospitality: 600,
  education: 400,
  facilities: 350,
}

// ─── Cause-Effect chain templates (propagation-aware) ────────────────────────
// Templates now reflect the full causal path from signal → portfolio impact.
const CAUSE_EFFECT_TEMPLATES: CauseEffectLink[] = [
  // Tourism propagation chain
  {
    cause: 'Geopolitical Risk (medium) → Tourism Index −8pts',
    effect: 'Effective tourism 48/100 — shoulder season amplification',
    portfolio: 'hospitality',
    severity: 'high',
  },
  {
    cause: 'Tourism Index 48/100 → Hotel Occupancy 68% (below 70% threshold)',
    effect: 'RevPAR −6.2% YoY — EBITDA margin compression',
    portfolio: 'hospitality',
    severity: 'high',
  },
  {
    cause: 'Hotel Occupancy Decline → Yas Island Footfall Contraction',
    effect: 'Retail footfall index 67/100 — tenant turnover rent underperformance',
    portfolio: 'retail',
    severity: 'medium',
  },
  {
    cause: 'Footfall 67/100 + Consumer Spending Index 66/100',
    effect: 'Tenant stress: medium — 7 tenants on covenant watchlist',
    portfolio: 'retail',
    severity: 'medium',
  },
  // Rate environment chain
  {
    cause: 'Restrictive Rate Environment (+175bps cumulative)',
    effect: 'Mortgage affordability −18% → off-plan absorption at 71% of target',
    portfolio: 'real-estate',
    severity: 'high',
  },
  {
    cause: 'Construction Cost Index 118 (+18% vs. 2023)',
    effect: 'Active pipeline margin compression — AED 48M overrun on Saadiyat Ph.2',
    portfolio: 'real-estate',
    severity: 'high',
  },
  // Cross-portfolio macro chain
  {
    cause: 'Consumer Spending Index Decline (66/100)',
    effect: 'Retail tenant default risk elevated — anchor lease renewal risk',
    portfolio: 'retail',
    severity: 'high',
  },
  {
    cause: 'Expat Population Sensitivity to Macro Signals',
    effect: 'School enrollment pipeline at 62% of target for new campuses',
    portfolio: 'education',
    severity: 'medium',
  },
  {
    cause: 'IoT Fleet Expansion (+340 endpoints) + Regional Cyber Threats',
    effect: 'Smart-building OT/IT boundary exposure — NCA advisory active',
    portfolio: 'facilities',
    severity: 'high',
  },
  {
    cause: 'FM Outsourcing SLA Decline (87%→79% CSAT)',
    effect: 'Tenant retention risk + asset valuation premium erosion',
    portfolio: 'facilities',
    severity: 'medium',
  },
]

// ─── Core engine ──────────────────────────────────────────────────────────────
export function runImpactEngine(
  fusionResult?: FusionResult | null,
  internalData?: Partial<InternalDataSnapshot> | null,
  headline?: string
): ImpactEngineResult {
  const portfolioKeys: PortfolioKey[] = [
    'real-estate', 'retail', 'hospitality', 'education', 'facilities',
  ]

  // Score each portfolio based on keyword affinity
  const scores: Record<PortfolioKey, number> = {
    'real-estate': 0,
    retail: 0,
    hospitality: 0,
    education: 0,
    facilities: 0,
  }

  const combined = [
    headline ?? '',
    fusionResult?.fusionInsight ?? '',
    fusionResult?.affectedBusiness ?? '',
    ...(fusionResult?.contributingFactors ?? []),
  ].join(' ').toLowerCase()

  for (const { keywords, weights } of KEYWORD_WEIGHTS) {
    const matches = keywords.filter((k) => combined.includes(k)).length
    if (matches > 0) {
      const boost = Math.min(1, matches / keywords.length * 3)
      for (const [p, w] of Object.entries(weights) as [PortfolioKey, number][]) {
        scores[p] += boost * w
      }
    }
  }

  // Blend with fusion impact if available
  const fusionAmplified = fusionResult?.amplified ?? false
  const fusionImpact = fusionResult?.impactLevel ?? 'medium'
  const fusionMultiplier =
    fusionImpact === 'critical' ? 1.4
    : fusionImpact === 'high' ? 1.2
    : fusionImpact === 'medium' ? 1.0
    : 0.8

  // Apply internal data overrides
  const internalOverrides: Partial<Record<PortfolioKey, number>> = {}
  if (internalData?.hospitality?.riskFlag) internalOverrides.hospitality = 0.7
  if (internalData?.retail?.tenantStress === 'high') internalOverrides.retail = 0.65
  if (internalData?.projects?.delays) internalOverrides['real-estate'] = 0.6
  if (internalData?.finance?.alertFlag) {
    portfolioKeys.forEach((p) => { internalOverrides[p] = (internalOverrides[p] ?? 0.3) + 0.15 })
  }

  // ── Propagation Engine baseline ─────────────────────────────────────────────
  // Seed portfolio scores from the propagation engine so they reflect current
  // macro/seasonal state (tourism index, rate env, seasonality, events).
  // Keyword scores then ADD incremental impact on top of this baseline.
  const propagationBaseline: Record<PortfolioKey, number> = {
    'real-estate': PROPAGATED_METRICS['real-estate'].riskScore / 100,
    retail:        PROPAGATED_METRICS.retail.riskScore / 100,
    hospitality:   PROPAGATED_METRICS.hospitality.riskScore / 100,
    education:     PROPAGATED_METRICS.education.riskScore / 100,
    facilities:    PROPAGATED_METRICS.facilities.riskScore / 100,
  }

  // Build portfolio impacts
  const portfolioImpacts: PortfolioImpact[] = portfolioKeys.map((p) => {
    // Blend: 60% propagation baseline + 40% keyword/fusion signal
    const keywordContrib = scores[p] * fusionMultiplier + (internalOverrides[p] ?? 0)
    const rawScore = Math.min(1, propagationBaseline[p] * 0.6 + (keywordContrib / 2) * 0.4)
    const impactScore = Math.round(rawScore * 100)

    const level: PortfolioImpact['impactLevel'] =
      impactScore >= 70 ? 'critical'
      : impactScore >= 45 ? 'high'
      : impactScore >= 25 ? 'medium'
      : 'low'

    // Revenue at risk: proportional to score × revenue base × amplification
    const riskPct = rawScore * (fusionAmplified ? 0.22 : 0.14)
    const revenueAtRisk = Math.round(REVENUE_BASE[p] * riskPct)

    const names: Record<PortfolioKey, string> = {
      'real-estate': 'Real Estate',
      retail: 'Retail',
      hospitality: 'Hospitality',
      education: 'Education',
      facilities: 'Facilities',
    }

    // Propagation-aware primary drivers reference current signal state
    const drivers: Record<PortfolioKey, string> = {
      'real-estate': fusionAmplified
        ? `Rate environment restrictive (+${CURRENT_SIGNALS.uae_rate_delta_bps}bps) + construction cost index ${CURRENT_SIGNALS.construction_cost_index} — margin squeeze amplified by external signal`
        : `Rate headwinds (${CURRENT_SIGNALS.uae_rate_delta_bps}bps) and pipeline costs +${CURRENT_SIGNALS.construction_cost_index - 100}% are primary pressure vectors`,
      retail: fusionAmplified
        ? `Footfall index ${DERIVED_STATE.derivedFootfall.toFixed(0)}/100 + tenant stress ${DERIVED_STATE.derivedTenantStress} — downstream from tourism signal convergence`
        : `Footfall at ${DERIVED_STATE.derivedFootfall.toFixed(0)}/100 with ${CURRENT_SIGNALS.tenant_stress_level} tenant stress — monitoring threshold`,
      hospitality: fusionAmplified
        ? `Effective tourism ${DERIVED_STATE.effectiveTourism.toFixed(0)}/100 + occupancy ${DERIVED_STATE.derivedOccupancy.toFixed(0)}% (below 70% threshold) — shoulder season amplifying external signal`
        : `Tourism index ${CURRENT_SIGNALS.tourism_index}/100 (shoulder season, no events until ${CURRENT_SIGNALS.next_major_event}). Occupancy ${DERIVED_STATE.derivedOccupancy.toFixed(0)}%`,
      education: fusionAmplified
        ? 'Enrollment pipeline sensitivity to macro signals elevated; ADEK compliance gap remains open'
        : 'Structurally resilient — ADEK compliance and enrollment sequencing are primary watch items',
      facilities: fusionAmplified
        ? 'IoT cyber risk + FM outsourcing SLA breach converging — smart-building threat level elevated by external signal'
        : 'Cyber risk is growing fastest in this portfolio — IoT expansion outpacing security controls',
    }

    return {
      portfolio: p,
      name: names[p],
      impactLevel: level,
      impactScore,
      revenueAtRisk,
      primaryDriver: drivers[p],
      contributingFactors: (fusionResult?.contributingFactors ?? ['Propagation engine baseline', 'Macro signal layer', 'Portfolio exposure weight']).slice(0, 3),
      amplified: fusionAmplified,
    }
  })

  // Select relevant cause-effect chain
  const affectedPortfolios = portfolioImpacts.filter((p) => p.impactLevel === 'high' || p.impactLevel === 'critical').map((p) => p.portfolio)
  const causeEffectChain = CAUSE_EFFECT_TEMPLATES.filter((link) =>
    affectedPortfolios.includes(link.portfolio) || link.severity === 'high'
  ).slice(0, 5)

  const systemicRisk = portfolioImpacts.filter((p) => p.impactLevel === 'high' || p.impactLevel === 'critical').length >= 3

  return {
    portfolioImpacts,
    causeEffectChain,
    overallAmplified: fusionAmplified,
    systemicRisk,
  }
}
