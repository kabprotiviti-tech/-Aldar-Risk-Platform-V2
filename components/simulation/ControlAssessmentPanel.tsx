'use client'

/**
 * ControlAssessmentPanel
 * ----------------------
 * Listens for uploaded documents (via UploadedDocumentContext). If the
 * content looks like a control-effectiveness assessment, it:
 *
 *   1. Detects the pattern
 *   2. Parses rows into control areas
 *   3. Maps each area to a derived RiskDef
 *   4. Pushes those into DerivedRisksContext (simulation engine picks them up)
 *   5. Offers "Run AI Critic" for deeper second-line findings
 *
 * Non-destructive: seed RISKS are untouched; derived risks carry
 * source='control_assessment'.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useUploadedDocument } from '@/lib/context/UploadedDocumentContext'
import { useDerivedRisks } from '@/lib/context/DerivedRisksContext'
import {
  runControlAssessmentPipeline,
  type ControlArea,
  type DerivedRiskMeta,
} from '@/lib/engine/controlAssessmentAdapter'
import type { RiskDef } from '@/lib/engine/types'

interface AICriticResponse {
  weak_control_zones: Array<{ area: string; reason: string }>
  high_risk_zones: Array<{ risk_id: string; reason: string }>
  missing_risks: Array<{ name: string; category: string; why_missing: string }>
  recommendations: Array<{
    risk_id: string
    recommendation: string
    reason: string
    expected_impact: string
  }>
  assessment: { coverage: string; adaptability: string; verdict: string }
  source: 'ai' | 'fallback'
  error?: string
}

export function ControlAssessmentPanel() {
  const { content, fileName } = useUploadedDocument()
  const { setDerivedRisks, clearDerivedRisks, sourceFileName } = useDerivedRisks()

  const pipeline = useMemo(() => {
    if (!content || content.length < 40) return null
    return runControlAssessmentPipeline(content)
  }, [content])

  const [aiLoading, setAiLoading] = useState(false)
  const [ai, setAi] = useState<AICriticResponse | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  // When detection succeeds for a new upload, publish derived risks.
  useEffect(() => {
    if (!pipeline || !pipeline.detected) {
      if (sourceFileName) clearDerivedRisks()
      return
    }
    if (fileName && fileName !== sourceFileName) {
      setDerivedRisks({
        risks: pipeline.derived.risks,
        meta: pipeline.derived.meta,
        areas: pipeline.areas,
        sourceFileName: fileName,
      })
      setAi(null)
      setAiError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipeline, fileName])

  if (!content || content.length < 40) return null
  if (!pipeline) return null
  if (!pipeline.detected) {
    return (
      <DetectionBanner
        detected={false}
        reason={pipeline.detection.reason}
      />
    )
  }

  const { areas, derived } = pipeline
  const risks = derived.risks
  const meta = derived.meta

  const runAi = async () => {
    setAiLoading(true)
    setAiError(null)
    setAi(null)
    try {
      const res = await fetch('/api/control-assessment-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areas: areas.map((a) => ({
            name: a.name,
            total_score: a.total_score,
            max_score: a.max_score,
            effectivenessPct: a.effectivenessPct,
          })),
          derived: risks.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            controlScore: r.controlScore ?? 0,
            controlAreaName: r.linkedControlArea ?? '',
          })),
        }),
      })
      const data: AICriticResponse = await res.json()
      setAi(data)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI critic failed')
    } finally {
      setAiLoading(false)
    }
  }

  // Find the weakest area + highest derived risk to highlight in the banner.
  const weakestArea = [...areas].sort((a, b) => a.effectivenessPct - b.effectivenessPct)[0]
  const highestDerived = [...risks].sort(
    (a, b) => (a.controlScore ?? 1) - (b.controlScore ?? 1),
  )[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
      <DetectionBanner
        detected
        fileName={fileName}
        areasCount={areas.length}
        risksCount={risks.length}
        weakest={weakestArea}
        highest={highestDerived}
      />

      {/* Control Areas table */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 8,
          padding: '14px 16px',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          Parsed Control Areas ({areas.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {areas.map((a) => (
            <AreaRow key={a.name} area={a} />
          ))}
        </div>
      </div>

      {/* Derived Risks */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 8,
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Derived Risks — Control-based ({risks.length})
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Added to the simulation pool alongside the original register. Tag: source=control_assessment
            </div>
          </div>
          <button
            onClick={runAi}
            disabled={aiLoading}
            style={{
              background: 'var(--accent-primary)',
              color: 'var(--on-accent)',
              border: 'none',
              fontSize: 11,
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: 4,
              cursor: aiLoading ? 'wait' : 'pointer',
            }}
          >
            {aiLoading ? 'Running…' : '🧠 Run AI Critic'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {risks.map((r) => (
            <DerivedRiskRow key={r.id} risk={r} meta={meta[r.id]} />
          ))}
        </div>
      </div>

      {/* AI results */}
      {aiError && (
        <div style={{ fontSize: 11, color: 'var(--risk-critical)' }}>AI critic error: {aiError}</div>
      )}
      {ai && <AISection ai={ai} />}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function DetectionBanner({
  detected,
  fileName,
  areasCount,
  risksCount,
  weakest,
  highest,
  reason,
}: {
  detected: boolean
  fileName?: string | null
  areasCount?: number
  risksCount?: number
  weakest?: ControlArea
  highest?: RiskDef
  reason?: string
}) {
  if (!detected) {
    return (
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px dashed var(--border-primary)',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 11,
          color: 'var(--text-tertiary)',
        }}
      >
        No control-assessment pattern detected in the uploaded file — using standard risk-register logic.
        <span style={{ marginLeft: 8, opacity: 0.6 }}>({reason})</span>
      </div>
    )
  }
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--accent-primary)',
        borderLeft: '3px solid var(--accent-primary)',
        borderRadius: 8,
        padding: '12px 16px',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: 0.5 }}>
        ✓ CONTROL-BASED RISKS DETECTED
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
        <b>{fileName}</b> — parsed <b>{areasCount}</b> control areas → <b>{risksCount}</b> derived risks added to the
        simulation pool.
        {weakest && (
          <>
            {' '}
            Weakest area: <b style={{ color: 'var(--risk-high)' }}>{weakest.name}</b> (
            {weakest.effectivenessPct.toFixed(0)}%).
          </>
        )}
        {highest && (
          <>
            {' '}
            Highest derived risk: <b style={{ color: 'var(--risk-critical)' }}>{highest.name}</b>.
          </>
        )}
      </div>
    </div>
  )
}

