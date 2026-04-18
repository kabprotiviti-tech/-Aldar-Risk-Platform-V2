'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ChevronRight,
  Zap,
  Activity,
  BarChart3,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { RiskBadge, TrendBadge } from '@/components/ui/Badge'
import { AIInsightBox } from '@/components/ui/AIInsightBox'
import { RiskDrillDownPanel } from '@/components/RiskDrillDownPanel'
import { PortfolioDrillDownPanel, type DrillDownView } from '@/components/PortfolioDrillDownPanel'
import { FinancialCalculationPanel, ViewCalcButton, type FinancialCalcContext } from '@/components/FinancialCalculationPanel'
import { PROPAGATION_EXPLANATIONS, CURRENT_SIGNALS, DERIVED_STATE, PROPAGATED_METRICS } from '@/lib/riskPropagationEngine'
import {
  riskRegister,
  portfolioMetrics,
  portfolioNames,
  type Portfolio,
  type Risk,
} from '@/lib/simulated-data'
import {
  portfolioProfiles,
  PORTFOLIO_KEYS,
  type PortfolioKey,
  type RiskLevel,
  type RiskCategory,
  type EnterpriseRisk,
} from '@/lib/portfolioData'
import type { BusinessImpactResult } from '@/app/api/business-impact/route'

// ─── Constants ────────────────────────────────────────────────────────────────

type SortKey = 'score' | 'likelihood' | 'impact' | 'financialImpact'

const PORTFOLIO_COLORS: Record<Portfolio, string> = {
  'real-estate': '#C9A84C',
  retail: '#4A9EFF',
  hospitality: '#A855F7',
  education: '#22C55E',
  facilities: '#FF6B6B',
}

const PORTFOLIOS: Portfolio[] = ['real-estate', 'retail', 'hospitality', 'education', 'facilities']

const LEVEL_COLORS: Record<RiskLevel, string> = {
  high: 'var(--risk-high)',
  medium: 'var(--risk-medium)',
  low: 'var(--risk-low)',
}

const LEVEL_BG: Record<RiskLevel, string> = {
  high: 'rgba(239,68,68,0.12)',
  medium: 'rgba(245,158,11,0.12)',
  low: 'rgba(34,197,94,0.12)',
}

const RADAR_DIMENSIONS = ['Market Risk', 'Credit Risk', 'Operational', 'Regulatory', 'Cyber Risk', 'ESG']
const CAT_LABELS: Record<RiskCategory, string> = {
  demand: 'Demand',
  market: 'Market',
  operational: 'Operational',
  financial: 'Financial',
}
const CAT_COLORS: Record<RiskCategory, string> = {
  demand: '#4A9EFF',
  market: '#C9A84C',
  operational: '#A855F7',
  financial: '#22C55E',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRadarData(portfolio: Portfolio) {
  const risks = riskRegister.filter((r) => r.portfolio === portfolio)
  const dims: Record<string, number> = { 'Market Risk': 0, 'Credit Risk': 0, 'Operational': 0, 'Regulatory': 0, 'Cyber Risk': 0, 'ESG': 0 }
  risks.forEach((r) => {
    const c = r.category
    if (c.includes('Market') || c.includes('Demand')) dims['Market Risk'] += r.score
    else if (c.includes('Credit') || c.includes('Revenue')) dims['Credit Risk'] += r.score
    else if (c.includes('Operational') || c.includes('Cost') || c.includes('Concentration')) dims['Operational'] += r.score
    else if (c.includes('Regulatory') || c.includes('Compliance')) dims['Regulatory'] += r.score
    else if (c.includes('Cyber') || c.includes('Technology')) dims['Cyber Risk'] += r.score
    else if (c.includes('ESG') || c.includes('Geopolitical')) dims['ESG'] += r.score
    else dims['Operational'] += r.score
  })
  return RADAR_DIMENSIONS.map((dim) => ({ dimension: dim, value: Math.min(100, Math.round((dims[dim] / 25) * 100)) }))
}

function getSeverity(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 16) return 'critical'
  if (score >= 10) return 'high'
  if (score >= 6) return 'medium'
  return 'low'
}

function formatRevenue(v: number) {
  if (v >= 1_000_000_000) return `AED ${(v / 1_000_000_000).toFixed(1)}Bn`
  return `AED ${(v / 1_000_000).toFixed(0)}M`
}

// ─── Trend icon ───────────────────────────────────────────────────────────────
function TrendIcon({ trend }: { trend: 'increasing' | 'stable' | 'decreasing' }) {
  if (trend === 'increasing')
    return <TrendingUp size={13} style={{ color: 'var(--risk-high)' }} />
  if (trend === 'decreasing')
    return <TrendingDown size={13} style={{ color: 'var(--risk-low)' }} />
  return <Minus size={13} style={{ color: 'var(--text-muted)' }} />
}

