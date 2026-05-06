'use client'

/**
 * KRIThresholdEditor
 * ------------------
 * Compact inline editor that lets the user set the amber/red threshold
 * boundaries for a single KRI. Saves to localStorage via
 * KRIThresholdsContext. Reset button reverts to the illustrative
 * default published in the KRI definition.
 *
 * Layout: appears as a small popover panel; toggled by parent component.
 */

import React, { useEffect, useState } from 'react'
import { Check, X, RotateCcw } from 'lucide-react'
import { useKRIThresholds } from '@/lib/context/KRIThresholdsContext'
import type { KRIDefinition, KRIThresholds } from '@/lib/data/kri-definitions'

interface Props {
  kri: KRIDefinition
  onClose: () => void
}

export function KRIThresholdEditor({ kri, onClose }: Props) {
  const { thresholdsFor, isOverridden, setThresholds, resetThresholds } =
    useKRIThresholds()
  const current = thresholdsFor(kri)

  const [amber, setAmber] = useState<number>(current.amberBoundary)
  const [red, setRed] = useState<number>(current.redBoundary)
  const [error, setError] = useState<string | null>(null)

  // Re-sync local state if KRI or override changes externally
  useEffect(() => {
    setAmber(current.amberBoundary)
    setRed(current.redBoundary)
  }, [kri.id, current.amberBoundary, current.redBoundary])

  function validate(a: number, r: number): string | null {
    if (Number.isNaN(a) || Number.isNaN(r)) return 'Both boundaries are required'
    if (kri.direction === 'higher_is_better') {
      // green ≥ amber > red. So amber must be > red.
      if (a <= r) return 'Amber boundary must be GREATER than red boundary (higher is better).'
    } else {
      // green ≤ amber < red. So red must be > amber.
      if (r <= a) return 'Red boundary must be GREATER than amber boundary (lower is better).'
    }
    return null
  }

  function save() {
    const err = validate(amber, red)
    if (err) {
      setError(err)
      return
    }
    const next: KRIThresholds = {
      amberBoundary: amber,
      redBoundary: red,
      unit: current.unit,
    }
    setThresholds(kri.id, next)
    onClose()
  }

  function reset() {
    resetThresholds(kri.id)
    onClose()
  }

  const directionHint =
    kri.direction === 'higher_is_better'
      ? 'Higher is better — green ≥ amber > red'
      : 'Lower is better — green ≤ amber < red'

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--accent-primary)',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
        minWidth: 320,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            Edit thresholds
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
            {kri.id} · {kri.name}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            borderRadius: 4,
            padding: 4,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <X size={12} />
        </button>
      </div>

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
        }}
      >
        {directionHint}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <BoundaryField
          label="Amber boundary"
          color="var(--risk-medium)"
          value={amber}
          onChange={(v) => {
            setAmber(v)
            setError(validate(v, red))
          }}
          unit={current.unit}
        />
        <BoundaryField
          label="Red boundary"
          color="var(--risk-critical)"
          value={red}
          onChange={(v) => {
            setRed(v)
            setError(validate(amber, v))
          }}
          unit={current.unit}
        />
      </div>

      {error && (
        <div
          style={{
            fontSize: 10,
            color: 'var(--risk-critical)',
            fontStyle: 'italic',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          padding: '6px 8px',
          background: 'var(--bg-secondary)',
          border: '1px dashed var(--border-color)',
          borderRadius: 4,
        }}
      >
        Default: amber {kri.defaultThresholds.amberBoundary}, red{' '}
        {kri.defaultThresholds.redBoundary}{' '}
        ({kri.defaultThresholds.unit}). Pilot will calibrate to Aldar
        appetite & tolerance.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <button
          onClick={reset}
          disabled={!isOverridden(kri.id)}
          title={isOverridden(kri.id) ? 'Revert to default' : 'No override set'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: isOverridden(kri.id) ? 'var(--text-secondary)' : 'var(--text-tertiary)',
            borderRadius: 4,
            padding: '5px 10px',
            fontSize: 10,
            fontWeight: 700,
            cursor: isOverridden(kri.id) ? 'pointer' : 'not-allowed',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          <RotateCcw size={10} />
          Reset
        </button>
        <button
          onClick={save}
          disabled={!!error}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: error ? 'var(--bg-secondary)' : 'var(--accent-primary)',
            color: error ? 'var(--text-tertiary)' : 'var(--on-accent)',
            border: 'none',
            borderRadius: 4,
            padding: '5px 12px',
            fontSize: 10,
            fontWeight: 700,
            cursor: error ? 'not-allowed' : 'pointer',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          <Check size={10} />
          Save
        </button>
      </div>
    </div>
  )
}

function BoundaryField({
  label,
  color,
  value,
  onChange,
  unit,
}: {
  label: string
  color: string
  value: number
  onChange: (v: number) => void
  unit: string
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            flex: 1,
            background: 'var(--bg-secondary)',
            border: `1px solid ${color}55`,
            borderRadius: 4,
            color: 'var(--text-primary)',
            padding: '5px 8px',
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
          }}
        />
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{unit}</span>
      </div>
    </label>
  )
}
