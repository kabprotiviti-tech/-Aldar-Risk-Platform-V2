'use client'

/**
 * ScenarioControlPanel
 * --------------------
 * Visible, clickable scenario presets. Each scenario exposes three intensity
 * buttons (Mild / Moderate / Severe). Clicking a button loads that preset into
 * the driver state via SimulationContext.applyScenario — the existing engine
 * then re-runs automatically.
 *
 * This panel is 100% additive: it does not modify or replace the driver panel,
 * manual sliders, or the engine itself.
 */

import React from 'react'
import { useSimulation } from '@/lib/context/SimulationContext'
import {
  SCENARIOS,
  INTENSITY_LABEL,
  INTENSITY_COLOR,
  type ScenarioIntensity,
} from '@/lib/engine/scenarios'

const INTENSITIES: ScenarioIntensity[] = ['mild', 'moderate', 'severe']

export function ScenarioControlPanel() {
  const { activeScenario, applyScenario, clearScenario } = useSimulation()

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
            Pre-built Scenarios
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            One click loads a full driver preset. Engine reacts instantly.
          </div>
        </div>
        {activeScenario && (
          <button
            onClick={clearScenario}
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
            Reset to baseline
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {SCENARIOS.map((s) => {
          const isActive = activeScenario?.scenarioId === s.id
          return (
            <div
              key={s.id}
              style={{
                background: 'var(--bg-primary)',
                border: isActive
                  ? '2px solid var(--accent-primary)'
                  : '1px solid var(--border-primary)',
                borderRadius: 8,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {s.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    {s.driversTouched.length} drivers affected
                  </div>
                </div>
                {isActive && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--accent-primary)',
                      borderRadius: 4,
                      padding: '2px 6px',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Active · {INTENSITY_LABEL[activeScenario.intensity]}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  minHeight: 32,
                }}
              >
                {s.summary}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                {INTENSITIES.map((intensity) => {
                  const active =
                    activeScenario?.scenarioId === s.id &&
                    activeScenario.intensity === intensity
                  return (
                    <button
                      key={intensity}
                      onClick={() => applyScenario(s.id, intensity)}
                      style={{
                        flex: 1,
                        background: active ? INTENSITY_COLOR[intensity] : 'var(--bg-secondary)',
                        color: active ? '#fff' : 'var(--text-primary)',
                        border: active
                          ? `1px solid ${INTENSITY_COLOR[intensity]}`
                          : '1px solid var(--border-primary)',
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '7px 0',
                        borderRadius: 5,
                        cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}
                    >
                      {INTENSITY_LABEL[intensity]}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
