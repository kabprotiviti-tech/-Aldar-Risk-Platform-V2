'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Play, AlertTriangle, TrendingDown, Shield, Lightbulb, Loader2, Zap, Activity } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { RiskBadge, ConfidenceBadge } from '@/components/ui/Badge'
import { AIInsightBox } from '@/components/ui/AIInsightBox'
import { FinancialCalculationPanel, ViewCalcButton, type FinancialCalcContext } from '@/components/FinancialCalculationPanel'
import { scenarioTemplates, portfolioNames, type Portfolio } from '@/lib/simulated-data'
import { ScenarioEngine } from '@/components/ScenarioEngine'

type Intensity = 'mild' | 'moderate' | 'severe'

const INTENSITY_CONFIG: Record<Intensity, { label: string; color: string; multiplier: number }> = {
  mild: { label: 'Mild', color: 'var(--risk-low)', multiplier: 0.5 },
  moderate: { label: 'Moderate', color: 'var(--risk-medium)', multiplier: 1.0 },
  severe: { label: 'Severe', color: 'var(--risk-critical)', multiplier: 1.7 },
}

interface SimulationResult {
  overallImpact: {
    severity: string
    revenueImpact: string
    ebitdaImpact: string
    navImpact: string
    summary: string
  }
  portfolioImpacts: Array<{
    portfolio: string
    impactAED: number
    impactPercent: number
    description: string
    recoveryTimeMonths: number
  }>
  financialImpact: {
    year1AED: number
    year2AED: number
    totalAED: number
    peakCashflowImpact: string
  }
  timeframe: {
    onsetMonths: number
    peakMonths: number
    recoveryMonths: number
  }
  mitigationStrategies: Array<{
    strategy: string
    owner: string
    timeToImplement: string
    costAED: string
    expectedBenefit: string
  }>
  opportunities: string[]
  confidence: number
  keyAssumptions: string[]
  simulatedAt?: string
}

// ─── AI Stress Test Panel ─────────────────────────────────────────────────────
interface StressTestResult {
  portfolioId: string
  scenarioName: string
  impactAED: number
  impactPercent: number
  severity: 'critical' | 'high' | 'medium' | 'low'
}

const PORTFOLIOS_ALL: Portfolio[] = ['real-estate', 'retail', 'hospitality', 'education', 'facilities']