// ─── Enterprise Portfolio Card ────────────────────────────────────────────────
function EnterpriseCard({
  portfolioId,
  selected,
  onClick,
}: {
  portfolioId: PortfolioKey
  selected: boolean
  onClick: () => void
}) {
  const p = portfolioProfiles[portfolioId]
  const color = p.color
  const highPct = (p.breakdown.high / p.totalRisks) * 100
  const medPct = (p.breakdown.medium / p.totalRisks) * 100
  const lowPct = (p.breakdown.low / p.totalRisks) * 100

  const levelLabel =
    p.overallLevel === 'critical' ? 'CRITICAL'
    : p.overallLevel === 'high' ? 'HIGH'
    : p.overallLevel === 'medium' ? 'MEDIUM'
    : 'LOW'

  const levelColor =
    p.overallLevel === 'critical' ? 'var(--risk-critical)'
    : p.overallLevel === 'high' ? 'var(--risk-high)'
    : p.overallLevel === 'medium' ? 'var(--risk-medium)'
    : 'var(--risk-low)'

  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: selected ? `2px solid ${color}` : '1px solid var(--border-color)',
        borderRadius: '14px',
        padding: '18px',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease',
        boxShadow: selected ? `0 0 20px ${color}25` : undefined,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: color,
              marginRight: '8px',
            }}
          />
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.875rem' }}>
            {p.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: levelColor,
              backgroundColor: `${levelColor}18`,
              padding: '2px 7px',
              borderRadius: '4px',
            }}
          >
            {levelLabel}
          </span>
          <TrendIcon trend={p.trend} />
        </div>
      </div>

      {/* Total risks + assets */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
            Total Risks
          </div>
          <div style={{ color: color, fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 }}>
            {p.totalRisks}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
            Assets
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 }}>
            {p.assets}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
            Revenue
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.2, marginTop: '3px' }}>
            {formatRevenue(p.revenue)}
          </div>
        </div>
      </div>

      {/* Risk breakdown stacked bar */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', gap: '2px' }}>
          <div style={{ width: `${highPct}%`, backgroundColor: 'var(--risk-high)', borderRadius: '4px 0 0 4px' }} />
          <div style={{ width: `${medPct}%`, backgroundColor: 'var(--risk-medium)' }} />
          <div style={{ width: `${lowPct}%`, backgroundColor: 'var(--risk-low)', borderRadius: '0 4px 4px 0' }} />
        </div>
      </div>

      {/* Count breakdown */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {(['high', 'medium', 'low'] as RiskLevel[]).map((lvl) => (
          <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: LEVEL_COLORS[lvl] }} />
            <span style={{ color: LEVEL_COLORS[lvl], fontSize: '0.72rem', fontWeight: 700 }}>
              {p.breakdown[lvl]}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
              {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
            </span>
          </div>
        ))}
      </div>

      {/* Click hint */}
      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
          {selected ? 'Drill-down active' : 'Click to drill down'}
        </span>
        <ChevronRight size={11} style={{ color: 'var(--text-muted)' }} />
      </div>
    </motion.div>
  )
}

// ─── Category bar component ───────────────────────────────────────────────────
function CategoryBar({ cat, breakdown, totalRisks }: {
  cat: RiskCategory
  breakdown: { total: number; high: number; medium: number; low: number }
  totalRisks: number
}) {
  const pct = (breakdown.total / totalRisks) * 100
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: CAT_COLORS[cat] }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>
            {CAT_LABELS[cat]}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: 'var(--risk-high)', fontSize: '0.65rem', fontWeight: 600 }}>{breakdown.high}H</span>
          <span style={{ color: 'var(--risk-medium)', fontSize: '0.65rem', fontWeight: 600 }}>{breakdown.medium}M</span>
          <span style={{ color: 'var(--risk-low)', fontSize: '0.65rem', fontWeight: 600 }}>{breakdown.low}L</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{breakdown.total}</span>
        </div>
      </div>
      <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: CAT_COLORS[cat],
            borderRadius: '3px',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  )
}

