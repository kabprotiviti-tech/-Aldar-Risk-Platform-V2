'use client'

/**
 * ExternalSignalCouplingPanel
 * ---------------------------
 * Takes ad-hoc news headlines, classifies them via the deterministic
 * classifier, proposes a driver nudge with magnitude, and applies it to
 * SimulationContext on user approval.
 *
 * Bridges the gap between external signals and the internal engine.
 */

import React, { useState } from 'react'
import { useSimulation } from '@/lib/context/SimulationContext'
import { classifySignal } from '@/lib/engine/registerCritic'
import type { DriverId } from '@/lib/engine/types'

// Category → primary driver + default magnitude
const NUDGE_MAP: Record<string, { driverId: DriverId; label: string; magnitude: number; direction: 'up' | 'down' }> = {
  commodity:    { driverId: 'DRV-01', label: 'Construction Cost',       magnitude: 8,  direction: 'up' },
  market:       { driverId: 'DRV-02', label: 'Sales Volume',            magnitude: 10, direction: 'down' },
  regulatory:   { driverId: 'DRV-05', label: 'Project Delay',           magnitude: 7,  direction: 'up' },
  geopolitical: { driverId: 'DRV-08', label: 'Supply Chain Stability',  magnitude: 12, direction: 'down' },
  supply:       { driverId: 'DRV-08', label: 'Supply Chain Stability',  magnitude: 15, direction: 'down' },
  liquidity:    { driverId: 'DRV-07', label: 'Liquidity',               magnitude: 8,  direction: 'down' },
  other:        { driverId: 'DRV-01', label: '—',                        magnitude: 0,  direction: 'up' },
}

interface PendingNudge {
  id: string
  headline: string
  category: string
  driverId: DriverId
  driverLabel: string
  magnitude: number
  direction: 'up' | 'down'
}

export function ExternalSignalCouplingPanel({ seedHeadlines = [] as string[] }: { seedHeadlines?: string[] }) {
  const { drivers, setDriverValue } = useSimulation()
  const [input, setInput] = useState('')
  const [pending, setPending] = useState<PendingNudge[]>(() =>
    seedHeadlines.slice(0, 3).map((h, i) => buildNudge(`seed-${i}`, h)),
  )
  const [applied, setApplied] = useState<string[]>([])

  function addHeadline(headline: string) {
    if (!headline.trim()) return
    setPending((prev) => [...prev, buildNudge(`h-${Date.now()}`, headline)])
    setInput('')
  }

  function applyNudge(n: PendingNudge) {
    const drv = drivers.find((d) => d.id === n.driverId)
    if (!drv) return
    const deltaPct = n.direction === 'up' ? n.magnitude : -n.magnitude
    const newVal =
      drv.id === 'DRV-05'
        ? drv.adjustedValue + (n.magnitude * (n.direction === 'up' ? 1 : -1))
        : drv.adjustedValue * (1 + deltaPct / 100)
    setDriverValue(n.driverId, newVal)
    setApplied((prev) => [...prev, n.id])
  }

  function dismiss(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 8,
        padding: '16px 18px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            External Signal → Driver Coupling
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Headlines become driver nudges. Approve to propagate.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Paste a headline (e.g. 'Steel prices surge 18% on China demand')"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addHeadline(input) }}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 4,
            color: 'var(--text-primary)',
            fontSize: 11,
          }}
        />
        <button
          onClick={() => addHeadline(input)}
          style={{
            background: 'var(--accent-primary)',
            color: 'var(--on-accent)',
            border: 'none',
            fontSize: 11,
            fontWeight: 600,
            padding: '8px 16px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Classify
        </button>
      </div>

      {pending.length === 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', padding: 18 }}>
          No signals yet. Paste a headline above — or use the News Intelligence panel to feed this engine.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pending.map((n) => {
          const isApplied = applied.includes(n.id)
          return (
            <div
              key={n.id}
              style={{
                padding: '10px 12px',
                background: 'var(--bg-primary)',
                borderRadius: 6,
                borderLeft: `2px solid ${isApplied ? 'var(--risk-low)' : 'var(--accent-primary)'}`,
                opacity: isApplied ? 0.6 : 1,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{n.headline}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                <span>
                  <b>Category:</b> {n.category}
                </span>
                <span>
                  <b>Nudges:</b> {n.driverLabel} {n.direction === 'up' ? '↑' : '↓'} {n.magnitude}
                  {n.driverId === 'DRV-05' ? ' days' : '%'}
                </span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                {!isApplied && n.magnitude > 0 && (
                  <button
                    onClick={() => applyNudge(n)}
                    style={{
                      background: 'var(--risk-low)',
                      color: 'var(--bg-primary)',
                      border: 'none',
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '5px 10px',
                      borderRadius: 3,
                      cursor: 'pointer',
                    }}
                  >
                    Apply to Simulation
                  </button>
                )}
                {isApplied && (
                  <span style={{ fontSize: 10, color: 'var(--risk-low)', fontWeight: 600 }}>✓ Applied</span>
                )}
                <button
                  onClick={() => dismiss(n.id)}
                  style={{
                    background: 'transparent',
                    color: 'var(--text-tertiary)',
                    border: '1px solid var(--border-primary)',
                    fontSize: 10,
                    padding: '5px 10px',
                    borderRadius: 3,
                    cursor: 'pointer',
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function buildNudge(id: string, headline: string): PendingNudge {
  const category = classifySignal(headline)
  const mapped = NUDGE_MAP[category]
  return {
    id,
    headline,
    category,
    driverId: mapped.driverId,
    driverLabel: mapped.label,
    magnitude: mapped.magnitude,
    direction: mapped.direction,
  }
}
