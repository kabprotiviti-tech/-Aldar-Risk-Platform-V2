/**
 * Critical & High risk breakdown — the named list behind the dashboard's
 * "Critical & High" headline tile.
 * -------------------------------------------------------------------------
 * The dashboard headline counts (2 Critical + 7 High = 9) come from the
 * curated BASELINE_RISK_POSTURE — the board-facing illustrative figures used
 * consistently across the app. This file is the matching NAMED list so a CEO
 * can drill the "9" open and see exactly which risks it is. Counts here MUST
 * stay in sync with BASELINE_RISK_POSTURE.criticalRiskCount / highRiskCount.
 *
 * Illustrative / pre-pilot — pilot replaces this with the live register's
 * own critical+high slice once the engine register and the group headline
 * are wired to one source.
 */

export type TopRiskRating = 'Critical' | 'High'

export interface TopRisk {
  id: string
  name: string
  rating: TopRiskRating
  owner: string
  entity: string
  residual: number // out of 25
  exposureAedMn: number
}

// 2 Critical + 7 High = 9  (matches BASELINE_RISK_POSTURE)
export const CRITICAL_HIGH_RISKS: TopRisk[] = [
  { id: 'R-001', name: 'Construction Cost Overrun', rating: 'Critical', owner: 'Chief Development Officer', entity: 'Aldar Development', residual: 21.4, exposureAedMn: 620 },
  { id: 'R-008', name: 'Cash-Flow / Liquidity Stress', rating: 'Critical', owner: 'Group CFO', entity: 'Aldar Group', residual: 18.9, exposureAedMn: 540 },
  { id: 'R-003', name: 'Off-Plan Sales Slowdown', rating: 'High', owner: 'Chief Commercial Officer', entity: 'Aldar Development', residual: 15.2, exposureAedMn: 480 },
  { id: 'R-004', name: 'Lease Revenue Decline', rating: 'High', owner: 'Head of Asset Management', entity: 'Aldar Investment', residual: 14.6, exposureAedMn: 360 },
  { id: 'R-002', name: 'Project Delivery Delay', rating: 'High', owner: 'Head of Project Delivery', entity: 'Aldar Development', residual: 14.1, exposureAedMn: 300 },
  { id: 'R-006', name: 'Contractor Default / Underperformance', rating: 'High', owner: 'Head of Procurement', entity: 'Aldar Development', residual: 13.5, exposureAedMn: 240 },
  { id: 'R-007', name: 'Supply-Chain Disruption', rating: 'High', owner: 'Chief Procurement Officer', entity: 'Aldar Group', residual: 13.0, exposureAedMn: 190 },
  { id: 'R-013', name: 'Interest-Rate / Financing Cost', rating: 'High', owner: 'Group Treasury', entity: 'Aldar Group', residual: 12.6, exposureAedMn: 210 },
  { id: 'R-009', name: 'Regulatory Change — RERA / ESG', rating: 'High', owner: 'General Counsel', entity: 'Aldar Group', residual: 12.2, exposureAedMn: 150 },
]
