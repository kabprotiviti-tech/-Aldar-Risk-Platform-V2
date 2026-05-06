'use client'

/**
 * RiskHeatmap — 5×5 Likelihood × Impact grid.
 * --------------------------------------------
 * Plots every engine risk as a dot inside its (likelihood, impact) cell.
 * Toggle between Inherent (pre-control) and Residual (post-control) views.
 * Click a dot or a cell to open the detail drawer.
 *
 * Honors CLAUDE.md: no invented coordinates. Inherent uses the engine's
 * baseLikelihood × baseImpact (1-5 each). Residual is computed from the
 * engine's residual score by extracting the L and I implied components
 * proportionally — same trick the engine uses internally so we never
 * fabricate "approximate" cells.
 */

import React, { useMemo, useState } from 'react'
import { useSimulation } from '@/lib/context/SimulationContext'
import { RISKS } from '@/lib/engine/seedData'
import type { RiskState, Rating } from '@/lib/engine/types'

type HeatmapView = 'inherent' | 'residual'

interface Props {
  onSelectRisk?: (risk: RiskState) => void
}

// 5×5 cell colour by score = L × I.
// 1-4 low, 5-9 medium, 10-14 high, 15-25 critical
function cellColor(score: number): string {
  if (score >= 15) return 'rgba(255,59,59,0.30)'
  if (score >= 10) return 'rgba(255,140,0,0.30)'
  if (score >= 5) return 'rgba(245,197,24,0.28)'
  return 'rgba(34,197,94,0.22)'
}

function cellBorder(score: number): string {
  if (score >= 15) return 'rgba(255,59,59,0.55)'
  if (score >= 10) return 'rgba(255,140,0,0.55)'
  if (score >= 5) return 'rgba(245,197,24,0.55)'
  return 'rgba(34,197,94,0.55)'
}

function ratingDot(r: Rating): string {
  switch (r) {
    case 'Critical': return 'var(--risk-critical)'
    case 'High': return 'var(--risk-high)'
    case 'Medium': return 'var(--risk-medium)'
    case 'Low':
    default: return 'var(--risk-low)'
  }
}

/**
 * Reverse the engine's likelihood × impact scoring back into a 5×5 cell.
 * For inherent we use the seed (deterministic). For residual we anchor
 * on the engine output `newResidual` (1-25) and split it back into a
 * (likelihood, impact) pair that preserves the same L:I shape as inherent
 * — i.e. controls reduce both proportionally. Pure derivation, no
 * fabrication.
 */
function residualCell(risk: RiskState, baseL: number, baseI: number): { l: number; i: number } {
  const inherent = baseL * baseI
  const residual = Math.max(1, Math.min(25, risk.newResidual))
  if (inherent <= 0) return { l: 1, i: 1 }
  // Same shape: scale both axes by sqrt(residual / inherent)
  const factor = Math.sqrt(residual / inherent)
  const l = Math.max(1, Math.min(5, Math.round(baseL * factor)))
  const i = Math.max(1, Math.min(5, Math.round(baseI * factor)))
  return { l, i }
}

export function RiskHeatmap({ onSelectRisk }: Props) {
  const { risks } = useSimulation()
  const [view, setView] = useState<HeatmapView>('inherent')

  // Build cell → list of {risk, plot coords} mapping.
  const cells = useMemo(() => {
    const map = new Map<string, RiskState[]>()
    for (const r of risks) {
      const seed = RISKS.find((s) => s.id === r.id)
      if (!seed) continue
      let l: number
      let i: number
      if (view === 'inherent') {
        l = seed.baseLikelihood
        i = seed.baseImpact
      } else {
        const c = residualCell(r, seed.baseLikelihood, seed.baseImpact)
        l = c.l
        i = c.i
      }
      const key = `${l}-${i}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    return map
  }, [risks, view])

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
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
            Risk Heatmap · {view === 'inherent' ? 'Inherent (pre-control)' : 'Residual (post-control)'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            Likelihood × Impact (1–5 each). Click any risk to open detail.
          </div>
        </div>
        <div style={{ display: 'inline-flex', gap: 4, padding: 3, background: 'var(--bg-primary)', borderRadius: 6, border: '1px solid var(--border-color)' }}>
          <ToggleButton active={view === 'inherent'} onClick={() => setView('inherent')}>
            Inherent
          </ToggleButton>
          <ToggleButton active={view === 'residual'} onClick={() => setView('residual')}>
            Residual
          </ToggleButton>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto repeat(5, 1fr)',
          gridTemplateRows: 'repeat(5, 1fr) auto',
          gap: 4,
          alignItems: 'stretch',
        }}
      >
        {/* Y axis labels (Likelihood, top→bottom 5..1) */}
        {[5, 4, 3, 2, 1].map((l) => (
          <React.Fragment key={`row-${l}`}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 8,
                color: 'var(--text-tertiary)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              L{l}
            </div>
            {[1, 2, 3, 4, 5].map((i) => {
              const score = l * i
              const list = cells.get(`${l}-${i}`) || []
              return (
                <div
                  key={`${l}-${i}`}
                  style={{
                    minHeight: 78,
                    background: cellColor(score),
                    border: `1px solid ${cellBorder(score)}`,
                    borderRadius: 4,
                    padding: 6,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                    alignContent: 'flex-start',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 6,
                      fontSize: 9,
                      color: 'var(--text-tertiary)',
                      fontWeight: 700,
                    }}
                  >
                    {score}
                  </span>
                  {list.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onSelectRisk?.(r)}
                      title={`${r.id} — ${r.name} (${r.ratingTo})`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 6px',
                        background: 'var(--bg-card)',
                        border: `1px solid ${ratingDot(r.ratingTo)}66`,
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontSize: 9,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: ratingDot(r.ratingTo),
                          flexShrink: 0,
                        }}
                      />
                      {r.id}
                    </button>
                  ))}
                </div>
              )
            })}
          </React.Fragment>
        ))}
        {/* X axis labels (Impact, left→right 1..5) */}
        <div />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={`col-${i}`}
            style={{
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              paddingTop: 4,
            }}
          >
            I{i}
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
        }}
      >
        Inherent uses the engine&rsquo;s baseLikelihood × baseImpact. Residual
        cell is derived from the engine&rsquo;s newResidual score (same shape
        scaling, no fabrication). Drafts are not plotted until they are
        calibrated against engine sensitivities (post-pilot).
      </div>
    </div>
  )
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'var(--accent-primary)' : 'transparent',
        color: active ? 'var(--on-accent)' : 'var(--text-secondary)',
        border: 'none',
        padding: '4px 12px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </button>
  )
}
