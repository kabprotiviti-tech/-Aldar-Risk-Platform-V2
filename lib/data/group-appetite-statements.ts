/**
 * Group-Level Risk Appetite Statements
 * ------------------------------------
 * Qualitative appetite statements at the Group level — the layer above
 * the per-KRI quantitative thresholds in kri-definitions.ts. These are
 * the statements the Audit & Risk Committee sanctions and the Board
 * acknowledges; per-KRI numerical thresholds derive from them.
 *
 * All statements are illustrative pre-pilot calibrations. Pilot will
 * replace these with the ABC-approved appetite framework signed off
 * by the Audit & Risk Committee.
 */

export type AppetiteCategory =
  | 'financial'
  | 'strategic'
  | 'operational'
  | 'compliance'
  | 'reputational'
  | 'esg'

export type AppetiteLevel = 'averse' | 'minimal' | 'cautious' | 'open' | 'eager'

export interface GroupAppetiteStatement {
  id: string
  category: AppetiteCategory
  /** Short title (3-6 words). */
  title: string
  /** 1-2 sentence appetite statement. */
  statement: string
  /** Calibrated appetite level. */
  level: AppetiteLevel
  /** Approving body — illustrative. */
  approvedBy: string
  /** Last reviewed (ISO date). */
  lastReviewed: string
  /** Linked KRIs (KRI-NN ids). */
  linkedKRIs: string[]
}

export const APPETITE_LEVEL_META: Record<
  AppetiteLevel,
  { label: string; color: string; description: string }
> = {
  averse: {
    label: 'Averse',
    color: '#FF3B3B',
    description: 'Avoidance of risk is a key objective.',
  },
  minimal: {
    label: 'Minimal',
    color: '#FF8C00',
    description: 'Preference for ultra-safe options that have a low degree of inherent risk.',
  },
  cautious: {
    label: 'Cautious',
    color: '#F5C518',
    description: 'Preference for options with low residual risk after controls.',
  },
  open: {
    label: 'Open',
    color: '#22C55E',
    description: 'Willing to consider all options and choose those most likely to deliver value.',
  },
  eager: {
    label: 'Eager',
    color: '#2D9EFF',
    description: 'Eager to be innovative and seek opportunities, accepting greater uncertainty.',
  },
}

export const APPETITE_CATEGORY_META: Record<
  AppetiteCategory,
  { label: string; color: string; description: string }
> = {
  financial: {
    label: 'Financial',
    color: '#FF6600',
    description: 'Capital, liquidity, leverage, foreign exchange exposure.',
  },
  strategic: {
    label: 'Strategic',
    color: '#A855F7',
    description: 'Market positioning, growth, M&A, portfolio mix.',
  },
  operational: {
    label: 'Operational',
    color: '#2D9EFF',
    description: 'Project delivery, supply chain, technology, people.',
  },
  compliance: {
    label: 'Compliance',
    color: '#22C55E',
    description: 'Regulatory, legal, escrow law, ADX disclosure.',
  },
  reputational: {
    label: 'Reputational',
    color: '#F5C518',
    description: 'Brand, investor confidence, customer & community trust.',
  },
  esg: {
    label: 'ESG',
    color: '#14B8A6',
    description: 'Environmental, social, governance, sustainability.',
  },
}

export const GROUP_APPETITE_STATEMENTS: GroupAppetiteStatement[] = [
  {
    id: 'GA-FIN-01',
    category: 'financial',
    title: 'Capital Structure & Leverage',
    statement:
      'Maintain net-debt-to-EBITDA below 4.0x with ≥AED 5Bn unencumbered liquidity headroom. The Group is averse to actions that materially impair investment-grade rating posture.',
    level: 'averse',
    approvedBy: 'Audit & Risk Committee (illustrative)',
    lastReviewed: '2026-01-15',
    linkedKRIs: [],
  },
  {
    id: 'GA-FIN-02',
    category: 'financial',
    title: 'Buyer Default Exposure',
    statement:
      'Tolerate buyer-default uplift up to 30% above baseline. Beyond 70% mandates Treasury-led collection action and ARC notification. Particular vigilance on overseas-resident sales given 88% of FY26 UAE pipeline.',
    level: 'cautious',
    approvedBy: 'Group Treasury (illustrative)',
    lastReviewed: '2026-02-10',
    linkedKRIs: ['KRI-13', 'KRI-16'],
  },
  {
    id: 'GA-STR-01',
    category: 'strategic',
    title: 'Portfolio Mix & Growth',
    statement:
      'Eager to expand recurring-income (Investment, Education, Hospitality) share of EBITDA, while preserving ABC Development pipeline depth. Open to opportunistic land-bank additions where unit economics support ≥18% margin.',
    level: 'eager',
    approvedBy: 'Board of Directors (illustrative)',
    lastReviewed: '2025-11-20',
    linkedKRIs: [],
  },
  {
    id: 'GA-OP-01',
    category: 'operational',
    title: 'Project Delivery & Handover',
    statement:
      'Tolerate project phase delay of ≤10% above plan and unit handover delay of ≤10% above contractual milestones. Sustained 30% above plan triggers ARC escalation and remediation programme.',
    level: 'cautious',
    approvedBy: 'Audit & Risk Committee (illustrative)',
    lastReviewed: '2025-11-20',
    linkedKRIs: ['KRI-11', 'KRI-12'],
  },
  {
    id: 'GA-OP-02',
    category: 'operational',
    title: 'Investment Portfolio Occupancy',
    statement:
      'Minimum 90% residential occupancy and 90% commercial leased GLA across the investment portfolio. Sustained drop below 80% triggers re-pricing and tenant-mix review.',
    level: 'cautious',
    approvedBy: 'Group ERM Head (illustrative)',
    lastReviewed: '2026-01-15',
    linkedKRIs: ['KRI-09', 'KRI-10'],
  },
  {
    id: 'GA-CMP-01',
    category: 'compliance',
    title: 'Regulatory & Escrow Law',
    statement:
      'Zero appetite for breach of UAE escrow law, ADX continuous disclosure obligations, RERA project registration, or DLD handover compliance. Any incident triggers immediate ARC and Board notification.',
    level: 'averse',
    approvedBy: 'Audit & Risk Committee (illustrative)',
    lastReviewed: '2026-02-10',
    linkedKRIs: [],
  },
  {
    id: 'GA-REP-01',
    category: 'reputational',
    title: 'Customer & Investor Confidence',
    statement:
      'Minimal appetite for events that materially erode customer or investor confidence. Customer NPS sustained below 40 or analyst-rating watch-negative status triggers Board review.',
    level: 'minimal',
    approvedBy: 'Board of Directors (illustrative)',
    lastReviewed: '2025-11-20',
    linkedKRIs: [],
  },
  {
    id: 'GA-ESG-01',
    category: 'esg',
    title: 'Sustainability & Net-Zero Path',
    statement:
      'Open to incremental capex / opex to maintain published net-zero trajectory and Estidama / LEED commitments. Material slippage from disclosed targets requires Board-level recalibration.',
    level: 'open',
    approvedBy: 'Board of Directors (illustrative)',
    lastReviewed: '2026-01-15',
    linkedKRIs: [],
  },
]

export function getAppetiteStatement(id: string): GroupAppetiteStatement | undefined {
  return GROUP_APPETITE_STATEMENTS.find((s) => s.id === id)
}
