'use client'

// ─── Decision Intelligence — Action Detail Panel (v2) ─────────────────────────
// Fixed right-side drawer. Sticky header. Inner scroll. Executive-grade clarity.
// Sections: Action Required → Why This Matters → Impact → What Will Happen →
//           What To Do → Data Backing (collapsed)

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Lightbulb,
  ShieldAlert,
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Send,
  TrendingDown,
  Calculator,
} from 'lucide-react'
import {
  PRIORITY_COLOR,
  PRIORITY_BG,
  STATUS_COLOR,
  STATUS_BG,
  STATUS_LABEL,
  IMPACT_LEVEL_COLOR,
  IMPACT_LEVEL_BG,
  type Action,
  type ActionPriority,
  type ActionStatus,
  type ImpactedUnit,
  type DataPoint,
  type PropagationStep,
} from '@/lib/actionEngine'

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ActionStatus }) {
  const color = STATUS_COLOR[status]
  const bg    = STATUS_BG[status]
  const label = STATUS_LABEL[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '5px',
        backgroundColor: bg,
        border: `1px solid ${color}55`,
        color,
        fontSize: '0.63rem',
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: color,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  )
}

// ─── Priority badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: ActionPriority }) {
  const label =
    priority === 'critical' ? '⚡ CRITICAL' : priority === 'high' ? '▲ HIGH' : '● MEDIUM'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '5px',
        backgroundColor: PRIORITY_BG[priority],
        border: `1px solid ${PRIORITY_COLOR[priority]}55`,
        color: PRIORITY_COLOR[priority],
        fontSize: '0.63rem',
        fontWeight: 800,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  )
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  iconColor = 'var(--accent-primary)',
  defaultOpen = false,
  children,
}: {
  icon: React.ElementType
  title: string
  iconColor?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ borderBottom: '1px solid var(--border-color)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '12px 20px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: `${iconColor}18`,
            border: `1px solid ${iconColor}35`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={13} style={{ color: iconColor }} />
        </div>
        <span
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            flex: 1,
          }}
        >
          {title}
        </span>
        {open ? (
          <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        ) : (
          <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 20px 16px' }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Root causes ──────────────────────────────────────────────────────────────

function RootCauses({ causes }: { causes: string[] }) {
  if (!causes.length)
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No additional data available</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {causes.map((c, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: '9px',
            alignItems: 'flex-start',
            padding: '9px 11px',
            borderRadius: '7px',
            backgroundColor: 'rgba(255,59,59,0.06)',
            border: '1px solid rgba(255,59,59,0.18)',
          }}
        >
          <AlertTriangle size={12} style={{ color: 'var(--risk-critical)', marginTop: '2px', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.55 }}>{c}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Propagation chain ────────────────────────────────────────────────────────

function PropagationChain({ steps }: { steps: PropagationStep[] }) {
  if (!steps.length)
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No additional data available</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Step card */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '7px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Signal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                {step.signal}
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--accent-glow)',
                  border: '1px solid var(--border-accent)',
                  color: 'var(--accent-primary)',
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {step.magnitude}
              </span>
            </div>
            {/* Effect */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
              <ArrowRight size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{step.effect}</span>
            </div>
          </div>

          {/* Connector line between steps */}
          {i < steps.length - 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3px 0' }}>
              <div
                style={{
                  width: '2px',
                  height: '14px',
                  background: 'linear-gradient(to bottom, var(--border-accent), rgba(0,0,0,0))',
                  borderRadius: '1px',
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Portfolio impact ─────────────────────────────────────────────────────────

function PortfolioImpact({ units }: { units: ImpactedUnit[] }) {
  if (!units.length)
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No additional data available</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {units.map((u, i) => {
        const color = IMPACT_LEVEL_COLOR[u.impact]
        const bg    = IMPACT_LEVEL_BG[u.impact]
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: '7px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Business unit name + impact chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, minWidth: '160px' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                {u.name}
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: bg,
                  border: `1px solid ${color}45`,
                  color,
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {u.impact}
              </span>
            </div>
            {/* Reason */}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.5, flex: 1 }}>
              {u.reason}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Data points table ────────────────────────────────────────────────────────

function DataPointsTable({ points }: { points: DataPoint[] }) {
  if (!points.length)
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No additional data available</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {points.map((dp, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '6px',
            backgroundColor: dp.breached ? 'rgba(255,59,59,0.05)' : 'rgba(34,197,94,0.04)',
            border: `1px solid ${dp.breached ? 'rgba(255,59,59,0.18)' : 'rgba(34,197,94,0.14)'}`,
          }}
        >
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.77rem', fontWeight: 600 }}>{dp.label}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.63rem', marginTop: '2px' }}>
              {dp.source}{dp.threshold ? ` · Threshold: ${dp.threshold}` : ''}
            </div>
          </div>
          <span style={{ color: dp.breached ? 'var(--risk-critical)' : 'var(--risk-low)', fontSize: '0.8rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {dp.value}
          </span>
          {dp.breached
            ? <XCircle size={13} style={{ color: 'var(--risk-critical)', flexShrink: 0 }} />
            : <CheckCircle2 size={13} style={{ color: 'var(--risk-low)', flexShrink: 0 }} />}
        </div>
      ))}
    </div>
  )
}

// ─── Recommendations ──────────────────────────────────────────────────────────

function Recommendations({ items }: { items: string[] }) {
  if (!items.length)
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No additional data available</p>
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            padding: '10px 12px',
            borderRadius: '7px',
            backgroundColor: 'rgba(201,168,76,0.06)',
            border: '1px solid var(--border-accent)',
          }}
        >
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-glow)',
              border: '1px solid var(--border-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: 'var(--accent-primary)',
              fontSize: '0.65rem',
              fontWeight: 800,
            }}
          >
            {i + 1}
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.6 }}>{item}</span>
        </li>
      ))}
    </ol>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ActionDetailPanel({
  action,
  onClose,
}: {
  action: Action | null
  onClose: () => void
}) {
  const [escalated, setEscalated] = useState(false)

  // Reset escalated state when action changes
  React.useEffect(() => { setEscalated(false) }, [action?.id])

  return (
    <AnimatePresence>
      {action && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              zIndex: 40,
            }}
          />

          {/* Panel — fixed, full height, inner scroll */}
          <motion.div
            key="panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              /* desktop: 460px wide; mobile: full screen */
              width: 'min(460px, 100vw)',
              backgroundColor: 'var(--bg-primary)',
              borderLeft: '1px solid var(--border-color)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >

            {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
            <div
              style={{
                flexShrink: 0,
                backgroundColor: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-color)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              {/* "ACTION REQUIRED" banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 20px 0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 10px',
                      borderRadius: '5px',
                      backgroundColor: `${PRIORITY_COLOR[action.priority]}18`,
                      border: `1px solid ${PRIORITY_COLOR[action.priority]}45`,
                    }}
                  >
                    <AlertTriangle size={11} style={{ color: PRIORITY_COLOR[action.priority] }} />
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        color: PRIORITY_COLOR[action.priority],
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Action Required
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '3px',
                      padding: '2px 7px',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {action.id} · {action.category}
                  </span>
                </div>

                <button
                  onClick={onClose}
                  title="Close"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '7px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Title */}
              <div style={{ padding: '10px 20px 0' }}>
                <h2
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: '1.02rem',
                    fontWeight: 700,
                    lineHeight: 1.38,
                    margin: 0,
                  }}
                >
                  {action.title}
                </h2>
              </div>

              {/* Key facts row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px 12px',
                  flexWrap: 'wrap',
                }}
              >
                <PriorityBadge priority={action.priority} />

                <div
                  title={`Based on total Aldar portfolio value: AED ${(10_000).toLocaleString()}M`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 10px',
                    borderRadius: '5px',
                    backgroundColor: `${PRIORITY_COLOR[action.priority]}15`,
                    border: `1px solid ${PRIORITY_COLOR[action.priority]}35`,
                    cursor: 'help',
                  }}
                >
                  <BarChart2 size={10} style={{ color: PRIORITY_COLOR[action.priority] }} />
                  <span style={{ color: PRIORITY_COLOR[action.priority], fontSize: '0.74rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {action.impactLabel}
                  </span>
                  <span
                    style={{
                      color: PRIORITY_COLOR[action.priority],
                      fontSize: '0.67rem',
                      fontWeight: 600,
                      opacity: 0.8,
                      borderLeft: `1px solid ${PRIORITY_COLOR[action.priority]}40`,
                      paddingLeft: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {action.impactPercent}% of portfolio
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '5px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <Clock size={10} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600 }}>
                    Act in {action.deadline}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '5px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <User size={10} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600 }}>{action.owner}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '5px', backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid var(--border-accent)' }}>
                  <Brain size={10} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 700 }}>
                    {Math.round(action.aiConfidence * 100)}% confidence
                  </span>
                </div>

                {/* Status badge */}
                <StatusBadge status={action.status} />
              </div>

              {/* Overdue / Escalation alert strip */}
              {action.daysOverdue > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    margin: '8px 20px 0',
                    padding: '8px 12px',
                    borderRadius: '7px',
                    backgroundColor: 'rgba(255,59,59,0.08)',
                    border: '1px solid rgba(255,59,59,0.3)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--risk-critical)' }}>
                    ⚠ Overdue by {action.daysOverdue} day{action.daysOverdue !== 1 ? 's' : ''}
                  </span>
                  {action.escalated && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--risk-critical)',
                        backgroundColor: 'rgba(255,59,59,0.15)',
                        border: '1px solid rgba(255,59,59,0.35)',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      🔴 Escalated to CRO
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── SCROLLABLE BODY ────────────────────────────────────────────── */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--border-color) transparent',
              }}
            >

              {/* ── 1. Why This Matters (Root Causes) — default OPEN ─────────── */}
              <Section
                icon={AlertTriangle}
                title="Why This Matters"
                iconColor="var(--risk-critical)"
                defaultOpen
              >
                <RootCauses causes={action.rootCauses} />
              </Section>

              {/* ── 2. Impact (Propagation) — default OPEN ───────────────────── */}
              <Section
                icon={TrendingDown}
                title="How It Propagates"
                iconColor="var(--risk-high)"
                defaultOpen
              >
                <PropagationChain steps={action.propagationPath} />
              </Section>

              {/* ── 2b. Portfolio Impact — default OPEN ──────────────────────── */}
              <Section
                icon={BarChart2}
                title="Portfolio Impact"
                iconColor="var(--chart-2)"
                defaultOpen
              >
                <PortfolioImpact units={action.impactedUnits} />
              </Section>

              {/* ── 3. Consequence Comparison — default OPEN ─────────────────── */}
              <Section
                icon={ShieldAlert}
                title="Consequence Comparison"
                iconColor="var(--risk-critical)"
                defaultOpen
              >
                {(() => {
                  const delta = action.impactValue - action.ifActedExposureM
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* If Action Taken */}
                      <div
                        style={{
                          padding: '11px 13px',
                          borderRadius: '7px',
                          backgroundColor: 'rgba(34,197,94,0.07)',
                          border: '1px solid rgba(34,197,94,0.25)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <CheckCircle2 size={13} style={{ color: 'var(--risk-low)', flexShrink: 0 }} />
                          <span style={{ color: 'var(--risk-low)', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                            If Action Taken
                          </span>
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: 'var(--risk-low)',
                              backgroundColor: 'rgba(34,197,94,0.12)',
                              border: '1px solid rgba(34,197,94,0.3)',
                              borderRadius: '4px',
                              padding: '1px 8px',
                              whiteSpace: 'nowrap',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            ~AED {action.ifActedExposureM}M residual
                          </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.79rem', lineHeight: 1.6, margin: 0 }}>
                          {action.ifActed}
                        </p>
                      </div>

                      {/* Delta banner */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-accent)',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Delta</span>
                        <span
                          style={{
                            color: 'var(--accent-primary)',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          AED {delta}M risk avoided
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                          ({Math.round((delta / action.impactValue) * 100)}% reduction)
                        </span>
                      </div>

                      {/* If Ignored */}
                      <div
                        style={{
                          padding: '11px 13px',
                          borderRadius: '7px',
                          backgroundColor: 'rgba(255,59,59,0.09)',
                          border: '1px solid rgba(255,59,59,0.3)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <XCircle size={13} style={{ color: 'var(--risk-critical)', flexShrink: 0 }} />
                          <span style={{ color: 'var(--risk-critical)', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                            If Ignored
                          </span>
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: 'var(--risk-critical)',
                              backgroundColor: 'rgba(255,59,59,0.12)',
                              border: '1px solid rgba(255,59,59,0.3)',
                              borderRadius: '4px',
                              padding: '1px 8px',
                              whiteSpace: 'nowrap',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            AED {action.impactValue}M+ exposure
                          </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.79rem', lineHeight: 1.6, margin: 0 }}>
                          {action.ifIgnored}
                        </p>
                      </div>
                    </div>
                  )
                })()}
              </Section>

              {/* ── 4. What To Do (Recommendations) — default OPEN ───────────── */}
              <Section
                icon={Lightbulb}
                title="What To Do"
                iconColor="var(--risk-low)"
                defaultOpen
              >
                <Recommendations items={action.recommendation} />
              </Section>

              {/* ── 5. Data Backing — collapsed by default ────────────────────── */}
              <Section
                icon={BarChart2}
                title="Data Backing"
                iconColor="var(--chart-2)"
                defaultOpen={false}
              >
                <DataPointsTable points={action.dataPoints} />
              </Section>

              {/* ── 6. Calculation Logic — collapsed by default ───────────────── */}
              <Section
                icon={Calculator}
                title="Calculation Logic"
                iconColor="var(--accent-primary)"
                defaultOpen={false}
              >
                <div
                  style={{
                    padding: '11px 13px',
                    borderRadius: '7px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.77rem',
                    lineHeight: 1.7,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {action.calculationLogic || 'No additional data available'}
                </div>
              </Section>

              {/* ── Trigger IDs ───────────────────────────────────────────────── */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 20px',
                  flexWrap: 'wrap',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600 }}>
                  Source signals:
                </span>
                {action.triggerIds.map((id) => (
                  <span
                    key={id}
                    style={{
                      fontSize: '0.63rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '3px',
                      padding: '2px 7px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {id}
                  </span>
                ))}
              </div>

              {/* ── CTA — Assign / Escalate ───────────────────────────────────── */}
              <div style={{ padding: '16px 20px 28px' }}>
                <button
                  onClick={() => setEscalated(true)}
                  disabled={escalated}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    width: '100%',
                    padding: '12px 20px',
                    borderRadius: '9px',
                    backgroundColor: escalated
                      ? 'rgba(34,197,94,0.12)'
                      : PRIORITY_BG[action.priority],
                    border: `1.5px solid ${escalated ? 'rgba(34,197,94,0.4)' : PRIORITY_COLOR[action.priority]}`,
                    color: escalated ? 'var(--risk-low)' : PRIORITY_COLOR[action.priority],
                    cursor: escalated ? 'default' : 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {escalated ? (
                    <>
                      <CheckCircle2 size={15} />
                      Escalated — Action Logged
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Assign / Escalate to {action.owner}
                    </>
                  )}
                </button>

                {escalated && (
                  <p
                    style={{
                      marginTop: '8px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.7rem',
                    }}
                  >
                    Notification sent · tracked in action log
                  </p>
                )}
              </div>

            </div>
            {/* end scrollable body */}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
