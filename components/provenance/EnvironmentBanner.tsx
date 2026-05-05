'use client'

/**
 * EnvironmentBanner
 * -----------------
 * Thin professional strip across the top of the entire app. Removes any
 * ambiguity about whether the user is looking at production or a
 * pre-contract MVP, while reading as discipline rather than a warning.
 *
 * Required by CLAUDE.md standing instruction. Shown on every page.
 *
 * Design note (post 4-agent synthesis):
 *   The earlier hazard-stripe design read as "warning" and undermined
 *   the demo aesthetic. This version is a calm, dark slim strip with a
 *   single MVP chip — same legal protection, presents as discipline.
 */

import React from 'react'

interface EnvironmentBannerProps {
  /** Defaults to 'demo'. Hidden once env transitions to pilot/production. */
  env?: 'demo' | 'pilot' | 'production'
  /** Override the version label. */
  version?: string
}

export function EnvironmentBanner({ env = 'demo', version }: EnvironmentBannerProps) {
  const v = version || process.env.NEXT_PUBLIC_APP_VERSION || 'v0.5 MVP'

  if (env !== 'demo') return null // hide once contract / pilot kicks in

  return (
    <div
      role="status"
      style={{
        width: '100%',
        background: 'rgba(10, 14, 26, 0.92)',
        borderBottom: '1px solid rgba(245,197,24,0.30)',
        color: 'var(--text-secondary)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: 0.3,
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(245,197,24,0.18)',
          color: '#F5C518',
          padding: '2px 10px',
          borderRadius: 4,
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          border: '1px solid rgba(245,197,24,0.35)',
        }}
      >
        {v}
      </span>
      <span style={{ color: 'var(--text-tertiary)' }}>
        Aldar ERM Platform · sourced from Aldar FY25 / Q1 2026 public disclosures
        + clearly-labeled illustrative samples · pre-contract POC
      </span>
    </div>
  )
}
