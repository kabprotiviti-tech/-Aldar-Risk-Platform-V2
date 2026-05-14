/**
 * Workflows Seed — Batch F
 * -------------------------
 * Illustrative workflow instances showing the chain mid-flight.
 * Pilot replaces with the live workflow store backed by the
 * approvals API.
 */

import type { WorkflowInstance } from '@/lib/workflow/workflowTypes'

function isoMinutesAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString()
}

export function buildWorkflowsSeed(): WorkflowInstance[] {
  return [
    {
      id: 'wf-001',
      kind: 'risk_approval',
      subjectId: 'R-008',
      subjectLabel: 'R-008 · Cash Flow / Liquidity Stress',
      state: 'cro_approve',
      createdAt: isoMinutesAgo(4 * 24 * 60),
      updatedAt: isoMinutesAgo(2 * 60),
      history: [
        {
          at: isoMinutesAgo(4 * 24 * 60),
          from: 'draft',
          to: 'submitted',
          by: 'risk-champion',
          byName: 'Ali Karim',
          note: 'Initial draft submitted post-Q2 close.',
        },
        {
          at: isoMinutesAgo(3 * 24 * 60),
          from: 'submitted',
          to: 'erm_review',
          by: 'risk-champion',
          byName: 'Ali Karim',
        },
        {
          at: isoMinutesAgo(20 * 60),
          from: 'erm_review',
          to: 'cro_approve',
          by: 'group-cro',
          byName: 'Group ERM Head',
          note: '2nd-line review complete. Recommend CRO approve.',
        },
      ],
    },
    {
      id: 'wf-002',
      kind: 'appetite_change',
      subjectId: 'GA-CMP-01',
      subjectLabel: 'Appetite · Concentration tolerance increase',
      state: 'arc_signoff',
      createdAt: isoMinutesAgo(7 * 24 * 60),
      updatedAt: isoMinutesAgo(6 * 60),
      history: [
        {
          at: isoMinutesAgo(7 * 24 * 60),
          from: 'draft',
          to: 'submitted',
          by: 'group-cro',
          byName: 'Group CRO',
        },
        {
          at: isoMinutesAgo(2 * 24 * 60),
          from: 'submitted',
          to: 'cro_approve',
          by: 'group-cro',
          byName: 'Group CRO',
          note: 'CRO recommends ARC sign-off — within delegated authority.',
        },
        {
          at: isoMinutesAgo(6 * 60),
          from: 'cro_approve',
          to: 'arc_signoff',
          by: 'group-cro',
          byName: 'Group CRO',
        },
      ],
    },
    {
      id: 'wf-003',
      kind: 'mitigation_closure',
      subjectId: 'M-014',
      subjectLabel: 'Mitigation · Heat-stress HSE protocol Jun-Sep',
      state: 'erm_review',
      createdAt: isoMinutesAgo(36 * 60),
      updatedAt: isoMinutesAgo(45),
      history: [
        {
          at: isoMinutesAgo(36 * 60),
          from: 'submitted',
          to: 'submitted',
          by: 'risk-champion',
          byName: 'Maha Al-Yassi',
          note: 'Closure pack submitted: incident-free Jun-Sep, evidence attached.',
        },
        {
          at: isoMinutesAgo(45),
          from: 'submitted',
          to: 'erm_review',
          by: 'risk-champion',
          byName: 'Maha Al-Yassi',
        },
      ],
    },
    {
      id: 'wf-004',
      kind: 'kri_threshold_change',
      subjectId: 'KRI-11',
      subjectLabel: 'KRI-11 · Project Delay (Phases) — amber/red review',
      state: 'submitted',
      createdAt: isoMinutesAgo(2 * 60),
      updatedAt: isoMinutesAgo(2 * 60),
      history: [
        {
          at: isoMinutesAgo(2 * 60),
          from: 'submitted',
          to: 'submitted',
          by: 'risk-champion',
          byName: 'Ali Karim',
          note: 'Proposed amber 7→10 phases, red 12→15 phases post-pilot data.',
        },
      ],
    },
  ]
}
