// ─── Control Testing Engine ────────────────────────────────────────────────────
// Integration Pending — replace with live GRC test workflow when available.
// Simulates control test results for each of the 20 ICOFAR controls.
// Logic:
//   - If nextDue < today → 'overdue'
//   - 30% of controls → testResult = 'fail'
//   - 20% of controls → testResult = 'partial'
//   - remainder → testResult = 'pass'
// All test data is deterministic (no random()) — fixed assignments per control ID.

import { controls, type Control, type ControlStatus } from '@/lib/controlData'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TestResult = 'pass' | 'fail' | 'partial' | 'not-tested'
export type TestStatus = 'current' | 'overdue' | 'due-soon'   // due-soon = within 14 days

export interface ControlTestRecord {
  controlId: string
  controlName: string
  process: Control['process']
  frequency: Control['frequency']
  owner: Control['owner']
  linkedRiskId: string
  linkedRiskTitle: string
  portfolio: Control['portfolio']
  controlType: Control['controlType']
  icafarAssertion: Control['icafarAssertion']
  controlStatus: ControlStatus

  // Testing fields
  lastTestDate: string          // ISO date
  nextTestDue: string           // ISO date
  testFrequency: string         // human label e.g. "Monthly", "Quarterly"
  testResult: TestResult
  testStatus: TestStatus        // derived from nextTestDue vs today
  daysUntilDue: number          // negative = overdue
  testerName: string
  testEvidence: string          // what was reviewed
  testNotes: string             // findings or pass rationale
  integrationPending: boolean
}

// ─── Today constant ───────────────────────────────────────────────────────────

const TODAY = new Date('2026-04-18')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(from: string, to: Date): number {
  const d = new Date(from)
  return Math.round((d.getTime() - to.getTime()) / (1000 * 60 * 60 * 24))
}

function deriveTestStatus(nextDue: string): TestStatus {
  const days = daysBetween(nextDue, TODAY)
  if (days < 0) return 'overdue'
  if (days <= 14) return 'due-soon'
  return 'current'
}

// ─── Fixed test assignments ───────────────────────────────────────────────────
// Deterministic per control ID — no randomness.
// Distribution: 6 fail (30%), 4 partial (20%), 10 pass (50%).

interface TestAssignment {
  testResult: TestResult
  testerName: string
  testNotes: string
}