// ─── Top risks panel ──────────────────────────────────────────────────────────
function TopRisksPanel({ risks, color }: { risks: EnterpriseRisk[]; color: string }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const byCategory = risks.reduce<Record<RiskCategory, EnterpriseRisk[]>>(
    (acc, r) => { acc[r.category].push(r); return acc },
    { demand: [], market: [], operational: [], financial: [] }
  )

  return (
    <div>
      {(Object.entries(byCategory) as [RiskCategory, EnterpriseRisk[]][])
        .filter(([, arr]) => arr.length > 0)
        .map(([cat, arr]) => (
          <div key={cat} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: CAT_COLORS[cat] }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {CAT_LABELS[cat]}
              </span>
            </div>
            {arr.map((r) => (
              <div
                key={r.id}
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                style={{
                  padding: '8px 10px',
                  marginBottom: '4px',
                  borderRadius: '7px',
                  backgroundColor: LEVEL_BG[r.level],
                  border: `1px solid ${LEVEL_COLORS[r.level]}25`,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: '8px' }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.3 }}>
                      {r.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: LEVEL_COLORS[r.level],
                      backgroundColor: LEVEL_BG[r.level],
                      padding: '1px 6px',
                      borderRadius: '3px',
                      textTransform: 'uppercase',
                    }}>
                      {r.level}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                      {r.score}/25
                    </span>
                    <TrendIcon trend={r.trend} />
                  </div>
                </div>
                <AnimatePresence>
                  {expanded === r.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '8px', lineHeight: 1.5 }}>
                        {r.description}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                          Financial Exposure: <strong style={{ color: 'var(--text-secondary)' }}>AED {r.financialImpact}M</strong>
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                          Category: <strong style={{ color: CAT_COLORS[r.category] }}>{CAT_LABELS[r.category]}</strong>
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}

// ─── Cause-Effect chain ───────────────────────────────────────────────────────
const CAUSE_EFFECT_CHAIN = [
  { cause: 'Tourism Demand Decline', effect: 'Hospitality Occupancy ↓', severity: 'high', portfolio: 'hospitality' },
  { cause: 'Hospitality Occupancy ↓', effect: 'Retail Footfall Contraction', severity: 'medium', portfolio: 'retail' },
  { cause: 'Retail Footfall ↓', effect: 'Tenant Stress Index Escalation', severity: 'medium', portfolio: 'retail' },
  { cause: 'Interest Rate Rise', effect: 'Off-Plan Sales Conversion ↓', severity: 'high', portfolio: 'real-estate' },
  { cause: 'Development Delays', effect: 'FM Revenue Pipeline Slippage', severity: 'medium', portfolio: 'facilities' },
  { cause: 'Expat Churn', effect: 'School Enrollment Shortfall', severity: 'low', portfolio: 'education' },
] as const

function CauseEffectChain({ activePortfolio }: { activePortfolio: PortfolioKey }) {
  const relevant = CAUSE_EFFECT_CHAIN.filter((l) => l.portfolio === activePortfolio)
  const rest = CAUSE_EFFECT_CHAIN.filter((l) => l.portfolio !== activePortfolio).slice(0, 3)
  const all = [...relevant, ...rest].slice(0, 5)

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {all.map((link, i) => (
          <React.Fragment key={i}>
            <div
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                backgroundColor: link.severity === 'high' ? 'rgba(239,68,68,0.1)' : link.severity === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                border: `1px solid ${link.severity === 'high' ? 'rgba(239,68,68,0.3)' : link.severity === 'medium' ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              {link.cause}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {PORTFOLIO_COLORS[link.portfolio as Portfolio] ? portfolioProfiles[link.portfolio as PortfolioKey].name : ''}
              </div>
            </div>
            <div
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              {link.effect}
            </div>
            {i < all.length - 1 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', padding: '0 4px' }}>·</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// ─── Drill-Down Panel ─────────────────────────────────────────────────────────
function DrillDownPanel({ portfolioId, onViewCalc }: { portfolioId: PortfolioKey; onViewCalc?: (ctx: FinancialCalcContext) => void }) {
  const p = portfolioProfiles[portfolioId]
  const color = p.color
  const [impact, setImpact] = useState<BusinessImpactResult | null>(null)
  const [loadingImpact, setLoadingImpact] = useState(false)
  const fetchedFor = useRef<string>('')

  const fetchImpact = useCallback(async (id: PortfolioKey) => {
    if (fetchedFor.current === id) return
    fetchedFor.current = id
    setLoadingImpact(true)
    try {
      const res = await fetch('/api/business-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId: id }),
      })
      const data = await res.json()
      if (data.result) setImpact(data.result)
    } catch {
      // fallback: use static data from profile
    } finally {
      setLoadingImpact(false)
    }
  }, [])

  useEffect(() => {
    fetchImpact(portfolioId)
  }, [portfolioId, fetchImpact])

  const cats: RiskCategory[] = ['demand', 'market', 'operational', 'financial']

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25 }}
    >
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={14} style={{ color }} />
            <CardTitle>{p.name} — Enterprise Risk Drill-Down</CardTitle>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              {p.totalRisks} risks · {p.breakdown.high} High · {p.breakdown.medium} Medium · {p.breakdown.low} Low
            </span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: p.trend === 'increasing' ? 'var(--risk-high)' : p.trend === 'decreasing' ? 'var(--risk-low)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '3px'
            }}>
              <TrendIcon trend={p.trend} />
              {p.trend.charAt(0).toUpperCase() + p.trend.slice(1)}
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-6">

            {/* Column 1: Risk by Category */}
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>
                Risk by Category
              </div>
              {cats.map((cat) => (
                <CategoryBar
                  key={cat}
                  cat={cat}
                  breakdown={p.categoryBreakdown[cat]}
                  totalRisks={p.totalRisks}
                />
              ))}

              {/* Business Impact */}
              <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Revenue at Risk
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--risk-high)', fontSize: '1.4rem', fontWeight: 700 }}>
                    AED {impact?.revenueAtRisk.low ?? p.revenueAtRisk.low}M
                  </span>
                  <ViewCalcButton onClick={() => onViewCalc?.({ type: 'revenue_at_risk', portfolioId, impactScore: Math.round((p.revenueAtRisk.high / (p.revenue / 1_000_000)) * 100 / 0.14), amplified: false, value: impact?.revenueAtRisk.high ?? p.revenueAtRisk.high })} />
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  to <strong style={{ color: 'var(--risk-high)' }}>AED {impact?.revenueAtRisk.high ?? p.revenueAtRisk.high}M</strong> scenario range
                </div>
                <div style={{ marginTop: '8px', height: '4px', backgroundColor: 'var(--bg-card)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${((p.revenueAtRisk.high / (p.revenue / 1_000_000)) * 100).toFixed(0)}%`, height: '100%', backgroundColor: color, borderRadius: '2px' }} />
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '4px' }}>
                  {((p.revenueAtRisk.high / (p.revenue / 1_000_000)) * 100).toFixed(1)}% of annual revenue
                </div>
              </div>
            </div>

            {/* Column 2+3: Top 10 Risks */}
            <div className="col-span-2">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>
                Top 10 Risks by Score — Grouped by Category (click to expand)
              </div>
              <TopRisksPanel risks={p.topRisks} color={color} />
            </div>
          </div>

          {/* AI Business Insight */}
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
              AI Business Impact Assessment
            </div>
            {loadingImpact ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px' }}>
                <Activity size={14} className="animate-spin" style={{ color: 'var(--accent-primary)', animationDuration: '1s' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Generating AI impact analysis for {p.name}...
                </span>
              </div>
            ) : impact ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <AIInsightBox
                    insight={impact.aiInsight}
                    confidence={impact.confidence}
                    source={`AI Business Impact Engine — ${p.name}`}
                  />
                  {impact.keyActions.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Recommended Actions
                      </div>
                      {impact.keyActions.map((a, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                            <span style={{ color, fontSize: '0.6rem', fontWeight: 700 }}>{i + 1}</span>
                          </div>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.5 }}>{a}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Watch Indicators
                  </div>
                  {impact.watchIndicators.map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px', padding: '7px 10px', borderRadius: '7px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <AlertTriangle size={11} style={{ color: 'var(--risk-medium)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <AIInsightBox
                insight={`${p.name} portfolio has ${p.totalRisks} active risks with ${p.breakdown.high} high-severity items. Revenue at risk ranges AED ${p.revenueAtRisk.low}M–${p.revenueAtRisk.high}M. Top risk categories: ${['demand', 'market', 'operational', 'financial'].sort((a, b) => p.categoryBreakdown[b as RiskCategory].high - p.categoryBreakdown[a as RiskCategory].high).slice(0, 2).join(' and ')} require priority management attention.`}
                confidence={0.78}
                source={`Portfolio Risk Engine — ${p.name} (static)`}
              />
            )}
          </div>

          {/* Cause-Effect Chain */}
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Cross-Portfolio Risk Propagation Chain
            </div>
            <CauseEffectChain activePortfolio={portfolioId} />
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}

// ─── Risk Register Row ────────────────────────────────────────────────────────
function RiskRow({ risk, expanded, onToggle }: { risk: Risk; expanded: boolean; onToggle: () => void }) {
  const severity = getSeverity(risk.score)
  return (
    <>
      <tr onClick={onToggle} style={{ cursor: 'pointer' }} className="hover:bg-hover-theme transition-colors">
        <td className="px-4 py-3">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'monospace' }}>{risk.id}</div>
        </td>
        <td className="px-4 py-3">
          <div style={{ color: 'var(--text-primary)', fontSize: '0.825rem', fontWeight: 500 }}>{risk.title}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{risk.category}</div>
        </td>
        <td className="px-4 py-3"><RiskBadge severity={severity} /></td>
        <td className="px-4 py-3 text-center"><span style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>{risk.likelihood}</span></td>
        <td className="px-4 py-3 text-center"><span style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>{risk.impact}</span></td>
        <td className="px-4 py-3 text-center">
          <span style={{
            color: risk.score >= 16 ? 'var(--risk-critical)' : risk.score >= 10 ? 'var(--risk-high)' : risk.score >= 6 ? 'var(--risk-medium)' : 'var(--risk-low)',
            fontWeight: 700, fontSize: '0.875rem',
          }}>{risk.score}</span>
        </td>
        <td className="px-4 py-3"><TrendBadge trend={risk.trend} /></td>
        <td className="px-4 py-3"><span style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>AED {risk.financialImpact}M</span></td>
        <td className="px-4 py-3"><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{risk.owner}</span></td>
        <td className="px-4 py-3">
          {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={10} style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-hover)', borderTop: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '12px', lineHeight: 1.6 }}>{risk.description}</p>
              <AIInsightBox insight={risk.aiInsight} confidence={0.84} compact />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Cell zone helpers ────────────────────────────────────────────────────────
function cellBg(score: number) {
  if (score >= 15) return 'rgba(255,59,59,0.16)'
  if (score >= 10) return 'rgba(255,140,0,0.13)'
  if (score >= 5)  return 'rgba(245,197,24,0.11)'
  return 'rgba(34,197,94,0.08)'
}
function cellBorder(score: number) {
  if (score >= 15) return 'rgba(255,59,59,0.32)'
  if (score >= 10) return 'rgba(255,140,0,0.28)'
  if (score >= 5)  return 'rgba(245,197,24,0.26)'
  return 'rgba(34,197,94,0.2)'
}
function scoreSevColor(score: number) {
  if (score >= 16) return 'var(--risk-critical)'
  if (score >= 10) return 'var(--risk-high)'
  if (score >= 6)  return 'var(--risk-medium)'
  return 'var(--risk-low)'
}

// Offset positions for multiple dots in same cell (supports up to 6)
const DOT_OFFSETS = [
  [{ x: 0, y: 0 }],
  [{ x: -11, y: 0 }, { x: 11, y: 0 }],
  [{ x: -11, y: -9 }, { x: 11, y: -9 }, { x: 0, y: 9 }],
  [{ x: -11, y: -9 }, { x: 11, y: -9 }, { x: -11, y: 9 }, { x: 11, y: 9 }],
  [{ x: -14, y: -9 }, { x: 0, y: -9 }, { x: 14, y: -9 }, { x: -7, y: 9 }, { x: 7, y: 9 }],
  [{ x: -14, y: -9 }, { x: 0, y: -9 }, { x: 14, y: -9 }, { x: -14, y: 9 }, { x: 0, y: 9 }, { x: 14, y: 9 }],
]

// ─── Risk Heatmap ─────────────────────────────────────────────────────────────
interface HeatmapProps {
  risks: Risk[]           // all risks to plot (all portfolios)
  filterPortfolio: Portfolio | null
  selectedRisk: Risk | null
  onSelect: (r: Risk) => void
}

function RiskHeatmap({ risks, filterPortfolio, selectedRisk, onSelect }: HeatmapProps) {
  const [hoveredRisk, setHoveredRisk] = useState<Risk | null>(null)

  const displayRisks = useMemo(
    () => filterPortfolio ? risks.filter(r => r.portfolio === filterPortfolio) : risks,
    [risks, filterPortfolio]
  )

  const cellMap = useMemo(() => {
    const m: Record<string, Risk[]> = {}
    displayRisks.forEach((r) => {
      const key = `${r.likelihood}-${r.impact}`
      if (!m[key]) m[key] = []
      m[key].push(r)
    })
    return m
  }, [displayRisks])

  const CELL_SIZE = 80

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

      {/* Grid + axes */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '4px' }}>

          {/* Y-axis label */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '20px' }}>
            <div style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              color: 'var(--text-muted)',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              Likelihood
            </div>
          </div>

          {/* Row number labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[5, 4, 3, 2, 1].map((l) => (
              <div key={l} style={{ width: '16px', height: `${CELL_SIZE}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700 }}>
                {l}
              </div>
            ))}
          </div>

          {/* 5×5 grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[5, 4, 3, 2, 1].map((l) => (
              <div key={l} style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((imp) => {
                  const score = l * imp
                  const key = `${l}-${imp}`
                  const cellRisks = cellMap[key] || []
                  const offsets = DOT_OFFSETS[Math.min(cellRisks.length - 1, 5)] || DOT_OFFSETS[5]
                  return (
                    <div
                      key={key}
                      style={{
                        width: `${CELL_SIZE}px`,
                        height: `${CELL_SIZE}px`,
                        borderRadius: '8px',
                        backgroundColor: cellBg(score),
                        border: `1px solid ${cellBorder(score)}`,
                        position: 'relative',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      {/* Score label */}
                      <div style={{ position: 'absolute', bottom: '3px', right: '5px', fontSize: '0.52rem', color: 'var(--text-muted)', opacity: 0.45, fontWeight: 600, pointerEvents: 'none' }}>
                        {score}
                      </div>

                      {/* Dots — absolutely positioned with offsets to avoid overlap */}
                      {cellRisks.map((r, idx) => {
                        const isSelected = selectedRisk?.id === r.id
                        const isHovered = hoveredRisk?.id === r.id
                        const dotColor = PORTFOLIO_COLORS[r.portfolio] || 'var(--accent-primary)'
                        const offset = offsets[idx] || { x: 0, y: 0 }
                        const dotSize = isSelected ? 22 : isHovered ? 20 : 17
                        return (
                          <motion.div
                            key={r.id}
                            animate={{ scale: isSelected ? 1.1 : 1 }}
                            whileTap={{ scale: 0.88 }}
                            onClick={(e) => { e.stopPropagation(); onSelect(r) }}
                            onMouseEnter={() => setHoveredRisk(r)}
                            onMouseLeave={() => setHoveredRisk(null)}
                            style={{
                              position: 'absolute',
                              width: `${dotSize}px`,
                              height: `${dotSize}px`,
                              borderRadius: '50%',
                              backgroundColor: dotColor,
                              border: isSelected
                                ? `2.5px solid #fff`
                                : `2px solid ${dotColor}90`,
                              boxShadow: isSelected
                                ? `0 0 0 3px ${dotColor}50, 0 0 12px ${dotColor}60`
                                : isHovered
                                ? `0 0 0 2px ${dotColor}40, 0 2px 8px ${dotColor}60`
                                : `0 1px 4px ${dotColor}50`,
                              cursor: 'pointer',
                              top: '50%',
                              left: '50%',
                              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                              transition: 'width 0.15s, height 0.15s, box-shadow 0.15s',
                              zIndex: isSelected ? 4 : isHovered ? 3 : 2,
                            }}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}

            {/* X-axis numbers */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} style={{ width: `${CELL_SIZE}px`, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700 }}>
                  {n}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>
              Impact
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: legend + hover info */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '4px' }}>

        {/* Zone legend */}
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '8px' }}>Zone</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[
              { label: 'Critical', color: 'var(--risk-critical)', range: '≥15' },
              { label: 'High', color: 'var(--risk-high)', range: '10–14' },
              { label: 'Medium', color: 'var(--risk-medium)', range: '5–9' },
              { label: 'Low', color: 'var(--risk-low)', range: '1–4' },
            ].map((z) => (
              <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: z.color, opacity: 0.75, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, minWidth: '48px' }}>{z.label}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{z.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio legend */}
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '8px' }}>Portfolio</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {(Object.entries(PORTFOLIO_COLORS) as [Portfolio, string][]).map(([p, c]) => {
              const count = displayRisks.filter(r => r.portfolio === p).length
              return (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c, flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', flex: 1 }}>{portfolioNames[p]}</span>
                  {count > 0 && <span style={{ color: c, fontSize: '0.65rem', fontWeight: 700 }}>{count}</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Hover info card */}
        <AnimatePresence mode="wait">
          {hoveredRisk ? (
            <motion.div
              key={hoveredRisk.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-secondary)',
                border: `1px solid ${scoreSevColor(hoveredRisk.score)}30`,
                borderLeft: `3px solid ${scoreSevColor(hoveredRisk.score)}`,
              }}
            >
              <div style={{ color: scoreSevColor(hoveredRisk.score), fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                {hoveredRisk.score >= 16 ? 'Critical' : hoveredRisk.score >= 10 ? 'High' : hoveredRisk.score >= 6 ? 'Medium' : 'Low'} · Score {hoveredRisk.score}
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.35, marginBottom: '6px' }}>
                {hoveredRisk.title}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.65rem', color: PORTFOLIO_COLORS[hoveredRisk.portfolio], fontWeight: 600 }}>
                  {portfolioNames[hoveredRisk.portfolio]}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>L{hoveredRisk.likelihood} × I{hoveredRisk.impact}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>AED {hoveredRisk.financialImpact}M</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '4px' }}>
                Click dot to open drill-down ↓
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ color: 'var(--text-muted)', fontSize: '0.7rem', padding: '10px 0' }}
            >
              Hover a dot for details · Click to drill down
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const [selectedOverview, setSelectedOverview] = useState<PortfolioKey | null>(null)
  const [activePortfolio, setActivePortfolio] = useState<Portfolio>('real-estate')
  const [activePortfolioView, setActivePortfolioView] = useState<DrillDownView | null>(null)
  const [calcCtx, setCalcCtx] = useState<FinancialCalcContext | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDesc, setSortDesc] = useState(true)
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null)
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null)

  const portfolioRisks = riskRegister
    .filter((r) => r.portfolio === activePortfolio)
    .sort((a, b) => sortDesc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey])

  // Reset selected risk + drill-down view when switching portfolio
  const handleSetActivePortfolio = (p: Portfolio) => {
    setActivePortfolio(p)
    setSelectedRisk(null)
    setActivePortfolioView(null)
  }

  const metrics = portfolioMetrics[activePortfolio]
  const radarData = getRadarData(activePortfolio)
  const color = PORTFOLIO_COLORS[activePortfolio]

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc(!sortDesc)
    else { setSortKey(key); setSortDesc(true) }
  }

  // AI insights sourced from Risk Propagation Engine — dynamically reflect current signals:
  // tourism_index=61, season=shoulder, occupancy=68%, rate_env=restrictive, geo=medium
  const portfolioAIInsights: Record<Portfolio, string> = {
    'real-estate': PROPAGATION_EXPLANATIONS['real-estate'].propagationPath + ' — ' + PROPAGATION_EXPLANATIONS['real-estate'].businessImpact,
    retail: PROPAGATION_EXPLANATIONS.retail.headline + ' ' + PROPAGATION_EXPLANATIONS.retail.propagationPath,
    hospitality: PROPAGATION_EXPLANATIONS.hospitality.headline + ' ' + PROPAGATION_EXPLANATIONS.hospitality.propagationPath + ' Watch: ' + PROPAGATION_EXPLANATIONS.hospitality.watchIndicators[0] + '.',
    education: PROPAGATION_EXPLANATIONS.education.headline + ' ' + PROPAGATION_EXPLANATIONS.education.propagationPath + ' ' + PROPAGATION_EXPLANATIONS.education.businessImpact,
    facilities: PROPAGATION_EXPLANATIONS.facilities.headline + ' ' + PROPAGATION_EXPLANATIONS.facilities.propagationPath,
  }

  return (
    <div className="space-y-6">

      {/* ─── Enterprise Risk Overview ─────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={14} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', fontWeight: 600 }}>
              Enterprise Risk Universe — All Business Units
            </span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            {PORTFOLIO_KEYS.reduce((s, k) => s + portfolioProfiles[k].totalRisks, 0).toLocaleString()} total risks · Click a card to drill down
          </span>
        </div>

        {/* Portfolio Cards Grid */}
        <div className="grid grid-cols-5 gap-3">
          {PORTFOLIO_KEYS.map((k) => (
            <EnterpriseCard
              key={k}
              portfolioId={k}
              selected={selectedOverview === k}
              onClick={() => setSelectedOverview(selectedOverview === k ? null : k)}
            />
          ))}
        </div>
      </div>

      {/* ─── Drill-Down Panel ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {selectedOverview && (
          <DrillDownPanel key={selectedOverview} portfolioId={selectedOverview} onViewCalc={setCalcCtx} />
        )}
      </AnimatePresence>

      {/* ─── Divider ──────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Portfolio Deep Dive — Risk Register &amp; Radar Analysis
        </span>
      </div>

      {/* ─── Portfolio Tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {PORTFOLIOS.map((p) => {
          const isActive = p === activePortfolio
          const m = portfolioMetrics[p]
          return (
            <button
              key={p}
              onClick={() => handleSetActivePortfolio(p)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: isActive ? `2px solid ${PORTFOLIO_COLORS[p]}` : '1px solid var(--border-color)',
                backgroundColor: isActive ? `${PORTFOLIO_COLORS[p]}15` : 'var(--bg-card)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
            >
              <div style={{ color: isActive ? PORTFOLIO_COLORS[p] : 'var(--text-primary)', fontSize: '0.825rem', fontWeight: isActive ? 700 : 500 }}>
                {portfolioNames[p]}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                Score: {m.riskScore} · {m.riskCount.high + m.riskCount.critical} High+
              </div>
            </button>
          )
        })}
      </div>

      {/* ─── Portfolio Summary Row ────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePortfolio}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-4 gap-4"
        >
          {[
            { label: 'Risk Score', value: `${metrics.riskScore}/100`, sub: 'Composite · Click to explore', view: 'risk_breakdown' as DrillDownView },
            { label: 'Critical/High', value: `${metrics.riskCount.critical}C / ${metrics.riskCount.high}H`, sub: 'Risks requiring action · Click to explore', view: 'risk_list' as DrillDownView },
            { label: 'Financial Exposure', value: `AED ${metrics.financialExposure}M`, sub: 'Gross risk-adjusted · Click to explore', view: 'financial_breakdown' as DrillDownView },
            { label: 'Trend', value: metrics.trend.charAt(0).toUpperCase() + metrics.trend.slice(1), sub: 'Risk trajectory · Click to explore', view: 'trend_analysis' as DrillDownView },
          ].map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.97 }}
              style={{ cursor: 'pointer' }}
              onClick={() => setActivePortfolioView(activePortfolioView === item.view ? null : item.view)}
            >
              <Card accent style={{ borderColor: activePortfolioView === item.view ? `${color}80` : undefined }}>
                <CardBody>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {item.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ color, fontSize: '1.4rem', fontWeight: 700 }}>{item.value}</div>
                    {item.view === 'financial_breakdown' && (
                      <ViewCalcButton onClick={() => setCalcCtx({ type: 'portfolio_exposure', portfolioId: activePortfolio as PortfolioKey, riskScore: metrics.riskScore, value: metrics.financialExposure })} />
                    )}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{item.sub}</div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* ─── Portfolio Drill-Down Panel ───────────────────────────────────── */}
      <AnimatePresence>
        {activePortfolioView && (
          <PortfolioDrillDownPanel
            key={`${activePortfolio}-${activePortfolioView}`}
            portfolioId={activePortfolio}
            view={activePortfolioView}
            color={color}
            onClose={() => setActivePortfolioView(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Radar + AI Insight ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Risk Dimension Radar</CardTitle>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{portfolioNames[activePortfolio]}</span>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Radar name="Risk Score" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <div className="col-span-2">
          <Card style={{ height: '100%' }}>
            <CardHeader>
              <CardTitle>Portfolio AI Intelligence</CardTitle>
            </CardHeader>
            <CardBody>
              <AIInsightBox
                insight={portfolioAIInsights[activePortfolio]}
                confidence={0.88}
                source={`Portfolio Risk Engine — ${portfolioNames[activePortfolio]}`}
              />
              <div className="mt-5">
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Cross-Portfolio Risk Propagation
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: `${color}20`, border: `1px solid ${color}50`, color, fontSize: '0.8rem', fontWeight: 600 }}>
                    {portfolioNames[activePortfolio]}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>→ propagates to →</div>
                  {PORTFOLIOS.filter((p) => p !== activePortfolio).slice(0, 3).map((p) => (
                    <div key={p} style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {portfolioNames[p]}
                    </div>
                  ))}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '8px', lineHeight: 1.5 }}>
                  Construction cost overruns in Real Estate propagate to Facilities Management (maintenance budget pressure) and indirectly suppress Retail development pipeline timing.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ─── Risk Heatmap ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePortfolio + '-heatmap'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={14} style={{ color: PORTFOLIO_COLORS[activePortfolio] }} />
                <CardTitle>
                  Risk Heatmap — {portfolioNames[activePortfolio]}
                </CardTitle>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                {riskRegister.length} risks plotted · Filtered: {portfolioNames[activePortfolio]} · Click any dot to drill down
              </span>
            </CardHeader>
            <CardBody>
              <div className="heatmap-scroll">
                <RiskHeatmap
                  risks={riskRegister}
                  filterPortfolio={activePortfolio}
                  selectedRisk={selectedRisk}
                  onSelect={(r) => setSelectedRisk(selectedRisk?.id === r.id ? null : r)}
                />
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* ─── Risk Drill-Down Panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedRisk && (
          <RiskDrillDownPanel
            key={selectedRisk.id}
            risk={selectedRisk}
            allRisks={riskRegister}
            onClose={() => setSelectedRisk(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Risk Register Table ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Register — {portfolioNames[activePortfolio]}</CardTitle>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            {portfolioRisks.length} risks · Click row to expand AI insight
          </span>
        </CardHeader>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Risk Title</th>
                <th>Severity</th>
                <th onClick={() => handleSort('likelihood')} style={{ cursor: 'pointer' }}>
                  L {sortKey === 'likelihood' ? (sortDesc ? '↓' : '↑') : ''}
                </th>
                <th onClick={() => handleSort('impact')} style={{ cursor: 'pointer' }}>
                  I {sortKey === 'impact' ? (sortDesc ? '↓' : '↑') : ''}
                </th>
                <th onClick={() => handleSort('score')} style={{ cursor: 'pointer' }}>
                  Score {sortKey === 'score' ? (sortDesc ? '↓' : '↑') : ''}
                </th>
                <th>Trend</th>
                <th onClick={() => handleSort('financialImpact')} style={{ cursor: 'pointer' }}>
                  Financial Impact {sortKey === 'financialImpact' ? (sortDesc ? '↓' : '↑') : ''}
                </th>
                <th>Owner</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {portfolioRisks.map((risk) => (
                <RiskRow
                  key={risk.id}
                  risk={risk}
                  expanded={expandedRisk === risk.id}
                  onToggle={() => setExpandedRisk(expandedRisk === risk.id ? null : risk.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Financial Calculation Panel */}
      <AnimatePresence>
        {calcCtx && (
          <FinancialCalculationPanel key={JSON.stringify(calcCtx)} ctx={calcCtx} onClose={() => setCalcCtx(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
