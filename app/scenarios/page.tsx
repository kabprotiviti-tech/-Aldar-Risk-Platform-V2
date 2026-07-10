'use client'

/**
 * Scenario Analysis — factor-based, single-flow (CEO-grade).
 * -----------------------------------------------------------
 *   0 · Bottom line   → <VerdictCallout/> (the answer, one sentence)
 *   1 · The stakes    → <ExposureClimax/> (baseline → stress → inaction bridge)
 *   2 · Stress test   → <DriverScenarioBuilder/> — leadership composes a scenario
 *        from Aldar's key drivers (sliders), clicks Run, and sees the modelled
 *        exposure WITH the calculation shown line-by-line.
 *   3 · The decision  → <CostOfInactionPanel/> (response plan + route)
 * Plus on-demand depth: Baseline & sources + analyst Intelligence Workbench.
 *
 * All headline numbers derive from lib/data/scenarioInaction (single source of
 * truth); driver sensitivities are illustrative and labelled as such.
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Play, ChevronDown, SlidersHorizontal, ArrowRight, RotateCcw, Info, Save, X, Check } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { SavedScenariosProvider, useSavedScenarios } from '@/lib/context/SavedScenariosContext'
import { CostOfInactionPanel } from '@/components/scenarios/CostOfInactionPanel'
import { DecisionIntelligencePanel } from '@/components/scenarios/DecisionIntelligencePanel'
import { ExposureClimax } from '@/components/scenarios/ExposureClimax'
import { recordAiSuggestion } from '@/lib/context/AuditTrailContext'
import { SimulationWorkbench } from '@/components/simulation/SimulationWorkbench'
import { BaselineComparisonPanel } from '@/components/scenarios/BaselineComparisonPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatCurrencyShort } from '@/lib/utils/formatters'
import { portfolioNames, type Portfolio } from '@/lib/simulated-data'
import { BASELINE_RISK_POSTURE } from '@/lib/data/baselineRiskPosture'
import { BASELINE_EXPOSURE, INACTION_EXPOSURE, STRESSED_EXPOSURE, COST_OF_INACTION, COST_TO_ACT } from '@/lib/data/scenarioInaction'
import { SCENARIO_DRIVERS, SCENARIO_PRESETS, type ScenarioDriver } from '@/lib/data/scenarioDrivers'

const PORTFOLIOS: Portfolio[] = ['real-estate', 'retail', 'hospitality', 'education', 'facilities']
const BASE_M = BASELINE_EXPOSURE / 1e6
const CEILING_M = BASELINE_RISK_POSTURE.netUnhedgedAppetiteCeiling / 1e6
const REFERENCE_SEVERE_M = STRESSED_EXPOSURE / 1e6 // the bridge's fixed "reference severe scenario"
const aedM = (m: number) => formatCurrencyShort(m * 1e6, 'AED')

// ════════════════════════════════════════════════════════════════════════
export default function ScenariosPage() {
  return (
    <SavedScenariosProvider>
      <ScenariosPageContent />
    </SavedScenariosProvider>
  )
}

function ScenariosPageContent() {
  const [showBaseline, setShowBaseline] = useState(false)
  const [showAnalyst, setShowAnalyst] = useState(false)

  return (
    <div className="space-y-6" style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <PageHeader eyebrow="What-if" title="Scenario Analysis" subtitle="The answer first, then the workings: the stakes, a driver-based stress test, and the decision — all reconciled to one baseline." />
        <button onClick={() => setShowAnalyst((v) => !v)} style={toggleBtn(showAnalyst)} title="Show driver-level analyst workbench">
          <SlidersHorizontal size={13} /> Analyst view
          <ChevronDown size={13} style={{ transform: showAnalyst ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
        </button>
      </div>

      <VerdictCallout />

      <SectionLabel step={1} title="The stakes" hint="Where the Group sits today, under stress, and if nothing is done" />
      <ExposureClimax />

      <SectionLabel step={2} title="Stress test" hint="Compose a scenario from Aldar's key drivers, then run it — the calculation is shown" />
      <DriverScenarioBuilder />

      <SectionLabel step={3} title="The decision" hint="What it costs to do nothing, the recommended response, and where to route it" />
      <CostOfInactionPanel />

      <Disclosure open={showBaseline} onToggle={() => setShowBaseline((v) => !v)} label="Baseline & sources" hint="FY24 → FY25 anchors behind every figure above">
        <BaselineComparisonPanel />
      </Disclosure>

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
// 0 · VERDICT
// ════════════════════════════════════════════════════════════════════════
function VerdictCallout() {
  return (
    <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-primary)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 320 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-primary)' }}>Bottom line</span>
          <IllustrativePill />
        </div>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.5, color: 'var(--text-primary)', fontWeight: 600, maxWidth: 900 }}>
          If a severe shock hits, Group exposure goes from <b>{formatCurrencyShort(BASELINE_EXPOSURE, 'AED')}</b> to <b style={{ color: 'var(--risk-high)' }}>{formatCurrencyShort(INACTION_EXPOSURE, 'AED')}</b>. Waiting 12 months instead of acting costs about <b style={{ color: 'var(--risk-high)' }}>{formatCurrencyShort(COST_OF_INACTION, 'AED')}</b>.{' '}
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Acting now — the immediate actions below — costs about {formatCurrencyShort(COST_TO_ACT, 'AED')} and needs board sign-off.</span>
        </p>
      </div>
      <Link href="/respond/approvals" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--accent-primary)', color: 'var(--on-accent)', padding: '10px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
        Route the decision <ArrowRight size={15} />
      </Link>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════
// 2 · DRIVER SCENARIO BUILDER — the playable stress test
// ════════════════════════════════════════════════════════════════════════
function DriverScenarioBuilder() {
  const { scenarios: saved, saveScenario, removeScenario } = useSavedScenarios()
  const [values, setValues] = useState<Record<string, number>>({})
  const [showAll, setShowAll] = useState(false)
  const [ran, setRan] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [activeSaved, setActiveSaved] = useState<string | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const setDriver = (k: string, v: number) => {
    setValues((p) => ({ ...p, [k]: v }))
    setActivePreset(null)
    setActiveSaved(null)
  }
  const applyPreset = (id: string, vals: Record<string, number>) => {
    setValues({ ...vals })
    setActivePreset(id)
    setActiveSaved(null)
    setRan(false)
  }
  const applySaved = (id: string, vals: Record<string, number>) => {
    setValues({ ...vals })
    setActiveSaved(id)
    setActivePreset(null)
    setRan(false)
  }
  const reset = () => { setValues({}); setActivePreset(null); setActiveSaved(null); setRan(false) }

  const handleRun = () => {
    setRan(true)
    const drivers = SCENARIO_DRIVERS.filter((d) => (values[d.key] || 0) > 0)
    if (drivers.length > 0) {
      recordAiSuggestion({
        feature: 'Scenario Analysis · Decision Intelligence',
        summary: `Surfaced response options for a ${drivers.length}-driver scenario (${drivers.map((d) => d.label).join(', ')}).`,
        details: { drivers: drivers.map((d) => ({ key: d.key, move: values[d.key] })) },
      })
    }
  }

  const handleSave = (name: string) => {
    const s = saveScenario(name, values)
    setActiveSaved(s.id)
    setShowSaveModal(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2200)
  }

  const active = SCENARIO_DRIVERS.filter((d) => (values[d.key] || 0) > 0)
  const perDriver = active.map((d) => ({ d, v: values[d.key], contrib: values[d.key] * d.aedPerUnit }))
  const totalM = perDriver.reduce((s, x) => s + x.contrib, 0)
  const stressedM = BASE_M + totalM
  const overM = stressedM - CEILING_M

  const chart = PORTFOLIOS.map((p) => ({
    name: portfolioNames[p],
    impact: Math.round(perDriver.reduce((s, x) => s + x.contrib * (x.d.portfolios[p] || 0), 0)),
  })).filter((r) => r.impact > 0)

  const shown = showAll ? SCENARIO_DRIVERS : SCENARIO_DRIVERS.filter((d) => d.headline)

  return (
    <Card>
      <CardBody>
        {/* Presets */}
        <FieldLabel>Start from a scenario <span style={{ textTransform: 'none', fontWeight: 600, color: 'var(--text-tertiary)' }}>— or build your own with the drivers below</span></FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {SCENARIO_PRESETS.map((p) => {
            const on = activePreset === p.id
            return (
              <button key={p.id} onClick={() => applyPreset(p.id, p.values)} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: on ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)', background: on ? 'var(--accent-glow)' : 'var(--bg-secondary)', color: on ? 'var(--accent-primary)' : 'var(--text-secondary)', transition: 'all 120ms' }}>
                {p.name}
              </button>
            )
          })}
        </div>

        {/* Saved scenarios — user-named driver combinations */}
        {saved.length > 0 && (
          <>
            <FieldLabel>Your saved scenarios</FieldLabel>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {saved.map((s) => {
                const on = activeSaved === s.id
                return (
                  <span
                    key={s.id}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999,
                      border: on ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: on ? 'var(--accent-glow)' : 'var(--bg-secondary)', padding: '2px 4px 2px 12px',
                    }}
                  >
                    <button
                      onClick={() => applySaved(s.id, s.values)}
                      style={{ fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'transparent', border: 'none', padding: '4px 0', color: on ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                    >
                      {s.name}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove saved scenario "${s.name}"?`)) {
                          if (activeSaved === s.id) setActiveSaved(null)
                          removeScenario(s.id)
                        }
                      }}
                      title="Remove"
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                )
              })}
            </div>
          </>
        )}

        {/* Drivers */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <FieldLabel>Drivers <span style={{ textTransform: 'none', fontWeight: 600, color: 'var(--text-tertiary)' }}>· drag to set each move</span></FieldLabel>
          {active.length > 0 && (
            <button onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px 22px' }}>
          {shown.map((d) => (
            <DriverRow key={d.key} d={d} value={values[d.key] || 0} onChange={(v) => setDriver(d.key, v)} />
          ))}
        </div>
        {SCENARIO_DRIVERS.some((d) => !d.headline) && (
          <button onClick={() => setShowAll((v) => !v)} style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            {showAll ? 'Show fewer drivers' : `+ ${SCENARIO_DRIVERS.filter((d) => !d.headline).length} more drivers`}
            <ChevronDown size={13} style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
          </button>
        )}

        {/* Run bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
            {active.length === 0 ? 'No drivers set yet — pick a preset or drag a driver.' : (
              <><b style={{ color: 'var(--text-primary)' }}>{active.length}</b> driver{active.length > 1 ? 's' : ''} in this scenario</>
            )}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {justSaved && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: 'var(--risk-low)' }}>
                <Check size={13} /> Saved
              </span>
            )}
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={active.length === 0}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, cursor: active.length === 0 ? 'not-allowed' : 'pointer',
                background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 8, padding: '9px 14px',
                color: 'var(--text-secondary)', opacity: active.length === 0 ? 0.5 : 1,
              }}
            >
              <Save size={14} /> Save scenario
            </button>
            <button onClick={handleRun} disabled={active.length === 0} className="btn-primary flex items-center gap-2" style={{ opacity: active.length === 0 ? 0.5 : 1, cursor: active.length === 0 ? 'not-allowed' : 'pointer' }}>
              <Play size={15} /> Run scenario
            </button>
          </div>
        </div>

        {/* Result + calculation */}
        <AnimatePresence>
          {ran && active.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 0.95fr) 1.6fr', gap: 18, alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Stressed net-unhedged exposure</span>
                    <IllustrativePill />
                  </div>
                  <div style={{ fontSize: 'clamp(28px,3.2vw,38px)', fontWeight: 700, color: 'var(--risk-high)', letterSpacing: '-0.02em', lineHeight: 1.02, fontVariantNumeric: 'tabular-nums' }}>{aedM(stressedM)}</div>
                  <div style={{ fontSize: 12.5, color: overM > 0 ? 'var(--risk-high)' : 'var(--risk-low)', fontWeight: 700, marginTop: 6 }}>
                    {overM > 0 ? `${aedM(overM)} over board appetite` : `Within board appetite`}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 8, lineHeight: 1.45, maxWidth: 300 }}>
                    {active.length} driver move{active.length > 1 ? 's' : ''} applied on top of the baseline above —{' '}
                    {stressedM < REFERENCE_SEVERE_M
                      ? 'milder than the reference severe scenario.'
                      : stressedM > REFERENCE_SEVERE_M
                        ? 'harsher than the reference severe scenario.'
                        : 'matches the reference severe scenario.'}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 12 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chart} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }} formatter={(v) => [`AED ${v}M`, 'Impact']} />
                      <Bar dataKey="impact" radius={[4, 4, 0, 0]}>
                        {chart.map((_, i) => (<Cell key={i} fill="var(--risk-high)" fillOpacity={0.72 + i * 0.05} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Calculation — line by line, behind a toggle */}
              <div>
                <button onClick={() => setShowCalc((v) => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--accent-primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <Info size={13} />
                  {showCalc ? 'Hide calculation' : 'Show calculation'}
                  <ChevronDown size={13} style={{ transform: showCalc ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
                </button>
                <AnimatePresence>
                  {showCalc && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden', marginTop: 10 }}>
                        <CalcRow head cols={['Driver', 'Your input', 'Sensitivity (illustrative)', 'AED impact']} />
                        <CalcRow cols={['Baseline net-unhedged exposure', '—', '—', aedM(BASE_M)]} muted />
                        {perDriver.map(({ d, v, contrib }) => (
                          <CalcRow key={d.key} title={d.basis} cols={[d.label, `${v} ${d.unit}`, `${d.aedPerUnit} AED M / ${d.unit === 'bps' ? 'bp' : '%'}`, `+ ${aedM(contrib)}`]} />
                        ))}
                        <CalcRow cols={['Stressed net-unhedged exposure', '', '', aedM(stressedM)]} total />
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: 8, lineHeight: 1.5 }}>
                        Sensitivities are illustrative (AED-million Group impact per unit of each driver), pending calibration against Aldar&rsquo;s books in pilot. Hover a driver for its basis. Impact splits across portfolios by each driver&rsquo;s exposure weighting.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Decision intelligence — response options for this scenario */}
              <div style={{ marginTop: 4 }}>
                <SectionLabel title="What can we do about it?" hint="Response options mapped to your drivers, ranked by return on effort" />
                <div style={{ marginTop: 12 }}>
                  <DecisionIntelligencePanel
                    driverContribM={Object.fromEntries(perDriver.map(({ d, contrib }) => [d.key, contrib]))}
                    totalStressM={totalM}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardBody>

      {showSaveModal && (
        <SaveScenarioModal
          driverCount={active.length}
          onSave={handleSave}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </Card>
  )
}

function SaveScenarioModal({
  driverCount,
  onSave,
  onClose,
}: {
  driverCount: number
  onSave: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const canSave = name.trim().length > 0

  return (
    <Modal open onClose={onClose} ariaLabel="Save scenario" size="sm">
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>
            Stress test
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Save this scenario</h3>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
            {driverCount} driver{driverCount > 1 ? 's' : ''} set. Give it a name so leadership can reload it later.
          </p>
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
          <span>Scenario name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q3 Board Downside Case"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter' && canSave) onSave(name.trim()) }}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', padding: '8px 10px', fontSize: 13 }}
          />
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6 }}>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '8px 14px', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => canSave && onSave(name.trim())}
            disabled={!canSave}
            style={{ background: 'var(--accent-primary)', color: 'var(--on-accent)', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', cursor: canSave ? 'pointer' : 'not-allowed', opacity: canSave ? 1 : 0.5 }}
          >
            Save scenario
          </button>
        </div>
      </div>
    </Modal>
  )
}

function DriverRow({ d, value, onChange }: { d: ScenarioDriver; value: number; onChange: (v: number) => void }) {
  const on = value > 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }} title={d.basis}>{d.label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: on ? 'var(--risk-high)' : 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
          {value}{d.unit === 'bps' ? ' bps' : '%'}
        </span>
      </div>
      <input type="range" min={d.min} max={d.max} step={d.step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={d.label} style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }} />
    </div>
  )
}

function CalcRow({ cols, head, total, muted, title }: { cols: string[]; head?: boolean; total?: boolean; muted?: boolean; title?: string }) {
  return (
    <div title={title} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.6fr 1.1fr', gap: 10, padding: '9px 14px', alignItems: 'center', background: head ? 'var(--bg-primary)' : total ? 'var(--accent-glow)' : 'transparent', borderTop: head ? 'none' : '1px solid var(--border-color)' }}>
      {cols.map((c, i) => (
        <span key={i} style={{
          fontSize: head ? 10 : 12.5,
          fontWeight: head ? 700 : total ? 800 : i === 0 ? 600 : 500,
          letterSpacing: head ? '0.06em' : undefined,
          textTransform: head ? 'uppercase' : undefined,
          color: head ? 'var(--text-muted)' : muted ? 'var(--text-tertiary)' : total ? 'var(--text-primary)' : i === 3 ? 'var(--risk-high)' : 'var(--text-secondary)',
          textAlign: i === 0 ? 'left' : i === 3 ? 'right' : 'left',
          fontVariantNumeric: i >= 1 ? 'tabular-nums' : undefined,
        }}>{c}</span>
      ))}
    </div>
  )
}

// ─── shared helpers ─────────────────────────────────────────────────────
function IllustrativePill() {
  return <span style={{ fontSize: 9, fontWeight: 700, color: '#B8860B', background: 'rgba(245,197,24,0.14)', border: '1px solid rgba(245,197,24,0.45)', padding: '1px 7px', borderRadius: 999, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Illustrative</span>
}

function SectionLabel({ step, title, hint }: { step?: number; title: string; hint: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
      {step != null && <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-primary)', color: 'var(--on-accent)', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{step}</span>}
      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</span>
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{hint}</span>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>{children}</div>
}

function PanelTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{icon}{children}</div>
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

function toggleBtn(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
    border: active ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
    background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)', transition: 'all 120ms',
  }
}