const TEST_ASSIGNMENTS: Record<string, TestAssignment> = {
  'C-001': {
    testResult: 'pass',
    testerName: 'Internal Audit — Finance Team',
    testNotes: 'All 12 bank accounts reconciled. No items >AED 500K outstanding >30 days. CFO sign-off confirmed.',
  },
  'C-002': {
    testResult: 'fail',
    testerName: 'Internal Audit — Finance Team',
    testNotes: 'FAIL: IFRS 9 ECL provision not updated since Q4 2025. AED 142M receivables >90 days unprovisioned. Control did not detect within 30-day SLA. Immediate remediation required.',
  },
  'C-003': {
    testResult: 'pass',
    testerName: 'Internal Audit — Finance Team',
    testNotes: 'Q1 2026 lease commencement journals reviewed. No premature recognition found. IFRS 16 conditions verified for all 7 new leases.',
  },
  'C-004': {
    testResult: 'partial',
    testerName: 'Internal Audit — Finance Team',
    testNotes: 'PARTIAL: Variance analysis submitted 12 days late. Off-plan shortfall of 8% not escalated within 5-day window. Process followed but SLA breached.',
  },
  'C-005': {
    testResult: 'partial',
    testerName: 'Internal Audit — ESG Team',
    testNotes: 'PARTIAL: Scope 3 data 68% complete. 12 tier-2 suppliers have not submitted. ADX deadline in 60 days. Data quality review incomplete.',
  },
  'C-006': {
    testResult: 'fail',
    testerName: 'Internal Audit — Projects Team',
    testNotes: 'FAIL: AED 48M Saadiyat Grove variation order processed without Board approval. Oracle Fusion escalation workflow not triggered. Control bypass confirmed.',
  },
  'C-007': {
    testResult: 'partial',
    testerName: 'Internal Audit — Projects Team',
    testNotes: 'PARTIAL: WIP review detected 11.2% overrun but reforecast not submitted within 10-day SLA. Detection worked; escalation response failed.',
  },
  'C-008': {
    testResult: 'pass',
    testerName: 'Internal Audit — Projects Team',
    testNotes: 'All active project milestones reviewed in April 2026. Two minor delays flagged (<15 days each). No critical path breaches. PMO escalation threshold not yet triggered.',
  },
  'C-009': {
    testResult: 'fail',
    testerName: 'Internal Audit — Procurement Team',
    testNotes: 'FAIL: Steel/cement concentration at 78% (threshold: 60%). Q4 2025 review flagged risk but no multi-source action plan activated. Full AED 8.2Bn pipeline exposed.',
  },
  'C-010': {
    testResult: 'fail',
    testerName: 'Internal Audit — Procurement Team',
    testNotes: 'FAIL: Commodity costs +18% vs 10% trigger. Fixed-price provisions not activated. Q1 2026 review not completed. Control 17 days overdue.',
  },
  'C-011': {
    testResult: 'pass',
    testerName: 'Internal Audit — Procurement Team',
    testNotes: 'All active contractors pre-qualified within 24-month window. No exceptions. Electra LLC financial health flagged for enhanced monitoring in next cycle.',
  },
  'C-012': {
    testResult: 'partial',
    testerName: 'Internal Audit — IT Security Team',
    testNotes: 'PARTIAL: 12 of 40 assets reviewed. 3 shared VLAN configs identified, not yet remediated. CISA advisory N-006 issued during open window. Q2 audit not scheduled.',
  },
  'C-013': {
    testResult: 'fail',
    testerName: 'Internal Audit — IT Security Team',
    testNotes: 'FAIL: BMS penetration test 12 days overdue (due 2026-04-06). CISA advisory requires immediate response. Last test October 2025. Control SLA breached.',
  },
  'C-014': {
    testResult: 'partial',
    testerName: 'Internal Audit — IT Security Team',
    testNotes: 'PARTIAL: 4 dormant privileged accounts found — 2 from FM staff who departed February 2026. 5-day deprovisioning SLA breached. Remediation in progress.',
  },
  'C-015': {
    testResult: 'partial',
    testerName: 'Internal Audit — Commercial Team',
    testNotes: 'PARTIAL: Yas Mall 18,000 sqm anchor expiry in Q4 2026 identified. Replacement search not initiated despite 12-month mandate. CRM-002 NPS at 54 vs 66 benchmark.',
  },
  'C-016': {
    testResult: 'partial',
    testerName: 'Internal Audit — Hospitality Team',
    testNotes: 'PARTIAL: Occupancy at 71% — below 70% trigger for 3 weeks. Detection confirmed. Revenue recovery plan not submitted within 5-business-day escalation SLA.',
  },
  'C-017': {
    testResult: 'fail',
    testerName: 'Internal Audit — Commercial Team',
    testNotes: 'FAIL: Vacancy at 8.5% (threshold: 7%) for 10 consecutive weeks. No repositioning plan submitted. Control flagged issue but no management response within SLA.',
  },
  'C-018': {
    testResult: 'pass',
    testerName: 'Internal Audit — Governance Team',
    testNotes: 'Q1 2026 Board Risk Report presented on schedule. All 15 risks reviewed. R-007 action plan submitted and accepted. No overdue action plans identified.',
  },
  'C-019': {
    testResult: 'pass',
    testerName: 'Internal Audit — Education Team',
    testNotes: 'All ADEK submissions on track. Curriculum redesign 40% complete. 30 schools have initiated teacher retraining. No compliance deadline breaches.',
  },
  'C-020': {
    testResult: 'partial',
    testerName: 'Internal Audit — FM Team',
    testNotes: 'PARTIAL: CSAT at 79% — below 80% trigger. PIN not yet issued despite trigger breach. Q3 2026 contract renewal approaching without formal review initiated.',
  },
}

