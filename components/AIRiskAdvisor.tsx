'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  X,
  Send,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Zap,
  Building2,
  MessageSquare,
} from 'lucide-react'
import { internalSnapshot } from '@/lib/internalData'
import { aggregateKPIs } from '@/lib/simulated-data'

// ─── Suggested questions ──────────────────────────────────────────────────────

const SUGGESTED = [
  { label: 'Top risks today?', icon: AlertTriangle, q: 'What are the top risks today across Aldar\'s portfolio?' },
  { label: 'Most exposed BU?', icon: Building2, q: 'Which business unit is most exposed right now and why?' },
  { label: 'Biggest external threat?', icon: TrendingUp, q: 'What is the biggest external market threat facing Aldar?' },
  { label: 'Risk Committee focus?', icon: Zap, q: 'What should the Risk Committee prioritise in this quarter\'s review?' },
  { label: 'Hospitality position?', icon: MessageSquare, q: 'Summarise the hospitality risk position and key actions needed.' },
]

// ─── Portfolio focus color map ────────────────────────────────────────────────

const PORTFOLIO_COLORS: Record<string, string> = {
  'Real Estate': '#C9A84C',
  'Retail': '#4A9EFF',
  'Hospitality': '#A855F7',
  'Education': '#22C55E',
  'Facilities': '#FF6B6B',
  'Cross-Portfolio': 'var(--accent-primary)',
}

// ─── Build context from live data ─────────────────────────────────────────────

function buildContext(): string {
  const s = internalSnapshot
  return [
    `INTERNAL SIGNALS (live):`,
    `- Hospitality: Occupancy ${s.hospitality.occupancyRate}% (${s.hospitality.occupancyTrend}), RevPAR AED ${s.hospitality.revPAR} (${s.hospitality.revPARChange}% MoM). ${s.hospitality.flagReason}`,
    `- Retail: Tenant stress ${s.retail.tenantStress}, ${s.retail.stressedTenants} stressed tenants, footfall ${s.retail.footfallChange}% YoY, vacancy ${s.retail.vacancyRate}%`,
    `- Real Estate: Off-plan sales ${s.realEstate.offPlanSales}/${s.realEstate.offPlanTarget} units MTD (${Math.round(s.realEstate.offPlanSales / s.realEstate.offPlanTarget * 100)}%), collections ${s.realEstate.collectionRate}%, ${s.realEstate.handoverDelays} units delayed`,
    `- Projects: ${s.projects.delayedProjects}/${s.projects.totalActiveProjects} active projects delayed (avg ${s.projects.averageDelayDays} days), cost variance +${s.projects.costVariancePercent}%`,
    `- Risk Register: ${s.riskRegister.activeRisks} active risks (${s.riskRegister.criticalRisks} critical, ${s.riskRegister.highRisks} high, ${s.riskRegister.mediumRisks} medium), ${s.riskRegister.overdueMitigations} overdue mitigations, ${s.riskRegister.newRisksThisMonth} new this month`,
    `- Finance: Cash flow ${s.finance.cashFlowVariance}% vs budget, DSCR ${s.finance.debtServiceCoverage}x, gearing ${s.finance.gearingRatio}%`,
    ``,
    `PORTFOLIO OVERVIEW:`,
    `- Total enterprise risks: 1,280 across 5 BUs`,
    `- Overall risk score: ${aggregateKPIs.totalRiskScore}/100 (↑ +4 pts MTD)`,
    `- Financial exposure at risk: AED ${aggregateKPIs.totalFinancialExposure}M`,
    `- Critical+High: ${aggregateKPIs.criticalRisks + aggregateKPIs.highRisks} risks requiring management action`,
    ``,
    `TOP ACTIVE RISKS:`,
    `1. Interest rate headwind — CBUAE benchmark rate impacting off-plan mortgage conversion`,
    `2. Yas Island hotel occupancy below 70% threshold for 3 consecutive weeks`,
    `3. Construction cost overrun — steel +22%, MEP subcontractor distress (Saadiyat Lagoons Ph.2)`,
    `4. Tenant covenant risk — 2 retail tenants (AED 28M income) under parent restructuring`,
    `5. Smart building cyber risk — 8 commercial assets using legacy OT protocols (NCA advisory issued)`,
    `6. ADEK regulatory change — IB curriculum mandate (AED 4.2M compliance cost, Sep 2026)`,
    `7. ESG reporting gap — Scope 3 emissions only 34% covered (IFRS S1/S2 mandatory FY2026)`,
  ].join('\n')
}

// ─── Typing dots animation ────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1" style={{ padding: '12px 0 4px' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
          }}
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AdvisorResult {
  answer: string
  keyPoints: string[]
  actionItems: string[]
  portfolioFocus: string
  confidence: number
  answeredAt?: string
}

