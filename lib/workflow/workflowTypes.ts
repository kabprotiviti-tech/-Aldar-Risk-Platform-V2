/**
 * Workflow Types — Batch F
 * -------------------------
 * N-step approval chain for ERM artefacts that require multi-line
 * sign-off before they become "of record". Maps the IIA 3-lines model
 * onto a concrete state machine:
 *
 *   Champion (1st line) → ERM Lead (2nd line) → CRO (2nd line head)
 *     → ARC Chair (governing body) → Board (where applicable)
 *
 * Status set is deliberately small and explicit — every transition is
 * audit-recordable.
 *
 * CLAUDE.md compliance: deterministic state transitions only. AI may
 * propose, but only a human in the right role can advance the state.
 */

import type { PersonaId } from '@/lib/personas'

export type WorkflowKind =
  | 'risk_approval'        // Champion drafts → ERM → CRO → ARC notify
  | 'appetite_change'      // Champion or CRO proposes → CRO → ARC → Board approve
  | 'mitigation_closure'   // Champion proposes close → ERM verify → CRO approve
  | 'kri_threshold_change' // Champion → ERM → CRO

export type WorkflowStepKey =
  | 'draft'
  | 'submitted'
  | 'erm_review'
  | 'cro_approve'
  | 'arc_signoff'
  | 'board_note'
  | 'closed'
  | 'rejected'

export interface WorkflowStep {
  key: WorkflowStepKey
  label: string
  /** Personas allowed to advance the state from this step. */
  advanceBy: PersonaId[]
  /** Final state (no further transitions). */
  terminal?: boolean
}

export interface WorkflowDefinition {
  kind: WorkflowKind
  label: string
  steps: WorkflowStepKey[]
}

export interface WorkflowInstance {
  id: string
  kind: WorkflowKind
  /** What artefact is moving through the chain (risk id, appetite id, etc.). */
  subjectId: string
  subjectLabel: string
  state: WorkflowStepKey
  createdAt: string
  updatedAt: string
  /** Audit-like trail of state transitions. */
  history: WorkflowTransition[]
}

export interface WorkflowTransition {
  at: string
  from: WorkflowStepKey
  to: WorkflowStepKey
  by: PersonaId
  byName: string
  note?: string
}

// ── Step catalogue ──────────────────────────────────────────────────────
export const STEP_CATALOG: Record<WorkflowStepKey, WorkflowStep> = {
  draft: {
    key: 'draft',
    label: 'Draft',
    advanceBy: ['risk-champion', 'subsidiary-ceo'],
  },
  submitted: {
    key: 'submitted',
    label: 'Submitted to ERM',
    advanceBy: ['risk-champion', 'subsidiary-ceo'],
  },
  erm_review: {
    key: 'erm_review',
    label: 'ERM review',
    advanceBy: ['group-cro'],
  },
  cro_approve: {
    key: 'cro_approve',
    label: 'CRO approve',
    advanceBy: ['group-cro'],
  },
  arc_signoff: {
    key: 'arc_signoff',
    label: 'ARC sign-off',
    advanceBy: ['arc-chair'],
  },
  board_note: {
    key: 'board_note',
    label: 'Board note',
    advanceBy: ['arc-chair'],
  },
  closed: {
    key: 'closed',
    label: 'Closed',
    advanceBy: [],
    terminal: true,
  },
  rejected: {
    key: 'rejected',
    label: 'Rejected',
    advanceBy: [],
    terminal: true,
  },
}

// ── Workflow definitions ────────────────────────────────────────────────
export const WORKFLOWS: Record<WorkflowKind, WorkflowDefinition> = {
  risk_approval: {
    kind: 'risk_approval',
    label: 'Risk approval',
    steps: ['draft', 'submitted', 'erm_review', 'cro_approve', 'arc_signoff', 'closed'],
  },
  appetite_change: {
    kind: 'appetite_change',
    label: 'Appetite change',
    steps: ['draft', 'submitted', 'cro_approve', 'arc_signoff', 'board_note', 'closed'],
  },
  mitigation_closure: {
    kind: 'mitigation_closure',
    label: 'Mitigation closure',
    steps: ['submitted', 'erm_review', 'cro_approve', 'closed'],
  },
  kri_threshold_change: {
    kind: 'kri_threshold_change',
    label: 'KRI threshold change',
    steps: ['submitted', 'erm_review', 'cro_approve', 'closed'],
  },
}
