'use client'

// ─── Decision Intelligence — Top Actions Panel ────────────────────────────────
// Compact ranked list of AI-derived priority actions.
// Each row: rank badge, title, impact, owner, deadline, priority badge.
// Click any row to open ActionDetailPanel.

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Zap, Clock, User, Brain } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import {
  TOP_ACTIONS,
  PRIORITY_COLOR,
  PRIORITY_BG,
  STATUS_COLOR,
  STATUS_BG,
  STATUS_LABEL,
  rankLabel,
  type Action,
  type ActionPriority,
  type ActionStatus,
} from '@/lib/actionEngine'

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ActionStatus }) {
  const color = STATUS_COLOR[status]
  const bg    = STATUS_BG[status]
  const label = STATUS_LABEL[status]
  return (
    <span
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 7px',
        borderRadius: '4px',
        backgroundColor: bg,
        border: `1px solid ${color}50`,
        fontSize: '0.6rem',
        fontWeight: 700,
        color,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  )
}

// ─── Portfolio label map ──────────────────────────────────────────────────────

const PORTFOLIO_LABEL: Record<string, string> = {
  'real-estate': 'Real Estate',
  retail:        'Retail',
  hospitality:   'Hospitality',
  education:     'Education',
  facilities:    'Facilities',
}

// ─── Priority badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: ActionPriority }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: PRIORITY_BG[priority],
        border: `1px solid ${PRIORITY_COLOR[priority]}40`,
        color: PRIORITY_COLOR[priority],
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {priority === 'critical' ? '⚡ CRITICAL' : priority === 'high' ? '▲ HIGH' : '● MEDIUM'}
    </span>
  )
}

// ─── Single action row ────────────────────────────────────────────────────────

function ActionRow({
  action,
  rank,
  onClick,
}: {
  action: Action
  rank: number
  onClick: (a: Action) => void
}) {
  const color = PRIORITY_COLOR[action.priority]

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: rank * 0.08 }}
      whileHover={{ x: 3, backgroundColor: 'var(--bg-hover, rgba(255,255,255,0.03))' }}
      onClick={() => onClick(action)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '8px',
        border: `1px solid var(--border-color)`,
        cursor: 'pointer',
        transition: 'border-color 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = `${color}50`
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)'
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          backgroundColor: color,
          borderRadius: '8px 0 0 8px',
        }}
      />

      {/* Rank badge + score stack */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: PRIORITY_BG[action.priority],
            border: `1px solid ${color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            fontWeight: 800,
            fontSize: '0.72rem',
          }}
        >
          {rank}
        </div>
        {/* Priority score */}
        <span
          title="Priority score (0–100)"
          style={{
            fontSize: '0.58rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.02em',
          }}
        >
          {action.priorityScore}
        </span>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title + priority + rank label row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              lineHeight: 1.3,
              minWidth: 0,
              flex: 1,
            }}
          >
            {action.title}
          </span>
          {rank === 1 && (
            <span
              style={{
                fontSize: '0.6rem',
                fontWeight: 800,
                color: color,
                backgroundColor: PRIORITY_BG[action.priority],
                border: `1px solid ${color}50`,
                borderRadius: '4px',
                padding: '2px 7px',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Highest Priority
            </span>
          )}
          <PriorityBadge priority={action.priority} />
        </div>

        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginTop: '6px',
            flexWrap: 'wrap',
          }}
        >
          {/* Impact */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={11} style={{ color: 'var(--text-muted)' }} />
            <span
              style={{
                color,
                fontSize: '0.74rem',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {action.impactLabel}
            </span>
          </div>

          {/* Deadline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={10} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              Act in {action.deadline}
            </span>
          </div>

          {/* Owner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={10} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{action.owner}</span>
          </div>

          {/* Portfolio tag */}
          <span
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.64rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '3px',
              padding: '1px 6px',
            }}
          >
            {PORTFOLIO_LABEL[action.portfolio] ?? action.portfolio}
          </span>

          {/* AI Confidence */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Brain size={10} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ color: 'var(--accent-primary)', fontSize: '0.68rem', fontWeight: 600 }}>
              {Math.round(action.aiConfidence * 100)}% conf
            </span>
          </div>

          {/* Status */}
          <StatusDot status={action.status} />

          {/* Overdue days (if applicable) */}
          {action.daysOverdue > 0 && (
            <span style={{ color: 'var(--risk-critical)', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {action.escalated ? '🔴' : '🟡'} {action.daysOverdue}d overdue
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </motion.div>
  )
}

// ─── Panel header metrics ─────────────────────────────────────────────────────

function HeaderMetric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        padding: '6px 12px',
        borderRadius: '6px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <span
        style={{
          fontSize: '0.9rem',
          fontWeight: 700,
          color: color ?? 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
        {label}
      </span>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function TopActionsPanel({ onActionClick }: { onActionClick: (action: Action) => void }) {
  const criticalCount = TOP_ACTIONS.filter((a) => a.priority === 'critical').length
  const highCount = TOP_ACTIONS.filter((a) => a.priority === 'high').length
  const totalImpact = TOP_ACTIONS.reduce((sum, a) => sum + a.impactValue, 0)

  return (
    <Card glow>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: 'rgba(255,59,59,0.1)',
              border: '1px solid rgba(255,59,59,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Brain size={15} style={{ color: 'var(--risk-critical)' }} />
          </div>
          <CardTitle>Decision Intelligence — Priority Actions</CardTitle>
        </div>

        {/* Header metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <HeaderMetric
            label="Critical"
            value={String(criticalCount)}
            color="var(--risk-critical)"
          />
          <HeaderMetric label="High" value={String(highCount)} color="var(--risk-high)" />
          <HeaderMetric
            label="Total Exposure"
            value={`AED ${totalImpact.toLocaleString()}M`}
            color="var(--accent-primary)"
          />
          <span
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(var(--accent-primary-rgb,201,168,76),0.08)',
              border: '1px solid var(--border-accent)',
            }}
          >
            AI-generated · click any action for full analysis
          </span>
        </div>
      </CardHeader>

      <CardBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {TOP_ACTIONS.map((action, i) => (
            <ActionRow
              key={action.id}
              action={action}
              rank={i + 1}
              onClick={onActionClick}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
