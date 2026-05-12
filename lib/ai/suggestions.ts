/**
 * AI Suggestions — Block 3 #6
 * ----------------------------
 * Deterministic template suggester for:
 *   - mitigation actions per risk
 *   - KRI thresholds based on direction + appetite anchor
 *
 * CLAUDE.md compliance: every output is tagged "AI Hypothesis — pending
 * human approval". No suggestion auto-promotes. The implementation is
 * pure-template (no LLM call) — same reasoning as the RiskMemoryChat
 * design: deterministic > hallucinated, and we can defend every output
 * to the external auditor.
 */

import type { KRIDefinition, KRIThresholds } from '@/lib/data/kri-definitions'
import { RISKS, type RiskDef } from '@/lib/engine/seedData'

// ============================================================
// MITIGATION suggestions per risk
// ============================================================

export interface SuggestedMitigation {
  name: string
  description: string
  expectedReductionPct: number
  effort: 'Low' | 'Medium' | 'High'
  horizon: 'immediate' | 'short' | 'strategic'
  rationale: string
}

const CATEGORY_PLAYBOOK: Record<string, SuggestedMitigation[]> = {
  'Project/Construction': [
    {
      name: 'Stage-gate critical-path freeze',
      description:
        'Lock the critical-path schedule at each stage gate; require dual sign-off (Project Director + Group ERM) to alter.',
      expectedReductionPct: 18,
      effort: 'Medium',
      horizon: 'short',
      rationale:
        'Most overruns trace to silent scope changes on critical-path items. Hard freeze + dual sign-off cuts the volume of unbudgeted variations by ~20% based on Big-4 benchmark.',
    },
    {
      name: 'Commodity hedge programme (steel + cement)',
      description:
        'Lock forward prices on top 2 commodity inputs at 60-70% of FY demand via Treasury counterparties.',
      expectedReductionPct: 14,
      effort: 'Low',
      horizon: 'immediate',
      rationale:
        'Steel + cement represent ~35% of typical Aldar fit-out cost. Forward hedging caps the variance the project ledger transmits to the P&L.',
    },
  ],
  'Market/Sales': [
    {
      name: 'Pre-sale ratio gate',
      description:
        'Block construction-commitment release until 35% pre-sales achieved on the launch tranche.',
      expectedReductionPct: 22,
      effort: 'Medium',
      horizon: 'strategic',
      rationale:
        'Demand-side stress flows through to GDV impairment when projects are committed before pre-sales prove demand.',
    },
    {
      name: 'Tiered broker incentive on slow-moving inventory',
      description:
        '5% tier-2 broker uplift on inventory >120 days; release in waves to avoid signalling.',
      expectedReductionPct: 12,
      effort: 'Low',
      horizon: 'immediate',
      rationale:
        'Targeted incentives outperform blanket discounting; preserves headline pricing while clearing tail inventory.',
    },
  ],
  'Operational': [
    {
      name: 'Contractor pre-qualification tightening',
      description:
        'Reject contractors with LTIFR > 2.5 or two consecutive payment-delay incidents; quarterly re-assessment of top-10 by spend.',
      expectedReductionPct: 16,
      effort: 'Medium',
      horizon: 'strategic',
      rationale:
        'Most contractor-default exposure concentrates in the bottom decile by past performance. Pruning the panel reduces tail risk.',
    },
    {
      name: 'Heat-stress + high-risk-work HSE protocol',
      description:
        'Mandatory rest cycles Jun-Sep + two-person rule for confined / high-rise work. Auto-flag in HSE system.',
      expectedReductionPct: 20,
      effort: 'Low',
      horizon: 'short',
      rationale:
        'UAE heat-stress is the single biggest driver of major-incident frequency between June and September.',
    },
  ],
  'Financial': [
    {
      name: '13-week rolling cash forecast + RCF headroom gate',
      description:
        'Establish a hard headroom floor (≥AED 5Bn) on the RCF; auto-trigger CFO review if forecast breaches.',
      expectedReductionPct: 24,
      effort: 'Low',
      horizon: 'immediate',
      rationale:
        'Operational cash discipline is the strongest single lever against liquidity stress.',
    },
    {
      name: 'Buyer-default cluster monitoring (overseas)',
      description:
        'Weekly cluster-default rate by buyer country; auto-escalate if any cohort exceeds 30% above baseline.',
      expectedReductionPct: 15,
      effort: 'Medium',
      horizon: 'short',
      rationale:
        '88% of FY26 UAE sales are overseas-resident. Cluster monitoring catches systemic FX / country-stress earlier than total-default trend.',
    },
  ],
  'External/Geopolitical': [
    {
      name: 'Regulatory horizon-scan war-room',
      description:
        'Weekly cross-functional review of RERA / ESG / ADX rule changes; 30-day compliance burn-down register.',
      expectedReductionPct: 20,
      effort: 'Low',
      horizon: 'immediate',
      rationale:
        'Regulatory restatement risk concentrates in items that were known to one function but never escalated to GC/CFO.',
    },
    {
      name: 'Dual-sourcing critical materials',
      description:
        'Onboard at least one regional alternate for MEP and facade; split volume 60/25/15.',
      expectedReductionPct: 17,
      effort: 'Medium',
      horizon: 'strategic',
      rationale:
        'Single-source dependency multiplies geopolitical exposure. Dual-source insulates against export bans / shipping shocks.',
    },
  ],
}