function AIStressTest() {
  const [running, setRunning] = useState(false)
  const [stressResults, setStressResults] = useState<StressTestResult[] | null>(null)
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['S-001', 'S-002', 'S-003'])

  const STRESS_INTENSITY: Intensity = 'severe'

  const runStressTest = async () => {
    setRunning(true)
    setStressResults(null)
    await new Promise((r) => setTimeout(r, 1800)) // simulate AI analysis delay

    const results: StressTestResult[] = []
    for (const sId of selectedScenarios) {
      const scenario = scenarioTemplates.find((s) => s.id === sId)
      if (!scenario) continue
      for (const pi of scenario.estimatedImpact) {
        const severityMultiplier = 1.7 // severe
        const impactAED = Math.round(pi.impactAED * severityMultiplier)
        const impactPercent = Math.round(pi.impactPercent * severityMultiplier)
        const score = Math.abs(impactPercent)
        results.push({
          portfolioId: pi.portfolio,
          scenarioName: scenario.name,
          impactAED,
          impactPercent,
          severity: score >= 40 ? 'critical' : score >= 25 ? 'high' : score >= 12 ? 'medium' : 'low',
        })
      }
    }
    setStressResults(results)
    setRunning(false)
  }

  // Aggregate by portfolio
  const portfolioTotals = PORTFOLIOS_ALL.map((p) => {
    const relevant = stressResults?.filter((r) => r.portfolioId === p) || []
    const totalImpact = relevant.reduce((s, r) => s + r.impactAED, 0)
    const maxSeverity = relevant.reduce<'critical' | 'high' | 'medium' | 'low'>((worst, r) => {
      const order = { critical: 3, high: 2, medium: 1, low: 0 }
      return order[r.severity] > order[worst] ? r.severity : worst
    }, 'low')
    return { portfolio: p, totalImpact, maxSeverity, scenarios: relevant }
  })

  const toggleScenario = (id: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const SCOLOR: Record<string, string> = {
    critical: 'var(--risk-critical)', high: 'var(--risk-high)', medium: 'var(--risk-medium)', low: 'var(--risk-low)',
  }

  return (
    <Card accent glow>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: 'var(--accent-primary)' }} />
          <CardTitle>AI Portfolio Stress Test</CardTitle>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          Simultaneously stress all portfolios across multiple scenarios — severe intensity
        </span>
      </CardHeader>
      <CardBody>
        {/* Scenario selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', alignSelf: 'center', marginRight: '4px' }}>
            Select scenarios:
          </span>
          {scenarioTemplates.map((s) => {
            const active = selectedScenarios.includes(s.id)
            return (
              <button
                key={s.id}
                onClick={() => toggleScenario(s.id)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: active ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  backgroundColor: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                  color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {s.name}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={runStressTest}
            disabled={running || selectedScenarios.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            {running ? (
              <><Loader2 size={14} className="animate-spin" />Running AI Stress Test...</>
            ) : (
              <><Activity size={14} />Run Stress Test ({selectedScenarios.length} scenarios · Severe)</>
            )}
          </button>
          {stressResults && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              {stressResults.length} impact vectors computed
            </span>
          )}
        </div>

        <AnimatePresence>
          {stressResults && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-5 gap-3"
            >
              {portfolioTotals.map((pt) => {
                const hasImpact = pt.scenarios.length > 0
                return (
                  <div
                    key={pt.portfolio}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      backgroundColor: hasImpact ? `${SCOLOR[pt.maxSeverity]}10` : 'var(--bg-secondary)',
                      border: `1px solid ${hasImpact ? SCOLOR[pt.maxSeverity] + '35' : 'var(--border-color)'}`,
                    }}
                  >
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {portfolioNames[pt.portfolio]}
                    </div>
                    {hasImpact ? (
                      <>
                        <div style={{ color: SCOLOR[pt.maxSeverity], fontSize: '1.1rem', fontWeight: 700, marginBottom: '2px' }}>
                          AED {Math.abs(pt.totalImpact).toLocaleString()}M
                        </div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: SCOLOR[pt.maxSeverity], marginBottom: '8px' }}>
                          {pt.maxSeverity}
                        </div>
                        <div className="space-y-1">
                          {pt.scenarios.map((s, i) => (
                            <div key={i} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{s.scenarioName}</span>
                              <span style={{ color: SCOLOR[s.severity], fontWeight: 600, flexShrink: 0 }}>{s.impactPercent}%</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: 'var(--risk-low)', fontSize: '0.75rem' }}>No impact</div>
                    )}
                  </div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </CardBody>
    </Card>
  )
}

export default function ScenariosPage() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [calcCtx, setCalcCtx] = useState<FinancialCalcContext | null>(null)

  const scenario = scenarioTemplates.find((s) => s.id === selectedScenario)

  const runSimulation = async () => {
    if (!scenario) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/scenario-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          parameters: {
            intensity,
            duration: scenario.parameters.duration,
            probability: scenario.parameters.probability,
          },
        }),
      })
      if (!res.ok) throw new Error('Simulation failed')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Simulation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const chartData = result?.portfolioImpacts.map((pi) => ({
    name: portfolioNames[pi.portfolio as Portfolio] || pi.portfolio,
    impact: Math.abs(pi.impactAED),
    percent: Math.abs(pi.impactPercent),
  })) || []

  return (
    <div className="space-y-6">

      {/* Quick Scenario Engine */}
      <ScenarioEngine />

      {/* AI Stress Test */}
      <AIStressTest />

      {/* Scenario Selection */}
      <div className="grid grid-cols-2 gap-4">
        {scenarioTemplates.map((s) => {
          const isSelected = selectedScenario === s.id
          return (
            <motion.div
              key={s.id}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.15 }}
            >
              <Card
                accent={isSelected}
                glow={isSelected}
                onClick={() => setSelectedScenario(s.id)}
                style={{ cursor: 'pointer' }}
              >
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        backgroundColor: isSelected ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {s.category}
                    </div>
                    <div
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.7rem',
                      }}
                    >
                      p={Math.round(s.parameters.probability * 100)}%
                    </div>
                  </div>

                  <h3
                    style={{
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      marginBottom: '6px',
                    }}
                  >
                    {s.name}
                  </h3>
                  <p
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      lineHeight: 1.5,
                      marginBottom: '10px',
                    }}
                  >
                    {s.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {s.affectedPortfolios.map((p) => (
                      <span
                        key={p}
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '5px',
                          backgroundColor: 'var(--bg-hover)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {portfolioNames[p]}
                      </span>
                    ))}
                  </div>

                  {/* Static impact preview */}
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '8px 10px',
                      borderRadius: '7px',
                      backgroundColor: 'var(--bg-hover)',
                    }}
                  >
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '4px' }}>
                      Estimated total impact
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ color: 'var(--risk-high)', fontSize: '0.875rem', fontWeight: 700 }}>
                        AED{' '}
                        {Math.abs(
                          s.estimatedImpact.reduce((sum, i) => sum + i.impactAED, 0)
                        ).toLocaleString()}
                        M
                      </div>
                      <ViewCalcButton onClick={() => setCalcCtx({ type: 'scenario_impact', scenarioId: s.id, value: Math.abs(s.estimatedImpact.reduce((sum, i) => sum + i.impactAED, 0)) })} />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Controls */}
      {selectedScenario && scenario && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card accent glow>
            <CardBody>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>
                    {scenario.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Duration: {scenario.parameters.duration} · Base probability: {Math.round(scenario.parameters.probability * 100)}%
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Intensity selector */}
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Intensity
                    </div>
                    <div className="flex gap-2">
                      {(['mild', 'moderate', 'severe'] as Intensity[]).map((i) => {
                        const config = INTENSITY_CONFIG[i]
                        const isActive = intensity === i
                        return (
                          <button
                            key={i}
                            onClick={() => setIntensity(i)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '7px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: isActive ? `2px solid ${config.color}` : '1px solid var(--border-color)',
                              backgroundColor: isActive ? `${config.color}18` : 'var(--bg-secondary)',
                              color: isActive ? config.color : 'var(--text-muted)',
                              transition: 'all 0.15s',
                            }}
                          >
                            {config.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <button
                    onClick={runSimulation}
                    disabled={loading}
                    className="btn-primary flex items-center gap-2"
                    style={{ minWidth: '180px', justifyContent: 'center' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Run AI Simulation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* Error */}
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

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
          ))}
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              color: 'var(--accent-primary)',
              fontSize: '0.875rem',
            }}
          >
            <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: 'var(--accent-primary)' }} />
            AI is modelling scenario impact across Aldar portfolios...
          </div>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Overall Impact Summary */}
            <Card accent glow>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} style={{ color: 'var(--risk-high)' }} />
                  <CardTitle>Simulation Results — Overall Impact</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <ConfidenceBadge confidence={result.confidence} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    {result.simulatedAt
                      ? new Date(result.simulatedAt).toLocaleTimeString('en-AE', { timeZone: 'Asia/Dubai' })
                      : ''}
                  </span>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { label: 'Revenue Impact', value: result.overallImpact.revenueImpact },
                    { label: 'EBITDA Impact', value: result.overallImpact.ebitdaImpact },
                    { label: 'NAV Impact', value: result.overallImpact.navImpact },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        {item.label}
                      </div>
                      <div style={{ color: 'var(--risk-high)', fontSize: '1.1rem', fontWeight: 700 }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {result.overallImpact.summary}
                </p>
              </CardBody>
            </Card>

            {/* Portfolio Impact Chart */}
            <div className="grid grid-cols-2 gap-5">
              <Card>
                <CardHeader>
                  <CardTitle>Impact by Portfolio (AED M)</CardTitle>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-accent)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                        }}
                        formatter={(value) => [`AED ${value}M`, 'Impact']}
                      />
                      <Bar dataKey="impact" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, index) => (
                          <Cell key={index} fill="var(--risk-high)" fillOpacity={0.7 + index * 0.06} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              {/* Financial Impact Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Impact Timeline</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {[
                      { label: 'Year 1 Impact', value: `AED ${result.financialImpact.year1AED?.toLocaleString() || 'N/A'}M` },
                      { label: 'Year 2 Impact', value: `AED ${result.financialImpact.year2AED?.toLocaleString() || 'N/A'}M` },
                      { label: 'Total Impact', value: `AED ${result.financialImpact.totalAED?.toLocaleString() || 'N/A'}M` },
                      { label: 'Peak Cashflow', value: result.financialImpact.peakCashflowImpact || 'N/A' },
                      { label: 'Onset', value: `${result.timeframe.onsetMonths} months` },
                      { label: 'Recovery', value: `${result.timeframe.recoveryMonths} months` },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-center"
                        style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}
                      >
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.label}</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Mitigation Strategies */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield size={14} style={{ color: 'var(--accent-primary)' }} />
                  <CardTitle>Mitigation Strategies</CardTitle>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {result.mitigationStrategies?.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600 }}>
                          {i + 1}. {m.strategy}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                            {m.timeToImplement}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          Owner: <span style={{ color: 'var(--accent-primary)' }}>{m.owner}</span>
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          Cost: {m.costAED}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>
                        Expected benefit: {m.expectedBenefit}
                      </p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Opportunities */}
            {result.opportunities && result.opportunities.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lightbulb size={14} style={{ color: 'var(--risk-low)' }} />
                    <CardTitle>Silver Lining Opportunities</CardTitle>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-2">
                    {result.opportunities.map((opp, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(34,197,94,0.07)',
                          border: '1px solid rgba(34,197,94,0.2)',
                        }}
                      >
                        <span style={{ color: 'var(--risk-low)', fontWeight: 700, fontSize: '0.85rem' }}>+</span>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.5 }}>{opp}</p>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Key Assumptions */}
            {result.keyAssumptions && (
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Key Modelling Assumptions
                </div>
                <div className="space-y-1">
                  {result.keyAssumptions.map((a, i) => (
                    <div key={i} className="flex gap-2">
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>·</span>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.5 }}>{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Financial Calculation Panel */}
      <AnimatePresence>
        {calcCtx && (
          <FinancialCalculationPanel key={JSON.stringify(calcCtx)} ctx={calcCtx} onClose={() => setCalcCtx(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
