'use client'

/**
 * EscalateToGroupModal — E10
 * --------------------------
 * Pre-fills a board-style narrative from the risk's Cause / Event /
 * Impact / exposure / current status. User can edit the narrative,
 * add a justification, and submit. The escalation is logged to
 * EscalationsContext (localStorage-persisted) and surfaces on the
 * Portfolio Tower's "Escalated to Group" panel.
 *
 * The auto-drafted narrative is honest: every value substituted is
 * derived from the engine state at the moment of escalation. No AI
 * hallucination — pure template fill.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowUpCircle, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useEscalations } from '@/lib/context/EscalationsContext'
import { RISKS } from '@/lib/engine/seedData'
import type { RiskState } from '@/lib/engine/types'

interface Props {
  risk: RiskState | null
  onClose: () => void
}

/**
 * Build a board-style narrative from the engine state. Pure template —
 * substitutes engine values into a deterministic string. No invented
 * sentences, no AI completion.
 */
function buildAutoNarrative(risk: RiskState): string {
  const seed = RISKS.find((r) => r.id === risk.id)
  const ratingShift =
    risk.ratingFrom === risk.ratingTo
      ? `holding at ${risk.ratingTo}`
      : `${risk.ratingFrom} → ${risk.ratingTo}`
  const deltaPct =
    risk.baseExposureAedMn > 0
      ? ((risk.exposureAedMn - risk.baseExposureAedMn) / risk.baseExposureAedMn) * 100
      : 0
  const deltaText =
    Math.abs(deltaPct) < 0.5
      ? 'broadly flat vs baseline'
      : `${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(0)}% vs baseline`
  return [
    `Escalating risk ${risk.id} (${risk.name}, owner: ${risk.owner}) for Group attention.`,
    seed
      ? `Cause: ${seed.cause}. Event: ${seed.event}. Impact to ABC: ${seed.impact}.`
      : '',
    `Current posture: residual ${risk.newResidual.toFixed(1)} / 25, rating ${ratingShift}, ` +
      `exposure ${risk.exposureAedMn.toFixed(0)} AED mn (${deltaText}).`,
    risk.contributingDrivers.length > 0
      ? `Top drivers: ${risk.contributingDrivers
          .slice()
          .sort(
            (a, b) =>
              Math.abs(b.contributionPoints) - Math.abs(a.contributionPoints),
          )
          .slice(0, 3)
          .map((d) => `${d.driverId} (${d.contributionPoints >= 0 ? '+' : ''}${d.contributionPoints.toFixed(1)} pts)`)
          .join(', ')}.`
      : '',
    `Recommend Group ERM Head review and confirm escalation path / appetite review.`,
  ]
    .filter(Boolean)
    .join(' ')
}

export function EscalateToGroupModal({ risk, onClose }: Props) {
  const { pendingFor, addEscalation } = useEscalations()
  const [justification, setJustification] = useState('')
  const [narrative, setNarrative] = useState('')
  const [escalatedBy, setEscalatedBy] = useState('Risk Champion (demo)')
  const [error, setError] = useState<string | null>(null)
  const existing = risk ? pendingFor(risk.id) : null

  const autoDraft = useMemo(
    () => (risk ? buildAutoNarrative(risk) : ''),
    [risk],
  )

  // Pre-fill the narrative when the modal opens for a new risk
  useEffect(() => {
    if (risk) {
      setNarrative(autoDraft)
      setJustification('')
      setError(null)
    }
  }, [risk, autoDraft])

  function regenerateDraft() {
    setNarrative(autoDraft)
  }

  function save() {
    if (!risk) return
    if (justification.trim().length < 10) {
      setError('Justification must be at least 10 characters.')
      return
    }
    if (narrative.trim().length < 30) {
      setError('Narrative is too short — keep the auto-draft or expand it.')
      return
    }
    setError(null)
    addEscalation({
      riskId: risk.id,
      riskName: risk.name,
      justification: justification.trim(),
      narrative: narrative.trim(),
      escalatedBy: escalatedBy.trim() || 'Risk Champion (demo)',
      snapshot: {
        inherentScore: risk.newInherent,
        residualScore: risk.newResidual,
        rating: risk.ratingTo,
        exposureAedMn: risk.exposureAedMn,
      },
    })
    onClose()
  }

  if (!risk) return null

  return (
    <Modal open={!!risk} onClose={onClose} ariaLabel={`Escalate ${risk.id} to Group`} size="md">
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--accent-primary)',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ArrowUpCircle size={11} />
            Escalate to Group
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
            {risk.id} · {risk.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            Surfaces this risk on the Portfolio Tower for Group ERM Head /
            CEO attention with an auto-drafted board narrative.
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            borderRadius: 6,
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {existing && (
          <div
            style={{
              padding: 10,
              background: 'rgba(245,197,24,0.10)',
              border: '1px solid rgba(245,197,24,0.40)',
              borderRadius: 6,
              fontSize: 11,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>
              Already escalated.
            </strong>{' '}
            This risk is currently {existing.status} since {existing.escalatedAt.slice(0, 10)} by {existing.escalatedBy}. Submitting again will create a second entry.
          </div>
        )}

        <Field label="Justification" required>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Why is this risk escalated to Group right now? E.g. residual breached appetite, cross-entity contagion, ARC-level decision needed."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }}
          />
        </Field>

        <Field label="Escalated by">
          <input
            type="text"
            value={escalatedBy}
            onChange={(e) => setEscalatedBy(e.target.value)}
            placeholder="e.g. Sara Al-Mahri (Risk Champion)"
            style={inputStyle}
          />
        </Field>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              }}
            >
              Board narrative
              <span style={{ color: 'var(--risk-critical)', marginLeft: 3 }}>*</span>
            </span>
            <button
              onClick={regenerateDraft}
              title="Regenerate auto-draft from current engine state"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'transparent',
                border: '1px solid var(--accent-primary)',
                color: 'var(--accent-primary)',
                borderRadius: 4,
                padding: '2px 8px',
                cursor: 'pointer',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={10} />
              Regenerate
            </button>
          </div>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={6}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 120, lineHeight: 1.55 }}
          />
          <span style={{ fontSize: 9, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            Auto-drafted from engine state (Cause / Event / Impact / scores /
            top drivers). Pure template — no AI hallucination. Edit freely
            before save.
          </span>
        </div>

        {error && (
          <div style={{ fontSize: 11, color: 'var(--risk-critical)', fontStyle: 'italic' }}>
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: 14,
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          background: 'var(--bg-secondary)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            padding: '7px 14px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          Cancel
        </button>
        <button
          onClick={save}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: 'var(--accent-primary)',
            color: 'var(--on-accent)',
            border: 'none',
            padding: '7px 16px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          <ArrowUpCircle size={11} />
          Escalate to Group
        </button>
      </div>
    </Modal>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  padding: '8px 10px',
  fontSize: 12,
  fontFamily: 'inherit',
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--risk-critical)', marginLeft: 3 }}>*</span>}
      </span>
      {children}
    </label>
  )
}
