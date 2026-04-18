'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScrollText, Loader2, Download, Clock, Shield, Target, TrendingUp,
  AlertTriangle, ChevronRight, Presentation, Copy, CheckCheck,
  ExternalLink, Database, Cpu, Globe, Network,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { ConfidenceBadge } from '@/components/ui/Badge'
import { AIInsightBox } from '@/components/ui/AIInsightBox'
import { riskRegister, portfolioMetrics } from '@/lib/simulated-data'
import { internalSnapshot } from '@/lib/internalData'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BriefResult {
  summary: string
  executiveSummary: string
  businessImpact: string
  crossPortfolioImpact: string
  riskRating: string
  topRisks: Array<{
    rank: number
    title: string
    portfolio: string
    financialImpact: string
    urgency: string
    executiveNote: string
  }>
  strategicImplications: string[]
  recommendedActions: Array<{
    priority: number
    action: string
    owner: string
    deadline: string
    rationale: string
  }>
  marketContext: string
  confidence: number
  keyMetrics: {
    overallRiskScore: number
    financialExposureAED: number
    criticalRisks: number
    risksRequiringBoardAttention: number
  }
  sourceReferences?: Array<{
    source: string
    type: 'internal' | 'external' | 'ai'
    detail: string
  }>
  generatedAt?: string
  generatedFor?: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const RISK_RATING_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: 'var(--risk-critical)', bg: 'rgba(255,59,59,0.1)', label: 'CRITICAL' },
  elevated: { color: 'var(--risk-high)', bg: 'rgba(255,140,0,0.1)', label: 'ELEVATED' },
  moderate: { color: 'var(--risk-medium)', bg: 'rgba(245,197,24,0.1)', label: 'MODERATE' },
  low: { color: 'var(--risk-low)', bg: 'rgba(34,197,94,0.1)', label: 'LOW' },
}

const URGENCY_COLORS: Record<string, string> = {
  immediate: 'var(--risk-critical)',
  '30-day': 'var(--risk-high)',
  '90-day': 'var(--risk-medium)',
}

const SOURCE_ICON: Record<string, React.ElementType> = {
  internal: Database,
  external: Globe,
  ai: Cpu,
}

const SOURCE_COLOR: Record<string, string> = {
  internal: 'var(--accent-primary)',
  external: 'var(--risk-medium)',
  ai: '#A855F7',
}

