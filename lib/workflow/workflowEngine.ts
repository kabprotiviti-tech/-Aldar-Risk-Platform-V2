/**
 * Workflow Engine — Batch F
 * --------------------------
 * Deterministic helpers around WorkflowInstance. Decides:
 *   - is this transition legal for this persona?
 *   - what's the next step?
 *   - how do we render a 5-dot progress chain?
 *
 * No side effects. The caller (Approvals page, drawer, ARC pack) owns
 * persistence and audit logging.
 */

import type { PersonaId } from '@/lib/personas'
import {
  STEP_CATALOG,
  WORKFLOWS,
  type WorkflowInstance,
  type WorkflowKind,
  type WorkflowStepKey,
  type WorkflowTransition,
} from './workflowTypes'

/** Steps in this workflow's chain. */
export function stepsFor(kind: WorkflowKind): WorkflowStepKey[] {
  return WORKFLOWS[kind].steps
}

/** Current index of state within the workflow's step list. */
export function currentIndex(instance: WorkflowInstance): number {
  return stepsFor(instance.kind).indexOf(instance.state)
}

/** The step that would come next on a normal advance (null if terminal). */
export function nextStep(instance: WorkflowInstance): WorkflowStepKey | null {
  if (STEP_CATALOG[instance.state].terminal) return null
  const steps = stepsFor(instance.kind)
  const i = steps.indexOf(instance.state)
  if (i < 0 || i >= steps.length - 1) return null
  return steps[i + 1]
}

/**
 * Can this persona advance the instance from its current state?
 * Persona must be listed in the step's `advanceBy` array AND there
 * must be a non-terminal next step.
 */
export function canAdvance(instance: WorkflowInstance, personaId: PersonaId | null): boolean {
  if (!personaId) return false
  if (STEP_CATALOG[instance.state].terminal) return false
  if (!nextStep(instance)) return false
  return STEP_CATALOG[instance.state].advanceBy.includes(personaId)
}

/**
 * Can this persona reject the instance? Same rule as advance — only
 * the gatekeeper of the current step can reject.
 */
export function canReject(instance: WorkflowInstance, personaId: PersonaId | null): boolean {
  if (!personaId) return false
  if (STEP_CATALOG[instance.state].terminal) return false
  return STEP_CATALOG[instance.state].advanceBy.includes(personaId)
}

/**
 * Sign-off invariants — Q0 governance hardening.
 * Defense-in-depth on top of step ordering: certain workflow kinds
 * must NEVER reach `closed` without specific intermediate states in
 * their history. If the invariant is violated, advance() refuses the
 * transition.
 */
const REQUIRED_HISTORY_BEFORE_CLOSE: Record<string, WorkflowStepKey[]> = {
  risk_approval: ['cro_approve', 'arc_signoff'],
  appetite_change: ['cro_approve', 'arc_signoff'],
  mitigation_closure: ['erm_review', 'cro_approve'],
  kri_threshold_change: ['erm_review', 'cro_approve'],
}

function violatesCloseInvariant(instance: WorkflowInstance, target: WorkflowStepKey): boolean {
  if (target !== 'closed') return false
  const required = REQUIRED_HISTORY_BEFORE_CLOSE[instance.kind]
  if (!required) return false
  const seen = new Set(instance.history.map((h) => h.to))
  return required.some((step) => !seen.has(step))
}

/** Pure transition — returns a NEW instance, never mutates the input. */
export function advance(
  instance: WorkflowInstance,
  by: PersonaId,
  byName: string,
  note?: string,
): WorkflowInstance {
  const next = nextStep(instance)
  if (!next) return instance
  if (!canAdvance(instance, by)) return instance
  if (violatesCloseInvariant(instance, next)) {
    // Block: the workflow cannot close without all required sign-off
    // states having passed through history. This is a belt-and-braces
    // guard on top of step ordering.
    return instance
  }
  const at = new Date().toISOString()
  const transition: WorkflowTransition = {
    at,
    from: instance.state,
    to: next,
    by,
    byName,
    note,
  }
  return {
    ...instance,
    state: next,
    updatedAt: at,
    history: [...instance.history, transition],
  }
}

export function reject(
  instance: WorkflowInstance,
  by: PersonaId,
  byName: string,
  note?: string,
): WorkflowInstance {
  if (!canReject(instance, by)) return instance
  const at = new Date().toISOString()
  const transition: WorkflowTransition = {
    at,
    from: instance.state,
    to: 'rejected',
    by,
    byName,
    note,
  }
  return {
    ...instance,
    state: 'rejected',
    updatedAt: at,
    history: [...instance.history, transition],
  }
}

/** Helper: where is this instance? "3 of 5 · ERM review". */
export function progressLabel(instance: WorkflowInstance): string {
  const steps = stepsFor(instance.kind)
  const i = currentIndex(instance)
  if (i < 0) return STEP_CATALOG[instance.state].label
  return `${i + 1} of ${steps.length} · ${STEP_CATALOG[instance.state].label}`
}
