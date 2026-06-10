'use client'

/**
 * StoryRail — Batch C (Connect the beats)
 * ---------------------------------------
 * Replaces the floating "Next →" pill with a proper wayfinding rail: seven
 * numbered, named, clickable nodes showing exactly where you are in the
 * story and letting you jump anywhere. The active node is brand-red; past
 * beats are filled; future beats are outlined. A single causal handoff
 * sentence frames the next step. Prev/Next sit at the ends.
 *
 * Renders only on the 7 spine routes.
 */

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { STORY_SPINE } from './Sidebar'

function spineIndex(pathname: string): number {
  const exact = STORY_SPINE.findIndex((s) => s.href === pathname)
  if (exact !== -1) return exact
  return STORY_SPINE.findIndex((s) => pathname === s.href || pathname.startsWith(s.href + '/'))
}

export function StoryRail() {
  const pathname = usePathname()
  const idx = spineIndex(pathname)
  if (idx === -1) return null

  const total = STORY_SPINE.length
  const isLast = idx === total - 1
  const current = STORY_SPINE[idx]
  const prev = idx > 0 ? STORY_SPINE[idx - 1] : null
  const next = isLast ? STORY_SPINE[0] : STORY_SPINE[idx + 1]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 55,
        width: 'min(760px, calc(100vw - 32px))',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(0,0,0,0.18))',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* handoff line */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--accent-primary)', whiteSpace: 'nowrap' }}>
          Step {idx + 1}/{total} · {current.label}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {isLast ? '' : 'Next — '}
          {current.handoff}
        </span>
      </div>

      {/* nodes + nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <NavArrow href={prev?.href} dir="prev" disabled={!prev} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, overflow: 'hidden' }}>
          {STORY_SPINE.map((s, i) => (
            <Node key={s.href} href={s.href} n={i + 1} label={s.label} state={i === idx ? 'active' : i < idx ? 'past' : 'future'} />
          ))}
        </div>
        <Link
          href={next.href}
          aria-label={isLast ? 'Restart the story' : `Next: ${next.label}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '7px 12px',
            borderRadius: 9,
            textDecoration: 'none',
            background: 'var(--accent-primary)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {isLast ? <><RotateCcw size={14} /> Restart</> : <>Next <ChevronRight size={14} /></>}
        </Link>
      </div>
    </div>
  )
}

function Node({ href, n, label, state }: { href: string; n: number; label: string; state: 'active' | 'past' | 'future' }) {
  const active = state === 'active'
  const past = state === 'past'
  return (
    <Link
      href={href}
      title={`${n}. ${label}`}
      aria-current={active ? 'step' : undefined}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        textDecoration: 'none',
        minWidth: 0,
        flex: active ? '0 1 auto' : '0 0 auto',
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
          background: active ? 'var(--accent-primary)' : past ? 'var(--text-tertiary)' : 'transparent',
          color: active || past ? '#fff' : 'var(--text-tertiary)',
          border: active || past ? 'none' : '1.5px solid var(--border-color)',
        }}
      >
        {n}
      </span>
      {active && (
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 96 }}>
          {label}
        </span>
      )}
    </Link>
  )
}

function NavArrow({ href, dir, disabled }: { href?: string; dir: 'prev' | 'next'; disabled?: boolean }) {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 8,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-secondary)',
    flexShrink: 0,
    opacity: disabled ? 0.4 : 1,
  }
  if (disabled || !href) {
    return <span style={{ ...style, cursor: 'default' }} aria-hidden><Icon size={16} /></span>
  }
  return (
    <Link href={href} aria-label="Previous step" style={{ ...style, textDecoration: 'none' }}>
      <Icon size={16} />
    </Link>
  )
}
