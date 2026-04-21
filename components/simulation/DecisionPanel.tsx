'use client'

import React, { useMemo } from 'react'
import { useSimulation } from '@/lib/context/SimulationContext'
import {
  ceoSummary,
  costOfDelay,
  recommendedActions,
  urgencyFor,
  timeToAct,
  priorityScore,
} from '@/lib/engine/decisionEngine'

export function DecisionPanel() {
  const { drivers, risks } = useSimulation()

  const summary = useMemo(() => ceoSummary(drivers, risks), [drivers, risks])
  const top3 = useMemo(
    () =>
      risks
        .slice()
        .sort((a, b) => priorityScore(b) - priorityScore(a))
        .slice(0, 3),
    [risks],
  )

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
        AI Decision Layer
      </div>

      <div
        style={{
          padding: '10px 12px',
          background: 'var(--bg-primary)',
          borderLeft: '3px solid var(--risk-medium)',
          borderRadius: 6,
          fontSize: 12,
          color: 'var(--text-primary)',
          lineHeight: 1.5,
          marginBottom: 14,
        }}
      >
        {summary.keyMessage}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
        <Mini label="Total Exposure" value={`AED ${summary.totalExposureAedMn.toFixed(0)} mn`} />
        <Mini label="If No Action (30d)" value={`AED ${summary.exposureIfNoAction30dAedMn.toFixed(0)} mn`} color="var(--risk-high)" />
        <Mini label="If Actions Taken" value={`AED ${summary.exposureIfActionsTakenAedMn.toFixed(0)} mn`} color="var(--risk-low)" />
        <Mini label="Protectable" value={`AED ${summary.exposureProtectedAedMn.toFixed(0)} mn`} color="var(--accent-primary)" />
      </div>

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 8,
        }}
      >
        Top 3 Priorities
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {top3.map((r, i) => {
          const urg = urgencyFor(r)
          const cod = costOfDelay(r)
          const actions = recommendedActions(r.id, 2)
          return (
            <div
              key={r.id}
              style={{
                border: '1px solid var(--border-primary)',
                borderRadius: 6,
                padding: '10px 12px',
                background: 'var(--bg-primary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  #{i + 1}. {r.name}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 3,
                    color: '#fff',
                    background: urgColor(urg),
                  }}
                >
                  {urg.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <span>Exposure: <b>AED {r.exposureAedMn.toFixed(0)} mn</b></span>
                <span>Δ: <b style={{ color: r.deltaExposureAedMn >= 0 ? 'var(--risk-high)' : 'var(--risk-low)' }}>{r.deltaExposureAedMn >= 0 ? '+' : ''}{r.deltaExposureAedMn.toFixed(0)} mn</b></span>
                <span>Act within: <b>{timeToAct(urg)}</b></span>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                <b>Cost of delay:</b> +AED {cod.at_7d_aed_mn.toFixed(0)} mn (7d) · +AED {cod.at_30d_aed_mn.toFixed(0)} mn (30d)
              </div>

              {actions.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Recommended actions
                  </div>
                  {actions.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        padding: '4px 0',
                        borderTop: '1px solid var(--border-primary)',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {a.name}{' '}
                        <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>
                          — {a.expectedReductionPct}% reduction · {a.implementationTime} · {a.effort} effort
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{a.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Mini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: color || 'var(--text-primary)', marginTop: 2 }}>
        {value}
      </div>
    </div>
  )
}

function urgColor(u: string) {
  return (
    { Critical: 'var(--risk-critical)', High: 'var(--risk-high)', Medium: 'var(--risk-medium)', Low: 'var(--risk-low)' } as Record<
      string,
      string
    >
  )[u] || 'var(--text-tertiary)'
}