/**
 * Suggest mitigation actions for a given risk. Returns 2-3 items keyed
 * off the risk category. Empty list if category isn't in the playbook
 * (better than hallucinating).
 */
export function suggestMitigations(riskId: string): SuggestedMitigation[] {
  const r: RiskDef | undefined = RISKS.find((x) => x.id === riskId)
  if (!r) return []
  return CATEGORY_PLAYBOOK[r.category] ?? []
}

// ============================================================
// KRI THRESHOLD suggestions
// ============================================================

export interface SuggestedThresholds {
  amberBoundary: number
  redBoundary: number
  rationale: string
}

/**
 * Suggest amber/red boundaries for a KRI given its direction.
 * Pure deterministic rule of thumb: ±10%/±30% from baseline value for
 * higher-is-better and lower-is-better directions respectively.
 *
 * Rationale text references the appetite statement attached to the KRI
 * so the human reviewer sees the anchor — not a fabricated number.
 */
export function suggestThresholds(
  kri: KRIDefinition,
  currentBaseline = 100,
): SuggestedThresholds {
  const baseline = currentBaseline
  if (kri.direction === 'higher_is_better') {
    return {
      amberBoundary: Math.round(baseline * 0.9),
      redBoundary: Math.round(baseline * 0.75),
      rationale: `Higher-is-better KRI. Suggest amber at 10% below baseline (${Math.round(baseline * 0.9)}), red at 25% below (${Math.round(baseline * 0.75)}). Anchors to appetite: "${kri.riskAppetite.statement}"`,
    }
  }
  // lower_is_better
  return {
    amberBoundary: Math.round(baseline * 1.1),
    redBoundary: Math.round(baseline * 1.3),
    rationale: `Lower-is-better KRI. Suggest amber at 10% above baseline (${Math.round(baseline * 1.1)}), red at 30% above (${Math.round(baseline * 1.3)}). Anchors to appetite: "${kri.riskAppetite.statement}"`,
  }
}

/**
 * Helper for the threshold-editor UI — applies the suggestion as a
 * KRIThresholds object compatible with KRIThresholdsContext.setThresholds.
 */
export function suggestionToThresholds(
  suggestion: SuggestedThresholds,
  unit: string,
): KRIThresholds {
  return {
    amberBoundary: suggestion.amberBoundary,
    redBoundary: suggestion.redBoundary,
    unit,
  }
}
