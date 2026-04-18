'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, Minus, Brain } from 'lucide-react'
import {
  riskRegister,
  portfolioMetrics,
  portfolioNames,
  kpiData,
  type Portfolio,
} from '@/lib/simulated-data'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrillDownView = 'risk_breakdown' | 'risk_list' | 'financial_breakdown' | 'trend_analysis'

interface Props {
  portfolioId: Portfolio
  view: DrillDownView
  color: string
  onClose: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PORTFOLIO_COLORS: Record<Portfolio, string> = {
  'real-estate': '#C9A84C',
  retail: '#4A9EFF',
  hospitality: '#A855F7',
  education: '#22C55E',
  facilities: '#FF6B6B',
}

const VIEW_TITLES: Record<DrillDownView, string> = {
  risk_breakdown: 'Risk Score Breakdown',
  risk_list: 'Critical & High Risks',
  financial_breakdown: 'Financial Exposure Analysis',
  trend_analysis: 'Risk Trend Analysis',
}

// ─── AI Insights per view / portfolio ─────────────────────────────────────────

const AI_INSIGHTS: Record<Portfolio, Record<DrillDownView, string>> = {
  'real-estate': {
    risk_breakdown: 'Score of 72/100 is primarily driven by pipeline cost overruns (AED 410M) and interest-rate sensitivity affecting off-plan demand. Operational risk dominates at 38% of total score.',
    risk_list: '3 high-severity risks are open — all linked to construction delivery. Saadiyat Lagoons critical path delay is the highest-priority item requiring CEO-level attention this quarter.',
    financial_breakdown: 'AED 1,640M gross exposure is concentrated in market (47%) and operational (31%) categories. Stress-testing shows a 200bps rate shock could increase exposure to AED 2,160M.',
    trend_analysis: 'Score has risen +24% over 12 months, driven by pipeline growth outpacing risk controls. Trajectory is concerning — recommend a formal risk appetite review before Q3 launches.',
  },
  retail: {
    risk_breakdown: 'Score of 58/100 reflects anchor tenant concentration at Yas Mall. Single-tenant dependency contributes ~40% of total retail risk score.',
    risk_list: '1 high risk open: anchor tenant financial distress risk flagged following Q4 covenant deterioration. Early action window closes in ~60 days.',
    financial_breakdown: 'AED 188M exposure is weighted toward credit risk (48%) from tenant covenant vulnerabilities. Operational exposure linked to footfall-linked revenue clauses is the secondary driver.',
    trend_analysis: 'Retail score is broadly stable but creeping upward. Community retail vacancy uptick (+2.3pp in 6 months) is the leading indicator to watch for further deterioration.',
  },
  hospitality: {
    risk_breakdown: 'Score of 51/100 is moderate, but event-revenue dependency (28% of annual revenue) creates high concentration risk. Saudi competition intensifying from 2027 is a rising factor.',
    risk_list: 'No critical risks open. 3 medium risks — all manageable with current mitigations in place. RevPAR trajectory in H2 2026 is the key watch item.',
    financial_breakdown: 'AED 180M exposure with balanced distribution across demand shock (42%) and market (33%) categories. EBITDA margin compression is the primary financial concern.',
    trend_analysis: 'Hospitality score is gradually increasing alongside UAE tourism sector growth — both risk and reward are rising. Board should clarify strategic risk appetite for the sector.',
  },
  education: {
    risk_breakdown: 'Lowest portfolio score at 38/100 — structurally resilient due to community enrollment linkage and ADEK regulatory framework providing stable demand base.',
    risk_list: '1 high risk: ADEK compliance gap identified in 2 schools. Remediation plan approved but execution is Q3 2026 — monitor monthly.',
    financial_breakdown: 'AED 77M exposure is the smallest portfolio. Regulatory risk dominates (55%) — driven entirely by ADEK compliance exposure. Low market and operational risk.',
    trend_analysis: 'Score has been stable for 12 months, reflecting the defensive characteristics of education assets. No material change drivers anticipated in near term.',
  },
  facilities: {
    risk_breakdown: 'Score of 46/100 conceals a rising cyber risk component from smart building IoT integration — this is the fastest-growing risk dimension and requires urgent attention.',
    risk_list: '1 high risk: FM outsourcing performance decline (KPIs missed Q3/Q4 2025). Vendor management intervention required. Cyber risk approaching high threshold.',
    financial_breakdown: 'AED 263M exposure driven by operational (44%) and cyber (29%) categories. The digital transformation programme increases short-term cyber exposure before reducing it.',
    trend_analysis: 'Facilities score is trending upward driven by IoT expansion. Without cyber controls investment, score could reach 60+ within 2 years — triggering board escalation threshold.',
  },
}

// ─── Risk score breakdown data (derived from portfolioMetrics + riskRegister) ─

function getRiskBreakdownByBusiness(portfolioId: Portfolio) {
  const m = portfolioMetrics[portfolioId]
  const score = m.riskScore
  // Simulate business-unit breakdown within portfolio
  const splits: Record<Portfolio, { unit: string; pct: number; driver: string }[]> = {
    'real-estate': [
      { unit: 'Development Pipeline', pct: 38, driver: 'Cost overruns + schedule delays' },
      { unit: 'Investment Properties', pct: 22, driver: 'Cap rate / valuation pressure' },
      { unit: 'Off-Plan Sales', pct: 25, driver: 'Demand & interest rate sensitivity' },
      { unit: 'Land Bank', pct: 15, driver: 'Regulatory & zoning risk' },
    ],
    retail: [
      { unit: 'Yas Mall', pct: 42, driver: 'Anchor tenant concentration' },
      { unit: 'Abu Dhabi Mall', pct: 28, driver: 'Footfall & turnover rent exposure' },
      { unit: 'Community Retail', pct: 18, driver: 'Vacancy uptick' },
      { unit: 'Al Jimi Mall', pct: 12, driver: 'Repositioning execution risk' },
    ],
    hospitality: [
      { unit: 'Yas Island Hotels', pct: 45, driver: 'Event-revenue dependency' },
      { unit: 'City Hospitality', pct: 30, driver: 'Corporate demand volatility' },
      { unit: 'Leisure & Tourism', pct: 25, driver: 'Saudi competition / demand shift' },
    ],
    education: [
      { unit: 'GEMS Schools', pct: 55, driver: 'ADEK compliance exposure' },
      { unit: 'Community Schools', pct: 30, driver: 'Enrollment yield risk' },
      { unit: 'Vocational', pct: 15, driver: 'Demand uncertainty' },
    ],
    facilities: [
      { unit: 'Smart Buildings', pct: 44, driver: 'Cyber / IoT attack surface' },
      { unit: 'FM Outsourcing', pct: 35, driver: 'Vendor performance SLA breach' },
      { unit: 'Energy & Utilities', pct: 21, driver: 'Regulatory compliance' },
    ],
  }
  return { score, splits: splits[portfolioId] }
}

function getFinancialBreakdown(portfolioId: Portfolio) {
  const m = portfolioMetrics[portfolioId]
  const total = m.financialExposure
  const byType: Record<Portfolio, { type: string; pct: number; color: string }[]> = {
    'real-estate': [
      { type: 'Market Risk', pct: 47, color: '#C9A84C' },
      { type: 'Operational', pct: 31, color: '#A855F7' },
      { type: 'Financial', pct: 22, color: '#22C55E' },
    ],
    retail: [
      { type: 'Credit Risk', pct: 48, color: '#4A9EFF' },
      { type: 'Market Risk', pct: 30, color: '#C9A84C' },
      { type: 'Operational', pct: 22, color: '#A855F7' },
    ],
    hospitality: [
      { type: 'Demand Shock', pct: 42, color: '#FF6B6B' },
      { type: 'Market Risk', pct: 33, color: '#C9A84C' },
      { type: 'Operational', pct: 25, color: '#A855F7' },
    ],
    education: [
      { type: 'Regulatory', pct: 55, color: '#F97316' },
      { type: 'Operational', pct: 28, color: '#A855F7' },
      { type: 'Market Risk', pct: 17, color: '#C9A84C' },
    ],
    facilities: [
      { type: 'Operational', pct: 44, color: '#A855F7' },
      { type: 'Cyber Risk', pct: 29, color: '#FF6B6B' },
      { type: 'Regulatory', pct: 27, color: '#F97316' },
    ],
  }
  return { total, splits: byType[portfolioId] }
}

function getTrendDrivers(portfolioId: Portfolio): string[] {
  const drivers: Record<Portfolio, string[]> = {
    'real-estate': ['Pipeline cost overruns +AED 93M YoY', 'Interest rate sensitivity (200bps scenario)', 'Off-plan demand softening in Q1 2026'],
    retail: ['Anchor tenant covenant deterioration (Q4 2025)', 'Community retail vacancy +2.3pp in 6 months', 'Turnover rent clause exposure crystallising'],
    hospitality: ['Saudi competition increasing (Vision 2030 hotel pipeline)', 'Event revenue dependency increasing to 28%', 'Corporate long-stay demand gap emerging'],
    education: ['ADEK compliance framework update (Jan 2026)', 'Community enrollment below projection in 2 schools', 'Vocational demand uncertainty due to AI automation'],
    facilities: ['IoT device fleet expanded +340 endpoints', 'FM outsourcing SLA breaches Q3 & Q4 2025', 'Cyber threat landscape intensifying regionally'],
  }
  return drivers[portfolioId]
}

// ─── Sub-views ────────────────────────────────────────────────────────────────

function RiskBreakdownView({ portfolioId, color }: { portfolioId: Portfolio; color: string }) {
  const { score, splits } = getRiskBreakdownByBusiness(portfolioId)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Score header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '2.4rem', fontWeight: 800, color }}>{score}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>/100</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '4px' }}>Composite Risk Score</span>
      </div>

      {/* Business breakdown */}
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Contribution by Business Unit
        </div>
        {splits.map((s) => (
          <div key={s.unit} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>{s.unit}</span>
              <span style={{ color, fontSize: '0.75rem', fontWeight: 700 }}>{s.pct}%</span>
            </div>
            <div style={{ height: '5px', borderRadius: '3px', backgroundColor: 'var(--border-color)' }}>
              <div style={{ height: '100%', width: `${s.pct}%`, borderRadius: '3px', backgroundColor: color, opacity: 0.75 }} />
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.63rem', marginTop: '2px' }}>{s.driver}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RiskListView({ portfolioId, color }: { portfolioId: Portfolio; color: string }) {
  const risks = riskRegister
    .filter((r) => r.portfolio === portfolioId && (r.score >= 10))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const OWNERS: Record<string, string> = {
    'real-estate': 'Ahmed Al Mansoori', retail: 'Fatima Al Hashimi',
    hospitality: 'Khalid Al Rumaithi', education: 'Sara Al Dhaheri', facilities: 'Mohammed Al Zaabi',
  }

  if (risks.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        No critical or high risks currently open for this portfolio.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        High Severity Risks — {risks.length} Open
      </div>
      {risks.map((r) => {
        const sev = r.score >= 16 ? 'Critical' : r.score >= 10 ? 'High' : 'Medium'
        const sevColor = r.score >= 16 ? 'var(--risk-critical)' : 'var(--risk-high)'
        return (
          <div key={r.id} style={{
            padding: '10px 12px', borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.3 }}>
                {r.title || r.category}
              </span>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
                backgroundColor: r.score >= 16 ? 'rgba(255,59,59,0.12)' : 'rgba(239,68,68,0.12)',
                color: sevColor, flexShrink: 0,
              }}>{sev}</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.67rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>BU:</span> {portfolioNames[portfolioId]}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.67rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Score:</span> {r.score}/25
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.67rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Owner:</span> {OWNERS[portfolioId]}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.67rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>AED:</span> {r.financialImpact}M
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FinancialBreakdownView({ portfolioId, color }: { portfolioId: Portfolio; color: string }) {
  const { total, splits } = getFinancialBreakdown(portfolioId)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Total */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '2rem', fontWeight: 800, color }}>AED {total.toLocaleString()}M</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Gross risk-adjusted exposure</span>
      </div>

      {/* By risk type */}
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Exposure by Risk Type
        </div>
        {splits.map((s) => {
          const aed = Math.round((s.pct / 100) * total)
          return (
            <div key={s.type} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>{s.type}</span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>AED {aed}M</span>
                  <span style={{ color: s.color, fontSize: '0.75rem', fontWeight: 700, minWidth: '36px', textAlign: 'right' }}>{s.pct}%</span>
                </div>
              </div>
              <div style={{ height: '5px', borderRadius: '3px', backgroundColor: 'var(--border-color)' }}>
                <div style={{ height: '100%', width: `${s.pct}%`, borderRadius: '3px', backgroundColor: s.color, opacity: 0.7 }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Stress note */}
      <div style={{
        padding: '8px 10px', borderRadius: '7px',
        backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
        fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5,
      }}>
        <span style={{ color: 'var(--risk-high)', fontWeight: 700 }}>Stress scenario: </span>
        200bps rate shock would increase total exposure by ~32% to AED {Math.round(total * 1.32).toLocaleString()}M.
      </div>
    </div>
  )
}

function TrendAnalysisView({ portfolioId, color }: { portfolioId: Portfolio; color: string }) {
  const months = kpiData.months
  const scores = kpiData.portfolioRiskScores[portfolioId]
  const drivers = getTrendDrivers(portfolioId)
  const m = portfolioMetrics[portfolioId]

  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1
  const H = 80

  const trendDir = m.trend
  const TrendIcon = trendDir === 'increasing' ? TrendingUp : trendDir === 'decreasing' ? TrendingDown : Minus
  const trendColor = trendDir === 'increasing' ? 'var(--risk-high)' : trendDir === 'decreasing' ? 'var(--risk-low)' : 'var(--text-muted)'

  // Build SVG path
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * 280
    const y = H - ((s - min) / range) * (H - 10)
    return `${x},${y}`
  })
  const pathD = `M ${pts.join(' L ')}`
  const fillD = `M 0,${H} L ${pts.join(' L ')} L 280,${H} Z`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Trend badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendIcon size={18} style={{ color: trendColor }} />
        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: trendColor, textTransform: 'capitalize' }}>{trendDir}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>12-month trajectory</span>
      </div>

      {/* Sparkline chart */}
      <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
          Risk Score — Last 12 Months
        </div>
        <svg viewBox={`0 0 280 ${H + 12}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1="0" x2="280" y1={H - t * (H - 10)} y2={H - t * (H - 10)}
              stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3,3" />
          ))}
          {/* Fill area */}
          <path d={fillD} fill={color} fillOpacity={0.08} />
          {/* Line */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Dots */}
          {scores.map((s, i) => {
            const x = (i / (scores.length - 1)) * 280
            const y = H - ((s - min) / range) * (H - 10)
            return <circle key={i} cx={x} cy={y} r="3" fill={color} />
          })}
          {/* Month labels (every 3rd) */}
          {months.map((m, i) => i % 3 === 0 && (
            <text key={i} x={(i / (months.length - 1)) * 280} y={H + 11} textAnchor="middle"
              fontSize="7" fill="var(--text-muted)">{m}</text>
          ))}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>Low: {min}</span>
          <span style={{ color, fontSize: '0.6rem', fontWeight: 700 }}>Current: {scores[scores.length - 1]}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>High: {max}</span>
        </div>
      </div>

      {/* Drivers */}
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Increase Driven by
        </div>
        {drivers.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', marginBottom: '6px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: color, flexShrink: 0, marginTop: '5px' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.73rem', lineHeight: 1.4 }}>{d}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── AI Insight Box ───────────────────────────────────────────────────────────

function AiInsightBar({ text, color }: { text: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '8px',
      padding: '10px 12px', borderRadius: '8px',
      backgroundColor: `${color}0D`, border: `1px solid ${color}30`,
    }}>
      <Brain size={13} style={{ color, flexShrink: 0, marginTop: '2px' }} />
      <div>
        <div style={{ color, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '3px' }}>
          AI INSIGHT
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', lineHeight: 1.5 }}>{text}</div>
      </div>
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function PortfolioDrillDownPanel({ portfolioId, view, color, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  const aiInsight = AI_INSIGHTS[portfolioId]?.[view] ?? ''
  const pColor = PORTFOLIO_COLORS[portfolioId] || color

  return (
    <AnimatePresence>
      {/* Overlay for mobile full-screen */}
      <motion.div
        ref={overlayRef}
        onClick={handleOverlayClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          /* desktop: dim bg; mobile: full opaque */
          backgroundColor: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'flex-end',
        }}
      >
        {/* Panel */}
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            /* Desktop: right side panel */
            top: 0,
            right: 0,
            width: 'min(420px, 100vw)',
            height: '100dvh',
            backgroundColor: 'var(--bg-secondary)',
            borderLeft: `2px solid ${pColor}50`,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 51,
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 18px', borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            position: 'sticky', top: 0, zIndex: 2,
          }}>
            <div>
              <div style={{ color: pColor, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>
                {portfolioNames[portfolioId]}
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700 }}>
                {VIEW_TITLES[view]}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '28px', height: '28px', borderRadius: '6px',
                backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            {/* AI Insight — always at top */}
            <AiInsightBar text={aiInsight} color={pColor} />

            {/* View content */}
            {view === 'risk_breakdown' && <RiskBreakdownView portfolioId={portfolioId} color={pColor} />}
            {view === 'risk_list' && <RiskListView portfolioId={portfolioId} color={pColor} />}
            {view === 'financial_breakdown' && <FinancialBreakdownView portfolioId={portfolioId} color={pColor} />}
            {view === 'trend_analysis' && <TrendAnalysisView portfolioId={portfolioId} color={pColor} />}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
