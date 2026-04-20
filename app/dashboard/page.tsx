'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Zap,
  RefreshCw,
  RotateCw,
  Activity,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { LiveRiskSignals } from '@/components/dashboard/LiveRiskSignals'
import { AIFusionPanel } from '@/components/dashboard/AIFusionPanel'
import { KPIDrillDownPanel, AI_ALERT_COUNT, type KPIView } from '@/components/KPIDrillDownPanel'
import { FinancialCalculationPanel, ViewCalcButton, type FinancialCalcContext } from '@/components/FinancialCalculationPanel'
import { TopActionsPanel } from '@/components/TopActionsPanel'
import { ActionDetailPanel } from '@/components/ActionDetailPanel'
import { type Action } from '@/lib/actionEngine'
import Link from 'next/link'
import { controlSummary } from '@/lib/controlData'
import {
  aggregateKPIs,
  kpiData,
  portfolioMetrics,
  portfolioNames,
  type Portfolio,
} from '@/lib/simulated-data'
import { PROPAGATED_METRICS } from '@/lib/riskPropagationEngine'

const PORTFOLIO_COLORS: Record<Portfolio, string> = {
  'real-estate': '#C9A84C',
  retail: '#4A9EFF',
  hospitality: '#A855F7',
  education: '#22C55E',
  facilities: '#FF6B6B',
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setValue(target)
        clearInterval(timer)
      } else {
        setValue(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return value
}

function KPICard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  color,
  trend,
  delay = 0,
  onClick,
  onViewCalc,
  onRefresh,
  refreshing = false,
}: {
  title: string
  value: number
  unit?: string
  subtitle: string
  icon: React.ElementType
  color: string
  trend?: string
  delay?: number
  onClick?: () => void
  onViewCalc?: () => void
  onRefresh?: () => void
  refreshing?: boolean
}) {
  const animated = useCountUp(value, 1000 + delay * 200)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.025, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.975 } : undefined}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Card glow>
        <CardBody>
          <div className="flex items-start justify-between mb-3">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: `${color}18`,
                border: `1px solid ${color}35`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={18} style={{ color }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              {trend && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{trend}</span>
              )}
              {onClick && (
                <span style={{ color: color, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', opacity: 0.7 }}>
                  TAP TO EXPLORE →
                </span>
              )}
            </div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            {title}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span
              className="kpi-value"
              style={{
                color: 'var(--text-primary)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {animated.toLocaleString()}
            </span>
            {unit && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{unit}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', gap: '6px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{subtitle}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {onViewCalc && <ViewCalcButton onClick={onViewCalc} light />}
              {onRefresh && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRefresh() }}
                  title="Refresh alerts"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '3px',
                    padding: '2px 7px', borderRadius: '4px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '0.6rem', fontWeight: 600,
                  }}
                >
                  <RotateCw size={9} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
                  {refreshing ? 'Loading…' : 'Refresh'}
                </button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}

function RiskHeatmap() {
  const portfolios: Portfolio[] = ['real-estate', 'retail', 'hospitality', 'education', 'facilities']

  // Build heatmap data from risk register (simplified: plot portfolio centroid)
  const portfolioData = portfolios.map((p) => {
    const metrics = portfolioMetrics[p]
    const totalRisks = Object.values(metrics.riskCount).reduce((a, b) => a + b, 0)
    // Approximate likelihood/impact from risk score (0-100 -> 1-5)
    const approxScore = metrics.riskScore / 20
    return {
      portfolio: p,
      label: portfolioNames[p],
      likelihood: Math.min(5, Math.max(1, approxScore * 0.9)),
      impact: Math.min(5, Math.max(1, approxScore * 1.1)),
      size: 8 + totalRisks * 2,
      color: PORTFOLIO_COLORS[p],
    }
  })

  const cells: { likelihood: number; impact: number; label: string }[] = []
  for (let impact = 5; impact >= 1; impact--) {
    for (let likelihood = 1; likelihood <= 5; likelihood++) {
      cells.push({ likelihood, impact, label: `L${likelihood}/I${impact}` })
    }
  }

  const getCellColor = (likelihood: number, impact: number) => {
    const score = likelihood * impact
    if (score >= 16) return 'rgba(255,59,59,0.18)'
    if (score >= 12) return 'rgba(255,140,0,0.14)'
    if (score >= 6) return 'rgba(245,197,24,0.12)'
    return 'rgba(34,197,94,0.1)'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Heatmap — All Portfolios</CardTitle>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          Likelihood × Impact Matrix
        </span>
      </CardHeader>
      <CardBody>
        <div style={{ position: 'relative' }}>
          {/* Y-axis label */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateX(-20px) translateY(-50%) rotate(-90deg)',
              color: 'var(--text-muted)',
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Impact →
          </div>

          <div style={{ marginLeft: '24px' }}>
            {/* X-axis labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '4px', paddingLeft: '28px' }}>
              {['1', '2', '3', '4', '5'].map((l) => (
                <div key={l} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                  {l}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {/* Y-axis numbers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '2px' }}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <div
                    key={n}
                    style={{
                      height: '44px',
                      width: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.65rem',
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gridTemplateRows: 'repeat(5, 44px)',
                  gap: '4px',
                  flex: 1,
                  position: 'relative',
                }}
              >
                {cells.map((cell) => (
                  <div
                    key={cell.label}
                    style={{
                      backgroundColor: getCellColor(cell.likelihood, cell.impact),
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {portfolioData
                      .filter(
                        (p) =>
                          Math.round(p.likelihood) === cell.likelihood &&
                          Math.round(p.impact) === cell.impact
                      )
                      .map((p) => (
                        <div
                          key={p.portfolio}
                          title={p.label}
                          style={{
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            borderRadius: '50%',
                            backgroundColor: p.color,
                            border: '2px solid rgba(255,255,255,0.3)',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                  </div>
                ))}
              </div>
            </div>

            {/* X-axis label */}
            <div
              style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginTop: '8px',
                paddingLeft: '28px',
              }}
            >
              Likelihood →
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4">
              {portfolioData.map((p) => (
                <div key={p.portfolio} className="flex items-center gap-1.5">
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: p.color,
                    }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function RiskTrendChart() {
  const data = kpiData.months.map((month, i) => ({
    month,
    'Real Estate': kpiData.portfolioRiskScores['real-estate'][i],
    Retail: kpiData.portfolioRiskScores['retail'][i],
    Hospitality: kpiData.portfolioRiskScores['hospitality'][i],
    Education: kpiData.portfolioRiskScores['education'][i],
    Facilities: kpiData.portfolioRiskScores['facilities'][i],
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Score Trend — 12 Months</CardTitle>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          May 2025 — Apr 2026
        </span>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-color)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[30, 80]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-accent)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
              labelStyle={{ color: 'var(--text-muted)' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)', paddingTop: '12px' }}
            />
            <Line type="monotone" dataKey="Real Estate" stroke={PORTFOLIO_COLORS['real-estate']} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Retail" stroke={PORTFOLIO_COLORS['retail']} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Hospitality" stroke={PORTFOLIO_COLORS['hospitality']} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Education" stroke={PORTFOLIO_COLORS['education']} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Facilities" stroke={PORTFOLIO_COLORS['facilities']} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  )
}

export default function DashboardPage() {
  const [lastUpdated, setLastUpdated] = useState(0)
  const [liveKPIs, setLiveKPIs] = useState({
    riskScore: aggregateKPIs.totalRiskScore,
    exposure: aggregateKPIs.totalFinancialExposure,
  })
  const [alertsRefreshing, setAlertsRefreshing] = useState(false)
  const [activeView, setActiveView] = useState<KPIView | null>(null)
  const [calcCtx, setCalcCtx] = useState<FinancialCalcContext | null>(null)
  const [selectedAction, setSelectedAction] = useState<Action | null>(null)

  const portfolioScores: Partial<Record<'real-estate' | 'retail' | 'hospitality' | 'education' | 'facilities', number>> = {
    'real-estate': PROPAGATED_METRICS['real-estate'].riskScore,
    retail:        PROPAGATED_METRICS.retail.riskScore,
    hospitality:   PROPAGATED_METRICS.hospitality.riskScore,
    education:     PROPAGATED_METRICS.education.riskScore,
    facilities:    PROPAGATED_METRICS.facilities.riskScore,
  }

  // Live updates for risk score + last-updated ticker only — alerts are static
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated((s) => s + 5)
      setLiveKPIs((prev) => ({
        ...prev,
        riskScore: aggregateKPIs.totalRiskScore + (Math.floor(Math.random() * 3) - 1),
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const refreshAlerts = useCallback(async () => {
    setAlertsRefreshing(true)
    // Simulate brief load — replace with real fetch in production
    await new Promise(r => setTimeout(r, 800))
    setAlertsRefreshing(false)
  }, [])

  const formatLastUpdated = useCallback(() => {
    if (lastUpdated < 60) return `${lastUpdated}s ago`
    return `${Math.floor(lastUpdated / 60)}m ago`
  }, [lastUpdated])

  return (
    <div className="space-y-6">
      {/* Last Updated Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Aldar Properties — Enterprise Risk Dashboard · Q2 2026
          </span>
        </div>
        <div className="flex items-center gap-2">
          <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '3s', color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            Last updated: {formatLastUpdated()}
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Overall Risk Score"
          value={liveKPIs.riskScore}
          subtitle="Composite across all portfolios"
          icon={AlertTriangle}
          color="var(--risk-high)"
          trend="↑ +4 pts MTD"
          delay={0}
          onClick={() => setActiveView(activeView === 'overallRisk' ? null : 'overallRisk')}
        />
        <KPICard
          title="Critical & High Risks"
          value={aggregateKPIs.highRisks + aggregateKPIs.criticalRisks}
          subtitle="Requiring management action"
          icon={Zap}
          color="var(--risk-critical)"
          trend={`${aggregateKPIs.highRisks} High · ${aggregateKPIs.criticalRisks} Critical`}
          delay={1}
          onClick={() => setActiveView(activeView === 'criticalRisks' ? null : 'criticalRisks')}
        />
        <KPICard
          title="Financial Exposure"
          value={liveKPIs.exposure}
          unit="AED M"
          subtitle="Gross risk-adjusted exposure"
          icon={DollarSign}
          color="var(--accent-primary)"
          trend="AED 2.35Bn total"
          delay={2}
          onClick={() => setActiveView(activeView === 'financialExposure' ? null : 'financialExposure')}
          onViewCalc={() => setCalcCtx({ type: 'total_exposure', value: liveKPIs.exposure, portfolioScores })}
        />
        <KPICard
          title="AI Alerts Today"
          value={AI_ALERT_COUNT}
          subtitle="New signals detected"
          icon={TrendingUp}
          color="var(--chart-2)"
          trend="10 external · 11 internal · 5 AI"
          delay={3}
          onClick={() => setActiveView(activeView === 'aiAlerts' ? null : 'aiAlerts')}
          onRefresh={refreshAlerts}
          refreshing={alertsRefreshing}
        />
      </div>

      {/* KPI Drill-Down Panel (modal overlay) */}
      <AnimatePresence>
        {activeView && (
          <KPIDrillDownPanel
            key={activeView}
            view={activeView}
            onClose={() => setActiveView(null)}
          />
        )}
      </AnimatePresence>

      {/* Decision Intelligence — Priority Actions */}
      <TopActionsPanel onActionClick={(a) => setSelectedAction(a)} />

      {/* ICOFR Control Health Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          padding: '14px 16px',
          borderRadius: '10px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: 'span 4' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ICOFR Internal Controls
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>·</span>
          <span style={{ color: '#F5C518', fontSize: '0.62rem', fontWeight: 600 }}>Integration Pending</span>
          <Link
            href="/control-command-center"
            style={{
              marginLeft: 'auto',
              color: 'var(--accent-primary)',
              fontSize: '0.67rem',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '3px 9px',
              borderRadius: '5px',
              border: '1px solid var(--border-accent)',
              backgroundColor: 'var(--accent-glow)',
            }}
          >
            Open Command Center →
          </Link>
        </div>
        {[
          { label: 'Effective', value: controlSummary.effective, color: '#22C55E' },
          { label: 'Partial',   value: controlSummary.partial,   color: '#F5C518' },
          { label: 'Failed',    value: controlSummary.failed,    color: '#FF3B3B' },
          { label: 'Coverage',  value: `${controlSummary.coveragePercent}%`, color: controlSummary.coveragePercent >= 80 ? '#22C55E' : '#F5C518' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ color, fontSize: '1.2rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', marginTop: '1px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Action Detail Panel — slide-in overlay */}
      <ActionDetailPanel action={selectedAction} onClose={() => setSelectedAction(null)} />

      {/* Live Risk Signals + AI Fusion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live News Feed */}
        <div className="lg:col-span-2">
          <LiveRiskSignals />
        </div>

        {/* AI Fusion Layer */}
        <div className="lg:col-span-1">
          <AIFusionPanel />
        </div>
      </div>

      {/* Heatmap + Trend Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RiskHeatmap />
        <RiskTrendChart />
      </div>

      {/* Financial Calculation Panel */}
      <AnimatePresence>
        {calcCtx && (
          <FinancialCalculationPanel key={calcCtx.type} ctx={calcCtx} onClose={() => setCalcCtx(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
