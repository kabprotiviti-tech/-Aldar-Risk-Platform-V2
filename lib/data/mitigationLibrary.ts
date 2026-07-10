/**
 * Decision Intelligence — curated mitigation library.
 * ---------------------------------------------------
 * When leadership runs or saves a scenario, the platform surfaces the response
 * options that actually address the drivers they moved — ranked by an
 * impact ÷ effort score, each with the honest cross-business trade-off.
 *
 * ── Anti-hallucination design (CLAUDE.md) ──────────────────────────────
 * This is a FIXED, curated table — not model-generated per run. The AI never
 * invents an action, a percentage, a cost, or a side-effect. Every action is
 * pre-mapped to the drivers it reduces; the reduction %, feasibility, cost
 * band, time-to-effect and trade-off are deterministic data that a human can
 * inspect and calibrate. All figures are ILLUSTRATIVE and surfaced as such,
 * pending calibration against Aldar's books in pilot. Recommendations are
 * decision-support hypotheses for leadership to approve — not automated advice.
 */

export type Feasibility = 'High' | 'Medium' | 'Low'
export type TimeToEffect = '0-3mo' | '3-12mo' | '12mo+'
export type CostBand = '<10M' | '10-50M' | '50-150M' | '150M+'

export interface MitigationAction {
  id: string
  title: string
  /** Function/owner that executes it. */
  owner: string
  /** Driver keys (from scenarioDrivers.ts) this action reduces. */
  drivers: string[]
  /** Single mid-point reduction applied to the addressed portion of the stress. */
  reductionPct: number
  feasibility: Feasibility
  /** Only set when the action carries a time-to-effect / schedule impact. */
  timeToEffect?: TimeToEffect
  /** Illustrative AED-million cost band, clearly labelled in the UI. */
  costBand: CostBand
  /** Plain, professional rationale — one line, no marketing language. */
  rationale: string
  /** The honest cross-business impact / trade-off. */
  tradeoff: string
}

/** Weights used for the impact ÷ effort ranking (all inspectable). */
export const FEASIBILITY_WEIGHT: Record<Feasibility, number> = { High: 1, Medium: 2, Low: 3 }
export const TIME_WEIGHT: Record<TimeToEffect, number> = { '0-3mo': 1, '3-12mo': 2, '12mo+': 3 }
export const COST_WEIGHT: Record<CostBand, number> = { '<10M': 1, '10-50M': 1.5, '50-150M': 2, '150M+': 3 }
export const COST_LABEL: Record<CostBand, string> = {
  '<10M': '< AED 10M',
  '10-50M': 'AED 10–50M',
  '50-150M': 'AED 50–150M',
  '150M+': 'AED 150M+',
}

