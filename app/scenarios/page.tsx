'use client'

/**
 * Scenario Analysis — consolidated single-flow redesign.
 * -------------------------------------------------------
 * One narrative, three acts, one engine:
 *   1 · The stakes      → <ExposureClimax/> (baseline → stress → inaction bridge)
 *   2 · Stress test     → <StressTestStudio/> (pick scenario + intensity → impact)
 *   3 · The decision    → <CostOfInactionPanel/> (response plan + route for approval)
 * Plus on-demand depth: Baseline & sources (collapsible) and the analyst
 * Intelligence Workbench (driver-level sliders) behind a toggle.
 *
 * The four redundant engines (Quick Scenario Engine, AI Stress Test, and the
 * old always-on Workbench wrapper) are removed so the page presents ONE way
 * to stress-test, with one set of reconciled numbers. AI-generated impact is
 * badged "AI Hypothesis — pending approval" per CLAUDE.md.
 */

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
import {
  Play,
  AlertTriangle,
  Shield,
  Loader2,
  Sparkles,
  ChevronDown,
  SlidersHorizontal,
  Activity,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { ConfidenceBadge } from '@/components/ui/Badge'
import {
  FinancialCalculationPanel,
  ViewCalcButton,
  type FinancialCalcContext,
} from '@/components/FinancialCalculationPanel'
import { scenarioTemplates, portfolioNames, type Portfolio } from '@/lib/simulated-data'
import { CostOfInactionPanel } from '@/components/scenarios/CostOfInactionPanel'
import { ExposureClimax } from '@/components/scenarios/ExposureClimax'
import { SimulationWorkbench } from '@/components/simulation/SimulationWorkbench'
import { BaselineComparisonPanel } from '@/components/scenarios/BaselineComparisonPanel'
import { PageHeader } from '@/components/ui/PageHeader'

type Intensity = 'mild' | 'moderate' | 'severe'

const INTENSITY_CONFIG: Record<Intensity, { label: string; color: string }> = {
  mild: { label: 'Mild', color: 'var(--risk-low)' },
  moderate: { label: 'Moderate', color: 'var(--risk-medium)' },
  severe: { label: 'Severe', color: 'var(--risk-critical)' },
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

// ════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════
export default function ScenariosPage() {
  const [showBaseline, setShowBaseline] = useState(false)
  const [showAnalyst, setShowAnalyst] = useState(false)

  return (
    <div className="space-y-6">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <PageHeader
          eyebrow="What-if"
          title="Scenario Analysis"
          subtitle="One flow: see the stakes, run a stress test, decide. The cost of inaction and the recommended response are reconciled to the same baseline."
        />
        <button onClick={() => setShowAnalyst((v) => !v)} style={toggleBtn(showAnalyst)} title="Show driver-level analyst workbench">
          <SlidersHorizontal size={13} />
          Analyst view
          <ChevronDown size={13} style={{ transform: showAnalyst ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
        </button>
      </div>

      {/* 1 · THE STAKES ─────────────────────────────────────────────── */}
      <SectionLabel step={1} title="The stakes" hint="Where the Group sits today, under stress, and if nothing is done" />
      <ExposureClimax />

      {/* 2 · STRESS TEST (single engine) ─────────────────────────────── */}
      <SectionLabel step={2} title="Stress test" hint="Pick a scenario and intensity — the engine models the impact across portfolios" />
      <StressTestStudio />

      {/* 3 · THE DECISION ────────────────────────────────────────────── */}
      <SectionLabel step={3} title="The decision" hint="What it costs to do nothing, the recommended response, and where to route it" />
      <CostOfInactionPanel />

      {/* Reference — baseline & sources (collapsed) */}
      <Disclosure
        open={showBaseline}
        onToggle={() => setShowBaseline((v) => !v)}
        label="Baseline & sources"
        hint="FY24 → FY25 anchors behind every figure above"
      >
        <BaselineComparisonPanel />
      </Disclosure>

      {/* Analyst workbench — driver-level depth, on demand */}
      <AnimatePresence>
        {showAnalyst && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: '4px 16px 16px' }}>
              <SectionLabel title="Analyst workbench" hint="Driver-level sliders, explainability and decision layer — for the ERM team" />
              <SimulationWorkbench />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// STRESS TEST STUDIO — the one engine: pick scenario → intensity → run
// ════════════════════════════════════════════════════════════════════════
function StressTestStudio() {
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

  const chartData =
    result?.portfolioImpacts.map((pi) => ({
      name: portfolioNames[pi.portfolio as Portfolio] || pi.portfolio,
      impact: Math.abs(pi.impactAED),
      percent: Math.abs(pi.impactPercent),
    })) || []

  return (
    <Card>
      <CardBody>
        {/* Step A — choose a scenario */}
        <FieldLabel>1. Choose a scenario</FieldLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: 10,
            marginBottom: 18,
          }}
        >
          {scenarioTemplates.map((s) => {
            const isSel = selectedScenario === s.id
            const est = Math.abs(s.estimatedImpact.reduce((sum, i) => sum + i.impactAED, 0))
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedScenario(s.id)
                  setResult(null)
                  setError(null)
                }}
                style={{
                  textAlign: 'left',
                  padding: '12px 13px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: isSel ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                  border: isSel ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  transition: 'all 120ms',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isSel ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                    {s.category}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>p={Math.round(s.parameters.probability * 100)}%</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{s.name}</span>
                <span style={{ fontSize: 11, color: 'var(--risk-high)', fontWeight: 700 }}>~AED {est.toLocaleString()}M est. impact</span>
              </button>
            )
          })}
        </div>

        {/* Step B — intensity + run */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <FieldLabel>2. Intensity</FieldLabel>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['mild', 'moderate', 'severe'] as Intensity[]).map((i) => {
                const cfg = INTENSITY_CONFIG[i]
                const active = intensity === i
                return (
                  <button
                    key={i}
                    onClick={() => setIntensity(i)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 7,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: active ? `1.5px solid ${cfg.color}` : '1px solid var(--border-color)',
                      background: active ? `${cfg.color}18` : 'var(--bg-secondary)',
                      color: active ? cfg.color : 'var(--text-muted)',
                      transition: 'all 120ms',
                    }}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {scenario && (
              <ViewCalcButton
                onClick={() =>
                  setCalcCtx({
                    type: 'scenario_impact',
                    scenarioId: scenario.id,
                    value: Math.abs(scenario.estimatedImpact.reduce((sum, i) => sum + i.impactAED, 0)),
                  })
                }
              />
            )}
            <button
              onClick={runSimulation}
              disabled={loading || !scenario}
              className="btn-primary flex items-center gap-2"
              style={{ minWidth: 190, justifyContent: 'center', opacity: !scenario ? 0.5 : 1 }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" />Modelling…</>
              ) : (
                <><Play size={16} />Run stress test</>
              )}
            </button>
          </div>
        </div>

        {!scenario && !loading && (
          <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} style={{ color: 'var(--accent-primary)' }} />
            Select a scenario above, choose an intensity, then run the stress test to see the modelled impact across portfolios.
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.3)', color: 'var(--risk-critical)', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* AI hypothesis banner — provenance */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={15} style={{ color: 'var(--risk-high)' }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {scenario?.name} · {INTENSITY_CONFIG[intensity].label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AIHypothesisBadge />
                  <ConfidenceBadge confidence={result.confidence} />
                </div>
              </div>

              {/* Overall impact KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Revenue Impact', value: result.overallImpact.revenueImpact },
                  { label: 'EBITDA Impact', value: result.overallImpact.ebitdaImpact },
                  { label: 'NAV Impact', value: result.overallImpact.navImpact },
                ].map((item) => (
                  <div key={item.label} style={{ padding: 14, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</div>
                    <div style={{ color: 'var(--risk-high)', fontSize: 18, fontWeight: 700 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{result.overallImpact.summary}</p>

              {/* Chart + timeline */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                <div style={panel}>
                  <PanelTitle>Impact by Portfolio (AED M)</PanelTitle>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }}
                        formatter={(value) => [`AED ${value}M`, 'Impact']}
                      />
                      <Bar dataKey="impact" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, index) => (
                          <Cell key={index} fill="var(--risk-high)" fillOpacity={0.7 + index * 0.06} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={panel}>
                  <PanelTitle>Financial Impact Timeline</PanelTitle>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {[
                      { label: 'Year 1 Impact', value: `AED ${result.financialImpact.year1AED?.toLocaleString() || 'N/A'}M` },
                      { label: 'Year 2 Impact', value: `AED ${result.financialImpact.year2AED?.toLocaleString() || 'N/A'}M` },
                      { label: 'Total Impact', value: `AED ${result.financialImpact.totalAED?.toLocaleString() || 'N/A'}M` },
                      { label: 'Peak Cashflow', value: result.financialImpact.peakCashflowImpact || 'N/A' },
                      { label: 'Onset', value: `${result.timeframe.onsetMonths} months` },
                      { label: 'Recovery', value: `${result.timeframe.recoveryMonths} months` },
                    ].map((item) => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{item.label}</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 700 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mitigation */}
              {result.mitigationStrategies?.length > 0 && (
                <div style={panel}>
                  <PanelTitle icon={<Shield size={13} style={{ color: 'var(--accent-primary)' }} />}>Recommended Mitigations</PanelTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {result.mitigationStrategies.map((m, i) => (
                      <div key={i} style={{ padding: 13, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                          <span style={{ color: 'var(--text-primary)', fontSize: 13.5, fontWeight: 700 }}>{i + 1}. {m.strategy}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{m.timeToImplement}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>Owner: <span style={{ color: 'var(--accent-primary)' }}>{m.owner}</span></span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>Cost: {m.costAED}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>Benefit: {m.expectedBenefit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assumptions */}
              {result.keyAssumptions?.length > 0 && (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Key Modelling Assumptions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {result.keyAssumptions.map((a, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>·</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardBody>

      <AnimatePresence>
        {calcCtx && <FinancialCalculationPanel key={JSON.stringify(calcCtx)} ctx={calcCtx} onClose={() => setCalcCtx(null)} />}
      </AnimatePresence>
    </Card>
  )
}

// ─── small presentational helpers ───────────────────────────────────────
function SectionLabel({ step, title, hint }: { step?: number; title: string; hint: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
      {step != null && (
        <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-primary)', color: 'var(--on-accent)', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {step}
        </span>
      )}
      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</span>
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{hint}</span>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>{children}</div>
}

function PanelTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
      {icon}
      {children}
    </div>
  )
}

function AIHypothesisBadge() {
  return (
    <span
      title="AI-generated from illustrative baselines — not yet approved by a human owner"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: '#B8860B',
        background: 'rgba(245,197,24,0.16)',
        border: '1px solid rgba(245,197,24,0.5)',
        padding: '3px 8px',
        borderRadius: 999,
      }}
    >
      <Sparkles size={10} />
      AI Hypothesis · pending approval
    </span>
  )
}

function Disclosure({
  open,
  onToggle,
  label,
  hint,
  children,
}: {
  open: boolean
  onToggle: () => void
  label: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px',
          background: 'var(--bg-secondary)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
          <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{hint}</span>
        </span>
        <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: 16 }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const panel: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 12,
  padding: 16,
}

function toggleBtn(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    border: active ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
    background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
    transition: 'all 120ms',
  }
}
