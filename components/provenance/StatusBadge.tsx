'use client'

/**
 * StatusBadge
 * -----------
 * Shown in the top-right of every page/screen. Tells the user what
 * tier the screen is operating at:
 *
 *   LIVE     → real data, real workflow, production-ready
 *   MVP      → working flow, mix of real + sample data
 *   PREVIEW  → UI shell only, full logic in pilot
 *   ROADMAP  → placeholder, Phase 2+
 *
 * Honest labeling = the contract that prevents the previous version's
 * "is this real?" credibility problem.
 */

import React from 'react'

export type ScreenTier = 'LIVE' | 'MVP' | 'PREVIEW' | 'ROADMAP'

interface StatusBadgeProps {
  tier: ScreenTier
  /** Optional: short note shown next to the badge, e.g. "RBAC: 2 of 5 roles". */
  note?: string
}

const TIER_META: Record<
  ScreenTier,
  { label: string; bg: string; fg: string; tooltip: string }
> = {
  LIVE: {
    label: '🟢 LIVE',
    bg: 'rgba(34,197,94,0.18)',
    fg: '#22C55E',
    tooltip:
      'LIVE — Real data, real workflow, production-ready logic. Numbers are sourced and click-through verifiable.',
  },
  MVP: {
    label: '🟡 MVP',
    bg: 'rgba(245,197,24,0.18)',
    fg: '#F5C518',
    tooltip:
      'MVP — Functional workflow with a mix of sourced and illustrative sample data. Pilot calibration pending.',
  },
  PREVIEW: {
    label: '🟠 PREVIEW',
    bg: 'rgba(255,140,0,0.18)',
    fg: '#FF8C00',
    tooltip:
      'PREVIEW — UI shell only. Full functionality scoped for pilot phase post-contract.',
  },
  ROADMAP: {
    label: '🔵 ROADMAP',
    bg: 'rgba(45,158,255,0.18)',
    fg: '#2D9EFF',
    tooltip:
      'ROADMAP — Placeholder page. Module is on the Phase 2+ roadmap, not built yet.',
  },
}

export function StatusBadge({ tier, note }: StatusBadgeProps) {
  const meta = TIER_META[tier]
  return (
    <div
      title={meta.tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 10px',
        background: meta.bg,
        color: meta.fg,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        border: `1px solid ${meta.fg}40`,
        cursor: 'help',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span>{meta.label}</span>
      {note && (
        <span
          style={{
            color: 'var(--text-secondary)',
            fontWeight: 500,
            textTransform: 'none',
            letterSpacing: 0,
          }}
        >
          · {note}
        </span>
      )}
    </div>
  )
}
