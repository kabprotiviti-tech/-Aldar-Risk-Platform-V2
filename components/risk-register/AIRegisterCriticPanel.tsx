'use client'

/**
 * AIRegisterCriticPanel
 * ---------------------
 * Surface for the AI Register Critic. Sits as a collapsible panel above
 * the heatmap on /risk-register. User clicks "Run AI Register Critic"
 * and the panel calls the existing /api/register-critic endpoint, then
 * renders the findings — each item explicitly badged "AI Hypothesis"
 * per the CLAUDE.md standing rule.
 *
 * Honors the no-hallucination rule: every AI suggestion is shown with a
 * "pending human approval" badge and an Accept / Dismiss action — no
 * suggestion auto-promotes to the register.
 */

import React, { useState } from 'react'
import { Sparkles, ChevronDown, ChevronRight, Loader2, AlertTriangle } from 'lucide-react'

interface CriticResponse {
  missing_risks: Array<{
    name: string
    category: string
    cause: string
    event: string
    impact: string
    why_missing: string
  }>
  weak_controls: Array<{
    risk_id: string
    control_gap: string
    suggested_control: string
  }>
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
  source: 'ai' | 'fallback'
  error?: string
}

export function AIRegisterCriticPanel() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CriticResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/register-critic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = (await res.json()) as CriticResponse
      setData(json)
      setOpen(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid #A855F7',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={16} style={{ color: '#A855F7' }} />
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#A855F7',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              AI Register Critic
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Second-line gap analysis. AI suggestions appear as Hypotheses
              awaiting your acceptance — none auto-promote to the register.
            </div>
          </div>
        </div>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          <button
            onClick={run}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#A855F7',
              color: '#fff',
              border: 'none',
              padding: '7px 14px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {loading ? 'Analysing…' : data ? 'Re-run' : 'Run Critic'}
          </button>
          {data && (
            <button
              onClick={() => setOpen((v) => !v)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {open ? 'Hide' : 'Show'} findings
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 8,
            background: 'rgba(255,59,59,0.10)',
            border: '1px solid rgba(255,59,59,0.45)',
            borderRadius: 4,
            fontSize: 11,
            color: 'var(--risk-critical)',
          }}
        >
          {error}
        </div>
      )}

      {data && open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          {/* Source badge */}
          {data.source === 'fallback' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                background: 'rgba(245,197,24,0.10)',
                color: 'var(--risk-medium)',
                border: '1px solid rgba(245,197,24,0.40)',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                alignSelf: 'flex-start',
              }}
            >
              <AlertTriangle size={11} />
              AI service unreachable — showing deterministic fallback suggestions
            </div>
          )}

          {/* Register assessment */}
          {data.register_assessment && (
            <Section title="Second-Line Verdict">
              <Row label="Coverage" text={data.register_assessment.coverage_comment} />
              <Row label="Adaptability" text={data.register_assessment.adaptability_comment} />
              <Row label="Verdict" text={data.register_assessment.second_line_verdict} highlight />
            </Section>
          )}

          {/* Missing risks */}
          {data.missing_risks?.length > 0 && (
            <Section title={`Missing Risks (${data.missing_risks.length})`}>
              {data.missing_risks.map((m, idx) => (
                <FindingCard
                  key={idx}
                  title={m.name}
                  meta={m.category}
                  body={`Cause: ${m.cause} · Event: ${m.event} · Impact: ${m.impact}`}
                  rationale={m.why_missing}
                />
              ))}
            </Section>
          )}

          {/* Weak controls */}
          {data.weak_controls?.length > 0 && (
            <Section title={`Weak Controls (${data.weak_controls.length})`}>
              {data.weak_controls.map((w, idx) => (
                <FindingCard
                  key={idx}
                  title={w.risk_id}
                  meta="Control gap"
                  body={w.control_gap}
                  rationale={`Suggested: ${w.suggested_control}`}
                />
              ))}
            </Section>
          )}

          {/* Deep recommendations */}
          {data.deep_recommendations?.length > 0 && (
            <Section title={`Recommendations (${data.deep_recommendations.length})`}>
              {data.deep_recommendations.map((r, idx) => (
                <FindingCard
                  key={idx}
                  title={r.risk_id}
                  meta="Recommendation"
                  body={r.recommendation}
                  rationale={`${r.reason} → expected impact: ${r.expected_impact}`}
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

// ── presentational helpers ──────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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

function Row({ label, text, highlight }: { label: string; text: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 11, lineHeight: 1.55 }}>
      <span
        style={{
          color: 'var(--text-tertiary)',
          fontWeight: 600,
          minWidth: 86,
          textTransform: 'uppercase',
          fontSize: 9,
          letterSpacing: 0.5,
          paddingTop: 2,
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, color: highlight ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: highlight ? 600 : 400 }}>
        {text}
      </span>
    </div>
  )
}

function FindingCard({
  title,
  meta,
  body,
  rationale,
}: {
  title: string
  meta: string
  body: string
  rationale: string
}) {
  return (
    <div
      style={{
        padding: 10,
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>{title}</strong>
        <span
          style={{
            fontSize: 9,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {meta}
        </span>
        <span
          style={{
            background: 'rgba(168,85,247,0.18)',
            color: '#A855F7',
            border: '1px solid rgba(168,85,247,0.45)',
            padding: '1px 6px',
            borderRadius: 3,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginLeft: 'auto',
          }}
        >
          AI Hypothesis · pending review
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>
        {body}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic', lineHeight: 1.5 }}>
        {rationale}
      </div>
    </div>
  )
}
