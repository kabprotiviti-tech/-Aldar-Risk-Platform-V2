// ─── Control Library — ICOFR-aligned Internal Controls ──────────────────────
// Integration Pending — replace static arrays with API call to GRC system
// All controls link to existing risk register IDs (R-001 … R-015).
// No random values — every field is traceable to source risk, owner or signal data.

import type { Portfolio } from '@/lib/simulated-data'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ControlProcess =
  | 'Finance'
  | 'Projects'
  | 'Procurement'
  | 'IT & Cyber'
  | 'Revenue & Commercial'
  | 'Governance & Compliance'

export type ControlFrequency = 'Monthly' | 'Quarterly' | 'Annual'
export type ControlType     = 'Preventive' | 'Detective' | 'Corrective'
export type ControlStatus   = 'effective' | 'partial' | 'failed'

export type ICOFRAssertion =
  | 'Existence / Occurrence'
  | 'Completeness'
  | 'Accuracy & Valuation'
  | 'Rights & Obligations'
  | 'Presentation & Disclosure'
  | 'Cut-off'

export interface Control {
  id: string
  name: string
  description: string              // one-line operating description
  process: ControlProcess
  frequency: ControlFrequency
  owner: string                    // matches risk register owner where applicable
  linkedRiskId: string             // must be a valid R-00x from riskRegister
  linkedRiskTitle: string          // denormalised for display (no lookup needed)
  portfolio: Portfolio
  controlType: ControlType
  icafarAssertion: ICOFRAssertion
  status: ControlStatus
  statusReason: string             // why this status — traceable to signal/ERP/CRM data
  lastTested: string               // ISO date
  nextDue: string                  // ISO date
  evidenceRequired: string         // what constitutes test evidence
  integrationPending: boolean      // true = data source not yet connected
}

// ─── Control definitions ──────────────────────────────────────────────────────
// 20 controls across Finance, Projects, Procurement, IT, Revenue, Governance.
// Statuses reflect real signal state: ERP-002 overrun, CRM-001 vacancy,
// ERP-001 receivables, N-006 CISA advisory, R-006 increasing trend, etc.

