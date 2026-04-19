'use client'

// ─── Control Detail Panel ─────────────────────────────────────────────────────
// Right-side drawer — mirrors ActionDetailPanel behavior.
// Shows full control detail, test history, audit trail, linked risk and actions.

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Shield,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  FileText,
  Hourglass,
  Brain,
} from 'lucide-react'
import {
  AUDIT_RESULT_COLOR,
  AUDIT_RESULT_LABEL,
  TREND_COLOR,
  TREND_ICON,
  getAuditRecord,
} from '@/lib/controlAuditTrail'
import {
  CONTROL_FAILURE_ACTIONS,
} from '@/lib/controlActionBridge'
import { PRIORITY_COLOR, PRIORITY_BG } from '@/lib/actionEngine'
import type { Control, ControlStatus } from '@/lib/controlData'
import { riskRegister, type Risk } from '@/lib/simulated-data'

// ─── Status color map ─────────────────────────────────────────────────────────

const STATUS_COLOR: Record<ControlStatus, string> = {
  effective: '#22C55E',
  partial:   '#F5C518',
  failed:    '#FF3B3B',
}
const STATUS_BG: Record<ControlStatus, string> = {
  effective: 'rgba(34,197,94,0.1)',
  partial:   'rgba(245,197,24,0.1)',
  failed:    'rgba(255,59,59,0.1)',
}
const STATUS_LABEL: Record<ControlStatus, string> = {
  effective: 'Effective',
  partial:   'Partial Pass',
  failed:    'Failed',
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
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
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title}
        </span>
        {open ? <ChevronUp size={12} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '10px 12px 12px', borderTop: '1px solid var(--border-color)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Audit result dot ─────────────────────────────────────────────────────────

function ResultDot({ result }: { result: ControlStatus }) {
  const color = AUDIT_RESULT_COLOR[result]
  const Icon = result === 'effective' ? CheckCircle2 : result === 'failed' ? XCircle : AlertCircle
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 7px',
        borderRadius: '4px',
        backgroundColor: `${color}12`,
        border: `1px solid ${color}35`,
        color,
        fontSize: '0.6rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={9} />
      {AUDIT_RESULT_LABEL[result]}
    </span>
  )
}

// ─── Linked Risk card (inline expandable) ────────────────────────────────────