export const MITIGATION_LIBRARY: MitigationAction[] = [
  // ── Rate / refinancing / liquidity ──────────────────────────────────
  {
    id: 'debt-ladder',
    title: 'Extend and stagger the debt maturity ladder',
    owner: 'Group Treasury',
    drivers: ['rate', 'refi'],
    reductionPct: 38,
    feasibility: 'Medium',
    timeToEffect: '3-12mo',
    costBand: '10-50M',
    rationale: 'Spreading maturities removes the single-year refinancing cliff that a rate move hits hardest.',
    tradeoff: 'Locks in today’s spread and reduces room to prepay if rates fall; ties up bank lines that could otherwise fund new launches.',
  },
  {
    id: 'fix-hedge',
    title: 'Raise the fixed-rate / hedged share of the debt book',
    owner: 'Group Treasury',
    drivers: ['rate', 'refi'],
    reductionPct: 38,
    feasibility: 'High',
    timeToEffect: '0-3mo',
    costBand: '10-50M',
    rationale: 'Converting floating exposure to fixed caps the funding cost the scenario is stressing.',
    tradeoff: 'Forgoes the benefit if rates ease, and hedge accounting adds quarter-to-quarter P&L movement.',
  },
  // ── Off-plan demand / FX ────────────────────────────────────────────
  {
    id: 'reprice-offplan',
    title: 'Reprice and re-phase off-plan launches; adjust payment plans',
    owner: 'Development — Sales & Commercial',
    drivers: ['demand', 'fx'],
    reductionPct: 18,
    feasibility: 'High',
    timeToEffect: '0-3mo',
    costBand: '50-150M',
    rationale: 'Payment-plan and pricing levers protect sales velocity without waiting on the market to turn.',
    tradeoff: 'Compresses development margin and can reset price expectations across the wider inventory.',
  },
  {
    id: 'buyer-mix',
    title: 'Broaden the buyer mix beyond the exposed overseas segment',
    owner: 'Development — Marketing & Distribution',
    drivers: ['fx', 'demand'],
    reductionPct: 18,
    feasibility: 'Medium',
    timeToEffect: '3-12mo',
    costBand: '10-50M',
    rationale: 'Widening the buyer base lowers reliance on a single currency and demand source.',
    tradeoff: 'Takes two to three quarters to shift the mix and can dilute premium positioning if pushed too broad.',
  },
  // ── Construction cost / supply chain ────────────────────────────────
  {
    id: 'lock-materials',
    title: 'Lock key materials through fixed-price / forward procurement',
    owner: 'Group Procurement',
    drivers: ['cost', 'supply'],
    reductionPct: 38,
    feasibility: 'Medium',
    timeToEffect: '3-12mo',
    costBand: '50-150M',
    rationale: 'Forward and fixed-price contracts take input-cost volatility off the active pipeline.',
    tradeoff: 'Commits working capital early and carries downside if input prices later fall.',
  },
  {
    id: 'supply-realign',
    title: 'Re-align the supply chain (dual-source / regionalise suppliers)',
    owner: 'Group Procurement + Project Delivery',
    drivers: ['supply', 'cost'],
    reductionPct: 18,
    feasibility: 'Medium',
    timeToEffect: '3-12mo',
    costBand: '10-50M',
    rationale: 'A second qualified source reduces single-supplier dependency and lead-time risk.',
    tradeoff: 'Directly affects project timelines: onboarding and re-qualifying suppliers introduces a mobilisation lag that can push handover dates on the active pipeline.',
  },
  {
    id: 'value-engineer',
    title: 'Value-engineer scope on the active pipeline',
    owner: 'Design & Development',
    drivers: ['cost'],
    reductionPct: 18,
    feasibility: 'High',
    timeToEffect: '3-12mo',
    costBand: '<10M',
    rationale: 'Design and specification review recovers margin without deferring the programme.',
    tradeoff: 'Can affect product specification and, if pushed too far, the premium brand positioning.',
  },
  // ── Occupancy / rental / tourism ────────────────────────────────────
  {
    id: 'lease-tenor',
    title: 'Lengthen lease tenor and pre-let ahead of delivery',
    owner: 'Investment — Leasing',
    drivers: ['occupancy'],
    reductionPct: 38,
    feasibility: 'High',
    timeToEffect: '3-12mo',
    costBand: '10-50M',
    rationale: 'Longer, pre-committed leases secure recurring income before the downturn reaches it.',
    tradeoff: 'Locks in rents below open-market peak and reduces room to re-price on recovery.',
  },
  {
    id: 'hospitality-domestic',
    title: 'Rebalance hospitality toward domestic / regional demand',
    owner: 'Hospitality Operations',
    drivers: ['tourism', 'occupancy'],
    reductionPct: 18,
    feasibility: 'Medium',
    timeToEffect: '3-12mo',
    costBand: '10-50M',
    rationale: 'Shifting channel mix toward resident demand cushions RevPAR when inbound tourism softens.',
    tradeoff: 'Runs at a lower average rate and competes for the same domestic segment as other operators.',
  },
  // ── Government / infrastructure ─────────────────────────────────────
  {
    id: 'pipeline-diversify',
    title: 'Diversify the development pipeline away from infra-dependent zones',
    owner: 'Strategy & Land',
    drivers: ['govspend'],
    reductionPct: 18,
    feasibility: 'Low',
    timeToEffect: '12mo+',
    costBand: '150M+',
    rationale: 'A broader land bank lowers reliance on any single public infrastructure programme.',
    tradeoff: 'A multi-year strategic shift, not a lever for the current cycle; carries land acquisition and opportunity cost.',
  },
  // ── ESG / regulatory ────────────────────────────────────────────────
  {
    id: 'esg-phase',
    title: 'Phase the ESG retrofit / compliance programme',
    owner: 'Sustainability + Facilities',
    drivers: ['esg'],
    reductionPct: 38,
    feasibility: 'High',
    timeToEffect: '3-12mo',
    costBand: '50-150M',
    rationale: 'Sequencing the programme spreads the cash impact while keeping compliance on track.',
    tradeoff: 'Leaves residual exposure if regulation tightens faster than the phasing assumes.',
  },
  // ── Cross-cutting / capital ─────────────────────────────────────────
  {
    id: 'liquidity-buffer',
    title: 'Build a scenario-linked capital / liquidity buffer',
    owner: 'Group CFO',
    drivers: ['refi', 'demand', 'occupancy'],
    reductionPct: 18,
    feasibility: 'High',
    timeToEffect: '0-3mo',
    costBand: '150M+',
    rationale: 'A held reserve buys time and optionality across every driver in the scenario.',
    tradeoff: 'Lowers deployable capital and blended return on equity for as long as it is held.',
  },
  {
    id: 'asset-recycle',
    title: 'Accelerate non-core asset recycling to release capital',
    owner: 'Investment + Group CFO',
    drivers: ['refi', 'demand'],
    reductionPct: 18,
    feasibility: 'Medium',
    timeToEffect: '3-12mo',
    costBand: '150M+',
    rationale: 'Recycling mature assets strengthens liquidity ahead of a tighter funding market.',
    tradeoff: 'Crystallises value on a soft-market timeline and forgoes future upside on the asset sold.',
  },
  {
    id: 'phase-launches',
    title: 'Tighten development phasing / defer discretionary launches',
    owner: 'Development — Portfolio Planning',
    drivers: ['cost', 'demand', 'supply'],
    reductionPct: 38,
    feasibility: 'High',
    timeToEffect: '0-3mo',
    costBand: '50-150M',
    rationale: 'Deferring discretionary launches cuts exposure quickly and preserves cash.',
    tradeoff: 'Slows the growth trajectory and can concede first-mover position on key launches.',
  },
]

