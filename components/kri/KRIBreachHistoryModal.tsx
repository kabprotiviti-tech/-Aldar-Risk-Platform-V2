'use client'

/**
 * KRIBreachHistoryModal
 * ---------------------
 * Modal that lists every status transition for a single KRI, computed
 * from its entries × thresholds × direction. Honest derivation — no
 * persisted breach store; if the user changes thresholds, the history
 * updates accordingly.
 *
 * D6 of Module 3. First consumer of:
 *   - Tier-B #5: createPersistedContext (transitively, via context shape)
 *   - Tier-B #6: <Modal> primitive
 */

import React from 'react'
import { X, History } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useKRIEntries } from '@/lib/context/KRIEntriesContext'
import { useKRIThresholds } from '@/lib/context/KRIThresholdsContext'
import {
  computeBreachHistory,
  transitionColor,
} from '@/lib/data/kri-breach-history'
import type { KRIDefinition } from '@/lib/data/kri-definitions'

interface Props {
  kri: KRIDefinition | null
  onClose: () => void
}

export function KRIBreachHistoryModal({ kri, onClose }: Props) {
  const { entriesFor } = useKRIEntries()
  const { thresholdsFor } = useKRIThresholds()

  if (!kri) return null

  const entries = entriesFor(kri.id)
  const thresholds = thresholdsFor(kri)
  const events = computeBreachHistory(entries, thresholds, kri.direction)
  const reversed = events.slice().reverse() // newest first for the timeline

  return (
    <Modal open={!!kri} onClose={onClose} ariaLabel={`Breach history for ${kri.id}`} size="md">
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
            <History size={11} />
            Breach Event Log
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
            {kri.id} · {kri.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            {events.length === 0
              ? 'No status transitions yet — values stable in current band.'
              : `${events.length} status transition${events.length === 1 ? '' : 's'} across ${entries.length} entries`}
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
            padding: 6,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
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
          gap: 8,
        }}
      >
        {reversed.length === 0 && (
          <div
            style={{
              padding: 14,
              background: 'var(--bg-secondary)',
              border: '1px dashed var(--border-color)',
              borderRadius: 6,
              fontSize: 11,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              fontStyle: 'italic',
            }}
          >
            This KRI has not transitioned between bands. Either there are no
            entries yet, or all observed values stayed in the same status band
            (Green, Amber, or Red). Try the Add Value action on the KRI page,
            or edit thresholds to see the timeline rebuild.
          </div>
        )}

        {reversed.map((e) => {
          const c = transitionColor(e)
          return (
            <div
              key={e.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '70px 1fr auto',
                gap: 10,
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                border: `1px solid ${c.border}`,
                borderLeft: `3px solid ${c.fg}`,
                borderRadius: 6,
                fontSize: 11,
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                }}
              >
                {e.period}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  style={{
                    color: c.fg,
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                  }}
                >
                  {c.label}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
                  Value <strong style={{ color: 'var(--text-primary)' }}>{e.value}</strong>{' '}
                  {kri.defaultThresholds.unit} ·{' '}
                  amber {e.amberBoundary} · red {e.redBoundary}
                </span>
              </div>
              <span
                style={{
                  display: 'inline-block',
                  background: c.bg,
                  color: c.fg,
                  border: `1px solid ${c.border}`,
                  padding: '2px 8px',
                  borderRadius: 3,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {e.previousStatus ?? 'first'} → {e.newStatus}
              </span>
            </div>
          )
        })}

        <div
          style={{
            marginTop: 4,
            padding: 10,
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-color)',
            borderRadius: 6,
            fontSize: 10,
            color: 'var(--text-tertiary)',
            fontStyle: 'italic',
          }}
        >
          Events derived from manual KRI entries × current thresholds × direction.
          Editing thresholds re-evaluates the history. A forensic-grade audit log
          (with thresholds frozen at event time) ships in Module 8.
        </div>
      </div>
    </Modal>
  )
}
