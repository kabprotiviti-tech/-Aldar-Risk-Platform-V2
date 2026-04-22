'use client'

/**
 * ScenarioSliderPanel
 * -------------------
 * Curated, business-friendly slider controls for 8 key drivers, grouped by
 * theme (Residential / Commercial / Project / Credit).
 *
 * ⚠️ Additive only — this panel does NOT introduce new driver state. It writes
 * directly into the existing drivers via SimulationContext.setDriverValue(),
 * so the existing engine pipeline (risks → exposure → explainability →
 * decision panel) updates in real time without any additional wiring.
 *
 * Ranges here are deliberately narrower / more intuitive than the underlying
 * driver.sliderMin/Max (which are engineering bounds). The input max/min caps
 * manual dragging; scenario presets can still push values further via
 * applyScenario().
 */

import React from 'react'
import { useSimulation } from '@/lib/context/SimulationContext'
import type { DriverId } from '@/lib/engine/types'

interface SliderSpec {
  driverId: DriverId
  label: string
  /** Min slider value, expressed as delta vs. base (or absolute for DRV-05). */
  min: number
  /** Max slider value. */
  max: number
  step?: number
  /** Suffix rendered next to value / delta. */
  unit: '%' | 'days' | 'pp'
  /** If true, slider value is the absolute adjustedValue (DRV-05 semantics). */
  absolute?: boolean
  hint?: string
}

interface SliderGroup {
  title: string
  color: string
  sliders: SliderSpec[]
}

const GROUPS: SliderGroup[] = [
  {
    title: 'Residential',
    color: 'var(--risk-high)',
    sliders: [
      {
        driverId: 'DRV-14',
        label: 'Residential Price Index',
        min: -100,
        max: 0,
        unit: '%',
        hint: 'Fall in avg. selling price vs. plan',
      },
      {
        driverId: 'DRV-02',
        label: 'Residential Sales Volume',
        min: -60,
        max: 0,
        unit: '%',
        hint: 'Drop in units sold vs. budget',
      },
      {
        driverId: 'DRV-09',
        label: 'Residential Occupancy',
        min: -50,
        max: 0,
        unit: 'pp',
        hint: '100% baseline; drag down toward 50%',
      },
    ],
  },
  {
    title: 'Commercial',
    color: 'var(--risk-medium)',
    sliders: [
      {
        driverId: 'DRV-15',
        label: 'Commercial Rent Index',
        min: -100,
        max: 0,
        unit: '%',
        hint: 'Rent re-basing below budget',
      },
      {
        driverId: 'DRV-10',
        label: 'Commercial Occupancy',
        min: -50,
        max: 0,
        unit: 'pp',
        hint: '100% baseline; drag down toward 50%',
      },
    ],
  },
  {
    title: 'Project',
    color: 'var(--accent-primary)',
    sliders: [
      {
        driverId: 'DRV-05',
        label: 'Project Delay',
        min: 0,
        max: 180,
        unit: 'days',
        absolute: true,
        hint: 'Extra calendar days beyond handover',
      },
      {
        driverId: 'DRV-12',
        label: 'Handover Delay',
        min: 0,
        max: 100,
        unit: '%',
        hint: '% of units handed over late',
      },
    ],
  },
  {
    title: 'Credit',
    color: 'var(--risk-critical)',
    sliders: [
      {
        driverId: 'DRV-13',
        label: 'Domestic Default Rate',
        min: 0,
        max: 200,
        unit: '%',
        hint: 'UAE buyer default-rate uplift vs. baseline',
      },
      {
        driverId: 'DRV-16',
        label: 'International Default Rate',
        min: 0,
        max: 200,
        unit: '%',
        hint: 'Overseas buyer default-rate uplift vs. baseline (typically higher in stress)',
      },
    ],
  },
]