// ─── Gamma state type ─────────────────────────────────────────────────────────
type GammaState = 'idle' | 'generating' | 'copied' | 'error'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExecutiveBriefPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BriefResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gammaState, setGammaState] = useState<GammaState>('idle')
  const [gammaError, setGammaError] = useState<string | null>(null)

  const generateBrief = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setGammaState('idle')

    try {
      const res = await fetch('/api/executive-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risks: riskRegister,
          portfolioMetrics,
          portfolioState: internalSnapshot,
          timeframe: 'Q2 2026 — April 2026',
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate brief. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const createPresentation = async () => {
    if (!result) return
    setGammaState('generating')
    setGammaError(null)

    try {
      const res = await fetch('/api/gamma-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: result }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Copy to clipboard
      await navigator.clipboard.writeText(data.prompt)
      setGammaState('copied')

      // Open Gamma in a new tab
      window.open('https://gamma.app', '_blank', 'noopener,noreferrer')

      // Reset after 6 seconds
      setTimeout(() => setGammaState('idle'), 6000)
    } catch (err: unknown) {
      setGammaError(err instanceof Error ? err.message : 'Failed to generate presentation prompt')
      setGammaState('error')
    }
  }

  const ratingConfig = result
    ? RISK_RATING_CONFIG[result.riskRating] || RISK_RATING_CONFIG['elevated']
    : null

  return (
    <div className="space-y-6">

      {/* ── Generate Controls ─────────────────────────────────────────────── */}
      <Card accent glow>
        <CardBody>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ScrollText size={18} style={{ color: 'var(--accent-primary)' }} />
                <h2 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}>
                  Board-Level Executive Risk Brief
                </h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', maxWidth: '520px', lineHeight: 1.6 }}>
                AI-powered risk intelligence brief for Aldar Properties Board of Directors. Synthesizes all portfolio risks, financial exposures, cross-portfolio propagation, and strategic recommendations.
              </p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {['15 Risks Analyzed', '5 Portfolios', 'AED 2.35Bn Exposure', 'Q2 2026'].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-hover)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 flex-shrink-0 flex-wrap justify-end">
              {result && (
                <>
                  {/* Gamma Button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={createPresentation}
                    disabled={gammaState === 'generating'}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '9px',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      cursor: gammaState === 'generating' ? 'not-allowed' : 'pointer',
                      border: gammaState === 'copied'
                        ? '2px solid var(--risk-low)'
                        : '1px solid var(--border-color)',
                      backgroundColor: gammaState === 'copied'
                        ? 'rgba(34,197,94,0.1)'
                        : gammaState === 'generating'
                        ? 'var(--bg-secondary)'
                        : 'var(--bg-hover)',
                      color: gammaState === 'copied'
                        ? 'var(--risk-low)'
                        : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {gammaState === 'generating' && <Loader2 size={14} className="animate-spin" />}
                    {gammaState === 'copied' && <CheckCheck size={14} />}
                    {gammaState === 'idle' && <Presentation size={14} />}
                    {gammaState === 'error' && <Presentation size={14} />}
                    {gammaState === 'generating' ? 'Preparing...'
                      : gammaState === 'copied' ? 'Prompt Copied!'
                      : 'Create Board Presentation'}
                    {gammaState === 'idle' && (
                      <ExternalLink size={11} style={{ opacity: 0.6 }} />
                    )}
                  </motion.button>

                  <button
                    onClick={() => alert('PDF export available in production via print-to-PDF pipeline.')}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download size={15} />
                    Export PDF
                  </button>
                </>
              )}

              <button
                onClick={generateBrief}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
                style={{ minWidth: '200px', justifyContent: 'center' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating Brief...
                  </>
                ) : (
                  <>
                    <ScrollText size={16} />
                    Generate Executive Brief
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Gamma success message */}
          <AnimatePresence>
            {gammaState === 'copied' && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: '14px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <CheckCheck size={14} style={{ color: 'var(--risk-low)', flexShrink: 0 }} />
                <span style={{ color: 'var(--risk-low)', fontSize: '0.825rem', fontWeight: 600 }}>
                  Prompt copied to clipboard. Gamma has been opened — paste into the AI prompt field to generate your board presentation.
                </span>
              </motion.div>
            )}
            {gammaState === 'error' && gammaError && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: '14px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,59,59,0.08)',
                  border: '1px solid rgba(255,59,59,0.25)',
                  color: 'var(--risk-critical)',
                  fontSize: '0.8rem',
                }}
              >
                {gammaError}
              </motion.div>
            )}
          </AnimatePresence>
        </CardBody>
      </Card>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255,59,59,0.1)',
            border: '1px solid rgba(255,59,59,0.3)',
            color: 'var(--risk-critical)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '60px 20px' }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '3px solid var(--border-color)',
              borderTop: '3px solid var(--accent-primary)',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px',
            }}
          />
          <div style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
            AI Board Brief Generation in Progress
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem', maxWidth: '420px', margin: '0 auto' }}>
            Synthesizing risk register, live ERP signals, portfolio metrics, and cross-portfolio propagation into a board-ready brief...
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      )}

      {/* ── Brief Output ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >

            {/* Brief Header + Key Metrics */}
            <Card accent glow>
              <CardBody>
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {result.generatedFor}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                      Enterprise Risk Intelligence Brief
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {result.generatedAt
                        ? new Date(result.generatedAt).toLocaleString('en-AE', {
                            timeZone: 'Asia/Dubai',
                            dateStyle: 'long',
                            timeStyle: 'short',
                          })
                        : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ConfidenceBadge confidence={result.confidence} />
                    {ratingConfig && (
                      <div
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          backgroundColor: ratingConfig.bg,
                          border: `1px solid ${ratingConfig.color}40`,
                          color: ratingConfig.color,
                          fontSize: '0.875rem',
                          fontWeight: 800,
                          letterSpacing: '0.05em',
                        }}
                      >
                        {ratingConfig.label} RISK
                      </div>
                    )}
                  </div>
                </div>

                {result.keyMetrics && (
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    {[
                      { label: 'Risk Score', value: result.keyMetrics.overallRiskScore?.toString() || 'N/A', Icon: AlertTriangle },
                      { label: 'Financial Exposure', value: `AED ${(result.keyMetrics.financialExposureAED || 0).toLocaleString()}M`, Icon: TrendingUp },
                      { label: 'Critical Risks', value: (result.keyMetrics.criticalRisks || 0).toString(), Icon: Shield },
                      { label: 'Board-Level Risks', value: (result.keyMetrics.risksRequiringBoardAttention || 0).toString(), Icon: Target },
                    ].map((m) => (
                      <div
                        key={m.label}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '9px',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                          {m.label}
                        </div>
                        <div style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: 700 }}>
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Executive Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardBody>
                <p
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    lineHeight: 1.75,
                    fontWeight: 400,
                    borderLeft: '3px solid var(--accent-primary)',
                    paddingLeft: '16px',
                  }}
                >
                  {result.executiveSummary || result.summary}
                </p>
              </CardBody>
            </Card>

            {/* Business Impact + Cross-Portfolio Impact */}
            <div className="grid grid-cols-2 gap-5">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} style={{ color: 'var(--risk-high)' }} />
                    <CardTitle>Business Impact</CardTitle>
                  </div>
                </CardHeader>
                <CardBody>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                    {result.businessImpact || 'Business impact analysis not available.'}
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Network size={14} style={{ color: 'var(--accent-primary)' }} />
                    <CardTitle>Cross-Portfolio Propagation</CardTitle>
                  </div>
                </CardHeader>
                <CardBody>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                    {result.crossPortfolioImpact || 'Cross-portfolio analysis not available.'}
                  </p>
                </CardBody>
              </Card>
            </div>

            {/* Top Risks Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} style={{ color: 'var(--risk-high)' }} />
                  <CardTitle>Top Risks — Board Attention Required</CardTitle>
                </div>
              </CardHeader>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Risk Title</th>
                      <th>Portfolio</th>
                      <th>Financial Impact</th>
                      <th>Urgency</th>
                      <th>Executive Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.topRisks?.map((risk) => (
                      <tr key={risk.rank}>
                        <td>
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--accent-glow)',
                              color: 'var(--accent-primary)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {risk.rank}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '220px' }}>
                          {risk.title}
                        </td>
                        <td style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>{risk.portfolio}</td>
                        <td style={{ color: 'var(--risk-high)', fontWeight: 600 }}>{risk.financialImpact}</td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '5px',
                              backgroundColor: `${URGENCY_COLORS[risk.urgency] || 'var(--text-muted)'}18`,
                              color: URGENCY_COLORS[risk.urgency] || 'var(--text-muted)',
                              border: `1px solid ${URGENCY_COLORS[risk.urgency] || 'var(--text-muted)'}30`,
                              textTransform: 'uppercase',
                            }}
                          >
                            {risk.urgency}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: '240px' }}>
                          {risk.executiveNote}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Strategic Implications + Recommended Actions */}
            <div className="grid grid-cols-2 gap-5">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} style={{ color: 'var(--accent-primary)' }} />
                    <CardTitle>Strategic Implications</CardTitle>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  {result.strategicImplications?.map((impl, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <ChevronRight size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.5 }}>{impl}</p>
                    </motion.div>
                  ))}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target size={14} style={{ color: 'var(--accent-primary)' }} />
                    <CardTitle>Recommended Actions</CardTitle>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  {result.recommendedActions?.map((action, i) => (
                    <motion.div
                      key={action.priority}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '9px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderLeft: '3px solid var(--accent-primary)',
                      }}
                    >
                      <div className="flex items-start gap-2 mb-1.5">
                        <span
                          style={{
                            minWidth: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-glow)',
                            color: 'var(--accent-primary)',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {action.priority}
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.825rem', fontWeight: 600 }}>
                          {action.action}
                        </span>
                      </div>
                      <div className="flex gap-3 ml-7">
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                          Owner: <span style={{ color: 'var(--accent-primary)' }}>{action.owner}</span>
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                          By: {action.deadline}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '5px', marginLeft: '28px' }}>
                        {action.rationale}
                      </p>
                    </motion.div>
                  ))}
                </CardBody>
              </Card>
            </div>

            {/* Market Context */}
            <Card>
              <CardHeader>
                <CardTitle>Market Context — UAE & GCC</CardTitle>
              </CardHeader>
              <CardBody>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '16px' }}>
                  {result.marketContext}
                </p>
                <AIInsightBox
                  insight="This executive brief synthesizes Aldar's internal risk register, live ERP/CRM signals, and AI fusion analysis. All assessments are AI-generated and should be reviewed by the Risk Management team before formal board submission."
                  confidence={result.confidence}
                  source="Aldar AI Risk Engine — Executive Brief Module"
                />
              </CardBody>
            </Card>

            {/* Source Traceability */}
            {result.sourceReferences && result.sourceReferences.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Database size={14} style={{ color: 'var(--text-muted)' }} />
                    <CardTitle>Source Traceability</CardTitle>
                  </div>
                  <ConfidenceBadge confidence={result.confidence} />
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-3 gap-3">
                    {result.sourceReferences.map((src, i) => {
                      const Icon = SOURCE_ICON[src.type] || Database
                      const color = SOURCE_COLOR[src.type] || 'var(--text-muted)'
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '9px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: `1px solid ${color}25`,
                            borderTop: `2px solid ${color}`,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon size={13} style={{ color, flexShrink: 0 }} />
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color,
                              }}
                            >
                              {src.type}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '3px' }}>
                            {src.source}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', lineHeight: 1.4 }}>
                            {src.detail}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Gamma CTA (bottom) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)',
                border: '1px solid rgba(99,102,241,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '3px' }}>
                  Ready to present to the board?
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Generate a premium board presentation from this brief in one click using Gamma AI.
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={createPresentation}
                disabled={gammaState === 'generating'}
                style={{
                  padding: '10px 22px',
                  borderRadius: '9px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: gammaState === 'generating' ? 'not-allowed' : 'pointer',
                  border: gammaState === 'copied' ? '2px solid var(--risk-low)' : '1px solid rgba(99,102,241,0.5)',
                  background: gammaState === 'copied'
                    ? 'rgba(34,197,94,0.12)'
                    : 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(168,85,247,0.2) 100%)',
                  color: gammaState === 'copied' ? 'var(--risk-low)' : '#c4b5fd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                {gammaState === 'generating' && <Loader2 size={14} className="animate-spin" />}
                {gammaState === 'copied' && <CheckCheck size={14} />}
                {(gammaState === 'idle' || gammaState === 'error') && <Presentation size={14} />}
                {gammaState === 'generating' ? 'Preparing Presentation...'
                  : gammaState === 'copied' ? 'Prompt Copied — Paste in Gamma'
                  : 'Create Board Presentation'}
                {(gammaState === 'idle' || gammaState === 'error') && (
                  <ExternalLink size={12} style={{ opacity: 0.7 }} />
                )}
              </motion.button>
            </motion.div>

            {/* Footer */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div className="flex items-center gap-2">
                <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Generated {result.generatedAt
                    ? new Date(result.generatedAt).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })
                    : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ConfidenceBadge confidence={result.confidence} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  {result.generatedFor}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Copy size={13} style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Board Confidential — Not for distribution
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
