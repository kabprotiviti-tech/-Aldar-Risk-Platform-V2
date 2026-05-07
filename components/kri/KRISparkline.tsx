'use client'

/**
 * KRISparkline
 * ------------
 * Compact inline SVG sparkline rendering up to the last 6 manual KRI
 * entries (most recent on the right). Each point is coloured by its
 * traffic-light status. Amber and red threshold lines are drawn as
 * thin dashed guides.
 *
 * Pure SVG — no chart library dependency. Honest visualization of the
 * user's own entries; nothing interpolated or fabricated.
 */

import React from 'react'
import type { KRIEntry } from '@/lib/context/KRIEntriesContext'
import {
  computeKRIStatus,
  STATUS_META,
  type KRIStatus,
} from '@/lib/data/kri-status'
import type { KRIDirection, KRIThresholds } from '@/lib/data/kri-definitions'

interface Props {
  entries: KRIEntry[]
  thresholds: KRIThresholds
  direction: KRIDirection
  width?: number
  height?: number
}

const DEFAULT_W = 130
const DEFAULT_H = 32
const PADDING = 4

export function KRISparkline({
  entries,
  thresholds,
  direction,
  width = DEFAULT_W,
  height = DEFAULT_H,
}: Props) {
  // Take the most recent 6 entries, sorted ascending by period.
  const recent = entries
    .slice()
    .sort((a, b) => (a.period < b.period ? -1 : 1))
    .slice(-6)

  if (recent.length === 0) {
    return (
      <span
        style={{
          display: 'inline-block',
          width,
          height,
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          lineHeight: `${height}px`,
          textAlign: 'center',
        }}
        title="No entries yet"
      >
        no history
      </span>
    )
  }

  // Y-axis range needs to comfortably show both the entry values and the
  // threshold lines so the user can see how close they are.
  const values = recent.map((e) => e.value)
  const candidates = [
    ...values,
    thresholds.amberBoundary,
    thresholds.redBoundary,
  ]
  const minRaw = Math.min(...candidates)
  const maxRaw = Math.max(...candidates)
  // Add 5% padding on each side, with a small minimum span to avoid flat lines
  const span = Math.max(maxRaw - minRaw, 1)
  const min = minRaw - span * 0.08
  const max = maxRaw + span * 0.08

  const innerW = width - PADDING * 2
  const innerH = height - PADDING * 2

  function xFor(i: number): number {
    if (recent.length === 1) return PADDING + innerW / 2
    return PADDING + (innerW * i) / (recent.length - 1)
  }
  function yFor(v: number): number {
    if (max === min) return PADDING + innerH / 2
    return PADDING + innerH * (1 - (v - min) / (max - min))
  }

  const linePath = recent
    .map((e, i) => `${i === 0 ? 'M' : 'L'}${xFor(i)},${yFor(e.value)}`)
    .join(' ')

  const amberY = yFor(thresholds.amberBoundary)
  const redY = yFor(thresholds.redBoundary)

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={`Last ${recent.length} entries`}
      style={{ overflow: 'visible' }}
    >
      {/* Threshold guides (dashed, thin) */}
      <line
        x1={PADDING}
        x2={width - PADDING}
        y1={amberY}
        y2={amberY}
        stroke="rgba(245,197,24,0.55)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <line
        x1={PADDING}
        x2={width - PADDING}
        y1={redY}
        y2={redY}
        stroke="rgba(255,59,59,0.55)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />

      {/* Trend line */}
      <path
        d={linePath}
        fill="none"
        stroke="var(--text-secondary)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Points coloured by status */}
      {recent.map((e, i) => {
        const status: KRIStatus = computeKRIStatus(e.value, thresholds, direction)
        const meta = STATUS_META[status]
        return (
          <circle
            key={e.id}
            cx={xFor(i)}
            cy={yFor(e.value)}
            r={2.6}
            fill={meta.color}
            stroke="var(--bg-secondary)"
            strokeWidth={1}
          >
            <title>{`${e.period}: ${e.value} (${meta.label})`}</title>
          </circle>
        )
      })}
    </svg>
  )
}