function ModeBadge({
  mode,
  scenarioLabel,
}: {
  mode: string
  scenarioLabel: string | null
}) {
  const color =
    mode === 'scenario'
      ? 'var(--accent-primary)'
      : mode === 'custom'
      ? 'var(--risk-high)'
      : 'var(--risk-low)'
  const fg =
    mode === 'scenario'
      ? 'var(--on-accent)'
      : mode === 'custom'
      ? 'var(--on-risk-high, #fff)'
      : 'var(--on-risk-low, #fff)'
  const label =
    mode === 'scenario' && scenarioLabel
      ? `Scenario · ${scenarioLabel}`
      : mode === 'custom'
      ? 'Custom (manual adjustments)'
      : 'Baseline'
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: fg,
        background: color,
        borderRadius: 4,
        padding: '3px 8px',
        textTransform: 'uppercase',
        letterSpacing: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

export function ScenarioSliderPanel() {
  const { drivers, setDriverValue, resetDrivers, mode, activeScenario } = useSimulation()

  const driverById = React.useMemo(() => {
    const m = new Map<DriverId, (typeof drivers)[number]>()
    drivers.forEach((d) => m.set(d.id, d))
    return m
  }, [drivers])

  const scenarioLabel = activeScenario
    ? `${activeScenario.scenarioId.replace(/_/g, ' ').toLowerCase()} · ${activeScenario.intensity}`
    : null

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 10,
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Executive Stress-Test Sliders
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Drag any slider — risks, exposure, decisions and explainability update instantly.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ModeBadge mode={mode} scenarioLabel={scenarioLabel} />
          <button
            onClick={resetDrivers}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              fontSize: 11,
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Reset to Baseline
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 12,
        }}
      >
        {GROUPS.map((group) => (
          <div
            key={group.title}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)',
              borderLeft: `3px solid ${group.color}`,
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: group.color,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {group.title}
            </div>

            {group.sliders.map((spec) => {
              const d = driverById.get(spec.driverId)
              if (!d) return null

              // Current slider value (delta for standard drivers, absolute for DRV-05)
              const sliderValue = spec.absolute
                ? d.adjustedValue
                : d.adjustedValue - d.baseValue

              // Cap the displayed slider position within the requested UI range —
              // but never alter the underlying driver value (scenarios may push
              // it beyond these bounds).
              const displayValue = Math.max(spec.min, Math.min(spec.max, sliderValue))

              // Delta vs. base for the feedback chip
              const deltaDisplay = spec.absolute
                ? `${d.adjustedValue.toFixed(0)} days`
                : `${sliderValue >= 0 ? '+' : ''}${sliderValue.toFixed(0)}${spec.unit === 'pp' ? ' pp' : '%'}`

              const deltaColor =
                Math.abs(sliderValue) < 0.01
                  ? 'var(--text-tertiary)'
                  : sliderValue > 0
                  ? 'var(--risk-high)'
                  : 'var(--risk-low)'

              const baseDisplay = spec.absolute
                ? `${d.baseValue} days`
                : `${d.baseValue}${spec.unit === 'pp' ? ' pp' : '%'}`

              const currentDisplay = spec.absolute
                ? `${d.adjustedValue.toFixed(0)} days`
                : `${d.adjustedValue.toFixed(0)}${spec.unit === 'pp' ? ' pp' : '%'}`

              return (
                <div key={spec.driverId} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {spec.label}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: deltaColor,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Δ {deltaDisplay}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={spec.min}
                    max={spec.max}
                    step={spec.step ?? 1}
                    value={displayValue}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      const next = spec.absolute ? v : d.baseValue + v
                      setDriverValue(spec.driverId, next)
                    }}
                    style={{ width: '100%', accentColor: group.color }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 10,
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    <span>Base {baseDisplay}</span>
                    <span>Now {currentDisplay}</span>
                  </div>

                  {spec.hint && (
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-tertiary)',
                        fontStyle: 'italic',
                      }}
                    >
                      {spec.hint}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
