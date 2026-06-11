'use client'

// ─── Decision Intelligence — Top Actions Panel ────────────────────────────────
// Compact ranked list of AI-derived priority actions.
// Each row: rank badge, title, impact, owner, deadline, priority badge.
// Click any row to open ActionDetailPanel.

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Zap, Clock, User, Brain, Radio, X } from 'lucide-react'
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

// ─── Live signal-driven actions ───────────────────────────────────────────────
// The priority actions are GENERATED from the live external news feed by Claude
// (/api/decision-actions): each action is a specific ABC response tied to a real
// signal, with its own due date and impact. Until they arrive (~30s) — or if the
// AI call fails — the panel shows the curated TOP_ACTIONS so the demo is never
// empty or broken. 90s cadence keeps API cost sane.

interface DecisionAction {
  title: string
  portfolio: string
  priority: ActionPriority
  dueInDays: number
  impactAedM: number
  aiConfidence: number // 0-100
  rationale: string
  whyItMatters?: string
  steps?: string[]
  signalHeadline: string
  signalSource?: string
  relevance: number // 0-100
}

function useDecisionActions() {
  const [actions, setActions] = React.useState<DecisionAction[]>([])
  const [source, setSource] = React.useState<'loading' | 'ai' | 'fallback'>('loading')
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null)

  React.useEffect(() => {
    let alive = true
    const stamp = () =>
      new Date().toLocaleTimeString('en-AE', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit' })

    const run = async () => {
      try {
        const nr = await fetch('/api/news', { cache: 'no-store' })
        if (!nr.ok) { if (alive) setSource('fallback'); return }
        const nd = await nr.json()
        const items: Array<{ headline: string; source: string }> = (nd.items || []).slice(0, 18)
        if (items.length === 0) { if (alive) setSource('fallback'); return }

        // Generate the actions from the live signals. 55s abort < the route's
        // 60s maxDuration; the AI call itself runs ~30s.
        const ctrl = new AbortController()
        const to = setTimeout(() => ctrl.abort(), 55000)
        const ar = await fetch('/api/decision-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
          signal: ctrl.signal,
        })
        clearTimeout(to)
        if (!ar.ok) { if (alive) setSource('fallback'); return }
        const ad = await ar.json()
        const list: DecisionAction[] = Array.isArray(ad.actions) ? ad.actions : []
        if (alive) {
          if (ad.source === 'ai' && list.length > 0) {
            setActions(list)
            setSource('ai')
            setUpdatedAt(stamp())
          } else {
            setSource('fallback')
          }
        }
      } catch {
        if (alive) setSource('fallback')
      }
    }
    run()
    const id = setInterval(run, 90000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return { actions, source, updatedAt }
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
      </div>

      {/* Arrow */}
      <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </motion.div>
  )
}

// ─── AI-generated (signal-driven) action row ──────────────────────────────────

const PORTFOLIO_LABEL_DYN: Record<string, string> = {
  ...PORTFOLIO_LABEL,
  'cross-portfolio': 'Cross-Portfolio',
}

function DynamicActionRow({ action, rank, onClick }: { action: DecisionAction; rank: number; onClick: (a: DecisionAction) => void }) {
  const color = PRIORITY_COLOR[action.priority]
  const impactPercent = ((action.impactAedM / 10000) * 100).toFixed(1)
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.06 }}
      whileHover={{ x: 3 }}
      onClick={() => onClick(action)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `${color}50` }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)' }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: color, borderRadius: '8px 0 0 8px' }} />

      {/* Rank + relevance */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
        <div
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: PRIORITY_BG[action.priority], border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color, fontWeight: 800, fontSize: '0.72rem',
          }}
        >
          {rank}
        </div>
        <span title="Driving signal relevance to ABC" style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {action.relevance}%
        </span>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.3, minWidth: 0, flex: 1 }}>
            {action.title}
          </span>
          {rank === 1 && (
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color, backgroundColor: PRIORITY_BG[action.priority], border: `1px solid ${color}50`, borderRadius: '4px', padding: '2px 7px', letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Highest Priority
            </span>
          )}
          <PriorityBadge priority={action.priority} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={11} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color, fontSize: '0.74rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>AED {action.impactAedM}M</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.67rem' }}>({impactPercent}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={10} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Act in {action.dueInDays} days</span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.64rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '1px 6px' }}>
            {PORTFOLIO_LABEL_DYN[action.portfolio] ?? action.portfolio}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Brain size={10} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ color: 'var(--accent-primary)', fontSize: '0.68rem', fontWeight: 600 }}>{action.aiConfidence}% conf</span>
          </div>
        </div>

        {action.rationale && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '7px 0 0' }}>
            {action.rationale}
          </p>
        )}

        {action.signalHeadline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', minWidth: 0 }}>
            <Radio size={10} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', flexShrink: 0 }}>Source:</span>
            <span title={action.signalHeadline} style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
              {action.signalHeadline}{action.signalSource ? ` · ${action.signalSource}` : ''}
            </span>
          </div>
        )}
      </div>

      <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, alignSelf: 'center' }} />
    </motion.div>
  )
}

// ─── Rich detail panel for an AI-generated action (board-confidence view) ──────

