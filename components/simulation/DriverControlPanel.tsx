'use client'

import React from 'react'
import { useSimulation } from '@/lib/context/SimulationContext'

export function DriverControlPanel() {
  const { drivers, setDriverValue, resetDrivers, mode } = useSimulation()

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 8,
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: 0.3 }}>
            Driver Controls
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Adjust any driver to simulate impact across the risk portfolio. Mode: <b>{mode}</b>
          </div>
        </div>
        <button
          onClick={resetDrivers}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            padding: '6px 12px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        {drivers.map((d) => {
          const pct = (d.deltaPct * 100).toFixed(1)
          const min = Math.min(d.sliderMin, d.sliderMax)
          const max = Math.max(d.sliderMin, d.sliderMax)
          const sliderValue = d.id === 'DRV-05' ? d.adjustedValue : d.adjustedValue - d.baseValue
          return (
            <div key={d.id} style={{ borderRadius: 6, background: 'var(--bg-primary)', padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {d.name}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color:
                      d.deltaPct > 0.001
                        ? 'var(--risk-high)'
                        : d.deltaPct < -0.001
                        ? 'var(--risk-low)'
                        : 'var(--text-tertiary)',
                  }}
                >
                  {d.id === 'DRV-05'
                    ? `${d.adjustedValue} days`
                    : `${d.deltaPct >= 0 ? '+' : ''}${pct}%`}
                </span>
              </div>

              <input
                type="range"
                min={min}
                max={max}
                step={1}
                value={sliderValue}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  const next = d.id === 'DRV-05' ? v : d.baseValue + v
                  setDriverValue(d.id, next)
                }}
                style={{ width: '100%', marginTop: 8, accentColor: 'var(--accent-primary)' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)' }}>
                <span>Base: {d.baseValue}{d.unit === '%' ? '%' : d.unit === 'days' ? '' : ''}</span>
                <span>Now: {d.adjustedValue.toFixed(d.id === 'DRV-05' ? 0 : 1)}{d.unit === '%' ? '%' : ''}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
