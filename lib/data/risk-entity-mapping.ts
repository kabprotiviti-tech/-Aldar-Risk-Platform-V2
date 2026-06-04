/**
 * Risk → Entity primary mapping (sidecar).
 * ----------------------------------------
 * Each engine risk is tagged with the subsidiary that primarily owns it.
 * This is ILLUSTRATIVE for MVP — production will lift entity ownership
 * from ABC's actual register where each risk has a real entity-level
 * accountable executive.
 *
 * Standing rule (CLAUDE.md): tagged honestly. ABC Education appears
 * with zero engine risks because none of R-001..R-010 are education-
 * specific in the seed register. The Portfolio Tower surfaces this
 * truthfully rather than fabricating an Education risk.
 *
 * Module 6 (Master-Subsidiary Linkage) will let the Group ERM Head
 * cascade the parent framework into each subsidiary's own register.
 */

export type EntityId =
  | 'aldar-group'
  | 'aldar-development'
  | 'aldar-investment'
  | 'aldar-education'
  | 'aldar-hospitality'

export const RISK_ENTITY_MAP: Record<string, EntityId> = {
  // Development — construction, sales, supply chain, contractor, HSE
  'R-001': 'aldar-development', // Construction Cost Overrun
  'R-002': 'aldar-development', // Project Delivery Delay
  'R-003': 'aldar-development', // Off-Plan Sales Slowdown
  'R-006': 'aldar-development', // Contractor Default / Underperformance
  'R-007': 'aldar-development', // Supply Chain Disruption
  'R-010': 'aldar-development', // HSE / Safety Incident

  // Investment — leasing, commercial / residential rental
  'R-004': 'aldar-investment', // Lease Revenue Decline

  // Hospitality — leads on R-005 because the risk name puts hospitality first
  'R-005': 'aldar-hospitality', // Occupancy Decline — Hospitality & Residential

  // Group-level — treasury / regulatory cross the portfolio
  'R-008': 'aldar-group', // Cash Flow / Liquidity Stress
  'R-009': 'aldar-group', // Regulatory Change — RERA / ESG
}

/** Look up the primary entity for a risk id; defaults to Group if unmapped. */
export function entityForRisk(riskId: string): EntityId {
  return RISK_ENTITY_MAP[riskId] || 'aldar-group'
}

/** Inverse: list every risk id currently tagged to the given entity. */
export function risksForEntity(entityId: EntityId): string[] {
  return Object.entries(RISK_ENTITY_MAP)
    .filter(([, e]) => e === entityId)
    .map(([rid]) => rid)
}
