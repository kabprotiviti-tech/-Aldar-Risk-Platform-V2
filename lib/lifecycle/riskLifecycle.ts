/**
 * Risk Lifecycle — Phase 0 (the enforced governance gate)
 * -------------------------------------------------------
 * Deterministic state machine that takes a drafted risk from creation to
 * "of record". This is the enforced maker–checker gate the BRD asks for
 * (refs 1.4, 7.1): a risk CANNOT reach the published register until it has
 * been reviewed, approved and signed off.
 *
 *   draft → under_review → approved → published
 *                 │
 *                 └→ rejected  (sent back; can be resubmitted)
 *
 * Persona gates reuse lib/personas.ts. Pure functions only — the context
 * owns persistence + audit logging (mirrors lib/workflow/workflowEngine).
 */

import type { PersonaId } from '@/lib/personas'

export type RiskLifecycleState =
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'published'
  | 'rejected'

export type LifecycleDecision = 'submit' | 'approve' | 'reject' | 'signoff'

export interface LifecycleStep {
  key: RiskLifecycleState
  label: string
  short: string
  /** BGR-independent hex for the UI badge. */
  color: string
  bg: string
}

export const LIFECYCLE_META: Record<RiskLifecycleState, LifecycleStep> = {
  draft:        { key: 'draft',        label: 'Draft',         short: 'Draft',     color: '#475467', bg: 'rgba(71,84,103,0.12)' },
  under_review: { key: 'under_review', label: 'Under review',  short: 'Review',    color: '#B54708', bg: 'rgba(181,71,8,0.12)' },
  approved:     { key: 'approved',     label: 'Approved',      short: 'Approved',  color: '#1D4ED8', bg: 'rgba(29,78,216,0.12)' },
  published:    { key: 'published',    label: 'Published',     short: 'Published', color: '#067647', bg: 'rgba(6,118,71,0.12)' },
  rejected:     { key: 'rejected',     label: 'Sent back',     short: 'Sent back', color: '#B42318', bg: 'rgba(180,35,24,0.12)' },
}

/** The happy-path chain shown in the tracker (rejected is off-path). */
export const LIFECYCLE_CHAIN: RiskLifecycleState[] = ['draft', 'under_review', 'approved', 'published']

/**
 * Who can perform each decision.
 *  - submit (maker): the 1st-line author (Champion / Sub CEO)
 *  - approve/reject (checker): 2nd-line ERM / CRO
 *  - signoff (governing): ARC Chair → moves approved → published
 */
export const DECISION_GATE: Record<LifecycleDecision, PersonaId[]> = {
  submit:  ['risk-champion', 'subsidiary-ceo'],
  approve: ['group-cro'],
  reject:  ['group-cro'],
  signoff: ['arc-chair', 'group-cro'],
}

/** Which decision is available from a given state (null = terminal/none). */
export function availableDecision(state: RiskLifecycleState): LifecycleDecision | null {
  switch (state) {
    case 'draft':
    case 'rejected':
      return 'submit'
    case 'under_review':
      return 'approve' // (reject also available — handled separately)
    case 'approved':
      return 'signoff'
    case 'published':
    default:
      return null
  }
}

/** Resulting state if `decision` is applied from `state` (null if illegal). */
export function nextState(state: RiskLifecycleState, decision: LifecycleDecision): RiskLifecycleState | null {
  if (decision === 'submit' && (state === 'draft' || state === 'rejected')) return 'under_review'
  if (decision === 'approve' && state === 'under_review') return 'approved'
  if (decision === 'reject' && state === 'under_review') return 'rejected'
  if (decision === 'signoff' && state === 'approved') return 'published'
  return null
}

/** Can this persona perform this decision from this state? */
export function canDecide(
  state: RiskLifecycleState,
  decision: LifecycleDecision,
  persona: PersonaId | null,
): boolean {
  if (!persona) return true // demo mode: no persona selected → allow (mirrors existing RBAC bypass)
  if (!nextState(state, decision)) return false
  return DECISION_GATE[decision].includes(persona)
}

/** Is this risk "of record" (counts toward the official register)? */
export function isPublished(state: RiskLifecycleState | undefined): boolean {
  return state === 'published'
}

export interface ApprovalRecord {
  decision: LifecycleDecision
  from: RiskLifecycleState
  to: RiskLifecycleState
  byUserId: string | null
  byName: string
  byRole: string
  at: string
  note?: string
}
