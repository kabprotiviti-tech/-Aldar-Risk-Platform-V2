'use client'

/**
 * RegisterCriticPanel
 * -------------------
 * AI Risk Register Intelligence Engine — UI surface.
 * Deterministic scoring renders instantly. Deep AI critique is lazy-loaded
 * on click to avoid burning API quota on page view.
 */

import React, { useMemo, useState } from 'react'
import { criticReport, type ExternalSignal, classifySignal } from '@/lib/engine/registerCritic'

interface AICritique {
  missing_risks: Array<{
    name: string
    category: string
    cause: string
    event: string
    impact: string
    why_missing: string
  }>
  weak_controls: Array<{ risk_id: string; control_gap: string; suggested_control: string }>
  deep_recommendations: Array<{
    risk_id: string
    recommendation: string
    reason: string
    expected_impact: string
    drivers_affected: string[]
  }>
  register_assessment: {
    coverage_comment: string
    adaptability_comment: string
    second_line_verdict: string
  }
  source: string
}

export function RegisterCriticPanel({ signals = [] as string[] }: { signals?: string[] }) {
  const externalSignals: ExternalSignal[] = useMemo(
    () => signals.map((h) => ({ headline: h, category: classifySignal(h) })),
    [signals],
  )

  const report = useMemo(() => criticReport(externalSignals), [externalSignals])

  const [ai, setAi] = useState<AICritique | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function runAI() {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch('/api/register-critic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signals: externalSignals.map((s) => ({ headline: s.headline })) }),
      })
      const data = await res.json()
      setAi(data)
      if (data.source === 'fallback') setErr(data.error || 'AI unavailable — showing fallback')
    } catch (e: any) {
      setErr(e.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor =
    report.quality.total >= 80
      ? 'var(--risk-low)'
      : report.quality.total >= 60
      ? 'var(--risk-medium)'
      : 'var(--risk-high)'

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 8,
        padding: '16px 18px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            AI Risk Register Intelligence
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Second-line challenge: clarity · controls · adequacy · missing risks
          </div>
        </div>
        <button
          onClick={runAI}
          disabled={loading}
          style={{
            background: 'var(--accent-primary)',
            color: 'var(--bg-primary)',
            border: 'none',
            fontSize: 11,
            fontWeight: 600,
            padding: '7px 14px',
            borderRadius: 4,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Analysing…' : ai ? 'Re-run AI Critic' : 'Run AI Critic'}
        </button>
      </div>

      {/* Quality score */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14, padding: '12px', background: 'var(--bg-primary)', borderRadius: 6 }}>
        <div style={{ textAlign: 'center', minWidth: 90 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
            {report.quality.total}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>
            Register Quality
          </div>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <Meter label="Completeness" value={report.quality.components.completeness} />
          <Meter label="Control Strength" value={report.quality.components.controlStrength} />
          <Meter label="Adaptability" value={report.quality.components.adaptability} />
        </div>
      </div>

      {/* Deterministic weak controls */}
      {report.quality.weakControls.length > 0 && (
        <Section title={`Weak Controls (${report.quality.weakControls.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {report.quality.weakControls.map((w, i) => (
              <div key={i} style={rowStyle('var(--risk-medium)')}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{w.risk}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{w.reason}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* External correlation (deterministic) */}
      {report.external_correlations.length > 0 && (
        <Section title="External Signal Correlation">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {report.external_correlations.map((c, i) => (
              <div key={i} style={rowStyle('var(--accent-primary)')}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {c.signal}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                  <b>Category:</b> {c.signal_category} · <b>Drivers:</b> {c.impacted_drivers.join(', ') || '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                  Control effectiveness: <b style={{ color: c.impact_on_control_effectiveness === 'decrease' ? 'var(--risk-high)' : 'var(--text-secondary)' }}>{c.impact_on_control_effectiveness}</b> · Residual risk: <b style={{ color: c.impact_on_residual_risk === 'increase' ? 'var(--risk-high)' : 'var(--text-secondary)' }}>{c.impact_on_residual_risk}</b>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4, fontStyle: 'italic' }}>
                  {c.explanation}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* AI-powered */}
      {err && (
        <div style={{ ...rowStyle('var(--risk-high)'), marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--risk-high)' }}>⚠ {err}</div>
        </div>
      )}

      {ai && (
        <>
          <Section title="Second-Line Verdict">
            <div style={rowStyle('var(--accent-primary)')}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {ai.register_assessment.second_line_verdict}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>
                <b>Coverage:</b> {ai.register_assessment.coverage_comment}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                <b>Adaptability:</b> {ai.register_assessment.adaptability_comment}
              </div>
            </div>
          </Section>

          {ai.missing_risks.length > 0 && (
            <Section title={`Missing Risks AI Flagged (${ai.missing_risks.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ai.missing_risks.map((r, i) => (
                  <div key={i} style={rowStyle('var(--risk-high)')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</div>
                      <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: 3, color: 'var(--text-tertiary)' }}>{r.category}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                      <b>Cause:</b> {r.cause}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      <b>Event:</b> {r.event}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      <b>Impact:</b> {r.impact}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 6, fontStyle: 'italic' }}>
                      Why flagged: {r.why_missing}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {ai.weak_controls.length > 0 && (
            <Section title={`AI Weak-Control Findings (${ai.weak_controls.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ai.weak_controls.map((w, i) => (
                  <div key={i} style={rowStyle('var(--risk-medium)')}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{w.risk_id}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      <b>Gap:</b> {w.control_gap}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--risk-low)', marginTop: 2 }}>
                      <b>Suggested:</b> {w.suggested_control}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {ai.deep_recommendations.length > 0 && (
            <Section title={`AI Recommendations (${ai.deep_recommendations.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ai.deep_recommendations.map((d, i) => (
                  <div key={i} style={rowStyle('var(--accent-primary)')}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {d.risk_id} · {d.recommendation}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                      <b>Reason:</b> {d.reason}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      <b>Expected impact:</b> {d.expected_impact}
                    </div>
                    {d.drivers_affected?.length > 0 && (
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                        Drivers: {d.drivers_affected.join(' · ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      {/* Per-risk deterministic table */}
      <Section title={`Per-Risk Analysis (${report.risk_analysis.length})`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {report.risk_analysis.map((a) => (
            <div
              key={a.risk_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                gap: 10,
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: 4,
                background: a.adequacy.sufficient ? 'transparent' : 'var(--bg-primary)',
                border: a.adequacy.sufficient ? '1px solid transparent' : '1px solid var(--risk-medium)',
                fontSize: 11,
              }}
            >
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.risk_name}</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>{a.control_presence}</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>
                Eff: {(a.composite_effectiveness * 100).toFixed(0)}%
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: a.adequacy.sufficient ? 'var(--risk-low)' : 'var(--risk-medium)',
                }}
              >
                {a.adequacy.sufficient ? 'OK' : 'GAP'}
              </div>
            </div>
          ))}
        </div>
      </Section>
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

function Meter({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'var(--risk-low)' : value >= 60 ? 'var(--risk-medium)' : 'var(--risk-high)'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color }}>{value}</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, transition: 'width 400ms ease' }} />
      </div>
    </div>
  )
}

function rowStyle(accent: string): React.CSSProperties {
  return {
    padding: '8px 10px',
    background: 'var(--bg-primary)',
    borderLeft: `2px solid ${accent}`,
    borderRadius: 4,
  }
}
