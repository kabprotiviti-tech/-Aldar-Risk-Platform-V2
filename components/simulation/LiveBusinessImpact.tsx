'use client'

/**
 * LiveBusinessImpact
 * ------------------
 * The "so what for Aldar" panel. Sits directly under the executive sliders so
 * that every drag shows an immediate, plain-English consequence:
 *
 *   • Portfolio exposure Δ (AED mn + %)
 *   • Portfolio risk band transition (Stable → Stressed, etc.)
 *   • Impact mapped to Aldar's four business anchors
 *       – Off-plan sales revenue
 *       – Recurring rental NOI
 *       – Active project GDV
 *       – Group revenue
 *   • Top-3 risks by Δ AED (what's actually moving)
 *   • One-line plain-English narrative
 *
 * Reads entirely from SimulationContext — no new state, no new engine.
 */

import React from 'react'
import { useSimulation } from '@/lib/context/SimulationContext'
import { FINANCIAL_ANCHORS } from '@/lib/engine/seedData'

// Map each anchor value to a human label + icon. Risks carry the raw AED
// anchor (financialBaseAedMn) so we can group by it.
const ANCHOR_META: Array<{
  value: number
  key: 'gdv' | 'sales' | 'noi' | 'revenue' | 'capex' | 'hospitality'
  label: string
  sub: string
  icon: string
}> = [
  {
    value: FINANCIAL_ANCHORS.annualOffPlanSalesAedMn,
    key: 'sales',
    label: 'Off-Plan Sales',
    sub: 'AED 7.5 bn / yr',
    icon: '🏠',
  },
  {
    value: FINANCIAL_ANCHORS.recurringRentalNoiAedMn,
    key: 'noi',
    label: 'Recurring Rental NOI',
    sub: 'AED 1.8 bn / yr',
    icon: '🏢',
  },
  {
    value: FINANCIAL_ANCHORS.activeProjectGdvAedMn,
    key: 'gdv',
    label: 'Active Project GDV',
    sub: 'AED 28 bn pipeline',
    icon: '🏗',
  },
  {
    value: FINANCIAL_ANCHORS.portfolioRevenueAedMn,
    key: 'revenue',
    label: 'Group Revenue',
    sub: 'AED 11 bn / yr',
    icon: '💼',
  },
  {
    value: FINANCIAL_ANCHORS.annualCapexAedMn,
    key: 'capex',
    label: 'Annual CapEx',
    sub: 'AED 6.5 bn / yr',
    icon: '🔧',
  },
  {
    value: FINANCIAL_ANCHORS.hospitalityRevenueAedMn,
    key: 'hospitality',
    label: 'Hospitality Revenue',
    sub: 'AED 1.4 bn / yr',
    icon: '🏨',
  },
]

function colourForDelta(delta: number): string {
  if (delta > 0.5) return 'var(--risk-critical)'
  if (delta > 0.05) return 'var(--risk-high)'
  if (delta < -0.05) return 'var(--risk-low)'
  return 'var(--text-tertiary)'
}

function narrative(
  deltaPct: number,
  ratingFrom: string,
  ratingTo: string,
): string {
  if (Math.abs(deltaPct) < 0.5) {
    return 'Portfolio within baseline tolerance — no material change to Aldar\'s risk posture.'
  }
  const dir = deltaPct > 0 ? 'deteriorates' : 'improves'
  const band =
    ratingFrom !== ratingTo
      ? ` Portfolio risk band shifts ${ratingFrom} → ${ratingTo}.`
      : ''
  return `Aldar's aggregate risk-weighted exposure ${dir} by ${Math.abs(deltaPct).toFixed(1)}% under these assumptions.${band}`
}

