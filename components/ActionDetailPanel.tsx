'use client'

// ─── Decision Intelligence — Action Detail Panel ──────────────────────────────
// Right-side slide-in panel. Six sections:
//   1. Summary header (id, priority, impact, owner, deadline, AI confidence)
//   2. Root Cause Analysis
//   3. Risk Propagation Path
//   4. Supporting Data Points (with breach indicators)
//   5. Calculation Logic
//   6. Consequence + Recommendations

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Calculator,
  Lightbulb,
  ShieldAlert,
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  PRIORITY_COLOR,
  PRIORITY_BG,
  type Action,
  type ActionPriority,
  type DataPoint,
  type PropagationStep,
} from '@/lib/actionEngine'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: ActionPriority }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '5px',
        backgroundColor: PRIORITY_BG[priority],
        border: `1px solid ${PRIORITY_COLOR[priority]}50`,
        color: PRIORITY_COLOR[priority],
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {priority === 'critical' ? '⚡ CRITICAL' : priority === 'high' ? '▲ HIGH' : '● MEDIUM'}
    </span>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
  iconColor = 'var(--accent-primary)',
  collapsible = false,
  defaultOpen = true,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  iconColor?: string
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      style={{
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => collapsible && setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '10px 14px',
          backgroundColor: 'var(--bg-card)',
          border: 'none',
          cursor: collapsible ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '5px',
            backgroundColor: `${iconColor}15`,
            border: `1px solid ${iconColor}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={12} style={{ color: iconColor }} />
        </div>
        <span
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            flex: 1,
          }}
        >
          {title}
        </span>
        {collapsible && (open ? <ChevronUp size={13} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />)}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-color)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Root cause list ──────────────────────────────────────────────────────────

function RootCauses({ causes }: { causes: string[] }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {causes.map((cause, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            padding: '8px 10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255,59,59,0.06)',
            border: '1px solid rgba(255,59,59,0.15)',
          }}
        >
          <AlertTriangle
            size={12}
            style={{ color: 'var(--risk-critical)', marginTop: '2px', flexShrink: 0 }}
          />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.5 }}>
            {cause}
          </span>
        </li>
      ))}
    </ul>
  )
}

// ─── Propagation path ─────────────────────────────────────────────────────────

function PropagationPath({ steps }: { steps: PropagationStep[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.77rem', fontWeight: 600 }}>
                {step.signal}
              </span>
              <span
                style={{
                  color: 'var(--accent-primary)',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--accent-glow)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: '3px',
                  padding: '1px 7px',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.magnitude}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
              <ArrowRight size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.73rem' }}>{step.effect}</span>
            </div>
          </div>

          {/* Connector */}
          {i < steps.length - 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '2px',
                  height: '12px',
                  background: 'linear-gradient(to bottom, var(--border-accent), transparent)',
                }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── Data points table ────────────────────────────────────────────────────────

function DataPointsTable({ points }: { points: DataPoint[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {points.map((dp, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 10px',
            borderRadius: '5px',
            backgroundColor: dp.breached
              ? 'rgba(255,59,59,0.05)'
              : 'rgba(34,197,94,0.04)',
            border: `1px solid ${dp.breached ? 'rgba(255,59,59,0.15)' : 'rgba(34,197,94,0.12)'}`,
          }}
        >
          {/* Label + source */}
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>
              {dp.label}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.63rem', marginTop: '1px' }}>
              {dp.source}
              {dp.threshold && (
                <span style={{ marginLeft: '6px' }}>
                  · Threshold: {dp.threshold}
                </span>
              )}
            </div>
          </div>

          {/* Value */}
          <span
            style={{
              color: dp.breached ? 'var(--risk-critical)' : 'var(--risk-low)',
              fontSize: '0.78rem',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {dp.value}
          </span>

          {/* Breach indicator */}
          {dp.breached ? (
            <XCircle size={13} style={{ color: 'var(--risk-critical)', flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={13} style={{ color: 'var(--risk-low)', flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Recommendations ──────────────────────────────────────────────────────────

function Recommendations({ items }: { items: string[] }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            padding: '9px 12px',
            borderRadius: '6px',
            backgroundColor: 'rgba(var(--accent-primary-rgb,201,168,76),0.05)',
            border: '1px solid var(--border-accent)',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
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
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.55 }}>
            {item}
          </span>
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
              backgroundColor: 'rgba(0,0,0,0.55)',
              zIndex: 40,
            }}
          />

          {/* Slide-in panel */}
          <motion.div
            key="panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(640px, 100vw)',
              backgroundColor: 'var(--bg-primary)',
              borderLeft: '1px solid var(--border-color)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'hidden',
            }}
          >
            {/* ── Section 1: Summary header ────────────────────────────────── */}
            <div
              style={{
                padding: '18px 20px 14px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                flexShrink: 0,
              }}
            >
              {/* Top row: ID + close */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {action.id}
                  </span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '3px',
                      padding: '1px 6px',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {action.category}
                  </span>
                </div>

                <button
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Title */}
              <h2
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  lineHeight: 1.35,
                  margin: '0 0 10px',
                }}
              >
                {action.title}
              </h2>

              {/* Meta pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <PriorityBadge priority={action.priority} />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    borderRadius: '5px',
                    backgroundColor: `${PRIORITY_COLOR[action.priority]}15`,
                    border: `1px solid ${PRIORITY_COLOR[action.priority]}35`,
                  }}
                >
                  <BarChart2 size={10} style={{ color: PRIORITY_COLOR[action.priority] }} />
                  <span
                    style={{
                      color: PRIORITY_COLOR[action.priority],
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {action.impactLabel}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '5px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <Clock size={10} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600 }}>
                    Act in {action.deadline}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '5px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <User size={10} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600 }}>
                    {action.owner}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '5px', backgroundColor: 'rgba(var(--accent-primary-rgb,201,168,76),0.08)', border: '1px solid var(--border-accent)' }}>
                  <Brain size={10} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 700 }}>
                    {Math.round(action.aiConfidence * 100)}% AI Confidence
                  </span>
                </div>
              </div>

              {/* Trigger IDs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Triggers:</span>
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
                      padding: '1px 6px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Scrollable body ─────────────────────────────────────────── */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                scrollbarWidth: 'thin',
              }}
            >
              {/* Section 2: Root Cause Analysis */}
              <Section
                icon={AlertTriangle}
                title="Root Cause Analysis"
                iconColor="var(--risk-critical)"
                collapsible
              >
                <RootCauses causes={action.rootCauses} />
              </Section>

              {/* Section 3: Risk Propagation Path */}
              <Section
                icon={ArrowRight}
                title="Risk Propagation Path"
                iconColor="var(--risk-high)"
                collapsible
              >
                <PropagationPath steps={action.propagationPath} />
              </Section>

              {/* Section 4: Supporting Data Points */}
              <Section
                icon={BarChart2}
                title="Supporting Data Points"
                iconColor="var(--chart-2)"
                collapsible
              >
                <DataPointsTable points={action.dataPoints} />
              </Section>

              {/* Section 5: Calculation Logic */}
              <Section
                icon={Calculator}
                title="Calculation Logic"
                iconColor="var(--accent-primary)"
                collapsible
                defaultOpen={false}
              >
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    lineHeight: 1.65,
                    fontFamily: 'monospace',
                  }}
                >
                  {action.calculationLogic}
                </div>
              </Section>

              {/* Section 6: Consequence */}
              <Section
                icon={ShieldAlert}
                title="Consequence if Unaddressed"
                iconColor="var(--risk-critical)"
                collapsible
              >
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255,59,59,0.06)',
                    border: '1px solid rgba(255,59,59,0.2)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    lineHeight: 1.6,
                  }}
                >
                  {action.consequence}
                </div>
              </Section>

              {/* Section 6b: Recommendations */}
              <Section
                icon={Lightbulb}
                title="Recommended Actions"
                iconColor="var(--risk-low)"
                collapsible
              >
                <Recommendations items={action.recommendation} />
              </Section>

              {/* Bottom spacer */}
              <div style={{ height: '20px' }} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
