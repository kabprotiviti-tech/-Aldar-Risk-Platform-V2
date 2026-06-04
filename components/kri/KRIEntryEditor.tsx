'use client'

/**
 * KRIEntryEditor
 * --------------
 * Modal that lets the user (a) add or update a monthly KRI value for a
 * given period, and (b) review the last few entries with delete.
 *
 * D4 will consume these entries to drive the traffic-light status; D5
 * will plot them as a sparkline.
 */

import React, { useEffect, useState } from 'react'
import { Check, X, Trash2 } from 'lucide-react'
import { useKRIEntries, type KRIEntry } from '@/lib/context/KRIEntriesContext'
import type { KRIDefinition } from '@/lib/data/kri-definitions'

interface Props {
  kri: KRIDefinition
  onClose: () => void
}

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function KRIEntryEditor({ kri, onClose }: Props) {
  const { entriesFor, upsertEntry, removeEntry } = useKRIEntries()
  const history = entriesFor(kri.id)
  const [period, setPeriod] = useState<string>(currentMonth())
  const [value, setValue] = useState<string>('')
  const [enteredBy, setEnteredBy] = useState<string>('Risk Champion (demo)')
  const [note, setNote] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Pre-fill when changing period to an existing entry
  useEffect(() => {
    const existing = history.find((h) => h.period === period)
    if (existing) {
      setValue(String(existing.value))
      setEnteredBy(existing.enteredBy)
      setNote(existing.note || '')
    } else {
      setValue('')
      setNote('')
    }
  }, [period, history])

  // Esc to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  function save() {
    const num = parseFloat(value)
    if (Number.isNaN(num)) {
      setError('Enter a numeric value')
      return
    }
    if (!/^\d{4}-\d{2}$/.test(period)) {
      setError('Period must be in YYYY-MM format')
      return
    }
    if (enteredBy.trim().length < 2) {
      setError('Entered By is required')
      return
    }
    setError(null)
    upsertEntry({
      kriId: kri.id,
      period,
      value: num,
      enteredBy: enteredBy.trim(),
      note: note.trim() || undefined,
    })
    onClose()
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
          zIndex: 9100,
        }}
      />
      <div
        role="dialog"
        aria-label={`Add KRI value for ${kri.id}`}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(520px, 94vw)',
          maxHeight: '90vh',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 10,
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
          zIndex: 9101,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
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
              }}
            >
              Manual KRI value entry
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
              {kri.id} · {kri.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
              {kri.frequency.charAt(0).toUpperCase() + kri.frequency.slice(1)}{' '}
              cadence ·{' '}
              {kri.direction === 'higher_is_better'
                ? 'higher is better'
                : 'lower is better'}
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
            gap: 14,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Period (YYYY-MM)" required>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field
              label={`Value (${kri.defaultThresholds.unit})`}
              required
            >
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 92"
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Entered by" required>
            <input
              type="text"
              value={enteredBy}
              onChange={(e) => setEnteredBy(e.target.value)}
              placeholder="e.g. Sara Al-Mahri (Risk Champion)"
              style={inputStyle}
            />
          </Field>

          <Field label="Note (optional)">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Brief context — driver of change, data caveat, etc."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }}
            />
          </Field>

          {error && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--risk-critical)',
                fontStyle: 'italic',
              }}
            >
              {error}
            </div>
          )}

          {/* History list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h3
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                margin: 0,
              }}
            >
              Recent entries ({history.length})
            </h3>
            {history.length === 0 && (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  fontStyle: 'italic',
                  padding: '6px 0',
                }}
              >
                No entries yet. Add the first monthly value above.
              </div>
            )}
            {history
              .slice()
              .reverse()
              .slice(0, 8)
              .map((h) => (
                <HistoryRow
                  key={h.id}
                  entry={h}
                  unit={kri.defaultThresholds.unit}
                  onLoad={() => setPeriod(h.period)}
                  onDelete={() => removeEntry(h.id)}
                />
              ))}
            {history.length > 8 && (
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-tertiary)',
                  fontStyle: 'italic',
                }}
              >
                +{history.length - 8} earlier entries (D5 trend chart will
                surface these visually).
              </div>
            )}
          </div>

          <div
            style={{
              padding: 10,
              background: 'var(--bg-secondary)',
              border: '1px dashed var(--border-color)',
              borderRadius: 6,
              fontSize: 11,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>
              Manual entry only — no auto-fill.
            </strong>{' '}
            Pilot will wire automated feeds from ABC PMS / Yardi / SAP.
            Re-entering the same period replaces the prior value.
          </div>
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
            borderRadius: '0 0 10px 10px',
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
              gap: 4,
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
            <Check size={11} />
            Save value
          </button>
        </div>
      </div>
    </>
  )
}

// ── presentational helpers ──────────────────────────────────────────────
function HistoryRow({
  entry,
  unit,
  onLoad,
  onDelete,
}: {
  entry: KRIEntry
  unit: string
  onLoad: () => void
  onDelete: () => void
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '70px 1fr auto auto',
        gap: 8,
        padding: '6px 8px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 4,
        fontSize: 11,
        alignItems: 'center',
      }}
    >
      <span
        style={{
          color: 'var(--text-tertiary)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontWeight: 700,
        }}
      >
        {entry.period}
      </span>
      <span style={{ color: 'var(--text-primary)' }}>
        <strong>{entry.value}</strong>
        <span style={{ color: 'var(--text-tertiary)', marginLeft: 4 }}>{unit}</span>
        {entry.note && (
          <span
            style={{
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
              marginLeft: 6,
            }}
          >
            · {entry.note}
          </span>
        )}
      </span>
      <span
        style={{ color: 'var(--text-tertiary)', fontSize: 10 }}
        title={`Entered ${entry.enteredAt}`}
      >
        {entry.enteredBy}
      </span>
      <div style={{ display: 'inline-flex', gap: 4 }}>
        <button
          onClick={onLoad}
          title="Load this period for editing"
          style={iconBtnStyle}
        >
          ↑
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete entry for ${entry.period}?`)) onDelete()
          }}
          title="Delete entry"
          style={{ ...iconBtnStyle, color: 'var(--risk-critical)' }}
        >
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  padding: '7px 10px',
  fontSize: 12,
  fontFamily: 'inherit',
  fontVariantNumeric: 'tabular-nums',
}

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  borderRadius: 3,
  padding: '2px 5px',
  cursor: 'pointer',
  fontSize: 10,
  display: 'inline-flex',
  alignItems: 'center',
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
