// ─── Control Failure → Action Bridge ──────────────────────────────────────────
// Integration Pending — replace with live GRC workflow triggers.
// For each failed control in controlData.ts, this module derives a Decision
// Layer action and merges it with the existing action set. No duplicates —
// actions are keyed by CTRL-{controlId}. Structure is fully consistent with
// the Action interface in actionEngine.ts.

import {
  controls,
} from '@/lib/controlData'
import {
  type Action,
  type ActionPriority,
  type ActionStatus,
  type AlertLink,
  TOTAL_PORTFOLIO_VALUE_M,
} from '@/lib/actionEngine'
import {
  riskRegister,
} from '@/lib/simulated-data'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getRisk = (id: string) => riskRegister.find(r => r.id === id)

// Days since a given ISO date relative to today (2026-04-18)
const TODAY_STR = '2026-04-18'
const TODAY = new Date(TODAY_STR)
function daysSince(isoDate: string): number {
  return Math.round((TODAY.getTime() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Control ID → control-sourced AlertLink ────────────────────────────────────

function controlAlertLink(controlId: string, controlName: string, process: string): AlertLink {
  return {
    id: controlId,
    title: controlName,
    source: `ICOFAR Control Library · ${process}`,
    type: 'risk',
    detail: 'Control failure detected via ICOFAR testing engine',
  }
}

// ─── Build control failure actions ────────────────────────────────────────────
// Only failed controls generate actions. Each action is enriched with:
//   - financial impact from the linked risk
//   - consequence / recommendation derived from statusReason
//   - an "Integration Pending — triggered due to control failure" explanation

function buildControlFailureActions(): Action[] {
  const failedControls = controls.filter(c => c.status === 'failed')

  return failedControls.map((control): Action => {
    const risk = getRisk(control.linkedRiskId)
    const impactValue = risk?.financialImpact ?? 50   // fallback AED 50M if risk not found
    const impactLabel = `AED ${impactValue}M at risk`

    // Deadline: 14-day standard response SLA for control failures
    const deadlineDays = 14

    // Elapsed days — how long ago the control's nextDue date passed
    const elapsedDays = daysSince(control.nextDue)
    const daysOverdue  = Math.max(0, elapsedDays - deadlineDays)
    const status: ActionStatus = daysOverdue > 0 ? 'overdue' : 'open'
    const escalated = daysOverdue > 3

    const impactPercent = parseFloat(((impactValue / TOTAL_PORTFOLIO_VALUE_M) * 100).toFixed(1))

    // Priority score — fixed at 72 for failed controls (high severity, overdue)
    // Placed above medium actions but below ACT-002/ACT-004 in existing set
    const priorityScore = Math.min(72, 40 + Math.min(daysOverdue * 2, 30))

    return {
      id:              `CTRL-${control.id}`,
      title:           `Fix Control Failure: ${control.name}`,
      priority:        'high' as ActionPriority,
      impactValue,
      impactLabel,
      owner:           control.owner,
      deadline:        `${deadlineDays} days`,
      deadlineDays,
      worseningTrend:  0.85,   // control failures are a confirmed worsening signal
      portfolio:       control.portfolio,
      category:        `Control Failure — ${control.process}`,

      triggerIds:      [control.linkedRiskId],

      rootCauses: [
        `Control ${control.id} failed: ${control.statusReason}`,
        `Linked risk ${control.linkedRiskId} (${control.linkedRiskTitle}) — exposure AED ${impactValue}M`,
        `Integration Pending — triggered due to control failure in ICOFAR testing engine`,
      ],

      propagationPath: [
        { signal: `${control.id} status: failed`, effect: 'Internal control objective not met', magnitude: `${control.process} process — ${control.controlType}` },
        { signal: `${control.linkedRiskId} risk unmitigated`, effect: 'Financial exposure window open', magnitude: `AED ${impactValue}M` },
        { signal: `ICOFAR assertion: ${control.icafarAssertion}`, effect: 'Financial statement reliability risk', magnitude: control.portfolio },
      ],

      dataPoints: [
        { label: 'Control Status',    value: 'FAILED',                source: 'ICOFAR Testing Engine', threshold: 'Effective', breached: true },
        { label: 'Control Type',      value: control.controlType,     source: 'Control Library', breached: false },
        { label: 'Process',           value: control.process,         source: 'Control Library', breached: false },
        { label: 'ICOFAR Assertion',  value: control.icafarAssertion, source: 'ICOFAR Framework', breached: true },
        { label: 'Financial Exposure',value: `AED ${impactValue}M`,   source: 'Risk Register', threshold: 'AED 0', breached: true },
      ],

      calculationLogic: `Control ${control.id} failed testing. Linked risk ${control.linkedRiskId} carries AED ${impactValue}M financial exposure (${impactPercent}% of total AED ${TOTAL_PORTFOLIO_VALUE_M.toLocaleString()}M portfolio). Remediation deadline: ${deadlineDays} days from failure detection. Elapsed: ${elapsedDays} days since nextDue.`,

      consequence: `Control ${control.id} failure leaves ${control.linkedRiskTitle} unmitigated. If not remediated within ${deadlineDays} days: AED ${impactValue}M exposure escalates, ICOFAR assertion '${control.icafarAssertion}' is not met, and audit findings may be raised.`,

      ifActed:         `Control remediated within SLA. ICOFAR assertion restored. Financial exposure reduced to residual risk level. Audit trail complete.`,
      ifIgnored:       `Control ${control.id} remains failed. AED ${impactValue}M exposure persists. Potential regulatory and audit implications for ${control.icafarAssertion} assertion.`,
      ifActedExposureM: Math.round(impactValue * 0.15),   // 85% risk reduction if control fixed

      recommendation: [
        `Investigate root cause: ${control.statusReason.split('.')[0]}`,
        `Reassign control ownership and confirm ${control.owner} acknowledgement within 48 hours`,
        `Implement corrective action and re-test within ${deadlineDays} days`,
        `Update evidence file: ${control.evidenceRequired}`,
        `Escalate to Risk Committee if remediation not completed within SLA`,
      ],

      aiConfidence: 0.92,   // high — based on direct test failure evidence

      triggeredBy: [
        controlAlertLink(control.id, control.name, control.process),
        ...(risk ? [{
          id: control.linkedRiskId,
          title: risk.title,
          source: `Risk Register · ${risk.category}`,
          type: 'risk' as const,
          detail: `Score ${risk.score}/25 · ${risk.trend} · Owner: ${risk.owner}`,
        }] : []),
      ],

      impactedUnits: [
        {
          name: control.linkedRiskTitle,
          portfolio: control.portfolio,
          impact: 'High',
          reason: `Control failure in ${control.process} process directly impacts this risk's mitigations`,
        },
      ],

      impactPercent,
      priorityScore,
      elapsedDays,
      status,
      daysOverdue,
      escalated,
    }
  })
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const CONTROL_FAILURE_ACTIONS: Action[] = buildControlFailureActions()

/**
 * Returns all actions merged — existing Decision Layer actions + control failure actions.
 * Deduplication key: action.id (CTRL-xxx never collides with ACT-xxx).
 * Sorted by priorityScore descending.
 */
export function getMergedActions(baseActions: Action[]): Action[] {
  const existing = new Set(baseActions.map(a => a.id))
  const additions = CONTROL_FAILURE_ACTIONS.filter(a => !existing.has(a.id))
  return [...baseActions, ...additions].sort((a, b) => b.priorityScore - a.priorityScore)
}
