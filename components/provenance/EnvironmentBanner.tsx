'use client'

/**
 * EnvironmentBanner
 * -----------------
 * Thin strip across the top of the entire app. Removes any ambiguity
 * about whether the user is looking at production or a pre-contract demo.
 *
 * Required by CLAUDE.md standing instruction. Shown on every page.
 */

import React from 'react'

interface EnvironmentBannerProps {
  /** Defaults to 'demo'. Future: 'pilot' | 'production' once contract signed. */
  env?: 'demo' | 'pilot' | 'production'
  /** Override the version label (default reads NEXT_PUBLIC_APP_VERSION or 'v0.5'). */
  version?: string
}

export function EnvironmentBanner({ env = 'demo', version }: EnvironmentBannerProps) {
  const v = version || process.env.NEXT_PUBLIC_APP_VERSION || 'v0.5 — MVP'

  if (env !== 'demo') return null // hide once contract / pilot kicks in

  return (
    <div
      role="status"
      style={{
        width: '100%',
        background:
          'repeating-linear-gradient(135deg, rgba(245,197,24,0.18) 0 14px, rgba(245,197,24,0.10) 14px 28px)',
        borderBottom: '1px solid rgba(245,197,24,0.35)',
        color: 'var(--text-primary)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.5,
        textAlign: 'center',
        padding: '4px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ color: '#F5C518', fontWeight: 800 }}>⚠ DEMO ENVIRONMENT</span>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
        Aldar ERM Platform · {v}
      </span>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
        · Data: public disclosures + clearly-labeled illustrative samples
      </span>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
        · Not for production use
      </span>
    </div>
  )
}
