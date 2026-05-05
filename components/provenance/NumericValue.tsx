'use client'

/**
 * NumericValue
 * ------------
 * Wraps every numeric figure shown in the platform with a provenance
 * tooltip. Click "ⓘ" to see source, retrieval date, formula, and the
 * upstream chain of inputs.
 *
 * Standing rule (CLAUDE.md): every number on screen MUST be either
 *   - verified (real source)
 *   - illustrative (sample, clearly labeled)
 *   - placeholder (calibration pending)
 *   - ai_hypothesis (pending human approval)
 * If you have a number with none of these tags — DO NOT render it raw.
 * Either tag it or remove it.
 */

import React from 'react'
import type { DataPoint, ReliabilityTier } from '@/lib/provenance/types'

interface NumericValueProps {
  data: DataPoint
  /** Display formatter — defaults to value.toLocaleString(). */
  format?: (value: number) => string
  /** Optional label suffix override (otherwise uses data.unit). */
  unitOverride?: string
  /** Compact mode hides the tier dot but keeps the tooltip. */
  compact?: boolean
}

const TIER_DOT: Record<ReliabilityTier, { color: string; label: string }> = {
  verified: { color: '#22C55E', label: 'Verified' },
  illustrative: { color: '#F5C518', label: 'Illustrative / Sample' },
  placeholder: { color: '#FF8C00', label: 'Placeholder — calibration pending' },
  ai_hypothesis: { color: '#A855F7', label: 'AI Hypothesis — pending approval' },
}

export function NumericValue({
  data,
  format,
  unitOverride,
  compact = false,
}: NumericValueProps) {
  const [open, setOpen] = React.useState(false)
  const wrapperRef = React.useRef<HTMLSpanElement>(null)

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const formatted = format ? format(data.value) : data.value.toLocaleString()
  const unit = unitOverride ?? data.unit
  const dot = TIER_DOT[data.reliability]

  return (
    <span
      ref={wrapperRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {formatted}
        {unit && (
          <span style={{ marginLeft: 3, color: 'var(--text-secondary)', fontSize: '0.85em' }}>
            {unit}
          </span>
        )}
      </span>

      {!compact && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Show provenance"
          title={`${dot.label} — click for source`}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            color: dot.color,
            fontSize: 11,
            lineHeight: 1,
          }}
        >
          ⓘ
        </button>
      )}

      {open && (
        <ProvenanceCard data={data} tierColor={dot.color} tierLabel={dot.label} />
      )}
    </span>
  )
}

function ProvenanceCard({
  data,
  tierColor,
  tierLabel,
}: {
  data: DataPoint
  tierColor: string
  tierLabel: string
}) {
  return (
    <div
      role="dialog"
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        right: 0,
        zIndex: 9999,
        width: 320,
        background: 'var(--bg-card)',
        border: `1px solid ${tierColor}66`,
        borderRadius: 8,
        padding: 12,
        boxShadow: '0 12px 30px -8px rgba(0,0,0,0.45)',
        fontSize: 11,
        color: 'var(--text-primary)',
        textAlign: 'left',
        whiteSpace: 'normal',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: tierColor,
            display: 'inline-block',
          }}
        />
        <span style={{ fontWeight: 700, color: tierColor, letterSpacing: 0.4 }}>
          {tierLabel.toUpperCase()}
        </span>
      </div>

      <Row label="Source" value={data.source.title} />
      {data.source.url && (
        <Row
          label="Reference"
          value={
            <a
              href={data.source.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
            >
              Open ↗
            </a>
          }
        />
      )}
      {data.source.pageRef && <Row label="Page" value={data.source.pageRef} />}
      {data.source.fetchedAt && (
        <Row
          label="Retrieved"
          value={`${data.source.fetchedAt}${
            data.source.fetchedBy ? ` · ${data.source.fetchedBy}` : ''
          }`}
        />
      )}
      {data.formula && <Row label="Formula" value={<code style={{ fontSize: 10 }}>{data.formula}</code>} />}
      {data.upstream && data.upstream.length > 0 && (
        <Row
          label="Inputs"
          value={
            <ul style={{ margin: 0, paddingLeft: 14 }}>
              {data.upstream.map((u, i) => (
                <li key={i} style={{ marginBottom: 2 }}>
                  {u.value.toLocaleString()} {u.unit} — <em>{u.source.title}</em>
                </li>
              ))}
            </ul>
          }
        />
      )}
      {data.confidenceNote && (
        <div
          style={{
            marginTop: 8,
            padding: 6,
            background: 'var(--bg-hover)',
            borderRadius: 4,
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
          }}
        >
          {data.confidenceNote}
        </div>
      )}
      {data.source.note && (
        <div style={{ marginTop: 6, color: 'var(--text-tertiary)', fontSize: 10 }}>
          {data.source.note}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
      <span
        style={{
          color: 'var(--text-tertiary)',
          minWidth: 64,
          fontWeight: 600,
          textTransform: 'uppercase',
          fontSize: 9,
          letterSpacing: 0.6,
          paddingTop: 2,
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}