export const controls: Control[] = [

  // ── FINANCE ──────────────────────────────────────────────────────────────────

  {
    id: 'C-001',
    name: 'Monthly Bank Reconciliation & Cash Position Review',
    description: 'CFO Office reconciles all bank accounts to GL monthly; exceptions escalated within 48 hours.',
    process: 'Finance',
    frequency: 'Monthly',
    owner: 'CFO Office',
    linkedRiskId: 'R-001',
    linkedRiskTitle: 'UAE Interest Rate Hike Impact on Mortgage Demand',
    portfolio: 'real-estate',
    controlType: 'Detective',
    icafarAssertion: 'Existence / Occurrence',
    status: 'effective',
    statusReason: 'No reconciling items >AED 500K outstanding >30 days. Last reconciliation completed on schedule.',
    lastTested: '2026-04-01',
    nextDue: '2026-05-01',
    evidenceRequired: 'Signed bank reconciliation workpapers + CFO sign-off email',
    integrationPending: false,
  },

  {
    id: 'C-002',
    name: 'Trade Receivables Aging & Provision Review',
    description: 'Finance reviews receivables aging monthly; provisioning applied per IFRS 9 ECL model for accounts >90 days.',
    process: 'Finance',
    frequency: 'Monthly',
    owner: 'CFO Office',
    linkedRiskId: 'R-009',
    linkedRiskTitle: 'Community Retail Vacancy Rate Increase',
    portfolio: 'retail',
    controlType: 'Detective',
    icafarAssertion: 'Accuracy & Valuation',
    status: 'failed',
    statusReason: 'ERP-001: Trade receivables >90 days at AED 142M — up 31% QoQ. IFRS 9 provision not updated since Q4 2025. Control failed to flag deterioration within 30-day SLA.',
    lastTested: '2026-03-01',
    nextDue: '2026-04-01',
    evidenceRequired: 'AR aging report from Oracle Fusion + signed provision memo + CFO approval',
    integrationPending: true,
  },

  {
    id: 'C-003',
    name: 'Revenue Recognition Gate — Lease Commencement Review',
    description: 'Finance validates lease commencement conditions (handover, inspection sign-off) before revenue is recognised under IFRS 16.',
    process: 'Finance',
    frequency: 'Monthly',
    owner: 'CFO Office',
    linkedRiskId: 'R-002',
    linkedRiskTitle: 'Yas Mall Anchor Tenant Lease Non-Renewal Risk',
    portfolio: 'retail',
    controlType: 'Preventive',
    icafarAssertion: 'Existence / Occurrence',
    status: 'effective',
    statusReason: 'All lease commencement journals reviewed and approved for Q1 2026. No premature recognition identified.',
    lastTested: '2026-04-05',
    nextDue: '2026-05-05',
    evidenceRequired: 'Lease commencement checklist + IFRS 16 journal approval + legal sign-off',
    integrationPending: false,
  },

  {
    id: 'C-004',
    name: 'Financial Forecast Variance Analysis — Quarterly',
    description: 'Finance compares actuals vs. approved budget quarterly; variances >5% require written explanation and reforecast submission to CFO.',
    process: 'Finance',
    frequency: 'Quarterly',
    owner: 'CFO Office',
    linkedRiskId: 'R-001',
    linkedRiskTitle: 'UAE Interest Rate Hike Impact on Mortgage Demand',
    portfolio: 'real-estate',
    controlType: 'Detective',
    icafarAssertion: 'Accuracy & Valuation',
    status: 'partial',
    statusReason: 'Q1 2026 variance analysis submitted 12 days late. Off-plan sales shortfall of 8% not escalated within the required 5-day window per control procedure.',
    lastTested: '2026-04-10',
    nextDue: '2026-07-10',
    evidenceRequired: 'Variance analysis workbook + CFO acknowledgement + reforecast sign-off',
    integrationPending: false,
  },

  {
    id: 'C-005',
    name: 'ESG Scope 3 Emissions Data Quality Review',
    description: 'Sustainability Office validates completeness and accuracy of Scope 3 emissions data from construction supply chain before ADX disclosure.',
    process: 'Governance & Compliance',
    frequency: 'Quarterly',
    owner: 'Sustainability Office',
    linkedRiskId: 'R-008',
    linkedRiskTitle: 'Sustainability Reporting Non-Compliance Risk (ESG)',
    portfolio: 'real-estate',
    controlType: 'Preventive',
    icafarAssertion: 'Presentation & Disclosure',
    status: 'partial',
    statusReason: 'Scope 3 supply chain emissions dataset is 68% complete. 12 tier-2 suppliers have not submitted data. ADX deadline 60 days away. Incomplete data creates restatement risk.',
    lastTested: '2026-03-31',
    nextDue: '2026-06-30',
    evidenceRequired: 'Supplier emissions data submissions + completeness matrix + Sustainability Director sign-off',
    integrationPending: true,
  },

  // ── PROJECTS ──────────────────────────────────────────────────────────────────

  {
    id: 'C-006',
    name: 'Project Budget Approval & Change Order Authorization',
    description: 'All variation orders >AED 5M require Development Director approval; >AED 25M require Board approval before contractor payment.',
    process: 'Projects',
    frequency: 'Monthly',
    owner: 'Development Division',
    linkedRiskId: 'R-004',
    linkedRiskTitle: 'Construction Cost Inflation — Active Development Pipeline',
    portfolio: 'real-estate',
    controlType: 'Preventive',
    icafarAssertion: 'Rights & Obligations',
    status: 'failed',
    statusReason: 'ERP-002: Saadiyat Grove Phase 2 AED 48M variation order processed without Board approval (threshold: AED 25M). Control bypassed — approver escalation workflow not triggered in Oracle Fusion.',
    lastTested: '2026-03-15',
    nextDue: '2026-04-15',
    evidenceRequired: 'Signed change order form + approval chain in Oracle Fusion + Board minute (if >AED 25M)',
    integrationPending: true,
  },

  {
    id: 'C-007',
    name: 'Construction WIP & Cost-to-Complete Monitoring',
    description: 'Development Finance reviews WIP schedules monthly against approved budgets; cost-to-complete reforecast submitted if overrun exceeds 5%.',
    process: 'Projects',
    frequency: 'Monthly',
    owner: 'Development Division',
    linkedRiskId: 'R-004',
    linkedRiskTitle: 'Construction Cost Inflation — Active Development Pipeline',
    portfolio: 'real-estate',
    controlType: 'Detective',
    icafarAssertion: 'Accuracy & Valuation',
    status: 'partial',
    statusReason: 'ERP-002: Saadiyat Grove Phase 2 showing 11.2% cost overrun vs approved budget. WIP review identified overrun but reforecast was not submitted within 10-day control SLA.',
    lastTested: '2026-04-08',
    nextDue: '2026-05-08',
    evidenceRequired: 'WIP schedule from Oracle Fusion + cost-to-complete model + Development Director sign-off',
    integrationPending: true,
  },

  {
    id: 'C-008',
    name: 'Project Milestone & Delivery Schedule Review',
    description: 'Project Management Office reviews milestone completion monthly; delays >30 days trigger a project risk escalation to the Development Committee.',
    process: 'Projects',
    frequency: 'Monthly',
    owner: 'Development Division',
    linkedRiskId: 'R-004',
    linkedRiskTitle: 'Construction Cost Inflation — Active Development Pipeline',
    portfolio: 'real-estate',
    controlType: 'Detective',
    icafarAssertion: 'Completeness',
    status: 'effective',
    statusReason: 'All active projects reviewed in April 2026. Two projects flagged with minor delays (<15 days); escalation not yet triggered. Monitoring on track.',
    lastTested: '2026-04-12',
    nextDue: '2026-05-12',
    evidenceRequired: 'PMO milestone tracker + Development Committee meeting minutes',
    integrationPending: false,
  },

  // ── PROCUREMENT ───────────────────────────────────────────────────────────────

  {
    id: 'C-009',
    name: 'Supplier Concentration Risk & Single-Source Review',
    description: 'Procurement reviews supplier concentration quarterly; any category with >60% spend concentration in one supplier triggers diversification action.',
    process: 'Procurement',
    frequency: 'Quarterly',
    owner: 'Development Division',
    linkedRiskId: 'R-004',
    linkedRiskTitle: 'Construction Cost Inflation — Active Development Pipeline',
    portfolio: 'real-estate',
    controlType: 'Detective',
    icafarAssertion: 'Rights & Obligations',
    status: 'failed',
    statusReason: 'Steel and cement sourcing: 78% single-source concentration (UAE supplier). Red Sea disruption (N-003) exposed full AED 8.2Bn pipeline. No multi-source plan activated despite Q4 2025 review flagging the risk.',
    lastTested: '2026-01-31',
    nextDue: '2026-04-30',
    evidenceRequired: 'Supplier spend analysis + category concentration report + CPO sign-off',
    integrationPending: true,
  },

  {
    id: 'C-010',
    name: 'Fixed-Price Contract Clause Activation Review',
    description: 'Legal & Procurement review all active contracts quarterly to activate price escalation or fixed-price provisions when commodity indices exceed 10% movement.',
    process: 'Procurement',
    frequency: 'Quarterly',
    owner: 'Development Division',
    linkedRiskId: 'R-004',
    linkedRiskTitle: 'Construction Cost Inflation — Active Development Pipeline',
    portfolio: 'real-estate',
    controlType: 'Preventive',
    icafarAssertion: 'Rights & Obligations',
    status: 'failed',
    statusReason: 'Steel/cement costs +18% YTD (threshold: 10%). Fixed-price provisions not activated across AED 8.2Bn pipeline. Control last reviewed Q4 2025 — Q1 2026 review not completed. Significant exposure unmitigated.',
    lastTested: '2025-12-31',
    nextDue: '2026-03-31',
    evidenceRequired: 'Contract clause review log + commodity price trigger evidence + Legal sign-off',
    integrationPending: false,
  },

  {
    id: 'C-011',
    name: 'Contractor Pre-qualification & Due Diligence',
    description: 'All new contractors undergo financial health, HSE, and technical capability assessment before contract award. Pre-qualification valid for 24 months.',
    process: 'Procurement',
    frequency: 'Quarterly',
    owner: 'Development Division',
    linkedRiskId: 'R-004',
    linkedRiskTitle: 'Construction Cost Inflation — Active Development Pipeline',
    portfolio: 'real-estate',
    controlType: 'Preventive',
    icafarAssertion: 'Rights & Obligations',
    status: 'effective',
    statusReason: 'All active contractors pre-qualified within 24-month window. No exceptions noted in Q1 2026 review.',
    lastTested: '2026-03-20',
    nextDue: '2026-06-20',
    evidenceRequired: 'Pre-qualification assessment reports + approval records',
    integrationPending: false,
  },

  // ── IT & CYBER ────────────────────────────────────────────────────────────────

  {
    id: 'C-012',
    name: 'OT/IT Network Segregation Audit — Smart Buildings',
    description: 'CTO Office audits network segmentation between BMS/OT and corporate IT quarterly; any shared credential or VLAN bridging is a critical finding.',
    process: 'IT & Cyber',
    frequency: 'Quarterly',
    owner: 'CTO Office',
    linkedRiskId: 'R-006',
    linkedRiskTitle: 'Data Centre & Smart Building Cyber Vulnerability',
    portfolio: 'facilities',
    controlType: 'Preventive',
    icafarAssertion: 'Existence / Occurrence',
    status: 'partial',
    statusReason: 'Q1 2026 audit: 12 of 40 assets reviewed. 3 shared VLAN configurations identified but not remediated. N-006 CISA advisory issued during open audit window. Q2 audit not yet scheduled.',
    lastTested: '2026-03-31',
    nextDue: '2026-04-30',
    evidenceRequired: 'Network topology diagram + audit findings report + CTO sign-off + remediation log',
    integrationPending: true,
  },

  {
    id: 'C-013',
    name: 'Cybersecurity Incident Response Plan Testing',
    description: 'Annual tabletop simulation and semi-annual penetration testing of smart building BMS environments. Results reported to Risk Committee.',
    process: 'IT & Cyber',
    frequency: 'Quarterly',
    owner: 'CTO Office',
    linkedRiskId: 'R-006',
    linkedRiskTitle: 'Data Centre & Smart Building Cyber Vulnerability',
    portfolio: 'facilities',
    controlType: 'Detective',
    icafarAssertion: 'Existence / Occurrence',
    status: 'failed',
    statusReason: 'CISA advisory N-006 (April 12) requires immediate response testing. Last BMS penetration test: October 2025 — 6 months ago. Control SLA: retest within 90 days of material threat advisory. Overdue by 12 days.',
    lastTested: '2025-10-15',
    nextDue: '2026-04-06',
    evidenceRequired: 'Penetration test report + Risk Committee presentation + remediation sign-off',
    integrationPending: false,
  },

  {
    id: 'C-014',
    name: 'Access Control & Privileged User Review — BMS Systems',
    description: 'IT reviews all privileged access to building management systems quarterly; dormant accounts disabled within 5 days of employee departure.',
    process: 'IT & Cyber',
    frequency: 'Quarterly',
    owner: 'CTO Office',
    linkedRiskId: 'R-006',
    linkedRiskTitle: 'Data Centre & Smart Building Cyber Vulnerability',
    portfolio: 'facilities',
    controlType: 'Preventive',
    icafarAssertion: 'Rights & Obligations',
    status: 'partial',
    statusReason: '4 dormant privileged accounts identified in BMS systems — 2 from FM staff who left in February 2026. Accounts not disabled within 5-day SLA. Remediation in progress.',
    lastTested: '2026-04-01',
    nextDue: '2026-07-01',
    evidenceRequired: 'Access review report + deprovisioning log + CTO sign-off',
    integrationPending: true,
  },

  // ── REVENUE & COMMERCIAL ──────────────────────────────────────────────────────

  {
    id: 'C-015',
    name: 'Lease Expiry Pipeline & Renewal Monitoring',
    description: 'Asset Management tracks lease expiries 18 months in advance; replacement tenant search mandated 12 months before expiry for anchors >5,000 sqm.',
    process: 'Revenue & Commercial',
    frequency: 'Monthly',
    owner: 'Retail Asset Management',
    linkedRiskId: 'R-002',
    linkedRiskTitle: 'Yas Mall Anchor Tenant Lease Non-Renewal Risk',
    portfolio: 'retail',
    controlType: 'Preventive',
    icafarAssertion: 'Completeness',
    status: 'partial',
    statusReason: 'Yas Mall anchor tenants (18,000 sqm) expiring Q4 2026. Expiry identified but replacement search not initiated despite 12-month mandate. CRM-002 NPS score at 54 vs 66 benchmark signals renewal risk.',
    lastTested: '2026-04-10',
    nextDue: '2026-05-10',
    evidenceRequired: 'Lease expiry tracker + tenant engagement log + Asset Management Director sign-off',
    integrationPending: false,
  },

  {
    id: 'C-016',
    name: 'Hotel Occupancy & RevPAR KPI Review',
    description: 'Hospitality Finance reviews occupancy and RevPAR weekly against targets; occupancy <70% for 2 consecutive weeks triggers a revenue recovery plan.',
    process: 'Revenue & Commercial',
    frequency: 'Monthly',
    owner: 'Hospitality Division',
    linkedRiskId: 'R-003',
    linkedRiskTitle: 'Tourism Demand Softening — Yas Island Hospitality',
    portfolio: 'hospitality',
    controlType: 'Detective',
    icafarAssertion: 'Accuracy & Valuation',
    status: 'partial',
    statusReason: 'CRM-003: Hotel occupancy at 71% — below 70% trigger threshold for 3 consecutive weeks. Revenue recovery plan not yet submitted. Control detected the issue but escalation SLA (5 business days) breached.',
    lastTested: '2026-04-15',
    nextDue: '2026-05-15',
    evidenceRequired: 'Weekly RevPAR dashboard + recovery plan submission + Hospitality Director approval',
    integrationPending: true,
  },

  {
    id: 'C-017',
    name: 'Retail Vacancy Rate & Footfall Index Review',
    description: 'Retail Asset Management reviews vacancy rates and footfall weekly; vacancy >7% triggers a repositioning action plan within 30 days.',
    process: 'Revenue & Commercial',
    frequency: 'Monthly',
    owner: 'Retail Asset Management',
    linkedRiskId: 'R-009',
    linkedRiskTitle: 'Community Retail Vacancy Rate Increase',
    portfolio: 'retail',
    controlType: 'Detective',
    icafarAssertion: 'Completeness',
    status: 'failed',
    statusReason: 'CRM-001: Vacancy at 8.5% (threshold: 7%) since February 2026 — 10 weeks above trigger. Repositioning plan not submitted. Footfall index at 67/100 and declining. Control flagged issue but no escalation response within SLA.',
    lastTested: '2026-04-15',
    nextDue: '2026-05-15',
    evidenceRequired: 'Vacancy report from CRM + footfall index data + repositioning plan with GM approval',
    integrationPending: true,
  },

  // ── GOVERNANCE & COMPLIANCE ───────────────────────────────────────────────────

  {
    id: 'C-018',
    name: 'Risk Register Update & Board Risk Report',
    description: 'Risk function updates risk register monthly and presents to Board Risk Committee quarterly. All risks with score ≥12 require individual action plans.',
    process: 'Governance & Compliance',
    frequency: 'Quarterly',
    owner: 'Strategy & Investments',
    linkedRiskId: 'R-007',
    linkedRiskTitle: 'Geopolitical Escalation — Regional Investor Sentiment',
    portfolio: 'real-estate',
    controlType: 'Detective',
    icafarAssertion: 'Presentation & Disclosure',
    status: 'effective',
    statusReason: 'Q1 2026 Board Risk Report presented on schedule. All 15 risks reviewed. R-007 action plan submitted and accepted. No overdue action plans.',
    lastTested: '2026-04-01',
    nextDue: '2026-07-01',
    evidenceRequired: 'Board Risk Report + Board minutes + Risk Committee sign-off',
    integrationPending: false,
  },

  {
    id: 'C-019',
    name: 'ADEK Regulatory Compliance Calendar Review',
    description: 'Aldar Education tracks ADEK regulatory submission deadlines monthly; any submission >5 days late is escalated to the Education CEO.',
    process: 'Governance & Compliance',
    frequency: 'Monthly',
    owner: 'Aldar Education CEO',
    linkedRiskId: 'R-005',
    linkedRiskTitle: 'Aldar Education Regulatory Compliance — ADEK Curriculum Changes',
    portfolio: 'education',
    controlType: 'Preventive',
    icafarAssertion: 'Cut-off',
    status: 'effective',
    statusReason: 'All ADEK submissions on track for September 2026 deadline. Curriculum redesign 40% complete. Teacher retraining programme initiated across 30 schools.',
    lastTested: '2026-04-10',
    nextDue: '2026-05-10',
    evidenceRequired: 'ADEK submission log + compliance calendar + Education CEO sign-off',
    integrationPending: false,
  },

  {
    id: 'C-020',
    name: 'FM Outsourcing Partner SLA Performance Review',
    description: 'Aldar Investment Properties reviews FM partner SLA performance quarterly; CSAT <80% triggers a formal performance improvement notice (PIN).',
    process: 'Governance & Compliance',
    frequency: 'Quarterly',
    owner: 'Aldar Investment Properties',
    linkedRiskId: 'R-010',
    linkedRiskTitle: 'FM Outsourcing Partner Performance Risk',
    portfolio: 'facilities',
    controlType: 'Detective',
    icafarAssertion: 'Accuracy & Valuation',
    status: 'partial',
    statusReason: 'CSAT dropped from 87% to 79% in Q1 2026 — below 80% threshold. PIN not yet issued despite trigger breach. Q3 2026 contract renewal approaching without formal review initiated.',
    lastTested: '2026-04-05',
    nextDue: '2026-07-05',
    evidenceRequired: 'CSAT report + SLA scorecard + PIN issuance record + Investment Properties Director sign-off',
    integrationPending: false,
  },
]