// ─── Core evaluation function ─────────────────────────────────────────────────

export function evaluateControlStatus(): ControlTestRecord[] {
  return controls.map((control): ControlTestRecord => {
    const assignment = TEST_ASSIGNMENTS[control.id]

    const daysUntilDue = daysBetween(control.nextDue, TODAY)
    const testStatus = deriveTestStatus(control.nextDue)

    return {
      controlId:        control.id,
      controlName:      control.name,
      process:          control.process,
      frequency:        control.frequency,
      owner:            control.owner,
      linkedRiskId:     control.linkedRiskId,
      linkedRiskTitle:  control.linkedRiskTitle,
      portfolio:        control.portfolio,
      controlType:      control.controlType,
      icafarAssertion:  control.icafarAssertion,
      controlStatus:    control.status,

      lastTestDate:     control.lastTested,
      nextTestDue:      control.nextDue,
      testFrequency:    control.frequency,
      testResult:       assignment?.testResult ?? 'not-tested',
      testStatus,
      daysUntilDue,
      testerName:       assignment?.testerName ?? 'Unassigned',
      testEvidence:     control.evidenceRequired,
      testNotes:        assignment?.testNotes ?? 'Test not yet performed.',
      integrationPending: control.integrationPending,
    }
  })
}

// ─── Aggregates ───────────────────────────────────────────────────────────────

export function testingSummary(records: ControlTestRecord[]) {
  return {
    total:      records.length,
    pass:       records.filter(r => r.testResult === 'pass').length,
    fail:       records.filter(r => r.testResult === 'fail').length,
    partial:    records.filter(r => r.testResult === 'partial').length,
    notTested:  records.filter(r => r.testResult === 'not-tested').length,
    overdue:    records.filter(r => r.testStatus === 'overdue').length,
    dueSoon:    records.filter(r => r.testStatus === 'due-soon').length,
    passRate:   Math.round(
      (records.filter(r => r.testResult === 'pass').length / records.length) * 100
    ),
    failRate:   Math.round(
      (records.filter(r => r.testResult === 'fail').length / records.length) * 100
    ),
  }
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

export const getTestsByResult = (records: ControlTestRecord[], result: TestResult) =>
  records.filter(r => r.testResult === result)

export const getTestsByStatus = (records: ControlTestRecord[], status: TestStatus) =>
  records.filter(r => r.testStatus === status)

export const getTestsByProcess = (records: ControlTestRecord[], process: Control['process']) =>
  records.filter(r => r.process === process)

export const getOverdueTests = (records: ControlTestRecord[]) =>
  records.filter(r => r.testStatus === 'overdue')

export const getFailedTests = (records: ControlTestRecord[]) =>
  records.filter(r => r.testResult === 'fail')

// ─── Color maps ───────────────────────────────────────────────────────────────

export const TEST_RESULT_COLOR: Record<TestResult, string> = {
  pass:       '#22C55E',
  fail:       '#FF3B3B',
  partial:    '#F5C518',
  'not-tested': '#94A3B8',
}

export const TEST_RESULT_BG: Record<TestResult, string> = {
  pass:       'rgba(34,197,94,0.1)',
  fail:       'rgba(255,59,59,0.1)',
  partial:    'rgba(245,197,24,0.1)',
  'not-tested': 'rgba(148,163,184,0.08)',
}

export const TEST_RESULT_LABEL: Record<TestResult, string> = {
  pass:       'Pass',
  fail:       'Fail',
  partial:    'Partial',
  'not-tested': 'Not Tested',
}

export const TEST_STATUS_COLOR: Record<TestStatus, string> = {
  current:    '#22C55E',
  overdue:    '#FF3B3B',
  'due-soon': '#F5C518',
}

export const TEST_STATUS_LABEL: Record<TestStatus, string> = {
  current:    'Current',
  overdue:    'Overdue',
  'due-soon': 'Due Soon',
}
