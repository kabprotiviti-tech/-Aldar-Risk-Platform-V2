'use client'

/**
 * RiskDetailDrawer
 * ----------------
 * Slide-in drawer that shows everything we know about a single risk:
 *   - Identity (id, category, owner)
 *   - Cause / Event / Impact (the core ISO 31000 triple)
 *   - Inherent vs Residual scores with rating transition
 *   - Controls list (type, effectiveness)
 *   - Contributing drivers from current simulation state
 *   - Financial exposure with provenance click-through to anchor source
 *
 * Read-only in C2. C3 adds edit. C4 adds mitigation actions sub-table.
 *
 * Honors CLAUDE.md: every numeric figure either comes from the engine
 * (live state) or is wrapped in a NumericValue with provenance.
 */

import React from 'react'
import { X } from 'lucide-react'
import type { RiskState, Rating } from '@/lib/engine/types'
import { useSimulation } from '@/lib/context/SimulationContext'
import { RISKS, FINANCIAL_ANCHORS } from '@/lib/engine/seedData'
import { NumericValue } from '@/components/provenance/NumericValue'
import { getAnchorReference } from '@/lib/data/risk-financial-provenance'
import { MitigationActionsSection } from './MitigationActionsSection'

interface Props {
  risk: RiskState | null
  onClose: () => void
}

function ratingColor(r: Rating): string {
  switch (r) {
    case 'Critical': return 'var(--risk-critical)'
    case 'High': return 'var(--risk-high)'
    case 'Medium': return 'var(--risk-medium)'
    case 'Low':
    default: return 'var(--risk-low)'
  }
}