function AIActionDetailPanel({ action, onClose }: { action: DecisionAction | null; onClose: () => void }) {
  React.useEffect(() => {
    if (!action) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [action, onClose])

  if (!action) return null
  const color = PRIORITY_COLOR[action.priority]
  const impactPercent = ((action.impactAedM / 10000) * 100).toFixed(1)

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9000, backdropFilter: 'blur(2px)' }} />
      <aside
        role="dialog"
        aria-label={`Action detail: ${action.title}`}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(520px, 94vw)',
          background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-color)',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.5)', zIndex: 9001,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: 18, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <PriorityBadge priority={action.priority} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--accent-primary)', background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', borderRadius: 4, padding: '2px 7px' }}>
                AI-generated
              </span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
              {action.title}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 6, padding: 6, cursor: 'pointer', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Figures */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <DetailStat label="Est. impact" value={`AED ${action.impactAedM}M`} sub={`${impactPercent}% of portfolio`} color={color} />
            <DetailStat label="Act within" value={`${action.dueInDays} days`} />
            <DetailStat label="AI confidence" value={`${action.aiConfidence}%`} />
          </div>

          {/* Triggered by signal */}
          <DetailSection title="Triggered by external signal">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderLeft: '3px solid var(--accent-primary)', borderRadius: 6 }}>
              <Radio size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>{action.signalHeadline}</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3 }}>
                  {action.signalSource ? `${action.signalSource} · ` : ''}relevance to {action.portfolio === 'cross-portfolio' ? 'the group' : action.portfolio} {action.relevance}%
                </div>
              </div>
            </div>
          </DetailSection>

          {/* Why it matters */}
          {(action.whyItMatters || action.rationale) && (
            <DetailSection title="Why this matters">
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {action.whyItMatters || action.rationale}
              </p>
            </DetailSection>
          )}

          {/* Recommended steps */}
          {action.steps && action.steps.length > 0 && (
            <DetailSection title="Recommended first steps">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {action.steps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {/* Provenance note */}
          <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontStyle: 'italic', lineHeight: 1.5, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
            AI-generated from the live external signal above. The impact is a first-pass estimate —
            validate against the risk register before committing budget.
          </div>
        </div>
      </aside>
    </>
  )
}

function DetailStat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color ?? 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginTop: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3 style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.8, margin: 0 }}>{title}</h3>
      {children}
    </section>
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
  // The AI layer IS the product. Priority actions are GENERATED from the live
  // external signal feed and are the primary, clickable list. The curated
  // TOP_ACTIONS are a silent fallback only if the AI is unavailable — so the
  // demo never breaks, but the AI is always the star when it's up.
  const { actions: aiActions, source, updatedAt } = useDecisionActions()
  const live = source === 'ai' && aiActions.length > 0
  const [selectedAI, setSelectedAI] = React.useState<DecisionAction | null>(null)

  const criticalCount = live
    ? aiActions.filter((a) => a.priority === 'critical').length
    : TOP_ACTIONS.filter((a) => a.priority === 'critical').length
  const highCount = live
    ? aiActions.filter((a) => a.priority === 'high').length
    : TOP_ACTIONS.filter((a) => a.priority === 'high').length
  const totalImpact = live
    ? aiActions.reduce((sum, a) => sum + a.impactAedM, 0)
    : TOP_ACTIONS.reduce((sum, a) => sum + a.impactValue, 0)

  return (
    <Card glow>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={15} style={{ color: 'var(--risk-critical)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <CardTitle>Priority Actions</CardTitle>
            <span style={{ fontSize: '0.62rem', color: live ? 'var(--accent-primary)' : '#B54708', fontWeight: 600 }}>
              {live
                ? 'AI-generated from live external signals'
                : source === 'loading'
                  ? 'Reading live external signals…'
                  : 'AI over capacity — showing reference actions'}
            </span>
          </div>
        </div>

        {/* Header metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <HeaderMetric label="Critical" value={String(criticalCount)} color="var(--risk-critical)" />
          <HeaderMetric label="High" value={String(highCount)} color="var(--risk-high)" />
          <HeaderMetric label="Total Exposure" value={`AED ${totalImpact.toLocaleString()}M`} color="var(--accent-primary)" />
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
            {live && updatedAt ? `${updatedAt} · click any action for detail` : 'Click any action for the full analysis'}
          </span>
        </div>
      </CardHeader>

      <CardBody>
        {source === 'loading' && !live && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', marginBottom: '10px', borderRadius: '8px', background: 'var(--accent-glow)', border: '1px solid var(--border-accent)' }}>
            <Radio size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              Reading the live external feed and generating priority actions…
            </span>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {live
            ? aiActions.map((action, i) => (
                <DynamicActionRow key={i} action={action} rank={i + 1} onClick={setSelectedAI} />
              ))
            : TOP_ACTIONS.map((action, i) => (
                <ActionRow key={action.id} action={action} rank={i + 1} onClick={onActionClick} />
              ))}
        </div>
      </CardBody>

      <AIActionDetailPanel action={selectedAI} onClose={() => setSelectedAI(null)} />
    </Card>
  )
}