function LinkedRiskCard({
  riskId,
  riskTitle,
  risk,
}: {
  riskId: string
  riskTitle: string
  risk: Risk | undefined
}) {
  const [expanded, setExpanded] = useState(false)

  const scoreColor = !risk ? 'var(--text-muted)'
    : risk.score >= 16 ? 'var(--risk-critical)'
    : risk.score >= 10 ? 'var(--risk-high)'
    : 'var(--risk-medium)'

  const trendColor = !risk ? 'var(--text-muted)'
    : risk.trend === 'increasing' ? 'var(--risk-critical)'
    : risk.trend === 'stable' ? 'var(--text-muted)'
    : '#22C55E'

  return (
    <div
      style={{
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
    >
      {/* Section header — always shows, click to expand */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Linked Risk
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>
            {expanded ? 'Hide details' : 'Click to expand ↗'}
          </span>
          {expanded ? <ChevronUp size={12} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </button>

      {/* Always-visible summary row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '8px 12px',
          borderTop: '1px solid var(--border-color)',
          cursor: 'pointer',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <span
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.65rem',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              marginBottom: '2px',
              display: 'block',
            }}
          >
            {riskId}
          </span>
          <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3 }}>
            {riskTitle}
          </span>
        </div>
        {risk && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={{ color: scoreColor, fontSize: '0.85rem', fontWeight: 800 }}>{risk.score}/25</span>
            <ExternalLink size={11} style={{ color: 'var(--text-muted)' }} />
          </div>
        )}
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && risk && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '10px 12px 12px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Score grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[
                  { label: 'Score',       value: `${risk.score}/25`,                   color: scoreColor },
                  { label: 'Likelihood',  value: `${risk.likelihood}/5`,               color: 'var(--text-secondary)' },
                  { label: 'Impact',      value: `${risk.impact}/5`,                   color: 'var(--text-secondary)' },
                  { label: 'Exposure',    value: `AED ${risk.financialImpact}M`,        color: 'var(--accent-primary)' },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '5px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ color, fontSize: '0.78rem', fontWeight: 700 }}>{value}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.58rem', marginTop: '1px' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={10} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{risk.owner}</span>
                </div>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: trendColor,
                    backgroundColor: `${trendColor}12`,
                    border: `1px solid ${trendColor}30`,
                    textTransform: 'capitalize',
                  }}
                >
                  {risk.trend === 'increasing' ? '↑' : risk.trend === 'decreasing' ? '↓' : '→'} {risk.trend}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.63rem' }}>
                  {risk.category}
                </span>
              </div>

              {/* AI Insight */}
              <div
                style={{
                  padding: '7px 9px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(201,168,76,0.05)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
                  lineHeight: 1.55,
                }}
              >
                <Brain size={9} style={{ color: 'var(--accent-primary)', display: 'inline', marginRight: '5px' }} />
                {risk.aiInsight}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface ControlDetailPanelProps {
  control: Control | null
  onClose: () => void
  onActionClick?: (actionId: string) => void
}

export function ControlDetailPanel({ control, onClose, onActionClick }: ControlDetailPanelProps) {
  const audit = control ? getAuditRecord(control.id) : undefined
  const linkedAction = control
    ? CONTROL_FAILURE_ACTIONS.find(a => a.id === `CTRL-${control.id}`)
    : undefined
  const linkedRisk = control
    ? riskRegister.find(r => r.id === control.linkedRiskId)
    : undefined

  return (
    <AnimatePresence>
      {control && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 998,
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              height: '100vh',
              width: 'min(460px, 100vw)',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-card)',
              borderLeft: '1px solid var(--border-color)',
            }}
          >
            {/* Sticky header */}
            <div
              style={{
                flexShrink: 0,
                padding: '16px 18px 12px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '3px 9px',
                      borderRadius: '5px',
                      backgroundColor: `${STATUS_COLOR[control.status]}12`,
                      border: `1px solid ${STATUS_COLOR[control.status]}35`,
                      marginBottom: '6px',
                    }}
                  >
                    <Shield size={10} style={{ color: STATUS_COLOR[control.status] }} />
                    <span style={{ color: STATUS_COLOR[control.status], fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                      INTERNAL CONTROL · {control.id}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    {control.process} · {control.controlType} · {control.icafarAssertion}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    padding: '6px',
                    borderRadius: '7px',
                    background: 'none',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Title */}
              <h2 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.3, margin: '0 0 10px' }}>
                {control.name}
              </h2>

              {/* Key facts */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    backgroundColor: STATUS_BG[control.status],
                    border: `1px solid ${STATUS_COLOR[control.status]}40`,
                    color: STATUS_COLOR[control.status],
                    fontSize: '0.67rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {STATUS_LABEL[control.status]}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={11} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{control.owner}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Next: {control.nextDue}</span>
                </div>

                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    color: 'var(--accent-primary)',
                    backgroundColor: 'var(--accent-glow)',
                    border: '1px solid var(--border-accent)',
                  }}
                >
                  {control.frequency}
                </span>

                {control.integrationPending && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: '#F5C518',
                      backgroundColor: 'rgba(245,197,24,0.08)',
                      border: '1px solid rgba(245,197,24,0.2)',
                    }}
                  >
                    <Hourglass size={8} /> Integration Pending
                  </span>
                )}
              </div>

              {/* Failed strip */}
              {control.status === 'failed' && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255,59,59,0.06)',
                    border: '1px solid rgba(255,59,59,0.25)',
                    color: 'var(--risk-critical)',
                    fontSize: '0.7rem',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Control Failure: </strong>{control.statusReason}
                </div>
              )}
            </div>

            {/* Scrollable body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px 18px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--border-color) transparent',
              }}
            >
              {/* Description */}
              <Section title="Control Description">
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.65, margin: 0 }}>
                  {control.description}
                </p>
              </Section>

              {/* Status reason */}
              {control.status !== 'effective' && (
                <Section title="Status Rationale">
                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: `${STATUS_COLOR[control.status]}08`,
                      border: `1px solid ${STATUS_COLOR[control.status]}25`,
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      lineHeight: 1.65,
                    }}
                  >
                    {control.statusReason}
                  </div>
                </Section>
              )}

              {/* Linked Risk — expandable inline card */}
              <LinkedRiskCard
                riskId={control.linkedRiskId}
                riskTitle={control.linkedRiskTitle}
                risk={linkedRisk}
              />

              {/* Triggered Action */}
              {linkedAction && (
                <Section title="Triggered Decision Layer Action">
                  <div
                    onClick={() => onActionClick?.(linkedAction.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      borderRadius: '7px',
                      backgroundColor: `${PRIORITY_BG[linkedAction.priority]}`,
                      border: `1px solid ${PRIORITY_COLOR[linkedAction.priority]}30`,
                      cursor: onActionClick ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '3px' }}>
                        {linkedAction.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ color: PRIORITY_COLOR[linkedAction.priority], fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          {linkedAction.priority}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                          {linkedAction.impactLabel}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                          Deadline: {linkedAction.deadline}
                        </span>
                      </div>
                    </div>
                    {onActionClick && <ExternalLink size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                  </div>
                </Section>
              )}

              {/* Evidence Required */}
              <Section title="Evidence Required">
                <div
                  style={{
                    padding: '7px 10px',
                    borderRadius: '5px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    lineHeight: 1.5,
                  }}
                >
                  <FileText size={10} style={{ color: 'var(--accent-primary)', display: 'inline', marginRight: '5px' }} />
                  {control.evidenceRequired}
                </div>
              </Section>

              {/* Audit Trail */}
              {audit && (
                <Section title={`Audit Trail — ${audit.dataLabel}`}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Trend indicator */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Trend:</span>
                      {audit.trendDirection === 'improving'
                        ? <TrendingUp size={12} style={{ color: TREND_COLOR.improving }} />
                        : audit.trendDirection === 'deteriorating'
                        ? <TrendingDown size={12} style={{ color: TREND_COLOR.deteriorating }} />
                        : <Minus size={12} style={{ color: TREND_COLOR.stable }} />
                      }
                      <span
                        style={{
                          color: TREND_COLOR[audit.trendDirection],
                          fontSize: '0.67rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                        }}
                      >
                        {TREND_ICON[audit.trendDirection]} {audit.trendDirection}
                      </span>
                    </div>

                    {/* History entries */}
                    {audit.testHistory.map((entry, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: i === 0 ? 'var(--bg-secondary)' : 'transparent',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontVariantNumeric: 'tabular-nums' }}>
                              {entry.date}
                            </span>
                            {i === 0 && (
                              <span style={{ color: 'var(--accent-primary)', fontSize: '0.58rem', fontWeight: 600, backgroundColor: 'var(--accent-glow)', padding: '1px 5px', borderRadius: '3px' }}>
                                LATEST
                              </span>
                            )}
                          </div>
                          <ResultDot result={entry.result} />
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', lineHeight: 1.4, marginBottom: '2px' }}>
                          {entry.notes}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={9} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>{entry.testedBy}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontFamily: 'monospace' }}>
                            {entry.evidenceRef}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Test schedule */}
              <Section title="Testing Schedule" defaultOpen={false}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Last Tested', value: control.lastTested, icon: Calendar },
                    { label: 'Next Due', value: control.nextDue, icon: Clock },
                    { label: 'Frequency', value: control.frequency, icon: Clock },
                    { label: 'Portfolio', value: control.portfolio, icon: Shield },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} style={{ padding: '7px 9px', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <Icon size={9} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                      </div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.73rem', fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