function RatingPill({ rating }: { rating: Rating }) {
  const c = ratingColor(rating)
  return (
    <span
      style={{
        display: 'inline-block',
        background: `${c}26`,
        color: c,
        border: `1px solid ${c}66`,
        padding: '3px 10px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {rating}
    </span>
  )
}

export function RiskDetailDrawer({ risk, onClose }: Props) {
  const { drivers } = useSimulation()

  // Resolve back to the seed RiskDef for static fields the engine state
  // doesn't carry (cause / event / impact / controls / financialBase ref).
  const seed = React.useMemo(
    () => (risk ? RISKS.find((r) => r.id === risk.id) : null),
    [risk],
  )

  // Find the FINANCIAL_ANCHORS key this risk uses by reference equality
  const anchorRef = React.useMemo(() => {
    if (!seed) return null
    // Each risk's financialBaseAedMn is a reference to FINANCIAL_ANCHORS[key].
    // We can match by value AND by checking each known anchor key.
    const knownKeys: (keyof typeof FINANCIAL_ANCHORS)[] = [
      'portfolioRevenueAedMn',
      'activeProjectGdvAedMn',
      'recurringRentalNoiAedMn',
      'hospitalityRevenueAedMn',
      'annualCapexAedMn',
      'annualOffPlanSalesAedMn',
    ]
    for (const k of knownKeys) {
      if (FINANCIAL_ANCHORS[k] === seed.financialBaseAedMn) {
        return getAnchorReference(k)
      }
    }
    return null
  }, [seed])

  // Close on Esc
  React.useEffect(() => {
    if (!risk) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [risk, onClose])

  if (!risk) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 9000,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label={`Risk detail: ${risk.name}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(560px, 92vw)',
          background: 'var(--bg-primary)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.5)',
          zIndex: 9001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 18,
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              {risk.id} · {risk.category}
            </div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {risk.name}
            </h2>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
              }}
            >
              Owner: <strong style={{ color: 'var(--text-primary)' }}>{risk.owner}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: 6,
              padding: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Cause / Event / Impact */}
          {seed && (
            <Section title="Cause · Event · Impact">
              <Field label="Cause">{seed.cause}</Field>
              <Field label="Event">{seed.event}</Field>
              <Field label="Impact">{seed.impact}</Field>
            </Section>
          )}

          {/* Scores */}
          <Section title="Scores (out of 25)">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 10,
              }}
            >
              <ScoreCard label="Inherent" value={risk.newInherent} baseline={risk.baseInherent} />
              <ScoreCard label="Residual" value={risk.newResidual} baseline={risk.baseResidual} />
            </div>
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: 'var(--text-secondary)',
              }}
            >
              Rating: <RatingPill rating={risk.ratingFrom} />
              <span>→</span>
              <RatingPill rating={risk.ratingTo} />
            </div>
          </Section>

          {/* Financial exposure with provenance */}
          <Section title="Financial Exposure">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {risk.exposureAedMn.toFixed(0)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                AED mn (current scenario)
              </span>
            </div>
            <Field label="Δ vs baseline">
              {risk.deltaExposureAedMn >= 0 ? '+' : ''}
              {risk.deltaExposureAedMn.toFixed(0)} AED mn ({(((risk.exposureAedMn - risk.baseExposureAedMn) / Math.max(1, risk.baseExposureAedMn)) * 100).toFixed(1)}%)
            </Field>
            {anchorRef && (
              <div
                style={{
                  marginTop: 8,
                  padding: 10,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  fontSize: 11,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  Financial anchor (with provenance):
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                  <span>
                    Engine: <NumericValue data={anchorRef.engineDataPoint} />
                  </span>
                  <span style={{ color: 'var(--text-tertiary)' }}>vs Aldar:</span>
                  <span>
                    <NumericValue data={anchorRef.aldarReference} />
                  </span>
                </div>
                <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  {anchorRef.calibrationNote}
                </div>
              </div>
            )}
          </Section>

          {/* Contributing drivers */}
          <Section title={`Contributing Drivers (${risk.contributingDrivers.length})`}>
            {risk.contributingDrivers.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                No drivers contributing under current scenario.
              </div>
            )}
            {[...risk.contributingDrivers]
              .sort((a, b) => Math.abs(b.contributionPoints) - Math.abs(a.contributionPoints))
              .map((cd) => {
                const c = cd.contributionPoints >= 0
                  ? 'var(--risk-high)'
                  : 'var(--risk-low)'
                return (
                  <div
                    key={cd.driverId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: 8,
                      fontSize: 11,
                      padding: '6px 0',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      {cd.driverId}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{cd.driverName}</span>
                    <span style={{ color: c, fontWeight: 700 }}>
                      {cd.contributionPoints >= 0 ? '+' : ''}
                      {cd.contributionPoints.toFixed(2)} pts
                    </span>
                  </div>
                )
              })}
          </Section>

          {/* Controls */}
          {seed && seed.controls.length > 0 && (
            <Section title={`Controls (${seed.controls.length})`}>
              {seed.controls.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: 8,
                    fontSize: 11,
                    padding: '6px 0',
                    borderTop: '1px solid var(--border-color)',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                  <span
                    style={{
                      fontSize: 9,
                      color: 'var(--text-tertiary)',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {c.type}
                  </span>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                    {(c.effectiveness * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                }}
              >
                Composite control effectiveness:{' '}
                <strong style={{ color: 'var(--accent-primary)' }}>
                  {(risk.compositeEffectiveness * 100).toFixed(0)}%
                </strong>
              </div>
            </Section>
          )}

          {/* Mitigation actions sub-table (C4) */}
          <MitigationActionsSection riskId={risk.id} />

          {/* Footnote */}
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
              padding: '8px 0',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            Status workflow auto-promotion / Heatmap / AI Register Critic ship
            in subsequent patches (C5-C7).
          </div>
        </div>
      </aside>
    </>
  )
}

// ── presentational helpers ──────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          margin: 0,
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
        {children}
      </span>
    </div>
  )
}

function ScoreCard({
  label,
  value,
  baseline,
}: {
  label: string
  value: number
  baseline: number
}) {
  const delta = value - baseline
  const c = delta > 0.5 ? 'var(--risk-high)' : delta < -0.5 ? 'var(--risk-low)' : 'var(--text-secondary)'
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value.toFixed(1)}
      </span>
      <span style={{ fontSize: 10, color: c, fontWeight: 600 }}>
        {delta >= 0 ? '+' : ''}
        {delta.toFixed(1)} vs baseline ({baseline.toFixed(1)})
      </span>
    </div>
  )
}
