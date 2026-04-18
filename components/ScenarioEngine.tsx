'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, RotateCcw, Loader2, ChevronRight, AlertTriangle, TrendingDown,
  ArrowDown, ArrowUp, Minus,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { QUICK_SCENARIO_LIST, QUICK_SCENARIOS, type QuickScenario } from '@/lib/scenarios'
import { internalSnapshot } from '@/lib/internalData'
import type { ScenarioImpactResponse } from '@/app/api/scenario-impact/route'

// ─── Severity colours ─────────────────────────────────────────────────────────
const SEV_COLOR: Record<string, string> = {
  critical: 'var(--risk-critical)',
  high: 'var(--risk-high)',
  medium: 'var(--risk-medium)',
}

// ─── KPI card definitions ─────────────────────────────────────────────────────
interface KPICard {
  id: string
  label: string
  portfolio: string
  baseValue: number
  unit: string
  format: (v: number) => string
  getDelta: (s: QuickScenario) => number | undefined
  direction: 'lower-is-worse' | 'higher-is-worse'
}

const KPI_CARDS: KPICard[] = [
  {
    id: 'occupancy',
    label: 'Hotel Occupancy',
    portfolio: 'Hospitality',
    baseValue: internalSnapshot.hospitality.occupancyRate,
    unit: '%',
    format: (v) => `${v.toFixed(1)}%`,
    getDelta: (s) => s.deltas.hospitality?.occupancyRate,
    direction: 'lower-is-worse',
  },
  {
    id: 'cashflow',
    label: 'Cash Flow vs Budget',
    portfolio: 'Finance',
    baseValue: internalSnapshot.finance.cashFlowVariance,
    unit: '%',
    format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`,
    getDelta: (s) => s.deltas.finance?.cashFlowVariance,
    direction: 'lower-is-worse',
  },
  {
    id: 'critical',
    label: 'Critical Risks',
    portfolio: 'Risk Register',
    baseValue: internalSnapshot.riskRegister.criticalRisks,
    unit: '',
    format: (v) => `${Math.max(0, Math.round(v))}`,
    getDelta: (s) => s.deltas.riskRegister?.criticalRisks,
    direction: 'higher-is-worse',
  },
  {
    id: 'tenants',
    label: 'Stressed Tenants',
    portfolio: 'Retail',
    baseValue: internalSnapshot.retail.stressedTenants,
    unit: '',
    format: (v) => `${Math.max(0, Math.round(v))}`,
    getDelta: (s) => s.deltas.retail?.stressedTenants,
    direction: 'higher-is-worse',
  },
  {
    id: 'offplan',
    label: 'Off-Plan Sales',
    portfolio: 'Real Estate',
    baseValue: internalSnapshot.realEstate.offPlanSales,
    unit: ' units',
    format: (v) => `${Math.max(0, Math.round(v))} units`,
    getDelta: (s) => s.deltas.realEstate?.offPlanSales,
    direction: 'lower-is-worse',
  },
]

// ─── Animated KPI tile ────────────────────────────────────────────────────────
function KPITile({
  card,
  activeScenario,
}: {
  card: KPICard
  activeScenario: QuickScenario | null
}) {
  const delta = activeScenario ? (card.getDelta(activeScenario) ?? 0) : 0
  const scenarioValue = card.baseValue + delta
  const hasChange = delta !== 0
  const isWorse =
    (card.direction === 'lower-is-worse' && delta < 0) ||
    (card.direction === 'higher-is-worse' && delta > 0)

  const stressColor = isWorse ? 'var(--risk-high)' : delta === 0 ? 'var(--text-primary)' : 'var(--risk-low)'

  return (
    <motion.div
      animate={hasChange ? { scale: [1, 1.03, 1] } : {}}
      transition={{ duration: 0.4 }}
      style={{
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: hasChange && isWorse
          ? 'rgba(255,107,107,0.06)'
          : 'var(--bg-secondary)',
        border: `1px solid ${hasChange && isWorse ? 'rgba(255,107,107,0.25)' : 'var(--border-color)'}`,
        transition: 'background-color 0.3s, border-color 0.3s',
      }}
    >
      {/* Portfolio label */}
      <div
        style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '4px',
        }}
      >
        {card.portfolio}
      </div>

      {/* KPI label */}
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '10px' }}>
        {card.label}
      </div>

      {/* Base value → Scenario value */}
      <div className="flex items-end gap-2">
        <motion.div
          key={activeScenario?.id ?? 'base'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            lineHeight: 1,
            color: activeScenario ? stressColor : 'var(--text-primary)',
          }}
        >
          {card.format(activeScenario ? scenarioValue : card.baseValue)}
        </motion.div>

        {/* Delta badge */}
        {activeScenario && delta !== 0 && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: stressColor,
              paddingBottom: '2px',
            }}
          >
            {delta < 0 ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
            {Math.abs(delta)}{card.unit}
          </motion.div>
        )}

        {activeScenario && delta === 0 && (
          <Minus size={12} style={{ color: 'var(--text-muted)', paddingBottom: '2px' }} />
        )}
      </div>

      {/* Base label */}
      {activeScenario && delta !== 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '4px' }}>
          Base: {card.format(card.baseValue)}
        </div>
      )}
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ScenarioEngine() {
  const [activeScenario, setActiveScenario] = useState<QuickScenario | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiResult, setAiResult] = useState<ScenarioImpactResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activateScenario = useCallback(async (scenario: QuickScenario) => {
    // Toggle off if same scenario clicked
    if (activeScenario?.id === scenario.id) {
      setActiveScenario(null)
      setAiResult(null)
      setError(null)
      return
    }

    setActiveScenario(scenario)
    setAiResult(null)
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/scenario-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          portfolioState: internalSnapshot,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAiResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI analysis unavailable')
    } finally {
      setLoading(false)
    }
  }, [activeScenario])

  const reset = useCallback(() => {
    setActiveScenario(null)
    setAiResult(null)
    setError(null)
    setLoading(false)
  }, [])

  const urgencyColor = aiResult ? SEV_COLOR[aiResult.urgency] : 'var(--text-muted)'

  return (
    <Card accent glow>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: 'var(--accent-primary)' }} />
          <CardTitle>Quick Scenario Engine</CardTitle>
          {activeScenario && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '5px',
                backgroundColor: `${activeScenario.color}20`,
                color: activeScenario.color,
                border: `1px solid ${activeScenario.color}40`,
              }}
            >
              {activeScenario.name} Active
            </motion.span>
          )}
          {!activeScenario && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '5px',
                backgroundColor: 'rgba(34,197,94,0.1)',
                color: 'var(--risk-low)',
                border: '1px solid rgba(34,197,94,0.25)',
              }}
            >
              Base Case
            </span>
          )}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          One-click scenario activation — live KPI mutation + AI propagation analysis
        </span>
      </CardHeader>

      <CardBody>
        {/* Quick-fire buttons */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {QUICK_SCENARIO_LIST.map((s) => {
            const isActive = activeScenario?.id === s.id
            return (
              <motion.button
                key={s.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => activateScenario(s)}
                disabled={loading}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  border: isActive
                    ? `2px solid ${s.color}`
                    : '1px solid var(--border-color)',
                  backgroundColor: isActive ? `${s.color}18` : 'var(--bg-secondary)',
                  color: isActive ? s.color : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                  opacity: loading && !isActive ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {loading && isActive ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isActive ? s.color : 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  />
                )}
                {s.name}
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    opacity: 0.75,
                    color: isActive ? s.color : 'var(--text-muted)',
                  }}
                >
                  {s.impactLevel.toUpperCase()}
                </span>
              </motion.button>
            )
          })}

          {activeScenario && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={reset}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-hover)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s',
              }}
            >
              <RotateCcw size={12} />
              Reset
            </motion.button>
          )}
        </div>

        {/* Tagline */}
        <AnimatePresence mode="wait">
          {activeScenario && (
            <motion.div
              key={activeScenario.id + '-tag'}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: `${activeScenario.color}0e`,
                border: `1px solid ${activeScenario.color}30`,
                marginBottom: '16px',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={13} style={{ color: activeScenario.color, flexShrink: 0 }} />
                <span style={{ color: activeScenario.color, fontSize: '0.8rem', fontWeight: 600 }}>
                  {activeScenario.tagline}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '5px', lineHeight: 1.5, paddingLeft: '21px' }}>
                {activeScenario.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          {KPI_CARDS.map((card) => (
            <KPITile key={card.id} card={card} activeScenario={activeScenario} />
          ))}
        </div>

        {/* Financial impact strip */}
        <AnimatePresence>
          {activeScenario && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              {[
                {
                  label: 'Est. Revenue Impact',
                  value: `–AED ${activeScenario.totalImpactAED}M`,
                  color: 'var(--risk-high)',
                },
                {
                  label: '% of Total Revenue',
                  value: `${activeScenario.impactPct}%`,
                  color: 'var(--risk-medium)',
                },
                {
                  label: 'Impact Level',
                  value: activeScenario.impactLevel.toUpperCase(),
                  color: SEV_COLOR[activeScenario.impactLevel],
                },
                {
                  label: 'Portfolios Affected',
                  value: activeScenario.affectedPortfolios.length.toString(),
                  color: 'var(--accent-primary)',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {item.label}
                  </div>
                  <div style={{ color: item.color, fontSize: '1rem', fontWeight: 800 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI loading */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 18px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                AI is modelling propagation chain across Aldar portfolios...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255,59,59,0.08)',
              border: '1px solid rgba(255,59,59,0.25)',
              color: 'var(--risk-critical)',
              fontSize: '0.8rem',
            }}
          >
            {error}
          </div>
        )}

        {/* AI Result */}
        <AnimatePresence>
          {aiResult && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Explanation + urgency */}
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: `1px solid ${urgencyColor}30`,
                  borderLeft: `3px solid ${urgencyColor}`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={13} style={{ color: urgencyColor }} />
                    <span style={{ color: urgencyColor, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {aiResult.urgency} — AI Scenario Analysis
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                    Confidence {Math.round(aiResult.confidence * 100)}%
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 1.65 }}>
                  {aiResult.explanation}
                </p>
              </div>

              {/* Propagation chain */}
              {aiResult.propagationChain.length > 0 && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Risk Propagation Chain
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {aiResult.propagationChain.map((step, i) => (
                      <div key={step.step} style={{ display: 'flex', alignItems: 'stretch', gap: '12px' }}>
                        {/* Step number + connector line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: `${SEV_COLOR[step.severity]}18`,
                              border: `2px solid ${SEV_COLOR[step.severity]}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              color: SEV_COLOR[step.severity],
                              flexShrink: 0,
                              zIndex: 1,
                            }}
                          >
                            {step.step}
                          </div>
                          {i < aiResult.propagationChain.length - 1 && (
                            <div
                              style={{
                                width: '2px',
                                flex: 1,
                                minHeight: '16px',
                                backgroundColor: 'var(--border-color)',
                                margin: '2px 0',
                              }}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <motion.div
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          style={{
                            flex: 1,
                            paddingBottom: i < aiResult.propagationChain.length - 1 ? '12px' : '0',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                              {step.trigger}
                            </span>
                            <ChevronRight size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          </div>
                          <div style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                            {step.effect}
                          </div>
                        </motion.div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Affected BUs */}
              {aiResult.affectedBUs.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap" style={{ paddingTop: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Affected:</span>
                  {aiResult.affectedBUs.map((bu) => (
                    <span
                      key={bu}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '3px 9px',
                        borderRadius: '5px',
                        backgroundColor: 'var(--bg-hover)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {bu}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!activeScenario && !loading && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Select a scenario above to activate live KPI mutation and AI propagation analysis
          </div>
        )}
      </CardBody>
    </Card>
  )
}
