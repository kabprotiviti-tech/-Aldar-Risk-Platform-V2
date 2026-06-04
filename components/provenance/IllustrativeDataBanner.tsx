'use client'

/**
 * IllustrativeDataBanner
 * ----------------------
 * Honest, single-glance disclaimer for legacy pages whose AED figures,
 * percentages, and trend numbers are illustrative simulated data
 * (pre-dating the per-value provenance spine).
 *
 * Rather than refactor every inline figure on /dashboard,
 * /executive-brief, /control-command-center to use <NumericValue>,
 * this banner page-tags the entire surface as illustrative — which is
 * what CLAUDE.md's standing rule requires for any value that is not
 * sourced from a real document.
 *
 * Pilot will replace these surfaces with live feeds; banner can be
 * removed per-page once the surface is fully sourced.
 */

import React from 'react'
import { Info } from 'lucide-react'

interface Props {
  /** Optional context — e.g. "ABC PMS / Yardi / SAP" — for the pilot pointer. */
  pilotFeeds?: string
}

export function IllustrativeDataBanner({
  pilotFeeds = 'ABC PMS / Yardi / SAP / escrow agents',
}: Props) {
  return (
    <div
      role="note"
      aria-label="Illustrative simulated data notice"
      style={{
        margin: '0 0 16px',
        padding: '8px 14px',
        background: 'rgba(245,197,24,0.10)',
        border: '1px solid rgba(245,197,24,0.40)',
        borderLeft: '3px solid #F5C518',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <Info
        size={14}
        style={{
          color: '#F5C518',
          flexShrink: 0,
          marginTop: 2,
        }}
      />
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>
          Illustrative simulated data.
        </strong>{' '}
        AED figures, percentages, occupancy and confidence scores on this
        page are demonstration values — they do not reflect ABC&rsquo;s
        actual operating numbers. Pilot will wire live feeds from{' '}
        {pilotFeeds}.{' '}
        <span style={{ color: 'var(--text-tertiary)' }}>
          For sourced figures, see /scenarios &ldquo;Anchored against
          ABC&rdquo; strip and the Risk Register exposure column.
        </span>
      </div>
    </div>
  )
}
