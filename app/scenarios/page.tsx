'use client'

/**
 * Scenario Analysis — consolidated single-flow redesign (CEO-grade).
 * -------------------------------------------------------------------
 * One narrative, three acts, one engine:
 *   0 · Bottom line     → <VerdictCallout/> (the answer, in one sentence)
 *   1 · The stakes      → <ExposureClimax/> (baseline → stress → inaction bridge)
 *   2 · Stress test     → <StressTestStudio/> (opens PRE-RUN on the most
 *        material scenario with a deterministic impact chart; "explore" to
 *        change scenario; "Run AI stress test" enriches with a badged AI view)
 *   3 · The decision    → <CostOfInactionPanel/> (response plan + route)
 * Plus on-demand depth: Baseline & sources (collapsible) and the analyst
 * Intelligence Workbench behind a toggle.
 *
 * All headline numbers derive from lib/data/scenarioInaction (single source
 * of truth) so the verdict, the bridge and the cost-of-inaction reconcile.
 * AI-generated impact is badged "AI Hypothesis — pending approval".
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
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
  Shield,
  Loader2,
  Sparkles,
  ChevronDown,
  SlidersHorizontal,
  ArrowRight,
} from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
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
import { formatCurrencyShort } from '@/lib/utils/formatters'
import {
  BASELINE_EXPOSURE,
  INACTION_EXPOSURE,
  COST_OF_INACTION,
  COST_TO_ACT,
} from '@/lib/data/scenarioInaction'

type Intensity = 'mild' | 'moderate' | 'severe'

// Intensity scales the scenario's illustrative base impact estimate.
const INTENSITY_CONFIG: Record<Intensity, { label: string; color: string; factor: number }> = {
  mild: { label: 'Mild', color: 'var(--risk-low)', factor: 0.6 },
  moderate: { label: 'Moderate', color: 'var(--risk-medium)', factor: 1.0 },
  severe: { label: 'Severe', color: 'var(--risk-critical)', factor: 1.5 },
}

const scenarioTotal = (s: (typeof scenarioTemplates)[number]) =>
  Math.abs(s.estimatedImpact.reduce((sum, i) => sum + i.impactAED, 0))

// Default selection = the single most material scenario, so Act 2 opens on a
// result rather than an empty picker.
const MOST_MATERIAL = [...scenarioTemplates].sort((a, b) => scenarioTotal(b) - scenarioTotal(a))[0]

interface SimulationResult {
  overallImpact: { severity: string; revenueImpact: string; ebitdaImpact: string; navImpact: string; summary: string }
  portfolioImpacts: Array<{ portfolio: string; impactAED: number; impactPercent: number; description: string; recoveryTimeMonths: number }>
  financialImpact: { year1AED: number; year2AED: number; totalAED: number; peakCashflowImpact: string }
  timeframe: { onsetMonths: number; peakMonths: number; recoveryMonths: number }
  mitigationStrategies: Array<{ strategy: string; owner: string; timeToImplement: string; costAED: string; expectedBenefit: string }>
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
    <div className="space-y-6" style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <PageHeader
          eyebrow="What-if"
          title="Scenario Analysis"
          subtitle="The answer first, then the workings: the stakes, a stress test, and the decision — all reconciled to one baseline."
        />
        <button onClick={() => setShowAnalyst((v) => !v)} style={toggleBtn(showAnalyst)} title="Show driver-level analyst workbench">
          <SlidersHorizontal size={13} />
          Analyst view
          <ChevronDown size={13} style={{ transform: showAnalyst ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
        </button>
      </div>

      {/* 0 · BOTTOM LINE — the one-sentence verdict ───────────────────── */}
      <VerdictCallout />

      {/* 1 · THE STAKES ─────────────────────────────────────────────── */}
      <SectionLabel step={1} title="The stakes" hint="Where the Group sits today, under stress, and if nothing is done" />
      <ExposureClimax />

      {/* 2 · STRESS TEST (single engine, pre-run) ────────────────────── */}
      <SectionLabel step={2} title="Stress test" hint="Opens on the most material scenario — explore others or run the AI view" />
      <StressTestStudio />

      {/* 3 · THE DECISION ────────────────────────────────────────────── */}
      <SectionLabel step={3} title="The decision" hint="What it costs to do nothing, the recommended response, and where to route it" />
      <CostOfInactionPanel />

      {/* Reference — baseline & sources (collapsed) */}
      <Disclosure open={showBaseline} onToggle={() => setShowBaseline((v) => !v)} label="Baseline & sources" hint="FY24 → FY25 anchors behind every figure above">
        <BaselineComparisonPanel />
      </Disclosure>

      {/* Analyst workbench — driver-level depth, on demand */}
      <AnimatePresence>
        {showAnalyst && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
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
// 0 · VERDICT — plain-English answer up top
// ════════════════════════════════════════════════════════════════════════
function VerdictCallout() {
  return (
    <section
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: '4px solid var(--accent-primary)',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 18,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 320 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-primary)' }}>
            Bottom line
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#B8860B', background: 'rgba(245,197,24,0.14)', border: '1px solid rgba(245,197,24,0.45)', padding: '1px 7px', borderRadius: 999, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Illustrative
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.5, color: 'var(--text-primary)', fontWeight: 600, maxWidth: 900 }}>
          Under a severe combined shock, Group net-unhedged exposure rises from{' '}
          <b>{formatCurrencyShort(BASELINE_EXPOSURE, 'AED')}</b> to{' '}
          <b style={{ color: 'var(--risk-high)' }}>{formatCurrencyShort(INACTION_EXPOSURE, 'AED')}</b>. Doing nothing for 12 months
          costs ≈ <b style={{ color: 'var(--risk-high)' }}>{formatCurrencyShort(COST_OF_INACTION, 'AED')}</b>.{' '}
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            Recommendation — approve the Tier-1 response (≈ {formatCurrencyShort(COST_TO_ACT, 'AED')}) and route it for board sign-off.
          </span>
        </p>
      </div>
      <Link
        href="/respond/approvals"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: 'var(--accent-primary)',
          color: 'var(--on-accent)',
          border: 'none',
          padding: '10px 16px',
          borderRadius: 8,
          fontSize: 12.5,
          fontWeight: 700,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Route the decision
        <ArrowRight size={15} />
      </Link>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════
