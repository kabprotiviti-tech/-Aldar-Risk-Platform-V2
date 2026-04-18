'use client'

import React from 'react'
import { clsx } from 'clsx'

type Severity = 'critical' | 'high' | 'medium' | 'low'

interface BadgeProps {
  severity: Severity
  children?: React.ReactNode
  className?: string
}

const severityConfig: Record<Severity, { label: string; bg: string; text: string; border: string }> = {
  critical: {
    label: 'Critical',
    bg: 'rgba(255, 59, 59, 0.15)',
    text: 'var(--risk-critical)',
    border: 'rgba(255, 59, 59, 0.35)',
  },
  high: {
    label: 'High',
    bg: 'rgba(255, 140, 0, 0.15)',
    text: 'var(--risk-high)',
    border: 'rgba(255, 140, 0, 0.35)',
  },
  medium: {
    label: 'Medium',
    bg: 'rgba(245, 197, 24, 0.15)',
    text: 'var(--risk-medium)',
    border: 'rgba(245, 197, 24, 0.35)',
  },
  low: {
    label: 'Low',
    bg: 'rgba(34, 197, 94, 0.15)',
    text: 'var(--risk-low)',
    border: 'rgba(34, 197, 94, 0.35)',
  },
}

export function RiskBadge({ severity, children, className }: BadgeProps) {
  const config = severityConfig[severity]
  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide',
        className
      )}
    >
      <span
        style={{ backgroundColor: config.text }}
        className="w-1.5 h-1.5 rounded-full"
      />
      {children || config.label}
    </span>
  )
}

interface ConfidenceBadgeProps {
  confidence: number
  className?: string
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100)
  const color =
    pct >= 85
      ? 'var(--risk-low)'
      : pct >= 70
      ? 'var(--risk-medium)'
      : 'var(--risk-high)'

  return (
    <span
      style={{ color, borderColor: color, backgroundColor: `${color}18` }}
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        className
      )}
    >
      AI {pct}%
    </span>
  )
}

interface TrendBadgeProps {
  trend: 'increasing' | 'stable' | 'decreasing'
  className?: string
}

export function TrendBadge({ trend, className }: TrendBadgeProps) {
  const config = {
    increasing: { label: '↑ Increasing', color: 'var(--risk-high)' },
    stable: { label: '→ Stable', color: 'var(--text-muted)' },
    decreasing: { label: '↓ Decreasing', color: 'var(--risk-low)' },
  }
  const c = config[trend]
  return (
    <span style={{ color: c.color }} className={clsx('text-xs font-medium', className)}>
      {c.label}
    </span>
  )
}
