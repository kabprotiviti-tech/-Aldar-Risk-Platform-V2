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
 *
 * UX-1 fix: the provenance card now renders via createPortal at body
 * level with fixed positioning, so it never gets clipped by a drawer
 * or modal that has `overflow: hidden`. Position is clamped to the
 * viewport so the card is fully readable even near screen edges.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  placeholder: { color: '#B8001F', label: 'Placeholder — calibration pending' },
  ai_hypothesis: { color: '#A855F7', label: 'AI Hypothesis — pending approval' },
}

const CARD_WIDTH = 340
const VIEWPORT_MARGIN = 12

export function NumericValue({
  data,
  format,
  unitOverride,
  compact = false,
}: NumericValueProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  // Position the card next to the trigger, clamped to viewport.
  useLayoutEffect(() => {
    if (!open || typeof window === 'undefined') return
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    // Default: below the trigger, right-aligned to the trigger
    let left = rect.right - CARD_WIDTH
    let top = rect.bottom + 6
    // Clamp horizontally
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN
    if (left + CARD_WIDTH > vw - VIEWPORT_MARGIN)
      left = vw - CARD_WIDTH - VIEWPORT_MARGIN
    // If it would go below the viewport, flip above the trigger
    // (rough card height estimate 320; refined below once mounted).
    const estHeight = cardRef.current?.offsetHeight ?? 320
    if (top + estHeight > vh - VIEWPORT_MARGIN) {
      top = Math.max(VIEWPORT_MARGIN, rect.top - estHeight - 6)
    }
    setPos({ top, left })
  }, [open])

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        cardRef.current &&
        !cardRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
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

      {open && typeof document !== 'undefined' && pos &&
        createPortal(
          <ProvenanceCard
            ref={cardRef}
            data={data}
            tierColor={dot.color}
            tierLabel={dot.label}
            position={pos}
          />,
          document.body,
        )}
    </span>
  )
}

const ProvenanceCard = React.forwardRef<
  HTMLDivElement,
  {
    data: DataPoint
    tierColor: string
    tierLabel: string
    position: { top: number; left: number }
  }
>(function ProvenanceCard({ data, tierColor, tierLabel, position }, ref) {
  return (
    <div
      ref={ref}
      role="dialog"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 10001,
        width: CARD_WIDTH,
        maxHeight: 'min(70vh, 520px)',
        overflowY: 'auto',
        background: 'var(--bg-card)',
        border: `1px solid ${tierColor}66`,
        borderRadius: 8,
        padding: 12,
        boxShadow: '0 16px 40px -8px rgba(0,0,0,0.55)',
        fontSize: 11,
        color: 'var(--text-primary)',
        textAlign: 'left',
        whiteSpace: 'normal',
        lineHeight: 1.55,
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
        <span style={{ fontWeight: 700, color: tierColor, letterSpacing: 0.4, fontSize: 10 }}>
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
      {data.formula && (
        <Row label="Formula" value={<code style={{ fontSize: 10 }}>{data.formula}</code>} />
      )}
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
            padding: 8,
            background: 'var(--bg-hover)',
            borderRadius: 4,
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            fontSize: 10.5,
          }}
        >
          {data.confidenceNote}
        </div>
      )}
      {data.source.note && (
        <div
          style={{
            marginTop: 6,
            color: 'var(--text-tertiary)',
            fontSize: 10,
          }}
        >
          {data.source.note}
        </div>
      )}
    </div>
  )
})

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
      <span style={{ flex: 1, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
        {value}
      </span>
    </div>
  )
}
