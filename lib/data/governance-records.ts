/**
 * Governance Records — Phase 1 (illustrative)
 * Three first-class ERM record types the BRD asks for that the tool did
 * not yet have: Incidents (7.5), Risk Acceptances (7.6), Lessons Learned
 * (7.7). All link back to risks in the register. Demo-real, browser-
 * persisted via createPersistedContext.
 */

import { RISKS } from '@/lib/engine/seedData'

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentStatus = 'open' | 'investigating' | 'closed'

export interface Incident {
  id: string
  title: string
  occurredOn: string        // yyyy-mm-dd
  severity: IncidentSeverity
  description: string
  linkedRiskIds: string[]
  owner: string
  status: IncidentStatus
  lossAmountAedM?: number
  createdAt: string
}

export interface RiskAcceptance {
  id: string
  riskId: string
  riskName: string
  rationale: string
  residualExposureAedM?: number
  acceptedBy: string        // 1st-line owner accepting
  approver: string          // governing approver (ARC / CRO)
  acceptedOn: string
  reviewBy: string          // re-review / expiry date
  createdAt: string
}

export type LessonSource = 'incident' | 'mitigation' | 'audit' | 'review' | 'other'

export interface LessonLearned {
  id: string
  title: string
  capturedOn: string
  context: string
  lesson: string
  linkedRiskId?: string
  source: LessonSource
  author: string
  createdAt: string
}

/** Risk options for linkage dropdowns (seed risks; drafts merged in the UI). */
export function seedRiskOptions(): { id: string; name: string }[] {
  return RISKS.map((r) => ({ id: r.id, name: r.name }))
}

// ── Illustrative seed ─────────────────────────────────────────────────────
export function seedIncidents(): Incident[] {
  const firstTwo = RISKS.slice(0, 3)
  return [
    {
      id: 'INC-001',
      title: 'Escrow reconciliation variance — Saadiyat project',
      occurredOn: '2026-04-18',
      severity: 'high',
      description: 'A AED 12m variance was identified between the project escrow ledger and the master developer statement during the April close. Root cause traced to a delayed milestone certificate.',
      linkedRiskIds: firstTwo[0] ? [firstTwo[0].id] : [],
      owner: 'Anita Verma',
      status: 'investigating',
      lossAmountAedM: 0,
      createdAt: '2026-04-19T08:00:00.000Z',
    },
    {
      id: 'INC-002',
      title: 'Phishing attempt against finance shared mailbox',
      occurredOn: '2026-05-02',
      severity: 'medium',
      description: 'A credential-harvesting email targeted the AP shared mailbox. Caught by the gateway; no credentials entered. Awareness note issued to the finance team.',
      linkedRiskIds: firstTwo[1] ? [firstTwo[1].id] : [],
      owner: 'Hassan Ali',
      status: 'closed',
      lossAmountAedM: 0,
      createdAt: '2026-05-03T09:30:00.000Z',
    },
  ]
}

export function seedAcceptances(): RiskAcceptance[] {
  const r = RISKS[0]
  return r
    ? [
        {
          id: 'ACC-001',
          riskId: r.id,
          riskName: r.name,
          rationale: 'Residual exposure sits marginally above the Group appetite ceiling. The Board accepts the residual for the current quarter given the mitigating hedge programme already in flight; to be re-reviewed at the next ARC.',
          residualExposureAedM: 120,
          acceptedBy: 'Sara Khalifa (CEO — Development)',
          approver: 'Sir Geoffrey Pike (ARC Chair)',
          acceptedOn: '2026-03-28',
          reviewBy: '2026-06-30',
          createdAt: '2026-03-28T14:00:00.000Z',
        },
      ]
    : []
}

export function seedLessons(): LessonLearned[] {
  const r = RISKS[0]
  return [
    {
      id: 'LL-001',
      title: 'Earlier milestone-certificate checks prevent escrow variances',
      capturedOn: '2026-04-30',
      context: 'Following INC-001, the escrow variance would have been caught two weeks earlier with a mid-month certificate reconciliation rather than a month-end one.',
      lesson: 'Move escrow-to-certificate reconciliation to a fortnightly cadence for active projects above AED 500m GDV. Now reflected in the controls calendar.',
      linkedRiskId: r ? r.id : undefined,
      source: 'incident',
      author: 'Omar Haddad (Head of ERM)',
      createdAt: '2026-04-30T11:00:00.000Z',
    },
  ]
}

export const INCIDENT_SEVERITY_META: Record<IncidentSeverity, { label: string; color: string }> = {
  low: { label: 'Low', color: '#067647' },
  medium: { label: 'Medium', color: '#B54708' },
  high: { label: 'High', color: '#B42318' },
  critical: { label: 'Critical', color: '#7A0019' },
}

export const INCIDENT_STATUS_META: Record<IncidentStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: '#B42318' },
  investigating: { label: 'Investigating', color: '#B54708' },
  closed: { label: 'Closed', color: '#067647' },
}