// ── Ranking ───────────────────────────────────────────────────────────

export interface RankedMitigation {
  action: MitigationAction
  /** AED-million reduction on this scenario (reduction% × addressed stress). */
  impactAedM: number
  /** 1 (easy) – 3 (hard); mean of feasibility, cost and time weights. */
  effortIndex: number
  /** impact ÷ effort — higher is a better return on effort. */
  score: number
}

/**
 * Rank the library against a specific scenario.
 * @param driverContribM  map of driver key → AED-million contribution in this run
 */
export function rankMitigations(driverContribM: Record<string, number>): RankedMitigation[] {
  const activeKeys = Object.keys(driverContribM).filter((k) => (driverContribM[k] || 0) > 0)

  return MITIGATION_LIBRARY
    // only actions that address at least one driver the user actually moved
    .filter((a) => a.drivers.some((k) => activeKeys.includes(k)))
    .map((action) => {
      const addressedM = action.drivers.reduce((s, k) => s + (driverContribM[k] || 0), 0)
      const impactAedM = (action.reductionPct / 100) * addressedM
      const effortIndex =
        (FEASIBILITY_WEIGHT[action.feasibility] +
          COST_WEIGHT[action.costBand] +
          (action.timeToEffect ? TIME_WEIGHT[action.timeToEffect] : 1)) /
        3
      const score = impactAedM / effortIndex
      return { action, impactAedM, effortIndex, score }
    })
    .sort((a, b) => b.score - a.score)
}
