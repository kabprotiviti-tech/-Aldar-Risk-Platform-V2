/**
 * Recommended Actions — Batch 7 canonical object
 * ----------------------------------------------
 * ONE source of truth for the group's recommended response plan. Before
 * this, the same actions were re-declared independently inside the Cost-of-
 * Inaction panel, the ARC pack and the scenario climax — so the demo could
 * (and did) show the same "recommendation" three different ways. This module
 * is the single canonical list; every surface now reads from it.
 *
 * Each action is tiered by urgency, carries an owner, and links back to the
 * scenario/risk that motivated it. Illustrative pre-pilot; the pilot wires
 * these to the engine's mitigation-action store.
 */

export type ActionTier = 'immediate' | '30day' | '90day' | 'board'

export interface RecommendedAction {
  id: string
  tier: ActionTier
  label: string
  detail: string
  owner: string
  /** The risk/scenario id this action responds to, for traceability. */
  linkedTo?: string
}

export const TIER_META: Record<
  ActionTier,
  { label: string; short: string; order: number }
> = {
  immediate: { label: 'Immediate', short: 'Now', order: 0 },
  '30day': { label: 'Within 30 days', short: '30d', order: 1 },
  '90day': { label: 'Within 90 days', short: '90d', order: 2 },
  board: { label: 'Board decision', short: 'Board', order: 3 },
}

export const RECOMMENDED_ACTIONS: RecommendedAction[] = [
  {
    id: 'RA-01',
    tier: 'immediate',
    label: 'Activate 13-week cash hedge top-up',
    detail: 'CFO directive — close +AED 250M FX hedge gap on the overseas-buyer book.',
    owner: 'Group CFO',
    linkedTo: 'S-001',
  },
  {
    id: 'RA-02',
    tier: 'immediate',
    label: 'Freeze new GMP commitments',
    detail: 'Pause new contractor GMP awards until Suez-disruption pricing settles.',
    owner: 'Risk Head + CDO',
    linkedTo: 'S-002',
  },
  {
    id: 'RA-03',
    tier: '30day',
    label: 'Dual-source MEP + facade panel',
    detail: 'Onboard a regional alternate; split volume 60/25/15.',
    owner: 'Procurement Head',
    linkedTo: 'S-002',
  },
  {
    id: 'RA-04',
    tier: '30day',
    label: 'KRI threshold re-baseline',
    detail: 'Refresh amber/red boundaries on KRI-10 / 13 / 15 with post-Q1 26 data.',
    owner: 'ERM Head',
    linkedTo: 'KRI-13',
  },
  {
    id: 'RA-05',
    tier: '90day',
    label: 'Stage-gate critical-path freeze',
    detail: 'Dual sign-off (Project Director + Group ERM) for any critical-path alteration.',
    owner: 'CDO',
    linkedTo: 'S-003',
  },
  {
    id: 'RA-06',
    tier: '90day',
    label: 'Contractor panel pruning',
    detail: 'Drop the bottom decile by past performance; quarterly re-assessment.',
    owner: 'Procurement Head',
    linkedTo: 'S-002',
  },
  {
    id: 'RA-07',
    tier: 'board',
    label: 'Approve appetite increase on concentration tolerance',
    detail: 'GA-CMP-01 — proposed +12% concentration tolerance to support the FY26 launch tranche.',
    owner: 'ARC Chair',
    linkedTo: 'GA-CMP-01',
  },
  {
    id: 'RA-08',
    tier: 'board',
    label: 'Note cyber + IT-resilience capex uplift',
    detail: 'AED 35M one-time for SOC modernisation + DR-site upgrade.',
    owner: 'Board',
    linkedTo: 'S-004',
  },
]

/** Actions for a given tier, in declaration order. */
export function actionsByTier(tier: ActionTier): RecommendedAction[] {
  return RECOMMENDED_ACTIONS.filter((a) => a.tier === tier)
}

/** All tiers in display order, each with its actions. */
export function actionsGroupedByTier(): Array<{
  tier: ActionTier
  meta: (typeof TIER_META)[ActionTier]
  actions: RecommendedAction[]
}> {
  return (Object.keys(TIER_META) as ActionTier[])
    .sort((a, b) => TIER_META[a].order - TIER_META[b].order)
    .map((tier) => ({ tier, meta: TIER_META[tier], actions: actionsByTier(tier) }))
}
