// ─── Control Audit Trail ───────────────────────────────────────────────────────
// Integration Pending — replace with live GRC audit log entries.
// Simulates test history for each of the 20 ICOFAR controls.
// Each control has 3–5 historical test entries showing trend over time.
// Label: "Simulated audit data"

import type { ControlStatus } from '@/lib/controlData'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TestHistoryEntry {
  date: string          // ISO date
  result: ControlStatus // effective | partial | failed
  testedBy: string
  notes: string
  evidenceRef: string   // reference to test evidence artefact
}

export interface ControlAuditRecord {
  controlId: string
  testHistory: TestHistoryEntry[]
  latestResult: ControlStatus
  latestTestedDate: string
  latestTestedBy: string
  trendDirection: 'improving' | 'stable' | 'deteriorating'
  integrationPending: true
  dataLabel: 'Simulated audit data'
}

// ─── History definitions ──────────────────────────────────────────────────────
// 3–5 entries per control — most recent first.
// Trends show realistic patterns: stable effective, deteriorating failed, etc.

const HISTORY_MAP: Record<string, TestHistoryEntry[]> = {
  'C-001': [
    { date: '2026-04-01', result: 'effective', testedBy: 'Internal Audit — Finance', notes: 'All 12 accounts reconciled. No exceptions.', evidenceRef: 'EVD-C001-2604' },
    { date: '2026-03-01', result: 'effective', testedBy: 'Internal Audit — Finance', notes: 'Clean reconciliation. 0 items >AED 500K.', evidenceRef: 'EVD-C001-2603' },
    { date: '2026-02-01', result: 'effective', testedBy: 'Internal Audit — Finance', notes: 'Passed. CFO sign-off on file.', evidenceRef: 'EVD-C001-2602' },
    { date: '2026-01-01', result: 'effective', testedBy: 'Internal Audit — Finance', notes: 'Clean. No escalation items.', evidenceRef: 'EVD-C001-2601' },
  ],
  'C-002': [
    { date: '2026-03-01', result: 'failed',    testedBy: 'Internal Audit — Finance', notes: 'FAIL: IFRS 9 provision not updated since Q4 2025. AED 142M >90d unprovisioned.', evidenceRef: 'EVD-C002-2603' },
    { date: '2026-02-01', result: 'partial',   testedBy: 'Internal Audit — Finance', notes: 'Partial: AED 89M >90d; provision memo late by 8 days.', evidenceRef: 'EVD-C002-2602' },
    { date: '2025-12-31', result: 'effective', testedBy: 'Internal Audit — Finance', notes: 'Passed. Q4 2025 provision completed on time.', evidenceRef: 'EVD-C002-2512' },
    { date: '2025-09-30', result: 'effective', testedBy: 'Internal Audit — Finance', notes: 'Passed. Q3 aging reviewed.', evidenceRef: 'EVD-C002-2509' },
  ],
  'C-003': [
    { date: '2026-04-05', result: 'effective', testedBy: 'Internal Audit — Finance', notes: 'Q1 2026 leases reviewed. No premature recognition.', evidenceRef: 'EVD-C003-2604' },
    { date: '2026-03-05', result: 'effective', testedBy: 'Internal Audit — Finance', notes: 'Passed. IFRS 16 conditions verified.', evidenceRef: 'EVD-C003-2603' },
    { date: '2026-02-05', result: 'effective', testedBy: 'Internal Audit — Finance', notes: 'Clean review.', evidenceRef: 'EVD-C003-2602' },
  ],
  'C-004': [
    { date: '2026-04-10', result: 'partial',   testedBy: 'Internal Audit — Finance', notes: 'Partial: submitted 12 days late. 8% shortfall not escalated in 5-day window.', evidenceRef: 'EVD-C004-2604' },
    { date: '2025-12-31', result: 'effective', testedBy: 'Internal Audit — Finance', notes: 'Q4 2025 variance analysis on time.', evidenceRef: 'EVD-C004-2512' },
    { date: '2025-09-30', result: 'effective', testedBy: 'Internal Audit — Finance', notes: 'Q3 2025 passed.', evidenceRef: 'EVD-C004-2509' },
  ],
  'C-005': [
    { date: '2026-03-31', result: 'partial',   testedBy: 'Internal Audit — ESG', notes: 'Partial: Scope 3 data 68% complete. 12 suppliers outstanding.', evidenceRef: 'EVD-C005-2603' },
    { date: '2025-12-31', result: 'partial',   testedBy: 'Internal Audit — ESG', notes: 'Partial: 58% complete at year-end.', evidenceRef: 'EVD-C005-2512' },
    { date: '2025-09-30', result: 'effective', testedBy: 'Internal Audit — ESG', notes: 'Passed. Q3 2025 submission on time.', evidenceRef: 'EVD-C005-2509' },
  ],
  'C-006': [
    { date: '2026-03-15', result: 'failed',    testedBy: 'Internal Audit — Projects', notes: 'FAIL: AED 48M VO processed without Board approval. Oracle workflow not triggered.', evidenceRef: 'EVD-C006-2603' },
    { date: '2026-02-15', result: 'effective', testedBy: 'Internal Audit — Projects', notes: 'Passed. All VOs within thresholds.', evidenceRef: 'EVD-C006-2602' },
    { date: '2026-01-15', result: 'effective', testedBy: 'Internal Audit — Projects', notes: 'January clean review.', evidenceRef: 'EVD-C006-2601' },
    { date: '2025-12-15', result: 'effective', testedBy: 'Internal Audit — Projects', notes: 'Passed. Year-end review complete.', evidenceRef: 'EVD-C006-2512' },
  ],
  'C-007': [
    { date: '2026-04-08', result: 'partial',   testedBy: 'Internal Audit — Projects', notes: 'Partial: 11.2% overrun detected; reforecast not submitted within 10-day SLA.', evidenceRef: 'EVD-C007-2604' },
    { date: '2026-03-08', result: 'partial',   testedBy: 'Internal Audit — Projects', notes: 'Partial: 6.8% overrun detected; reforecast delayed 5 days.', evidenceRef: 'EVD-C007-2603' },
    { date: '2026-02-08', result: 'effective', testedBy: 'Internal Audit — Projects', notes: 'Passed. Overrun 2.1% — within tolerance.', evidenceRef: 'EVD-C007-2602' },
  ],
  'C-008': [
    { date: '2026-04-12', result: 'effective', testedBy: 'Internal Audit — Projects', notes: 'All milestones reviewed. Two minor delays <15 days. No escalation triggered.', evidenceRef: 'EVD-C008-2604' },
    { date: '2026-03-12', result: 'effective', testedBy: 'Internal Audit — Projects', notes: 'Clean review.', evidenceRef: 'EVD-C008-2603' },
    { date: '2026-02-12', result: 'effective', testedBy: 'Internal Audit — Projects', notes: 'No delays above threshold.', evidenceRef: 'EVD-C008-2602' },
  ],
  'C-009': [
    { date: '2026-01-31', result: 'failed',    testedBy: 'Internal Audit — Procurement', notes: 'FAIL: Steel/cement 78% single source. No diversification plan activated post Q4 flag.', evidenceRef: 'EVD-C009-2601' },
    { date: '2025-10-31', result: 'partial',   testedBy: 'Internal Audit — Procurement', notes: 'Partial: 71% concentration. Action plan initiated but incomplete.', evidenceRef: 'EVD-C009-2510' },
    { date: '2025-07-31', result: 'effective', testedBy: 'Internal Audit — Procurement', notes: 'Passed. Concentration at 55% — below 60% threshold.', evidenceRef: 'EVD-C009-2507' },
  ],
  'C-010': [
    { date: '2025-12-31', result: 'failed',    testedBy: 'Internal Audit — Procurement', notes: 'FAIL: Steel/cement +18% YTD vs 10% trigger. Fixed-price provisions not activated.', evidenceRef: 'EVD-C010-2512' },
    { date: '2025-09-30', result: 'partial',   testedBy: 'Internal Audit — Procurement', notes: 'Partial: +11% movement. One contract reviewed; 14 pending.', evidenceRef: 'EVD-C010-2509' },
    { date: '2025-06-30', result: 'effective', testedBy: 'Internal Audit — Procurement', notes: 'Passed. Q2 2025 review completed on time.', evidenceRef: 'EVD-C010-2506' },
  ],
  'C-011': [
    { date: '2026-03-20', result: 'effective', testedBy: 'Internal Audit — Procurement', notes: 'All contractors pre-qualified within 24m. No exceptions.', evidenceRef: 'EVD-C011-2603' },
    { date: '2025-12-20', result: 'effective', testedBy: 'Internal Audit — Procurement', notes: 'Q4 2025 pre-qualification review clean.', evidenceRef: 'EVD-C011-2512' },
    { date: '2025-09-20', result: 'effective', testedBy: 'Internal Audit — Procurement', notes: 'Passed.', evidenceRef: 'EVD-C011-2509' },
  ],
  'C-012': [
    { date: '2026-03-31', result: 'partial',   testedBy: 'Internal Audit — IT Security', notes: 'Partial: 12/40 assets reviewed. 3 VLAN configs unresolved.', evidenceRef: 'EVD-C012-2603' },
    { date: '2025-12-31', result: 'partial',   testedBy: 'Internal Audit — IT Security', notes: 'Partial: 18/40 audited. 1 shared credential — remediation in progress.', evidenceRef: 'EVD-C012-2512' },
    { date: '2025-09-30', result: 'effective', testedBy: 'Internal Audit — IT Security', notes: 'Passed. Full 40-asset audit complete.', evidenceRef: 'EVD-C012-2509' },
  ],
  'C-013': [
    { date: '2025-10-15', result: 'failed',    testedBy: 'Internal Audit — IT Security', notes: 'FAIL: BMS pen test 12 days overdue. CISA advisory N-006 issued. Last test Oct 2025.', evidenceRef: 'EVD-C013-2510' },
    { date: '2025-04-15', result: 'effective', testedBy: 'External — CrowdStrike', notes: 'Passed. Tabletop simulation completed. No critical findings.', evidenceRef: 'EVD-C013-2504' },
    { date: '2024-10-15', result: 'effective', testedBy: 'External — CrowdStrike', notes: 'Penetration test completed. 2 medium findings — remediated.', evidenceRef: 'EVD-C013-2410' },
  ],
  'C-014': [
    { date: '2026-04-01', result: 'partial',   testedBy: 'Internal Audit — IT Security', notes: 'Partial: 4 dormant privileged accounts found. 2 from Feb 2026 leavers not disabled in SLA.', evidenceRef: 'EVD-C014-2604' },
    { date: '2026-01-01', result: 'effective', testedBy: 'Internal Audit — IT Security', notes: 'Passed. All accounts reviewed. Q4 2025 departures deprovisioned on time.', evidenceRef: 'EVD-C014-2601' },
    { date: '2025-10-01', result: 'effective', testedBy: 'Internal Audit — IT Security', notes: 'Clean review.', evidenceRef: 'EVD-C014-2510' },
  ],
  'C-015': [
    { date: '2026-04-10', result: 'partial',   testedBy: 'Internal Audit — Commercial', notes: 'Partial: Q4 2026 anchor expiry identified. Replacement search not yet initiated.', evidenceRef: 'EVD-C015-2604' },
    { date: '2026-03-10', result: 'partial',   testedBy: 'Internal Audit — Commercial', notes: 'Partial: Expiry flagged but no tenant engagement commenced.', evidenceRef: 'EVD-C015-2603' },
    { date: '2026-02-10', result: 'effective', testedBy: 'Internal Audit — Commercial', notes: 'Passed. No imminent anchor expiries >5,000 sqm without plan.', evidenceRef: 'EVD-C015-2602' },
  ],
  'C-016': [
    { date: '2026-04-15', result: 'partial',   testedBy: 'Internal Audit — Hospitality', notes: 'Partial: 71% occupancy below 70% trigger for 3 weeks. Recovery plan not submitted in 5-day SLA.', evidenceRef: 'EVD-C016-2604' },
    { date: '2026-03-15', result: 'effective', testedBy: 'Internal Audit — Hospitality', notes: 'Passed. Occupancy 76% — above threshold.', evidenceRef: 'EVD-C016-2603' },
    { date: '2026-02-15', result: 'effective', testedBy: 'Internal Audit — Hospitality', notes: 'RevPAR review clean.', evidenceRef: 'EVD-C016-2602' },
  ],
  'C-017': [
    { date: '2026-04-15', result: 'failed',    testedBy: 'Internal Audit — Commercial', notes: 'FAIL: Vacancy 8.5% for 10 weeks. No repositioning plan submitted despite trigger breach.', evidenceRef: 'EVD-C017-2604' },
    { date: '2026-03-15', result: 'failed',    testedBy: 'Internal Audit — Commercial', notes: 'FAIL: Vacancy 8.1%. Control flagged; no escalation response.', evidenceRef: 'EVD-C017-2603' },
    { date: '2026-02-15', result: 'partial',   testedBy: 'Internal Audit — Commercial', notes: 'Partial: Vacancy 7.4% — above threshold. Plan requested but not submitted.', evidenceRef: 'EVD-C017-2602' },
    { date: '2026-01-15', result: 'effective', testedBy: 'Internal Audit — Commercial', notes: 'Passed. Vacancy 6.2% — within range.', evidenceRef: 'EVD-C017-2601' },
  ],
  'C-018': [
    { date: '2026-04-01', result: 'effective', testedBy: 'Internal Audit — Governance', notes: 'Q1 2026 Board Risk Report on schedule. All risks reviewed. Action plans accepted.', evidenceRef: 'EVD-C018-2604' },
    { date: '2026-01-01', result: 'effective', testedBy: 'Internal Audit — Governance', notes: 'Q4 2025 Board report on time.', evidenceRef: 'EVD-C018-2601' },
    { date: '2025-10-01', result: 'effective', testedBy: 'Internal Audit — Governance', notes: 'Q3 2025 clean.', evidenceRef: 'EVD-C018-2510' },
  ],
  'C-019': [
    { date: '2026-04-10', result: 'effective', testedBy: 'Internal Audit — Education', notes: 'ADEK submissions on track. Curriculum 40% complete. Teacher retraining initiated.', evidenceRef: 'EVD-C019-2604' },
    { date: '2026-03-10', result: 'effective', testedBy: 'Internal Audit — Education', notes: 'Monthly review clean.', evidenceRef: 'EVD-C019-2603' },
    { date: '2026-02-10', result: 'effective', testedBy: 'Internal Audit — Education', notes: 'Passed.', evidenceRef: 'EVD-C019-2602' },
  ],
  'C-020': [
    { date: '2026-04-05', result: 'partial',   testedBy: 'Internal Audit — FM', notes: 'Partial: CSAT 79% — below 80%. PIN not issued. Contract renewal 6 months away.', evidenceRef: 'EVD-C020-2604' },
    { date: '2026-01-05', result: 'effective', testedBy: 'Internal Audit — FM', notes: 'Q4 2025 review: CSAT 85% — above threshold.', evidenceRef: 'EVD-C020-2601' },
    { date: '2025-10-05', result: 'effective', testedBy: 'Internal Audit — FM', notes: 'Q3 2025 CSAT 87%. Passed.', evidenceRef: 'EVD-C020-2510' },
  ],
}

