'use client'

/**
 * WorkflowChain — Batch F visual primitive
 * -----------------------------------------
 * Renders the N-step approval chain for a WorkflowInstance as a
 * horizontal dot-and-line progress strip. Current state is highlighted
 * in accent; completed steps are filled green; future steps are dim.
 *
 * Persona-aware: if the current viewer can advance / reject the
 * instance, the chain ends with action buttons. Otherwise it's
 * read-only — same component, no fork.
 */

import React from 'react'
import { Check, ChevronRight, X } from 'lucide-react'
import { usePersona } from '@/lib/context/PersonaContext'
import {
  STEP_CATALOG,
  WORKFLOWS,
  type WorkflowInstance,
  type WorkflowStepKey,
} from '@/lib/workflow/workflowTypes'
import {
  canAdvance,
  canReject,
  currentIndex,
  nextStep,
  progressLabel,
} from '@/lib/workflow/workflowEngine'

interface Props {
  instance: WorkflowInstance
  onAdvance?: (next: WorkflowInstance) => void
  onReject?: (next: WorkflowInstance) => void
}

export function WorkflowChain({ instance }: Props) {
  const { persona } = usePersona()
  const steps = WORKFLOWS[instance.kind].steps
  const cur = currentIndex(instance)
  const next = nextStep(instance)
  const canAdv = canAdvance(instance, persona?.id ?? null)
  const canRej = canReject(instance, persona?.id ?? null)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.005em' }}>
            {instance.subjectLabel}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 2 }}>
            {WORKFLOWS[instance.kind].label} · {progressLabel(instance)}
          </div>
        </div>
        {persona && (canAdv || canRej) && (
          <div style={{ display: 'flex', gap: 4 }}>
            {canRej && (
              <button
                style={btnStyle('reject')}
                title="Reject this step"
                onClick={() => {
                  /* parent owns persistence */
                }}
              >
                <X size={10} /> Reject
              </button>
            )}
            {canAdv && next && (
              <button
                style={btnStyle('advance')}
                title={`Advance to: ${STEP_CATALOG[next].label}`}
                onClick={() => {
                  /* parent owns persistence */
                }}
              >
                <ChevronRight size={10} /> {STEP_CATALOG[next].label}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {steps.map((s, i) => {
          const isCurrent = i === cur
          const isComplete = i < cur
          const isRejected = instance.state === 'rejected'
          const dotColor = isRejected
            ? 'var(--risk-critical, #FF3B3B)'
            : isCurrent
              ? 'var(--accent-primary)'
              : isComplete
                ? 'var(--state-success, #22C55E)'
                : 'var(--border-color)'
          const lineColor = isComplete
            ? 'var(--state-success, #22C55E)'
            : 'var(--border-color)'
          return (
            <React.Fragment key={s}>
              <StepDot
                step={s}
                isCurrent={isCurrent}
                isComplete={isComplete}
                color={dotColor}
              />
              {i < steps.length - 1 && (
                <span
                  style={{
                    flex: 1,
                    height: 2,
                    background: lineColor,
                    borderRadius: 2,
                    minWidth: 12,
                  }}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step labels */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 4 }}>
        {steps.map((s, i) => (
          <div
            key={s}
            style={{
              fontSize: 9,
              color: i === cur ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              fontWeight: i === cur ? 700 : 500,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            {STEP_CATALOG[s].label}
          </div>
        ))}
      </div>

      {/* Recent transition note */}
      {instance.history.length > 0 && (
        <div
          style={{
            fontSize: 10,
            color: 'var(--text-tertiary)',
            marginTop: 4,
            padding: '6px 8px',
            background: 'var(--bg-secondary)',
            borderLeft: '2px solid var(--accent-primary)',
            borderRadius: 4,
          }}
        >
          <strong style={{ color: 'var(--text-secondary)' }}>
            {instance.history[instance.history.length - 1].byName}
          </strong>{' '}
          {instance.history[instance.history.length - 1].note
            ? `— ${instance.history[instance.history.length - 1].note}`
            : `advanced to ${STEP_CATALOG[instance.state].label}.`}
        </div>
      )}
    </div>
  )
}

function StepDot({
  step,
  isCurrent,
  isComplete,
  color,
}: {
  step: WorkflowStepKey
  isCurrent: boolean
  isComplete: boolean
  color: string
}) {
  return (
    <span
      title={STEP_CATALOG[step].label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: isCurrent ? 22 : 16,
        height: isCurrent ? 22 : 16,
        borderRadius: '50%',
        background: isCurrent ? `${color}1f` : isComplete ? color : 'var(--bg-primary)',
        border: `2px solid ${color}`,
        flexShrink: 0,
        transition: 'transform 120ms ease-out',
      }}
    >
      {isComplete && <Check size={9} style={{ color: '#fff' }} />}
      {isCurrent && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
          }}
        />
      )}
    </span>
  )
}

function btnStyle(kind: 'advance' | 'reject'): React.CSSProperties {
  const accent = kind === 'advance' ? 'var(--accent-primary)' : 'var(--risk-critical, #FF3B3B)'
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    background: kind === 'advance' ? accent : 'transparent',
    color: kind === 'advance' ? 'var(--on-accent, #fff)' : accent,
    border: `1px solid ${accent}`,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    cursor: 'pointer',
  }
}