export function LiveBusinessImpact() {
  const { risks, portfolio, mode } = useSimulation()

  // Aggregate Δ exposure per financial anchor
  const anchorDeltas = new Map<number, { base: number; scen: number }>()
  for (const r of risks) {
    // We can't access financialBaseAedMn from RiskState directly, but each risk's
    // exposure is proportional to its own anchor. Use the risk name grouping via
    // deltaExposureAedMn and a lookup table of seeded anchors keyed by risk id.
    // (Simpler: attribute by risk name heuristics below.)
  }

  // Bucket risks by business area using category + name heuristics
  const buckets: Record<
    'sales' | 'noi' | 'gdv' | 'revenue' | 'capex' | 'hospitality',
    { base: number; scen: number; names: string[] }
  > = {
    sales: { base: 0, scen: 0, names: [] },
    noi: { base: 0, scen: 0, names: [] },
    gdv: { base: 0, scen: 0, names: [] },
    revenue: { base: 0, scen: 0, names: [] },
    capex: { base: 0, scen: 0, names: [] },
    hospitality: { base: 0, scen: 0, names: [] },
  }

  for (const r of risks) {
    const n = r.name.toLowerCase()
    let bucket: keyof typeof buckets = 'revenue'
    if (
      n.includes('sales') ||
      n.includes('off-plan') ||
      n.includes('default') ||
      n.includes('buyer')
    ) {
      bucket = 'sales'
    } else if (
      n.includes('lease') ||
      n.includes('rent') ||
      n.includes('occupan') ||
      n.includes('tenant')
    ) {
      bucket = 'noi'
    } else if (
      n.includes('construction') ||
      n.includes('delivery') ||
      n.includes('delay') ||
      n.includes('contractor') ||
      n.includes('supply')
    ) {
      bucket = 'gdv'
    } else if (n.includes('hospitality') || n.includes('hotel')) {
      bucket = 'hospitality'
    } else if (n.includes('capex') || n.includes('capital')) {
      bucket = 'capex'
    }
    buckets[bucket].base += r.baseExposureAedMn
    buckets[bucket].scen += r.exposureAedMn
    if (Math.abs(r.deltaExposureAedMn) > 0.01) buckets[bucket].names.push(r.name)
  }

  const orderedAnchors: Array<keyof typeof buckets> = [
    'sales',
    'noi',
    'gdv',
    'revenue',
    'hospitality',
    'capex',
  ]
  const anchorCards = orderedAnchors
    .map((key) => {
      const b = buckets[key]
      const meta = ANCHOR_META.find((m) => m.key === key)!
      const delta = b.scen - b.base
      return { key, meta, base: b.base, scen: b.scen, delta, names: b.names }
    })
    // Hide anchors with zero base AND zero delta to keep the strip focused
    .filter((a) => a.base > 0.01 || Math.abs(a.delta) > 0.01)

  const topRisks = [...risks]
    .filter((r) => Math.abs(r.deltaExposureAedMn) > 0.05)
    .sort((a, b) => Math.abs(b.deltaExposureAedMn) - Math.abs(a.deltaExposureAedMn))
    .slice(0, 3)

  const deltaUp = portfolio.deltaAedMn >= 0
  const headlineColor = deltaUp ? 'var(--risk-critical)' : 'var(--risk-low)'

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: '2px solid var(--accent-primary)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Headline row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
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
            Live Business Impact · Aldar Properties
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              marginTop: 4,
              maxWidth: 680,
              lineHeight: 1.5,
            }}
          >
            {narrative(portfolio.deltaPct, portfolio.ratingFrom, portfolio.ratingTo)}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, auto)',
            gap: 18,
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Baseline Exposure
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {portfolio.baselineExposureAedMn.toFixed(0)}{' '}
              <span style={{ fontSize: 11 }}>AED mn</span>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Simulated Exposure
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: headlineColor }}>
              {portfolio.scenarioExposureAedMn.toFixed(0)}{' '}
              <span style={{ fontSize: 11 }}>AED mn</span>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Δ Exposure
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: headlineColor, lineHeight: 1.1 }}>
              {deltaUp ? '+' : ''}
              {portfolio.deltaAedMn.toFixed(0)}{' '}
              <span style={{ fontSize: 12 }}>AED mn</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {deltaUp ? '+' : ''}
              {portfolio.deltaPct.toFixed(1)}% · {portfolio.ratingFrom} → {portfolio.ratingTo}
            </div>
          </div>
        </div>
      </div>

      {/* Business anchor tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        {anchorCards.map((a) => {
          const pct = a.base > 0 ? (a.delta / a.base) * 100 : 0
          const c = colourForDelta(a.delta)
          return (
            <div
              key={a.key}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderLeft: `3px solid ${c}`,
                borderRadius: 8,
                padding: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {a.meta.icon} {a.meta.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{a.meta.sub}</div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: c,
                  marginTop: 6,
                  lineHeight: 1.1,
                }}
              >
                {a.delta >= 0 ? '+' : ''}
                {a.delta.toFixed(1)} <span style={{ fontSize: 10 }}>AED mn risk</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                {a.delta >= 0 ? '+' : ''}
                {pct.toFixed(1)}% vs. baseline
              </div>
            </div>
          )
        })}
      </div>

      {/* Top impacted risks */}
      {topRisks.length > 0 && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 8,
            padding: 10,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Biggest movers — risks driving the Δ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {topRisks.map((r) => {
              const c = r.deltaExposureAedMn >= 0 ? 'var(--risk-critical)' : 'var(--risk-low)'
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: 10,
                    alignItems: 'center',
                    fontSize: 12,
                  }}
                >
                  <div style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                  </div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 10, whiteSpace: 'nowrap' }}>
                    {r.ratingFrom} → {r.ratingTo}
                  </div>
                  <div style={{ color: c, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {r.deltaExposureAedMn >= 0 ? '+' : ''}
                    {r.deltaExposureAedMn.toFixed(1)} mn
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'right' }}>
        Mode: <b style={{ color: 'var(--text-secondary)' }}>{mode}</b> · all figures are risk-weighted exposure values, not accounting losses
      </div>
    </div>
  )
}