export function AIRiskAdvisor() {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState('')
  const [result, setResult] = useState<AdvisorResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pulse, setPulse] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const contextRef = useRef<string>('')

  // Build context once
  useEffect(() => {
    contextRef.current = buildContext()
    // Stop pulse after 8s
    const t = setTimeout(() => setPulse(false), 8000)
    return () => clearTimeout(t)
  }, [])

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  // Scroll to bottom on new result
  useEffect(() => {
    if (result && bodyRef.current) {
      setTimeout(() => {
        bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
      }, 100)
    }
  }, [result])

  const submit = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed || loading) return

    setAsked(trimmed)
    setQuestion('')
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, context: contextRef.current }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Advisor unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [loading])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(question)
    }
  }

  const reset = () => {
    setAsked('')
    setResult(null)
    setError(null)
    setQuestion('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const focusColor = PORTFOLIO_COLORS[result?.portfolioFocus ?? ''] ?? 'var(--accent-primary)'

  return (
    <>
      {/* ── Floating toggle button ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            onClick={() => { setOpen(true); setPulse(false) }}
            style={{
              position: 'fixed',
              bottom: '28px',
              right: '28px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 60,
              boxShadow: '0 4px 20px rgba(201,168,76,0.4)',
            }}
            title="AI Risk Advisor"
          >
            <Bot size={24} style={{ color: 'var(--on-accent)' }} />
            {/* Pulse ring */}
            {pulse && (
              <motion.span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid var(--accent-primary)',
                }}
                animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: '28px',
              right: '28px',
              width: '400px',
              maxHeight: '620px',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-accent)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.45), 0 0 0 1px var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 60,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-color)',
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-card) 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Bot size={17} style={{ color: 'var(--on-accent)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  AI Risk Advisor
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#22C55E',
                      display: 'inline-block',
                    }}
                    className="animate-pulse"
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                    AI · Live context
                  </span>
                </div>
              </div>
              {result && (
                <button
                  onClick={reset}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '0.68rem',
                    padding: '4px 8px',
                    marginRight: '4px',
                  }}
                >
                  New
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '6px',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div
              ref={bodyRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Greeting + suggested questions */}
              {!asked && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Greeting */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <Sparkles size={13} style={{ color: 'var(--on-accent)' }} />
                    </div>
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        borderTopLeftRadius: '4px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        flex: 1,
                      }}
                    >
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.55, margin: 0 }}>
                        I have live access to Aldar's risk signals, internal data, and portfolio metrics. Ask me anything about the current risk position.
                      </p>
                    </div>
                  </div>

                  {/* Suggested questions */}
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                      Suggested
                    </div>
                    <div className="space-y-2">
                      {SUGGESTED.map(({ label, icon: Icon, q }) => (
                        <button
                          key={label}
                          onClick={() => submit(q)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '9px',
                            textAlign: 'left',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)'
                            ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-glow)'
                          }}
                          onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'
                            ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-secondary)'
                          }}
                        >
                          <Icon size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', flex: 1 }}>{label}</span>
                          <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Question bubble */}
              {asked && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', justifyContent: 'flex-end' }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      borderBottomRightRadius: '4px',
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      maxWidth: '82%',
                    }}
                  >
                    <p style={{ color: 'var(--on-accent)', fontSize: '0.8rem', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                      {asked}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Bot size={13} style={{ color: 'var(--on-accent)' }} />
                  </div>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      borderTopLeftRadius: '4px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <TypingDots />
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: '4px' }}>
                      Analyzing live risk context...
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {error && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,59,59,0.08)',
                    border: '1px solid rgba(255,59,59,0.25)',
                    color: 'var(--risk-critical)',
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </motion.div>
              )}

              {/* Answer */}
              <AnimatePresence>
                {result && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <Bot size={13} style={{ color: 'var(--on-accent)' }} />
                    </div>

                    <div
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '12px',
                        borderTopLeftRadius: '4px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      {/* Portfolio focus badge */}
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '20px',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            backgroundColor: `${focusColor}18`,
                            color: focusColor,
                            border: `1px solid ${focusColor}35`,
                          }}
                        >
                          {result.portfolioFocus}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                          AI {Math.round(result.confidence * 100)}% confidence
                        </span>
                      </div>

                      {/* Main answer */}
                      <p style={{ color: 'var(--text-primary)', fontSize: '0.825rem', lineHeight: 1.65, margin: 0 }}>
                        {result.answer}
                      </p>

                      {/* Key points */}
                      {result.keyPoints.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {result.keyPoints.map((pt, i) => (
                            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                              <span
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  backgroundColor: `${focusColor}18`,
                                  border: `1px solid ${focusColor}40`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  marginTop: '1px',
                                  fontSize: '0.55rem',
                                  fontWeight: 700,
                                  color: focusColor,
                                }}
                              >
                                {i + 1}
                              </span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                                {pt}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action items */}
                      {result.actionItems.length > 0 && (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderLeft: `2px solid var(--accent-primary)`,
                          }}
                        >
                          <div style={{ color: 'var(--accent-primary)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                            Recommended Actions
                          </div>
                          {result.actionItems.map((a, i) => (
                            <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: i < result.actionItems.length - 1 ? '4px' : 0 }}>
                              <span style={{ color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>→</span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.45 }}>{a}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                        <Sparkles size={9} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>
                          AI · {result.answeredAt ? new Date(result.answeredAt).toLocaleTimeString('en-AE', { timeZone: 'Asia/Dubai' }) : ''} GST
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input area */}
            <div
              style={{
                padding: '12px',
                borderTop: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  transition: 'border-color 0.15s',
                }}
                onFocusCapture={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)'
                }}
                onBlurCapture={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'
                }}
              >
                <textarea
                  ref={inputRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about risks, portfolios, threats..."
                  rows={1}
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.825rem',
                    lineHeight: '1.5',
                    fontFamily: 'inherit',
                    maxHeight: '96px',
                    overflowY: 'auto',
                  }}
                />
                <button
                  onClick={() => submit(question)}
                  disabled={loading || !question.trim()}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: question.trim() && !loading
                      ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                      : 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    cursor: question.trim() && !loading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                    opacity: question.trim() && !loading ? 1 : 0.5,
                  }}
                >
                  <Send size={14} style={{ color: question.trim() && !loading ? '#000' : 'var(--text-muted)' }} />
                </button>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', textAlign: 'center', marginTop: '6px' }}>
                Enter to send · Shift+Enter for new line
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