// 2 · STRESS TEST STUDIO — pre-run deterministic default + optional AI view
// ════════════════════════════════════════════════════════════════════════
function StressTestStudio() {
  const [selectedScenario, setSelectedScenario] = useState<string>(MOST_MATERIAL.id)
  const [intensity, setIntensity] = useState<Intensity>('severe')
  const [showExplore, setShowExplore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [calcCtx, setCalcCtx] = useState<FinancialCalcContext | null>(null)

  const scenario = scenarioTemplates.find((s) => s.id === selectedScenario) || MOST_MATERIAL
  const factor = INTENSITY_CONFIG[intensity].factor

  // Deterministic, instant impact preview (no API, fully reconcilable).
  const detData = useMemo(
    () =>
      scenario.estimatedImpact.map((pi) => ({
        name: portfolioNames[pi.portfolio as Portfolio] || pi.portfolio,
        impact: Math.round(Math.abs(pi.impactAED) * factor),
      })),
    [scenario, factor],
  )
  const detTotal = detData.reduce((sum, d) => sum + d.impact, 0)

  const runSimulation = async () => {
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
          parameters: { intensity, duration: scenario.parameters.duration, probability: scenario.parameters.probability },
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

  const pick = (id: string) => {
    setSelectedScenario(id)
    setResult(null)
    setError(null)
    setShowExplore(false)
  }

  return (
    <Card>
      <CardBody>
        {/* Header: scenario + intensity + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
              Most material scenario
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{scenario.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {scenario.category} · base probability {Math.round(scenario.parameters.probability * 100)}% · {scenario.parameters.duration}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['mild', 'moderate', 'severe'] as Intensity[]).map((i) => {
                const cfg = INTENSITY_CONFIG[i]
                const active = intensity === i
                return (
                  <button
                    key={i}
                    onClick={() => { setIntensity(i); setResult(null) }}
                    style={{
                      padding: '6px 13px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      border: active ? `1.5px solid ${cfg.color}` : '1px solid var(--border-color)',
                      background: active ? `${cfg.color}18` : 'var(--bg-secondary)',
                      color: active ? cfg.color : 'var(--text-muted)', transition: 'all 120ms',
                    }}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setShowExplore((v) => !v)} style={ghostBtn(showExplore)}>
              {showExplore ? 'Hide scenarios' : 'Explore scenarios'}
              <ChevronDown size={13} style={{ transform: showExplore ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
            </button>
          </div>
        </div>

        {/* Explore — the full picker, collapsed by default */}
        <AnimatePresence>
          {showExplore && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10, marginBottom: 16 }}>
                {scenarioTemplates.map((s) => {
                  const isSel = selectedScenario === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => pick(s.id)}
                      style={{
                        textAlign: 'left', padding: '12px 13px', borderRadius: 10, cursor: 'pointer',
                        background: isSel ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                        border: isSel ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        transition: 'all 120ms', display: 'flex', flexDirection: 'column', gap: 6,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isSel ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{s.category}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>p={Math.round(s.parameters.probability * 100)}%</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--risk-high)', fontWeight: 700 }}>~{formatCurrencyShort(scenarioTotal(s), 'AED')} est. impact</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deterministic impact (always shown — pre-run) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 0.9fr) 1.6fr', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
              Modelled Group impact · {INTENSITY_CONFIG[intensity].label}
            </div>
            <div style={{ fontSize: 'clamp(26px,3vw,34px)', fontWeight: 700, color: 'var(--risk-high)', letterSpacing: '-0.02em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrencyShort(detTotal * 1e6, 'AED')}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.45, maxWidth: 280 }}>
              Illustrative impact across portfolios at {INTENSITY_CONFIG[intensity].label.toLowerCase()} intensity.
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <ViewCalcButton onClick={() => setCalcCtx({ type: 'scenario_impact', scenarioId: scenario.id, value: detTotal })} />
              <button onClick={runSimulation} disabled={loading} className="btn-primary flex items-center gap-2" style={{ justifyContent: 'center' }}>
                {loading ? (<><Loader2 size={15} className="animate-spin" />Modelling…</>) : (<><Sparkles size={15} />Run AI stress test</>)}
              </button>
            </div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 12 }}>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={detData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }} formatter={(v) => [`AED ${v}M`, 'Impact']} />
                <Bar dataKey="impact" radius={[4, 4, 0, 0]}>
                  {detData.map((_, i) => (<Cell key={i} fill="var(--risk-high)" fillOpacity={0.72 + i * 0.05} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.3)', color: 'var(--risk-critical)', fontSize: 13 }}>{error}</div>
        )}

        {/* AI enrichment (optional, badged) */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16, borderTop: '1px solid var(--border-color)', paddingTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>AI stress view — {scenario.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AIHypothesisBadge />
                  <ConfidenceBadge confidence={result.confidence} />
                </div>
              </div>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
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
                {result.mitigationStrategies?.length > 0 && (
                  <div style={panel}>
                    <PanelTitle icon={<Shield size={13} style={{ color: 'var(--accent-primary)' }} />}>Recommended Mitigations</PanelTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {result.mitigationStrategies.slice(0, 4).map((m, i) => (
                        <div key={i} style={{ padding: 12, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                            <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>{i + 1}. {m.strategy}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{m.timeToImplement}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Owner: <span style={{ color: 'var(--accent-primary)' }}>{m.owner}</span></span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Cost: {m.costAED}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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

// ─── presentational helpers ─────────────────────────────────────────────
function SectionLabel({ step, title, hint }: { step?: number; title: string; hint: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
      {step != null && (
        <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-primary)', color: 'var(--on-accent)', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{step}</span>
      )}
      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</span>
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{hint}</span>
    </div>
  )
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
    <span title="AI-generated from illustrative baselines — not yet approved by a human owner" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#B8860B', background: 'rgba(245,197,24,0.16)', border: '1px solid rgba(245,197,24,0.5)', padding: '3px 8px', borderRadius: 999 }}>
      <Sparkles size={10} />
      AI Hypothesis · pending approval
    </span>
  )
}

function Disclosure({ open, onToggle, label, hint, children }: { open: boolean; onToggle: () => void; label: string; hint: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer' }}>
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

const panel: React.CSSProperties = { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }

function toggleBtn(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
    border: active ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
    background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)', transition: 'all 120ms',
  }
}

function ghostBtn(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
    border: '1px solid var(--border-color)',
    background: active ? 'var(--bg-hover)' : 'transparent',
    color: 'var(--text-secondary)', transition: 'all 120ms',
  }
}
