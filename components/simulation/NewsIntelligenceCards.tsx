'use client'

/**
 * NewsIntelligenceCards
 * ---------------------
 * For each external headline, render a structured card with:
 *   - Problem  (what the signal is, classified)
 *   - Impact   (which Aldar risks/drivers are affected + direction)
 *   - Recommendation (action to take)
 *
 * Pure, additive, read-only. Does NOT modify any existing news panel.
 */

import React from 'react'
import { classifySignal, correlateSignal } from '@/lib/engine/registerCritic'

const RECOMMENDATION_MAP: Record<string, string> = {
  commodity:
    'Trigger commodity hedge review (steel/cement). Lock GMP contracts on active projects; escalate to Procurement Committee.',
  market:
    'Pause new launches; reforecast absorption. Activate dynamic pricing and broker incentives on current inventory.',
  regulatory:
    'Convene regulatory horizon-scan war-room. Burn down 30-day compliance gap with General Counsel + ESG lead.',
  geopolitical:
    'Stress-test supply chain dual-sourcing. Invoke contingency on affected trade lanes; brief Board Risk Committee.',
  supply:
    'Activate alternate supplier roster + 60-day stockholding. Reprice affected BoQs; update project float.',
  liquidity:
    'Refresh 13-week cashflow. Draw on RCF headroom pre-emptively; defer non-critical capex.',
  other: 'Monitor. Add to watchlist until signal resolves into a mapped category.',
}

const CATEGORY_COLOR: Record<string, string> = {
  commodity: 'var(--risk-high)',
  market: 'var(--risk-medium)',
  regulatory: 'var(--accent-primary)',
  geopolitical: 'var(--risk-critical)',
  supply: 'var(--risk-high)',
  liquidity: 'var(--risk-critical)',
  other: 'var(--text-tertiary)',
}

export function NewsIntelligenceCards({
  headlines = [] as string[],
}: {
  headlines?: string[]
}) {
  if (headlines.length === 0) return null

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 8,
        padding: '16px 18px',
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          News Intelligence — Problem / Impact / Recommendation
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
          Every headline is decomposed into what it means, who it hits, and what to do.
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 10,
        }}
      >
        {headlines.map((h, i) => {
          const cat = classifySignal(h)
          const corr = correlateSignal({ headline: h, category: cat })
          const color = CATEGORY_COLOR[cat] || 'var(--accent-primary)'
          const rec = RECOMMENDATION_MAP[cat] || RECOMMENDATION_MAP.other
          return (
            <div
              key={i}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderLeft: `3px solid ${color}`,
                borderRadius: 6,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color,
                }}
              >
                {cat}
              </div>

              <div>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 2 }}>
                  PROBLEM
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.4 }}>{h}</div>
              </div>

              <div>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 2 }}>
                  IMPACT
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {corr.explanation}
                </div>
                {corr.affected_risks.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {corr.affected_risks.slice(0, 3).map((r, j) => (
                      <span
                        key={j}
                        style={{
                          fontSize: 9,
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-tertiary)',
                          padding: '2px 6px',
                          borderRadius: 10,
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Controls: <b style={{ color }}>{corr.impact_on_control_effectiveness}</b> · Residual:{' '}
                  <b style={{ color }}>{corr.impact_on_residual_risk}</b>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 2 }}>
                  RECOMMENDATION
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.4 }}>{rec}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
