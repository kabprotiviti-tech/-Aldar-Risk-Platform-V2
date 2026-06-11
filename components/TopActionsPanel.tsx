'use client'

// ─── Decision Intelligence — Top Actions Panel ────────────────────────────────
// Compact ranked list of AI-derived priority actions.
// Each row: rank badge, title, impact, owner, deadline, priority badge.
// Click any row to open ActionDetailPanel.

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Zap, Clock, User, Brain, Radio } from 'lucide-react'
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

// ─── Live external-signal binding ─────────────────────────────────────────────
// The curated actions stay (board-grade, never a weak AI line in the demo) but
// the panel now visibly RESPONDS to the live external signal feed: it pulls the
// same Claude-classified, relevance-scored signals as the Live Risk Signals
// rail, shows how many high-relevance signals are currently factored, and binds
// each action to the most-relevant live signal for its portfolio. Slower 60s
// cadence — decisions don't need 10s freshness, and it keeps API cost down.

interface ActionSignal {
  id: string
  headline: string
  source: string
  relevance: number
  severity: string
  impactedBusiness: string
}

function useActionSignals() {
  const [signals, setSignals] = React.useState<ActionSignal[]>([])
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null)

  React.useEffect(() => {
    let alive = true
    const stamp = () =>
      new Date().toLocaleTimeString('en-AE', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit' })

    const run = async () => {
      try {
        const nr = await fetch('/api/news', { cache: 'no-store' })
        if (!nr.ok) return
        const nd = await nr.json()
        const items: Array<{ id: string; headline: string; source: string }> = (nd.items || []).slice(0, 12)
        if (items.length === 0) return

        // ── Phase 1: show the feed IMMEDIATELY (neutral relevance) so the panel
        //   reacts within ~1s instead of waiting on the multi-second AI classify.
        if (alive) {
          setSignals(
            items.map((it) => ({
              id: it.id,
              headline: it.headline,
              source: it.source,
              relevance: 35,
              severity: 'low',
              impactedBusiness: 'cross-portfolio',
            })),
          )
          setUpdatedAt(stamp())
        }

        // ── Phase 2: enrich with Claude relevance scores when they land. A 20s
        //   abort guards against a hung classify call.
        try {
          const ctrl = new AbortController()
          const to = setTimeout(() => ctrl.abort(), 20000)
          const cr = await fetch('/api/ai-classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: items.map((it) => ({ id: it.id, headline: it.headline, source: it.source })) }),
            signal: ctrl.signal,
          })
          clearTimeout(to)
          if (cr.ok) {
            const cd = await cr.json()
            const map: Record<string, { confidenceScore?: number; severity?: string; impactedBusiness?: string }> = {}
            for (const r of cd.results || []) map[r.id] = r.classification
            if (alive) {
              setSignals(
                items
                  .map((it) => ({
                    id: it.id,
                    headline: it.headline,
                    source: it.source,
                    relevance: map[it.id]?.confidenceScore ?? 35,
                    severity: map[it.id]?.severity ?? 'low',
                    impactedBusiness: map[it.id]?.impactedBusiness ?? 'cross-portfolio',
                  }))
                  .sort((a, b) => b.relevance - a.relevance),
              )
              setUpdatedAt(stamp())
            }
          }
        } catch {
          // classification optional — Phase 1 signals remain shown
        }
      } catch {
        // network/feed error — panel keeps its curated actions
      }
    }
    run()
    const id = setInterval(run, 60000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return { signals, updatedAt }
}

/** Most-relevant live signal for an action's portfolio (else a cross-portfolio one). */
function matchSignal(portfolio: string, signals: ActionSignal[]): ActionSignal | null {
  const norm = portfolio.replace(/-/g, ' ')
  const exact = signals.filter((s) => s.impactedBusiness === norm)
  const pool = exact.length ? exact : signals.filter((s) => s.impactedBusiness === 'cross-portfolio')
  return pool.length ? pool[0] : null // signals already sorted by relevance desc
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
  signal,
}: {
  action: Action
  rank: number
  onClick: (a: Action) => void
  signal?: ActionSignal | null
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
          <div
            title="Based on total ABC portfolio value: AED 10,000M"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'help' }}
          >
            <Zap size={11} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color, fontSize: '0.74rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {action.impactLabel}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.67rem' }}>
              ({action.impactPercent}%)
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

        {/* Live signal binding — which external signal is driving this action */}
        {signal && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', minWidth: 0 }}>
            <Radio size={10} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', flexShrink: 0 }}>Live signal:</span>
            <span
              title={signal.headline}
              style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
            >
              {signal.headline}
            </span>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--accent-primary)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {signal.relevance}%
            </span>
          </div>
        )}
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

  // Live external-signal feed driving the analysis (updates every 60s)
  const { signals, updatedAt } = useActionSignals()
  const highRelevant = signals.filter((s) => s.relevance >= 50)
  const topSignal = signals[0] || null

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
            {signals.length > 0
              ? `Synced to ${signals.length} live signals${updatedAt ? ` · ${updatedAt}` : ''}`
              : 'AI-generated · click any action for full analysis'}
          </span>
        </div>
      </CardHeader>

      <CardBody>
        {/* Live external-signal strip — the feed these actions respond to */}
        {signals.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              marginBottom: '10px',
              borderRadius: '8px',
              background: 'var(--accent-glow)',
              border: '1px solid var(--border-accent)',
              flexWrap: 'wrap',
            }}
          >
            <Radio size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-primary)', whiteSpace: 'nowrap' }}>
              {highRelevant.length} high-relevance signal{highRelevant.length === 1 ? '' : 's'} factored
            </span>
            {topSignal && (
              <span
                title={topSignal.headline}
                style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}
              >
                · Top: {topSignal.headline} ({topSignal.relevance}%)
              </span>
            )}
            {updatedAt && (
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                updated {updatedAt}
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {TOP_ACTIONS.map((action, i) => (
            <ActionRow
              key={action.id}
              action={action}
              rank={i + 1}
              onClick={onActionClick}
              signal={matchSignal(action.portfolio, signals)}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
