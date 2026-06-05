'use client'

/**
 * IllustrativeDataBanner — Batch 1 redesign
 * ------------------------------------------
 * Was a large amber paragraph box at the top of every page (the #1 visual
 * problem flagged by the design panel: it buried content below the fold and
 * read as "unfinished POC"). Now a single quiet, neutral-grey, dismissible
 * chip. The full provenance text lives in the hover tooltip — disclose on
 * demand, lead with confidence.
 */

import React, { useEffect, useState } from 'react'
import { Info, X } from 'lucide-react'

interface Props {
  /** Optional context — e.g. "ABC PMS / Yardi / SAP" — for the pilot pointer. */
  pilotFeeds?: string
}

const DISMISS_KEY = 'pros-illustrative-dismissed-v1'

export function IllustrativeDataBanner({
  pilotFeeds = 'ABC PMS / Yardi / SAP / escrow agents',
}: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') setDismissed(true)
    } catch {}
  }, [])

  if (hydrated && dismissed) return null

  const fullText = `Illustrative POC data — AED figures, percentages and scores are demonstration values, not ABC's actual operating numbers. Pilot wires live feeds from ${pilotFeeds}. Sourced figures: see /scenarios and the Risk Register exposure column.`

  return (
    <div
      role="note"
      aria-label="Illustrative data notice"
      title={fullText}
      style={{
        margin: '0 0 12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '4px 10px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 999,
        fontSize: 12,
        color: 'var(--text-tertiary)',
        cursor: 'default',
      }}
    >
      <span
        aria-hidden
        style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }}
      />
      <span>Illustrative POC data</span>
      <Info size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
      <button
        onClick={() => {
          setDismissed(true)
          try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
        }}
        aria-label="Dismiss"
        title="Dismiss"
        style={{
          display: 'inline-flex',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
          padding: 0,
          marginLeft: 2,
          opacity: 0.6,
        }}
      >
        <X size={12} />
      </button>
    </div>
  )
}