// ─── Trend derivation ─────────────────────────────────────────────────────────

function deriveTrend(history: TestHistoryEntry[]): 'improving' | 'stable' | 'deteriorating' {
  if (history.length < 2) return 'stable'
  const scores: Record<ControlStatus, number> = { effective: 2, partial: 1, failed: 0 }
  const latest = scores[history[0].result]
  const prev   = scores[history[1].result]
  if (latest > prev) return 'improving'
  if (latest < prev) return 'deteriorating'
  return 'stable'
}

// ─── Build audit records ──────────────────────────────────────────────────────

export function buildAuditTrail(): ControlAuditRecord[] {
  return Object.entries(HISTORY_MAP).map(([controlId, history]): ControlAuditRecord => {
    const latest = history[0]
    return {
      controlId,
      testHistory: history,
      latestResult:     latest.result,
      latestTestedDate: latest.date,
      latestTestedBy:   latest.testedBy,
      trendDirection:   deriveTrend(history),
      integrationPending: true,
      dataLabel: 'Simulated audit data',
    }
  })
}

// ─── Lookup helper ────────────────────────────────────────────────────────────

export function getAuditRecord(controlId: string): ControlAuditRecord | undefined {
  return buildAuditTrail().find(r => r.controlId === controlId)
}

// ─── Pre-built export ─────────────────────────────────────────────────────────

export const AUDIT_TRAIL: ControlAuditRecord[] = buildAuditTrail()

// ─── Color helpers for result display ────────────────────────────────────────

export const AUDIT_RESULT_COLOR: Record<ControlStatus, string> = {
  effective: '#22C55E',
  partial:   '#F5C518',
  failed:    '#FF3B3B',
}

export const AUDIT_RESULT_LABEL: Record<ControlStatus, string> = {
  effective: 'Effective',
  partial:   'Partial',
  failed:    'Failed',
}

export const TREND_COLOR: Record<'improving' | 'stable' | 'deteriorating', string> = {
  improving:    '#22C55E',
  stable:       '#94A3B8',
  deteriorating:'#FF3B3B',
}

export const TREND_ICON: Record<'improving' | 'stable' | 'deteriorating', string> = {
  improving:    '↑',
  stable:       '→',
  deteriorating:'↓',
}
