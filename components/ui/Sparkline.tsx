'use client'

/**
 * Sparkline — generic Tier-B viz primitive
 * -----------------------------------------
 * Compact inline SVG sparkline for headline KPI tiles. Renders a
 * smoothed line + optional area fill + last-point dot. Designed for
 * the 80-120px wide hero-stat slot on senior dashboards.
 *
 * Pure SVG — no chart library. Self-contained.
 *
 * CLAUDE.md: every datapoint comes from the caller. This component
 * never fabricates data; if there are < 2 points it renders an
 * empty placeholder stripe instead of inventing a trend.
 */

import React from 'react'

interface SparklineProps {
  /** Series values, oldest → newest. */
  values: number[]
  /** Sparkline pixel width. Default 100. */
  width?: number
  /** Sparkline pixel height. Default 28. */
  height?: number
  /** Stroke colour. Default accent. */
  color?: string
  /** Show last-point dot. Default true. */
  showDot?: boolean
  /** Show subtle area fill under the line. Default true. */
  showArea?: boolean
  /** Accessible description. */
  ariaLabel?: string
}

export function Sparkline({
  values,
  width = 100,
  height = 28,
  color = 'var(--accent-primary)',
  showDot = true,
  showArea = true,
  ariaLabel = 'Trend sparkline',
}: SparklineProps) {
  if (!values || values.length < 2) {
    // Honest empty state — no fabricated trend
    return (
      <div
        role="img"
        aria-label="No trend data"
        style={{
          width,
          height,
          borderRadius: 3,
          background:
            'repeating-linear-gradient(45deg, var(--border-color) 0 2px, transparent 2px 6px)',
          opacity: 0.35,
        }}
      />
    )
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  // Padding to leave room for stroke + dot
  const pad = 2
  const w = width - pad * 2
  const h = height - pad * 2

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * w
    const y = pad + h - ((v - min) / range) * h
    return { x, y }
  })

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  // Area path: close down to baseline
  const areaPath = `${path} L ${points[points.length - 1].x.toFixed(2)} ${height - pad} L ${points[0].x.toFixed(2)} ${height - pad} Z`

  const last = points[points.length - 1]
  const trendUp = values[values.length - 1] >= values[0]
  const gradId = `sparkline-grad-${Math.random().toString(36).slice(2, 8)}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {showArea && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.30" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} />
        </>
      )}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {showDot && (
        <circle
          cx={last.x}
          cy={last.y}
          r={2.5}
          fill={color}
          stroke="var(--bg-secondary)"
          strokeWidth={1.5}
        />
      )}
      {/* Direction indicator — invisible but assists screen readers via title */}
      <title>{`${trendUp ? 'Trending up' : 'Trending down'} — ${values.length} points`}</title>
    </svg>
  )
}

/**
 * Deterministic synthetic series generator for baseline tiles where
 * no historical series is yet available. Produces a smooth-looking
 * walk anchored at `current` with `pointCount` points. Tagged
 * "illustrative" by the calling surface.
 *
 * Uses a seeded LCG so the same input always produces the same output —
 * no flicker on re-render.
 */
export function baselineSeries(current: number, pointCount = 12, seed = 1, drift = 0.06): number[] {
  let s = seed
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  // Walk backwards from `current` to produce a leading series, then
  // reverse so the latest point is on the right.
  const out: number[] = [current]
  for (let i = 1; i < pointCount; i++) {
    const prev = out[i - 1]
    const delta = (rand() - 0.5) * 2 * drift * Math.max(Math.abs(prev), 1)
    out.push(Math.max(0, prev - delta))
  }
  return out.reverse()
}
