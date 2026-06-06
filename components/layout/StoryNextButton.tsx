'use client'

/**
 * StoryNextButton — Batch 4 (Storyline Spine)
 * -------------------------------------------
 * A persistent, floating "Next →" pill that walks a presenter through the
 * seven-beat narrative spine without hunting in the sidebar. It reads the
 * current pathname, finds its position in STORY_SPINE, and routes to the
 * next beat. On the final beat it offers "Restart" back to beat 1.
 *
 * Only renders when the current route is itself a spine beat — reference
 * ("Depth on demand") screens deliberately show no Next, so the demo
 * never auto-advances off-script.
 */

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { STORY_SPINE } from './Sidebar'

function spineIndex(pathname: string): number {
  // Exact match first, then longest-prefix (so /risk-register/RISK-1 still
  // counts as the "Challenge" beat).
  const exact = STORY_SPINE.findIndex((s) => s.href === pathname)
  if (exact !== -1) return exact
  return STORY_SPINE.findIndex(
    (s) => pathname === s.href || pathname.startsWith(s.href + '/'),
  )
}

export function StoryNextButton() {
  const pathname = usePathname()
  const idx = spineIndex(pathname)

  // Not on a spine beat → no button (reference screens stay off-script).
  if (idx === -1) return null

  const isLast = idx === STORY_SPINE.length - 1
  const next = isLast ? STORY_SPINE[0] : STORY_SPINE[idx + 1]
  const stepNo = idx + 1
  const total = STORY_SPINE.length

  return (
    <Link
      href={next.href}
      aria-label={isLast ? 'Restart the risk story' : `Next: ${next.label}`}
      title={isLast ? 'Restart the risk story' : `Next: ${next.label}`}
      style={{
        position: 'fixed',
        right: 24,
        bottom: 88, // clear of the RiskMemoryChat launcher
        zIndex: 60,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        borderRadius: 999,
        textDecoration: 'none',
        background: 'var(--accent-primary)',
        color: '#fff',
        boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.18))',
        border: '1px solid rgba(255,255,255,0.18)',
        transition: 'transform 0.15s ease, filter 0.15s ease',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
        ;(e.currentTarget as HTMLElement).style.filter = 'brightness(1.06)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.filter = 'none'
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          lineHeight: 1.1,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            opacity: 0.8,
          }}
        >
          {isLast ? `Step ${stepNo}/${total} · End` : `Step ${stepNo}/${total}`}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {isLast ? 'Restart story' : next.label}
        </span>
      </span>
      {isLast ? (
        <RotateCcw size={16} style={{ flexShrink: 0 }} />
      ) : (
        <ArrowRight size={16} style={{ flexShrink: 0 }} />
      )}
    </Link>
  )
}
