'use client'

import React from 'react'
import { useSimulation } from '@/lib/context/SimulationContext'

export function BaselineVsSimulationPanel() {
  const { portfolio, risks } = useSimulation()

  const impactedCount = risks.filter((r) => Math.abs(r.deltaExposureAedMn) > 0.1).length
  const deltaColor =
    portfolio.deltaPct > 1
      ? 'var(--risk-high)'
      : portfolio.deltaPct < -1
      ? 'var(--risk-low)'
      : 'var(--text-secondary)'

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 8,
        padding: '16px 18px',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
        Baseline vs Simulation
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <Stat
          label="Baseline Exposure"
          value={`AED ${portfolio.baselineExposureAedMn.toFixed(0)} mn`}
          sub={portfolio.ratingFrom}
        />
        <Stat
          label="Simulated Exposure"
          value={`AED ${portfolio.scenarioExposureAedMn.toFixed(0)} mn`}
          sub={portfolio.ratingTo}
          highlight
        />
        <Stat
          label="Δ Exposure"
          value={`${portfolio.deltaAedMn >= 0 ? '+' : ''}AED ${portfolio.deltaAedMn.toFixed(0)} mn`}
          sub={`${portfolio.deltaPct >= 0 ? '+' : ''}${portfolio.deltaPct.toFixed(1)}%`}
          color={deltaColor}
        />
        <Stat label="Risks Impacted" value={`${impactedCount} of ${risks.length}`} sub="with Δ > 0" />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  color,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  color?: string
  highlight?: boolean
}) {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: highlight ? 'var(--bg-primary)' : 'transparent',
        border: highlight ? '1px solid var(--border-accent, var(--accent-primary))' : 'none',
        borderRadius: 6,
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || 'var(--text-primary)', marginTop: 4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
