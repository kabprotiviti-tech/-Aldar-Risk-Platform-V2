'use client'

/**
 * Skeleton — Tier-B loading primitives
 * -------------------------------------
 * Replaces silent "0" rendering during async fetches. Uses a subtle
 * gradient shimmer animation that respects prefers-reduced-motion.
 *
 * Three pre-composed shapes:
 *   - <Skeleton />           bare block, fully configurable
 *   - <SkeletonKPICard />    matches the executive KPI tile layout
 *   - <SkeletonRow />        list-row placeholder
 *
 * Animation is keyframed via inline <style> rather than global CSS so
 * the primitive is self-contained — drop into any page and it works.
 */

import React from 'react'

interface SkeletonProps {
  width?: number | string
  height?: number | string
  radius?: number | string
  className?: string
  style?: React.CSSProperties
  /** Accessible label announced to AT users. Defaults to "Loading…". */
  ariaLabel?: string
}

export function Skeleton({
  width = '100%',
  height = 14,
  radius = 4,
  className,
  style,
  ariaLabel = 'Loading…',
}: SkeletonProps) {
  return (
    <>
      <ShimmerKeyframes />
      <span
        role="status"
        aria-label={ariaLabel}
        aria-live="polite"
        className={className}
        style={{
          display: 'inline-block',
          width,
          height,
          borderRadius: radius,
          background:
            'linear-gradient(90deg, var(--bg-secondary, #1a1a1a) 0%, var(--border-color, #2a2a2a) 50%, var(--bg-secondary, #1a1a1a) 100%)',
          backgroundSize: '200% 100%',
          animation: 'aldar-shimmer 1.4s ease-in-out infinite',
          ...style,
        }}
      />
    </>
  )
}

/**
 * KPI-tile skeleton. Matches the visual rhythm of the headline tiles
 * used on /executive-brief, /dashboard, CRODashboard, /my-dashboard.
 */
export function SkeletonKPICard({ accent }: { accent?: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderTop: accent ? `3px solid ${accent}` : undefined,
        borderRadius: 8,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 80,
      }}
    >
      <Skeleton width={90} height={9} radius={3} ariaLabel="Loading metric label" />
      <Skeleton width={70} height={22} radius={4} ariaLabel="Loading metric value" />
      <Skeleton width={120} height={9} radius={3} ariaLabel="Loading metric trend" />
    </div>
  )
}

/**
 * Row skeleton for list surfaces (drafts, actions, audit events).
 */
export function SkeletonRow({ height = 32 }: { height?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 10px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 4,
        height,
      }}
    >
      <Skeleton width={48} height={10} radius={3} />
      <Skeleton width="60%" height={11} radius={3} />
      <Skeleton width={60} height={9} radius={3} style={{ marginLeft: 'auto' }} />
    </div>
  )
}

/**
 * Convenience wrapper — render N rows of SkeletonRow in a stack.
 */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

/** Inline keyframes — appended once per page render, idempotent. */
function ShimmerKeyframes() {
  return (
    <style>{`
      @keyframes aldar-shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        [role="status"] { animation: none !important; opacity: 0.7; }
      }
    `}</style>
  )
}
