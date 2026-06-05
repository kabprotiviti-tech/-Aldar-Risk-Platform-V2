'use client'

/**
 * EscalatedToGroupPanel — E10
 * ----------------------------
 * Surfaces every risk that has been escalated from a Risk Champion /
 * Subsidiary ERM Head up to the Group level. The Group ERM Head /
 * CEO opens the Portfolio Tower and sees a queue of pending items
 * with auto-drafted board narratives — the WOW moment #2 from the
 * demo storyteller agent.
 *
 * Data is consumed from EscalationsContext (localStorage-persisted,
 * Tier-B createPersistedContext). No fabrication: every entry was
 * created by a human via EscalateToGroupModal.
 */

import React from 'react'
import { ArrowUpCircle, CheckCircle2, Circle } from 'lucide-react'
import {
  useEscalations,
  type EscalationStatus,
} from '@/lib/context/EscalationsContext'

const STATUS_META: Record<EscalationStatus, { label: string; color: string; bg: string; border: string }> = {
  pending: {
    label: 'Pending',
    color: '#B8001F',
    bg: 'rgba(255,140,0,0.18)',
    border: 'rgba(255,140,0,0.55)',
  },
  acknowledged: {
    label: 'Acknowledged',
    color: '#2D9EFF',
    bg: 'rgba(45,158,255,0.18)',
    border: 'rgba(45,158,255,0.55)',
  },
  closed: {
    label: 'Closed',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.18)',
    border: 'rgba(34,197,94,0.55)',
  },
}

export function EscalatedToGroupPanel() {
  const { recent, pending, setStatus, removeEscalation } = useEscalations()
  const all = recent()
  const pendingCount = pending().length

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${pendingCount > 0 ? '#B8001F' : 'var(--accent-primary)'}`,
        borderRadius: 8,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <ArrowUpCircle size={11} />
            Escalated to Group
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Risks raised to Group ERM Head / CEO attention.{' '}
            {pendingCount > 0
              ? `${pendingCount} pending review.`
              : 'Nothing pending right now.'}
          </div>
        </div>
      </div>

      {all.length === 0 && (
        <div
          style={{
            padding: 14,
            background: 'var(--bg-primary)',
            border: '1px dashed var(--border-color)',
            borderRadius: 6,
            fontSize: 11,
            color: 'var(--text-tertiary)',
            fontStyle: 'italic',
            lineHeight: 1.55,
          }}
        >
          No escalations yet. From <code>/risk-register</code>, click any risk
          to open the drawer, then click <strong>Escalate</strong> in the
          header. The escalation auto-drafts a board-style narrative from
          the engine state — Risk Champion just adds a justification and
          ships it up to Group in one click.
        </div>
      )}

      {all.map((e) => {
        const m = STATUS_META[e.status]
        return (
          <div
            key={e.id}
            style={{
              padding: 12,
              background: 'var(--bg-primary)',
              border: `1px solid ${m.border}`,
              borderLeft: `3px solid ${m.color}`,
              borderRadius: 6,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                  }}
                >
                  {e.riskId}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {e.riskName}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                  Escalated {e.escalatedAt.slice(0, 10)} by{' '}
                  <strong style={{ color: 'var(--text-secondary)' }}>{e.escalatedBy}</strong>
                </div>
              </div>
              <span
                style={{
                  display: 'inline-block',
                  background: m.bg,
                  color: m.color,
                  border: `1px solid ${m.border}`,
                  padding: '2px 8px',
                  borderRadius: 3,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: 6,
                fontSize: 10,
              }}
            >
              <Stat label="Inherent" value={e.snapshot.inherentScore.toFixed(1)} />
              <Stat label="Residual" value={e.snapshot.residualScore.toFixed(1)} />
              <Stat label="Rating" value={e.snapshot.rating} />
              <Stat label="Exposure" value={`${e.snapshot.exposureAedMn.toFixed(0)} mn`} />
            </div>

            <div
              style={{
                fontSize: 11,
                color: 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 4,
                padding: '8px 10px',
                lineHeight: 1.55,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Justification
              </div>
              {e.justification}
            </div>

            <div
              style={{
                fontSize: 11,
                color: 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                border: '1px dashed var(--accent-primary)',
                borderRadius: 4,
                padding: '8px 10px',
                lineHeight: 1.6,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Board Narrative
              </div>
              {e.narrative}
            </div>

            {/* Group-side actions */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {e.status === 'pending' && (
                <button
                  onClick={() => setStatus(e.id, 'acknowledged')}
                  title="Mark as acknowledged"
                  style={actionBtnStyle('var(--accent-primary)')}
                >
                  <Circle size={10} />
                  Acknowledge
                </button>
              )}
              {e.status !== 'closed' && (
                <button
                  onClick={() => setStatus(e.id, 'closed')}
                  title="Close — risk has been actioned at Group level"
                  style={actionBtnStyle('var(--risk-low)')}
                >
                  <CheckCircle2 size={10} />
                  Close
                </button>
              )}
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Permanently delete this escalation log entry for ${e.riskId}?`,
                    )
                  )
                    removeEscalation(e.id)
                }}
                title="Delete (audit log entry)"
                style={{
                  ...actionBtnStyle('var(--risk-critical)'),
                  marginLeft: 'auto',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 3,
        padding: '4px 6px',
      }}
    >
      <div
        style={{
          fontSize: 8,
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    background: 'transparent',
    border: `1px solid ${color}66`,
    color,
    borderRadius: 3,
    padding: '3px 8px',
    fontSize: 9,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  }
}
