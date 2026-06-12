'use client'

/**
 * Control Intelligence — Phase 1
 *  - 3.2  Control reuse: link one control to MANY risks (extra links overlay)
 *  - P3.2 AI framework benchmarking: tag a control to ISO 31000 / COSO / NIST
 */

import React, { useMemo, useState } from 'react'
import { Layers, Sparkles, Link2, X } from 'lucide-react'
import { controls } from '@/lib/controlData'
import { ControlOverlaysProvider, useControlOverlays, type FrameworkTag } from '@/lib/context/ControlOverlaysContext'
import { RiskDraftProvider, useRiskDrafts } from '@/lib/context/RiskDraftContext'
import { seedRiskOptions } from '@/lib/data/governance-records'
import { isFlagOn } from '@/lib/featureFlags'
import { Stagger, StaggerItem, CountUp } from '@/components/motion/Motion'
import { PageHeader } from '@/components/ui/PageHeader'

export default function ControlIntelligencePage() {
  return (
    <RiskDraftProvider>
      <ControlOverlaysProvider>
        <Inner />
      </ControlOverlaysProvider>
    </RiskDraftProvider>
  )
}

const STATUS_COLOR: Record<string, string> = { effective: '#067647', partial: '#B54708', failed: '#B42318' }

function Inner() {
  const { drafts } = useRiskDrafts()
  const { frameworkTags, extraRiskLinks, setFrameworkTag, linkRisk, unlinkRisk } = useControlOverlays()
  const riskOptions = useMemo(() => [...seedRiskOptions(), ...drafts.map((d) => ({ id: d.id, name: d.name }))], [drafts])

  if (!isFlagOn('erm_entities')) return <div style={{ padding: 24, color: 'var(--text-tertiary)' }}>This module is not enabled.</div>

  const reusedCount = controls.filter((c) => (extraRiskLinks[c.id] || []).length > 0).length
  const taggedCount = Object.keys(frameworkTags).length

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 18px 60px' }}>
      <PageHeader
        eyebrow="Controls"
        title="Control Intelligence"
        subtitle="Reuse a control across multiple risks, and benchmark it against ISO 31000 / COSO ERM / NIST with AI. Overlays persist in this browser; the seed control library is untouched."
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <Stat label="Controls" value={controls.length} />
        <Stat label="Reused across >1 risk" value={reusedCount} />
        <Stat label="Framework-tagged" value={taggedCount} />
      </div>

      <Stagger>
        {controls.map((c) => (
          <StaggerItem key={c.id}>
            <ControlCard
              control={c}
              riskOptions={riskOptions}
              extraLinks={extraRiskLinks[c.id] || []}
              tag={frameworkTags[c.id]}
              onLink={(rid) => linkRisk(c.id, rid)}
              onUnlink={(rid) => unlinkRisk(c.id, rid)}
              onTag={(t) => setFrameworkTag(c.id, t)}
            />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 16px', background: 'var(--bg-secondary)', minWidth: 120 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-primary)' }}><CountUp value={value} /></div>
      <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function ControlCard({ control, riskOptions, extraLinks, tag, onLink, onUnlink, onTag }: {
  control: typeof controls[number]
  riskOptions: { id: string; name: string }[]
  extraLinks: string[]
  tag?: FrameworkTag
  onLink: (rid: string) => void
  onUnlink: (rid: string) => void
  onTag: (t: FrameworkTag) => void
}) {
  const [adding, setAdding] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const allCoveredIds = [control.linkedRiskId, ...extraLinks]
  const coverage = allCoveredIds.length

  async function benchmark() {
    setLoading(true); setErr('')
    try {
      const res = await fetch('/api/control-framework-tag', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ control: { name: control.name, description: control.description, controlType: control.controlType, process: control.process } }),
      })
      const data = await res.json()
      if (data?.tag) onTag(data.tag)
      else setErr('AI unavailable — try again.')
    } catch {
      setErr('AI unavailable — try again.')
    } finally {
      setLoading(false)
    }
  }

  const sc = STATUS_COLOR[control.status] || 'var(--text-tertiary)'
  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '14px 16px', background: 'var(--bg-secondary)', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10.5, color: 'var(--text-tertiary)' }}>{control.id}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: sc, background: `${sc}1a`, border: `1px solid ${sc}40`, borderRadius: 999, padding: '1px 8px' }}>{control.status}</span>
        <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{control.process} · {control.frequency} · {control.owner}</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: coverage > 1 ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
          <Layers size={12} /> covers {coverage} risk{coverage !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{control.name}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.45 }}>{control.description}</div>

      {/* Reuse / coverage */}
      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)' }}>Risks covered:</span>
        <RiskChip id={control.linkedRiskId} name={control.linkedRiskTitle} primary />
        {extraLinks.map((rid) => (
          <RiskChip key={rid} id={rid} name={riskOptions.find((o) => o.id === rid)?.name} onRemove={() => onUnlink(rid)} />
        ))}
        <select value={adding} onChange={(e) => { if (e.target.value) { onLink(e.target.value); setAdding('') } }} style={{ fontSize: 11, padding: '3px 6px', borderRadius: 6, border: '1px dashed var(--border-accent)', background: 'transparent', color: 'var(--accent-primary)' }}>
          <option value="">+ link another risk…</option>
          {riskOptions.filter((o) => !allCoveredIds.includes(o.id)).map((o) => <option key={o.id} value={o.id}>{o.id} · {o.name}</option>)}
        </select>
      </div>

      {/* Framework benchmarking */}
      <div style={{ marginTop: 10, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
        {tag ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <FwTag label="ISO 31000" value={tag.iso31000} />
            <FwTag label="COSO ERM" value={tag.coso} />
            <FwTag label="NIST CSF" value={tag.nist} />
            {tag.rationale && <div style={{ gridColumn: '1 / -1', fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{tag.rationale}</div>}
          </div>
        ) : (
          <button onClick={benchmark} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border-accent)', background: 'var(--accent-glow)', color: 'var(--accent-primary)', fontSize: 11.5, fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}>
            <Sparkles size={12} />{loading ? 'Benchmarking…' : 'Benchmark against ISO / COSO / NIST (AI)'}
          </button>
        )}
        {err && <span style={{ marginLeft: 8, fontSize: 10.5, color: '#B42318' }}>{err}</span>}
        {tag && (
          <button onClick={benchmark} disabled={loading} style={{ marginTop: 6, background: 'transparent', border: 'none', color: 'var(--text-tertiary)', fontSize: 10, cursor: 'pointer', textDecoration: 'underline' }}>{loading ? 'Re-running…' : 're-run'}</button>
        )}
      </div>
    </div>
  )
}

function RiskChip({ id, name, primary, onRemove }: { id: string; name?: string; primary?: boolean; onRemove?: () => void }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 600, color: primary ? 'var(--text-secondary)' : 'var(--accent-primary)', background: primary ? 'var(--bg-tertiary)' : 'var(--accent-glow)', border: `1px solid ${primary ? 'var(--border-color)' : 'var(--border-accent)'}`, borderRadius: 6, padding: '1px 7px' }}>
      <Link2 size={10} />{id}{name ? ` · ${name.slice(0, 26)}` : ''}{primary ? ' (primary)' : ''}
      {onRemove && <X size={10} style={{ cursor: 'pointer' }} onClick={onRemove} />}
    </span>
  )
}

function FwTag({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 7, padding: '6px 9px', background: 'var(--bg-primary)' }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: 0.3, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-primary)', marginTop: 2, lineHeight: 1.35 }}>{value || '—'}</div>
    </div>
  )
}
