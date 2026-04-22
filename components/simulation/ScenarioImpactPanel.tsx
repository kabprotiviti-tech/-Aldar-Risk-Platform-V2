'use client'

/**
 * ScenarioImpactPanel
 * -------------------
 * A compact, "at-a-glance" readout that appears when a pre-built scenario is
 * active. Shows:
 *   - Portfolio exposure delta (AED mn + %)
 *   - Narrative for the active scenario
 *   - Top-3 impacted risks by ΔAED
 *   - Drivers changed by this scenario with their %-delta
 *
 * Additive: lives next to the existing BaselineVsSimulationPanel; does not
 * replace it.
 */

import React from 'react'
import { useSimulation } from '@/lib/context/SimulationContext'
import { SCENARIOS, INTENSITY_LABEL } from '@/lib/engine/scenarios'

export function ScenarioImpactPanel() {
  const { activeScenario, drivers, risks, portfolio } = useSimulation()
  if (!activeScenario) return null

  const scenario = SCENARIOS.find((s) => s.id === activeScenario.scenarioId)
  if (!scenario) return null

  const effect = scenario.effects[activeScenario.intensity]
  const touched = scenario.driversTouched
    .map((id) => {
      const d = drivers.find((x) => x.id === id)
      if (!d) return null
      return {
        id,
        name: d.name,
        unit: d.unit,
        effectPct: effect[id] ?? 0,
        adjusted: d.adjustedValue,
        base: d.baseValue,
      }
    })
    .filter(Boolean) as Array<{
      id: string
      name: string
      unit: string
      effectPct: number
      adjusted: number
      base: number
    }>

  const topRisks = [...risks]
    .sort((a, b) => Math.abs(b.deltaExposureAedMn) - Math.abs(a.deltaExposureAedMn))
    .slice(0, 3)

  const deltaUp = portfolio.deltaAedMn >= 0
  const deltaColor = deltaUp ? 'var(--risk-critical)' : 'var(--risk-low)'

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--accent-primary)',
        borderLeft: '3px solid var(--accent-primary)',
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Scenario Active · {INTENSITY_LABEL[activeScenario.intensity]}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
            {scenario.icon} {scenario.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              marginTop: 6,
              maxWidth: 720,
            }}
          >
            {scenario.narrative}
          </div>
        </div>

        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Δ Exposure
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: deltaColor, lineHeight: 1.1 }}>
            {deltaUp ? '+' : ''}
            {portfolio.deltaAedMn.toFixed(0)} <span style={{ fontSize: 12 }}>AED mn</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {deltaUp ? '+' : ''}
            {portfolio.deltaPct.toFixed(1)}% · {portfolio.ratingFrom} → {portfolio.ratingTo}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {/* Top impacted risks */}
        <div
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Top Impacted Risks
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topRisks.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12,
                  gap: 8,
                }}
              >
                <div style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: r.deltaExposureAedMn >= 0 ? 'var(--risk-critical)' : 'var(--risk-low)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.deltaExposureAedMn >= 0 ? '+' : ''}
                  {r.deltaExposureAedMn.toFixed(1)} mn
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drivers changed */}
        <div
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Drivers Moved
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {touched.map((d) => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12,
                  gap: 8,
                }}
              >
                <div style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.name}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: d.effectPct >= 0 ? 'var(--risk-medium)' : 'var(--risk-high)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.effectPct >= 0 ? '+' : ''}
                  {d.effectPct}
                  {d.base === 0 ? ' days' : '%'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
