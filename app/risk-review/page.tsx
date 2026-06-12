'use client'

/**
 * Risk Review & History — Phase 2
 *  2.8 Review cycles  · 2.6 Movement & trend · 3.6 Mitigation→Control
 */

import React, { useMemo, useState } from 'react'
import { CalendarClock, TrendingUp, ArrowUpRight, Camera, CheckCircle2 } from 'lucide-react'
import { MitigationActionsProvider, useMitigationActions } from '@/lib/context/MitigationActionsContext'
import { RiskHistoryProvider, useReviewCycles, useRiskSnapshots, useDerivedControls } from '@/lib/context/RiskHistoryContext'
import { RISKS } from '@/lib/engine/seedData'
import { HISTORY_TODAY, RATING_COLOR, liveScore, type RiskRating } from '@/lib/data/risk-history'
import { isFlagOn } from '@/lib/featureFlags'
import { PageHeader } from '@/components/ui/PageHeader'

type Tab = 'cycles' | 'movement' | 'promote'

export default function RiskReviewPage() {
  return (
    <MitigationActionsProvider>
      <RiskHistoryProvider>
        <Inner />
      </RiskHistoryProvider>
    </MitigationActionsProvider>
  )
}

function Inner() {
  const [tab, setTab] = useState<Tab>('cycles')
  if (!isFlagOn('erm_history')) return <div style={{ padding: 24, color: 'var(--text-tertiary)' }}>This module is not enabled.</div>
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 18px 60px' }}>
      <PageHeader
        eyebrow="Monitoring"
        title="Risk Review & History"
        subtitle={`Periodic review cycles, period-over-period movement, and promotion of completed mitigations into standing controls. Illustrative, persists in this browser. Today = ${HISTORY_TODAY}.`}
      />
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, borderBottom: '1px solid var(--border-color)' }}>
        <TabBtn active={tab === 'cycles'} onClick={() => setTab('cycles')} icon={<CalendarClock size={14} />} label="Review Cycles" />
        <TabBtn active={tab === 'movement'} onClick={() => setTab('movement')} icon={<TrendingUp size={14} />} label="Movement & Trend" />
        <TabBtn active={tab === 'promote'} onClick={() => setTab('promote')} icon={<ArrowUpRight size={14} />} label="Mitigation → Control" />
      </div>
      {tab === 'cycles' && <CyclesTab />}
      {tab === 'movement' && <MovementTab />}
      {tab === 'promote' && <PromoteTab />}
    </div>
  )
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: active ? 'var(--accent-primary)' : 'var(--text-tertiary)', borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent', marginBottom: -1 }}>{icon}{label}</button>
}

const th: React.CSSProperties = { textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4, padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }
const td: React.CSSProperties = { fontSize: 12, color: 'var(--text-secondary)', padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }

function reviewState(nextReview: string): { label: string; color: string } {
  if (nextReview < HISTORY_TODAY) return { label: 'Overdue', color: '#B42318' }
  const soon = new Date(HISTORY_TODAY + 'T00:00:00Z'); soon.setUTCDate(soon.getUTCDate() + 21)
  if (nextReview <= soon.toISOString().slice(0, 10)) return { label: 'Due soon', color: '#B54708' }
  return { label: 'On track', color: '#067647' }
}