function AreaRow({ area }: { area: ControlArea }) {
  const pct = area.effectivenessPct
  const color =
    pct >= 80
      ? 'var(--risk-low)'
      : pct >= 60
      ? 'var(--risk-medium)'
      : pct >= 40
      ? 'var(--risk-high)'
      : 'var(--risk-critical)'
  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        borderRadius: 6,
        padding: '8px 12px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 120px',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500 }}>{area.name}</div>
      <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
        {area.total_score}/{area.max_score}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color }} />
        </div>
        <div style={{ fontSize: 10, color, fontWeight: 700, minWidth: 36, textAlign: 'right' }}>{pct.toFixed(0)}%</div>
      </div>
    </div>
  )
}

function DerivedRiskRow({ risk, meta }: { risk: RiskDef; meta?: DerivedRiskMeta }) {
  const cs = risk.controlScore ?? 0
  const drs = meta?.derived_risk_score ?? 1 - cs
  const severity = drs >= 0.6 ? 'critical' : drs >= 0.4 ? 'high' : drs >= 0.25 ? 'medium' : 'low'
  const color =
    severity === 'critical'
      ? 'var(--risk-critical)'
      : severity === 'high'
      ? 'var(--risk-high)'
      : severity === 'medium'
      ? 'var(--risk-medium)'
      : 'var(--risk-low)'
  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        borderRadius: 6,
        padding: '10px 12px',
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
          {risk.id} · {risk.name}
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--text-tertiary)' }}>
          <span>
            Control: <b style={{ color: 'var(--text-secondary)' }}>{(cs * 100).toFixed(0)}%</b>
          </span>
          <span>
            Derived: <b style={{ color }}>{(drs * 100).toFixed(0)}%</b>
          </span>
          <span style={{ textTransform: 'capitalize', color, fontWeight: 600 }}>{severity}</span>
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.5 }}>
        <b>Category:</b> {risk.category} · <b>Linked area:</b> {risk.linkedControlArea}
      </div>
      {meta?.reasoning && (
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{meta.reasoning}</div>
      )}
    </div>
  )
}

function AISection({ ai }: { ai: AICriticResponse }) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 8,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          AI Second-Line Critic
        </div>
        <span style={{ fontSize: 9, color: ai.source === 'ai' ? 'var(--risk-low)' : 'var(--risk-medium)', fontWeight: 700, letterSpacing: 0.5 }}>
          {ai.source === 'ai' ? 'LIVE AI' : 'FALLBACK'}
        </span>
      </div>

      {ai.weak_control_zones.length > 0 && (
        <List title="Weak control zones" items={ai.weak_control_zones.map((x) => `${x.area} — ${x.reason}`)} color="var(--risk-high)" />
      )}
      {ai.high_risk_zones.length > 0 && (
        <List title="High-risk zones" items={ai.high_risk_zones.map((x) => `${x.risk_id} — ${x.reason}`)} color="var(--risk-critical)" />
      )}
      {ai.missing_risks.length > 0 && (
        <List
          title="Missing risks (not in control sheet)"
          items={ai.missing_risks.map((x) => `${x.name} [${x.category}] — ${x.why_missing}`)}
          color="var(--accent-primary)"
        />
      )}
      {ai.recommendations.length > 0 && (
        <List
          title="Recommendations"
          items={ai.recommendations.map(
            (x) => `${x.risk_id}: ${x.recommendation} — ${x.reason} (Impact: ${x.expected_impact})`,
          )}
          color="var(--risk-low)"
        />
      )}

      <div
        style={{
          borderTop: '1px dotted var(--border-primary)',
          paddingTop: 8,
          fontSize: 10,
          color: 'var(--text-tertiary)',
          lineHeight: 1.5,
        }}
      >
        <b>Coverage:</b> {ai.assessment.coverage}
        <br />
        <b>Adaptability:</b> {ai.assessment.adaptability}
        <br />
        <b style={{ color: 'var(--text-secondary)' }}>Verdict:</b> {ai.assessment.verdict}
      </div>
    </div>
  )
}

function List({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color, textTransform: 'uppercase', marginBottom: 4 }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  )
}