// ─── Aggregates — used by Governance Command Center ──────────────────────────
// Integration Pending — replace with live GRC API

export const controlSummary = {
  total:     controls.length,
  effective: controls.filter(c => c.status === 'effective').length,
  partial:   controls.filter(c => c.status === 'partial').length,
  failed:    controls.filter(c => c.status === 'failed').length,
  preventive: controls.filter(c => c.controlType === 'Preventive').length,
  detective:  controls.filter(c => c.controlType === 'Detective').length,
  coveragePercent: Math.round(
    (controls.filter(c => c.status === 'effective').length / controls.length) * 100
  ),
  failureRate: Math.round(
    (controls.filter(c => c.status === 'failed').length / controls.length) * 100
  ),
} as const

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export const getControl       = (id: string) => controls.find(c => c.id === id)
export const getControlsByRisk = (riskId: string) => controls.filter(c => c.linkedRiskId === riskId)
export const getControlsByProcess = (process: ControlProcess) =>
  controls.filter(c => c.process === process)
export const getControlsByStatus  = (status: ControlStatus) =>
  controls.filter(c => c.status === status)
export const getFailedControls    = () => controls.filter(c => c.status === 'failed')
export const getOverdueControls   = () =>
  controls.filter(c => {
    const due = new Date(c.nextDue)
    return due < new Date('2026-04-18') && c.status !== 'effective'
  })
