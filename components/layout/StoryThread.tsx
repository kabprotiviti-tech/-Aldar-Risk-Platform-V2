'use client'

/**
 * StoryThread — Batch C (Connect the beats)
 * -----------------------------------------
 * A slim, persistent ledger that rides every spine screen so the headline
 * numbers travel with the story instead of resetting each beat. It carries
 * four objects — the group risk score (with its delta), Critical/High count,
 * net exposure vs appetite, and the live decision (the golden-thread risk).
 * Each chip deep-links to the beat where that number is owned.
 *
 * Renders only on the 7 spine routes; reference screens stay clean.
 */

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity } from 'lucide-react'
import { STORY_SPINE, GOLDEN_THREAD } from './Sidebar'
import { BASELINE_RISK_POSTURE as B } from '@/lib/data/baselineRiskPosture'

function aed(n: number): string {
  const v = Math.abs(n)
  if (v >= 1e9) return `AED ${(n / 1e9).toFixed(2)}Bn`
  return `AED ${Math.round(n / 1e6)}M`
}

function onSpine(pathname: string): boolean {
  return STORY_SPINE.some((s) => pathname === s.href || pathname.startsWith(s.href + '/'))
}

export function StoryThread() {
  const pathname = usePathname()
  if (!onSpine(pathname)) return null

  const scoreDelta = B.overallRiskScore - B.overallRiskScorePrior
  const overCeil = B.netUnhedgedExposure > B.netUnhedgedAppetiteCeiling

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
        padding: '7px 16px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          marginRight: 4,
        }}
      >
        <Activity size={13} style={{ color: 'var(--accent-primary)' }} />
        At a glance
      </span>

      <Chip href="/my-dashboard" label="Score" value={`${B.overallRiskScore}`} delta={`${scoreDelta > 0 ? '+' : ''}${scoreDelta}`} danger={scoreDelta > 0} />
      <Chip href="/risk-register" label="Critical+High" value={`${B.totalCriticalAndHighRisks}`} />
      <Chip
        href="/portfolio-tower"
        label="Net exposure"
        value={aed(B.netUnhedgedExposure)}
        delta={`vs ${aed(B.netUnhedgedAppetiteCeiling)} cap`}
        danger={overCeil}
      />
      <Chip
        href="/respond/approvals"
        label="Decision"
        value={GOLDEN_THREAD.riskId}
        delta={GOLDEN_THREAD.decision}
        accent
      />
    </div>
  )
}

function Chip({
  href,
  label,
  value,
  delta,
  danger,
  accent,
}: {
  href: string
  label: string
  value: string
  delta?: string
  danger?: boolean
  accent?: boolean
}) {
  const valueColor = danger ? '#B42318' : accent ? 'var(--accent-primary)' : 'var(--text-primary)'
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 6,
        textDecoration: 'none',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: valueColor, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      {delta && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{delta}</span>}
    </Link>
  )
}
