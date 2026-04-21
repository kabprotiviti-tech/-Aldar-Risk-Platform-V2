'use client'

import React, { useState } from 'react'
import { useSimulation } from '@/lib/context/SimulationContext'
import { whyChanged } from '@/lib/engine/explainabilityEngine'

export function ExplainabilityPanel() {
  const { explainability, risks } = useSimulation()
  const [open, setOpen] = useState(true)

  const movedRisks = risks
    .filter((r) => Math.abs(r.deltaExposureAedMn) > 0.1)
    .sort((a, b) => Math.abs(b.deltaExposureAedMn) - Math.abs(a.deltaExposureAedMn))
    .slice(0, 5)

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 8,
        padding: '16px 18px',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          padding: 0,
          textAlign: 'left',
        }}
      >
        <span>Explain Impact</span>
        <span style={{ fontSize: 16, color: 'var(--text-tertiary)' }}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-primary)',
              lineHeight: 1.5,
              padding: '10px 12px',
              background: 'var(--bg-primary)',
              borderRadius: 6,
              borderLeft: '3px solid var(--accent-primary)',
              marginBottom: 14,
            }}
          >
            {explainability.executiveSummary}
          </div>

          {explainability.driversChanged.length > 0 && (
            <Section title="Drivers changed">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {explainability.inputs
                  .filter((i) => Math.abs(i.deltaPct) > 0.1)
                  .map((i) => (
                    <span
                      key={i.driver}
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-primary)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {i.driver}: {i.deltaPct >= 0 ? '+' : ''}
                      {i.deltaPct.toFixed(1)}%
                    </span>
                  ))}
              </div>
            </Section>
          )}

          <Section title="Calculation trace">
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              {explainability.calculationSummary.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
              {explainability.calculationSummary.length === 0 && (
                <li>Baseline — no adjustments applied.</li>
              )}
            </ul>
          </Section>

          {movedRisks.length > 0 && (
            <Section title="Why each risk changed">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {movedRisks.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      padding: '8px 10px',
                      background: 'var(--bg-primary)',
                      borderRadius: 4,
                      borderLeft: '2px solid var(--border-accent, var(--accent-primary))',
                    }}
                  >
                    {whyChanged(r)}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}
