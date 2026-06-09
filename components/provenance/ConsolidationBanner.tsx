'use client'

/**
 * ConsolidationBanner — Batch 7 (Consolidation & merges)
 * ------------------------------------------------------
 * A quiet, dismissible note shown on a reference screen whose content now
 * has a canonical home inside the narrative spine. It does NOT remove the
 * screen (bookmarks and deep-links still resolve) — it simply tells the
 * reader where the consolidated version lives and links there. This is how
 * the IA "merges" without breaking routes.
 */

import React from 'react'
import Link from 'next/link'
import { GitMerge, ArrowRight } from 'lucide-react'

export function ConsolidationBanner({
  message,
  href,
  linkLabel,
}: {
  message: string
  href: string
  linkLabel: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: 'var(--accent-glow)',
        border: '1px solid var(--border-accent)',
        borderRadius: 8,
        flexWrap: 'wrap',
      }}
    >
      <GitMerge size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 200, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        {message}
      </span>
      <Link
        href={href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--accent-primary)',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {linkLabel}
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}