// ── 2.8 Review cycles ────────────────────────────────────────────────────
function CyclesTab() {
  const { cycles, markReviewed } = useReviewCycles()
  const overdue = cycles.filter((c) => reviewState(c.nextReview).label === 'Overdue').length
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
        <strong style={{ color: overdue ? '#B42318' : 'var(--text-primary)' }}>{overdue}</strong> risk{overdue !== 1 ? 's' : ''} overdue for review.
      </div>
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead><tr><th style={th}>Risk</th><th style={th}>Frequency</th><th style={th}>Last review</th><th style={th}>Next due</th><th style={th}>Status</th><th style={th}>Reviewer</th><th style={th}></th></tr></thead>
          <tbody>
            {cycles.map((c) => {
              const s = reviewState(c.nextReview)
              return (
                <tr key={c.riskId}>
                  <td style={td}><span style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: 10.5 }}>{c.riskId}</span> {c.riskName.slice(0, 40)}</td>
                  <td style={td}>{c.frequency}</td>
                  <td style={td}>{c.lastReview}</td>
                  <td style={td}>{c.nextReview}</td>
                  <td style={td}><span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: `${s.color}1a`, border: `1px solid ${s.color}40`, borderRadius: 999, padding: '1px 8px' }}>{s.label}</span></td>
                  <td style={td}>{c.reviewer}</td>
                  <td style={td}><button onClick={() => markReviewed(c.riskId, HISTORY_TODAY, c.reviewer)} style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', borderRadius: 6, padding: '3px 9px', cursor: 'pointer' }}>Mark reviewed</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── 2.6 Movement & trend ─────────────────────────────────────────────────
function MovementTab() {
  const { snapshots, takeSnapshot } = useRiskSnapshots()
  const liveEntries = useMemo(() => RISKS.map((r) => ({ riskId: r.id, score: liveScore(r) })), [])

  const sorted = [...snapshots].sort((a, b) => a.takenAt.localeCompare(b.takenAt))
  const latest = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]

  const rows = RISKS.map((r) => {
    const cur = latest?.entries.find((e) => e.riskId === r.id)
    const old = prev?.entries.find((e) => e.riskId === r.id)
    const delta = cur && old ? cur.score - old.score : 0
    const trend = sorted.map((s) => s.entries.find((e) => e.riskId === r.id)?.score ?? 0)
    return { id: r.id, name: r.name, cur, delta, trend }
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {sorted.length} snapshots · comparing <strong>{latest?.label || '—'}</strong> vs <strong>{prev?.label || '—'}</strong>
        </div>
        <button onClick={() => takeSnapshot(`Snapshot ${HISTORY_TODAY}`, HISTORY_TODAY, liveEntries)} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <Camera size={13} /> Freeze snapshot now
        </button>
      </div>
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead><tr><th style={th}>Risk</th><th style={th}>Current score</th><th style={th}>Rating</th><th style={th}>Movement</th><th style={th}>Trend (oldest→newest)</th></tr></thead>
          <tbody>
            {rows.map((row) => {
              const rating = row.cur?.rating as RiskRating | undefined
              const up = row.delta > 0, down = row.delta < 0
              const mvColor = up ? '#B42318' : down ? '#067647' : 'var(--text-tertiary)'
              return (
                <tr key={row.id}>
                  <td style={td}><span style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: 10.5 }}>{row.id}</span> {row.name.slice(0, 38)}</td>
                  <td style={td}>{row.cur?.score ?? '—'}</td>
                  <td style={td}>{rating ? <span style={{ fontSize: 10, fontWeight: 700, color: RATING_COLOR[rating], background: `${RATING_COLOR[rating]}1a`, border: `1px solid ${RATING_COLOR[rating]}40`, borderRadius: 999, padding: '1px 8px' }}>{rating}</span> : '—'}</td>
                  <td style={{ ...td, color: mvColor, fontWeight: 700 }}>{up ? '▲ increased' : down ? '▼ decreased' : '▬ stable'} {row.delta !== 0 ? `(${row.delta > 0 ? '+' : ''}${row.delta})` : ''}</td>
                  <td style={td}><Spark values={row.trend} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Spark({ values }: { values: number[] }) {
  if (!values.length) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>
  const max = 25
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 3, height: 22 }}>
      {values.map((v, i) => (
        <span key={i} title={String(v)} style={{ width: 7, height: `${Math.max(8, (v / max) * 100)}%`, background: i === values.length - 1 ? 'var(--accent-primary)' : 'var(--border-accent)', borderRadius: 1, display: 'inline-block' }} />
      ))}
    </span>
  )
}

// ── 3.6 Mitigation → Control ─────────────────────────────────────────────
function PromoteTab() {
  const { actions } = useMitigationActions()
  const { derivedControls, promote, remove } = useDerivedControls()
  const promotedFrom = new Set(derivedControls.map((d) => d.fromMitigationId))
  const closed = actions.filter((a) => a.status === 'closed')

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
        When a mitigation is completed and accepted, promote it into a <strong>standing control</strong> so the improved control environment is captured.
      </p>

      <h3 style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 8px' }}>Completed mitigations</h3>
      {closed.length === 0 && <Empty label="No completed mitigations yet — close one in the register, then promote it here." />}
      {closed.map((a) => {
        const done = promotedFrom.has(a.id)
        return (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border-color)', borderRadius: 9, padding: '10px 14px', background: 'var(--bg-secondary)', marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{a.name}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>on {a.riskId} · owner {a.owner}</div>
            </div>
            {done ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#067647' }}><CheckCircle2 size={13} /> Promoted</span>
            ) : (
              <button onClick={() => promote({ name: `${a.name} (standing control)`, riskId: a.riskId, owner: a.owner, frequency: 'Quarterly', fromMitigationId: a.id, fromMitigationName: a.name })} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#fff', background: 'var(--accent-primary)', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer' }}>
                <ArrowUpRight size={13} /> Promote to control
              </button>
            )}
          </div>
        )
      })}

      <h3 style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', margin: '18px 0 8px' }}>Controls created from mitigations</h3>
      {derivedControls.length === 0 && <Empty label="None yet." />}
      {derivedControls.map((d) => (
        <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border-color)', borderRadius: 9, padding: '10px 14px', background: 'var(--bg-secondary)', marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-tertiary)' }}>{d.id}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</span>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>covers {d.riskId} · {d.frequency} · {d.owner} · from {d.fromMitigationName}</div>
          </div>
          <button onClick={() => remove(d.id)} style={{ fontSize: 10.5, color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>undo</button>
        </div>
      ))}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12.5, fontStyle: 'italic' }}>{label}</div>
}
