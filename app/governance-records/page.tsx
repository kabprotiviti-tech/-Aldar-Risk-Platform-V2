'use client'

/**
 * Governance Records — Phase 1
 * Incidents (7.5), Risk Acceptances (7.6), Lessons Learned (7.7) — three
 * first-class, persisted, risk-linked record types in one tabbed surface.
 */

import React, { useMemo, useState } from 'react'
import { AlertTriangle, ShieldCheck, BookOpen, Plus, Trash2, Link2 } from 'lucide-react'
import {
  GovernanceRecordsProvider,
  useIncidents,
  useRiskAcceptances,
  useLessons,
} from '@/lib/context/GovernanceRecordsContext'
import { RiskDraftProvider, useRiskDrafts } from '@/lib/context/RiskDraftContext'
import {
  seedRiskOptions,
  INCIDENT_SEVERITY_META,
  INCIDENT_STATUS_META,
  type IncidentSeverity,
  type IncidentStatus,
  type LessonSource,
} from '@/lib/data/governance-records'
import { ERM_USERS, assignableOwners } from '@/lib/data/erm-users'
import { isFlagOn } from '@/lib/featureFlags'

type Tab = 'incidents' | 'acceptances' | 'lessons'

export default function GovernanceRecordsPage() {
  return (
    <RiskDraftProvider>
      <GovernanceRecordsProvider>
        <Inner />
      </GovernanceRecordsProvider>
    </RiskDraftProvider>
  )
}

function Inner() {
  const [tab, setTab] = useState<Tab>('incidents')
  const { drafts } = useRiskDrafts()
  const riskOptions = useMemo(() => {
    const seed = seedRiskOptions()
    const draftOpts = drafts.map((d) => ({ id: d.id, name: d.name }))
    return [...seed, ...draftOpts]
  }, [drafts])

  if (!isFlagOn('erm_entities')) {
    return <div style={{ padding: 24, color: 'var(--text-tertiary)' }}>This module is not enabled.</div>
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 18px 60px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Governance Records</h1>
      <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginBottom: 18 }}>
        Incidents, formal risk acceptances and lessons learned — each linked back to the risk register. Illustrative data, persists in this browser.
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18, borderBottom: '1px solid var(--border-color)' }}>
        <TabBtn active={tab === 'incidents'} onClick={() => setTab('incidents')} icon={<AlertTriangle size={14} />} label="Incidents" />
        <TabBtn active={tab === 'acceptances'} onClick={() => setTab('acceptances')} icon={<ShieldCheck size={14} />} label="Risk Acceptances" />
        <TabBtn active={tab === 'lessons'} onClick={() => setTab('lessons')} icon={<BookOpen size={14} />} label="Lessons Learned" />
      </div>

      {tab === 'incidents' && <IncidentsTab riskOptions={riskOptions} />}
      {tab === 'acceptances' && <AcceptancesTab riskOptions={riskOptions} />}
      {tab === 'lessons' && <LessonsTab riskOptions={riskOptions} />}
    </div>
  )
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: active ? 'var(--accent-primary)' : 'var(--text-tertiary)', borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent', marginBottom: -1 }}>
      {icon}{label}
    </button>
  )
}

// shared styles
const inp: React.CSSProperties = { width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12.5 }
const lbl: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 3 }
const card: React.CSSProperties = { border: '1px solid var(--border-color)', borderRadius: 10, padding: '14px 16px', background: 'var(--bg-secondary)', marginBottom: 10 }

function AddBtn({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}>
      <Plus size={14} />{open ? 'Close' : 'Add new'}
    </button>
  )
}

function RiskLink({ ids, options }: { ids: string[]; options: { id: string; name: string }[] }) {
  if (!ids.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
      {ids.map((id) => {
        const name = options.find((o) => o.id === id)?.name
        return (
          <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 600, color: 'var(--accent-primary)', background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', borderRadius: 6, padding: '1px 7px' }}>
            <Link2 size={10} />{id}{name ? ` · ${name.slice(0, 32)}` : ''}
          </span>
        )
      })}
    </div>
  )
}

// ── Incidents ────────────────────────────────────────────────────────────
function IncidentsTab({ riskOptions }: { riskOptions: { id: string; name: string }[] }) {
  const { incidents, add, remove } = useIncidents()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ title: '', occurredOn: '2026-06-01', severity: 'medium' as IncidentSeverity, description: '', owner: ERM_USERS[0].name, status: 'open' as IncidentStatus, linkedRiskIds: [] as string[], lossAmountAedM: '' })

  const submit = () => {
    if (!f.title.trim()) return
    add({ title: f.title.trim(), occurredOn: f.occurredOn, severity: f.severity, description: f.description.trim(), owner: f.owner, status: f.status, linkedRiskIds: f.linkedRiskIds, lossAmountAedM: f.lossAmountAedM ? Number(f.lossAmountAedM) : undefined })
    setF({ ...f, title: '', description: '', linkedRiskIds: [], lossAmountAedM: '' })
    setOpen(false)
  }

  return (
    <div>
      <AddBtn open={open} onClick={() => setOpen((v) => !v)} />
      {open && (
        <div style={{ ...card, background: 'var(--bg-primary)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Incident title</label><input style={inp} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="What happened" /></div>
            <div><label style={lbl}>Date</label><input type="date" style={inp} value={f.occurredOn} onChange={(e) => setF({ ...f, occurredOn: e.target.value })} /></div>
            <div><label style={lbl}>Severity</label><select style={inp} value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value as IncidentSeverity })}>{(['low', 'medium', 'high', 'critical'] as IncidentSeverity[]).map((s) => <option key={s} value={s}>{INCIDENT_SEVERITY_META[s].label}</option>)}</select></div>
          </div>
          <div style={{ marginBottom: 10 }}><label style={lbl}>Description</label><textarea rows={2} style={inp} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Owner</label><select style={inp} value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })}>{ERM_USERS.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
            <div><label style={lbl}>Status</label><select style={inp} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as IncidentStatus })}>{(['open', 'investigating', 'closed'] as IncidentStatus[]).map((s) => <option key={s} value={s}>{INCIDENT_STATUS_META[s].label}</option>)}</select></div>
            <div><label style={lbl}>Loss (AED m, optional)</label><input style={inp} value={f.lossAmountAedM} onChange={(e) => setF({ ...f, lossAmountAedM: e.target.value })} placeholder="0" /></div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Link to risk(s) — Ctrl/Cmd-click for multiple</label>
            <select multiple style={{ ...inp, height: 92 }} value={f.linkedRiskIds} onChange={(e) => setF({ ...f, linkedRiskIds: Array.from(e.target.selectedOptions, (o) => o.value) })}>
              {riskOptions.map((o) => <option key={o.id} value={o.id}>{o.id} · {o.name}</option>)}
            </select>
          </div>
          <button onClick={submit} disabled={!f.title.trim()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: f.title.trim() ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: f.title.trim() ? '#fff' : 'var(--text-tertiary)', fontSize: 12.5, fontWeight: 700, cursor: f.title.trim() ? 'pointer' : 'not-allowed' }}>Log incident</button>
        </div>
      )}
      {incidents.length === 0 && <Empty label="No incidents logged yet." />}
      {incidents.map((rec) => {
        const sev = INCIDENT_SEVERITY_META[rec.severity]; const st = INCIDENT_STATUS_META[rec.status]
        return (
          <div key={rec.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10.5, color: 'var(--text-tertiary)' }}>{rec.id}</span>
                  <Pill color={sev.color}>{sev.label}</Pill>
                  <Pill color={st.color}>{st.label}</Pill>
                  <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{rec.occurredOn} · {rec.owner}{rec.lossAmountAedM ? ` · loss AED ${rec.lossAmountAedM}m` : ''}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{rec.title}</div>
                {rec.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.45 }}>{rec.description}</div>}
                <RiskLink ids={rec.linkedRiskIds} options={riskOptions} />
              </div>
              <DeleteBtn onClick={() => remove(rec.id)} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Risk Acceptances ─────────────────────────────────────────────────────
function AcceptancesTab({ riskOptions }: { riskOptions: { id: string; name: string }[] }) {
  const { acceptances, add, remove } = useRiskAcceptances()
  const [open, setOpen] = useState(false)
  const owners = assignableOwners()
  const [f, setF] = useState({ riskId: riskOptions[0]?.id || '', rationale: '', residualExposureAedM: '', acceptedBy: owners[0]?.name || '', approver: 'Sir Geoffrey Pike (ARC Chair)', acceptedOn: '2026-06-01', reviewBy: '2026-09-30' })

  const submit = () => {
    if (!f.riskId || !f.rationale.trim()) return
    const riskName = riskOptions.find((o) => o.id === f.riskId)?.name || f.riskId
    add({ riskId: f.riskId, riskName, rationale: f.rationale.trim(), residualExposureAedM: f.residualExposureAedM ? Number(f.residualExposureAedM) : undefined, acceptedBy: f.acceptedBy, approver: f.approver, acceptedOn: f.acceptedOn, reviewBy: f.reviewBy })
    setF({ ...f, rationale: '', residualExposureAedM: '' })
    setOpen(false)
  }

  return (
    <div>
      <AddBtn open={open} onClick={() => setOpen((v) => !v)} />
      {open && (
        <div style={{ ...card, background: 'var(--bg-primary)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Risk being accepted</label><select style={inp} value={f.riskId} onChange={(e) => setF({ ...f, riskId: e.target.value })}>{riskOptions.map((o) => <option key={o.id} value={o.id}>{o.id} · {o.name}</option>)}</select></div>
            <div><label style={lbl}>Residual exposure (AED m)</label><input style={inp} value={f.residualExposureAedM} onChange={(e) => setF({ ...f, residualExposureAedM: e.target.value })} placeholder="optional" /></div>
          </div>
          <div style={{ marginBottom: 10 }}><label style={lbl}>Acceptance rationale (why accept above appetite)</label><textarea rows={3} style={inp} value={f.rationale} onChange={(e) => setF({ ...f, rationale: e.target.value })} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div><label style={lbl}>Accepted by</label><select style={inp} value={f.acceptedBy} onChange={(e) => setF({ ...f, acceptedBy: e.target.value })}>{owners.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
            <div><label style={lbl}>Approving authority</label><input style={inp} value={f.approver} onChange={(e) => setF({ ...f, approver: e.target.value })} /></div>
            <div><label style={lbl}>Accepted on</label><input type="date" style={inp} value={f.acceptedOn} onChange={(e) => setF({ ...f, acceptedOn: e.target.value })} /></div>
            <div><label style={lbl}>Re-review by</label><input type="date" style={inp} value={f.reviewBy} onChange={(e) => setF({ ...f, reviewBy: e.target.value })} /></div>
          </div>
          <button onClick={submit} disabled={!f.rationale.trim()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: f.rationale.trim() ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: f.rationale.trim() ? '#fff' : 'var(--text-tertiary)', fontSize: 12.5, fontWeight: 700, cursor: f.rationale.trim() ? 'pointer' : 'not-allowed' }}>Record acceptance</button>
        </div>
      )}
      {acceptances.length === 0 && <Empty label="No formal risk acceptances recorded." />}
      {acceptances.map((rec) => (
        <div key={rec.id} style={card}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10.5, color: 'var(--text-tertiary)' }}>{rec.id}</span>
                <Pill color="#7A0019">Accepted above appetite</Pill>
                {rec.residualExposureAedM ? <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>residual AED {rec.residualExposureAedM}m</span> : null}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{rec.riskId} · {rec.riskName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.45 }}>{rec.rationale}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 6 }}>Accepted by {rec.acceptedBy} · approved by <strong>{rec.approver}</strong> · {rec.acceptedOn} · re-review by {rec.reviewBy}</div>
            </div>
            <DeleteBtn onClick={() => remove(rec.id)} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Lessons Learned ──────────────────────────────────────────────────────
function LessonsTab({ riskOptions }: { riskOptions: { id: string; name: string }[] }) {
  const { lessons, add, remove } = useLessons()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ title: '', capturedOn: '2026-06-01', context: '', lesson: '', source: 'review' as LessonSource, linkedRiskId: '', author: ERM_USERS[1].name })

  const submit = () => {
    if (!f.title.trim() || !f.lesson.trim()) return
    add({ title: f.title.trim(), capturedOn: f.capturedOn, context: f.context.trim(), lesson: f.lesson.trim(), source: f.source, linkedRiskId: f.linkedRiskId || undefined, author: f.author })
    setF({ ...f, title: '', context: '', lesson: '', linkedRiskId: '' })
    setOpen(false)
  }

  return (
    <div>
      <AddBtn open={open} onClick={() => setOpen((v) => !v)} />
      {open && (
        <div style={{ ...card, background: 'var(--bg-primary)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Title</label><input style={inp} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div><label style={lbl}>Source</label><select style={inp} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value as LessonSource })}>{(['incident', 'mitigation', 'audit', 'review', 'other'] as LessonSource[]).map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label style={lbl}>Captured on</label><input type="date" style={inp} value={f.capturedOn} onChange={(e) => setF({ ...f, capturedOn: e.target.value })} /></div>
          </div>
          <div style={{ marginBottom: 10 }}><label style={lbl}>Context (what happened)</label><textarea rows={2} style={inp} value={f.context} onChange={(e) => setF({ ...f, context: e.target.value })} /></div>
          <div style={{ marginBottom: 10 }}><label style={lbl}>Lesson / what we changed</label><textarea rows={2} style={inp} value={f.lesson} onChange={(e) => setF({ ...f, lesson: e.target.value })} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div><label style={lbl}>Author</label><select style={inp} value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })}>{ERM_USERS.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
            <div><label style={lbl}>Link to risk (optional)</label><select style={inp} value={f.linkedRiskId} onChange={(e) => setF({ ...f, linkedRiskId: e.target.value })}><option value="">— none —</option>{riskOptions.map((o) => <option key={o.id} value={o.id}>{o.id} · {o.name}</option>)}</select></div>
          </div>
          <button onClick={submit} disabled={!f.title.trim() || !f.lesson.trim()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: f.title.trim() && f.lesson.trim() ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: f.title.trim() && f.lesson.trim() ? '#fff' : 'var(--text-tertiary)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Capture lesson</button>
        </div>
      )}
      {lessons.length === 0 && <Empty label="No lessons learned captured yet." />}
      {lessons.map((rec) => (
        <div key={rec.id} style={card}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10.5, color: 'var(--text-tertiary)' }}>{rec.id}</span>
                <Pill color="#1D4ED8">{rec.source}</Pill>
                <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{rec.capturedOn} · {rec.author}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{rec.title}</div>
              {rec.context && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.45 }}><strong>Context:</strong> {rec.context}</div>}
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.45 }}><strong>Lesson:</strong> {rec.lesson}</div>
              {rec.linkedRiskId && <RiskLink ids={[rec.linkedRiskId]} options={riskOptions} />}
            </div>
            <DeleteBtn onClick={() => remove(rec.id)} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}1a`, border: `1px solid ${color}40`, borderRadius: 999, padding: '1px 8px' }}>{children}</span>
}
function DeleteBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} title="Delete" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}><Trash2 size={14} /></button>
}
function Empty({ label }: { label: string }) {
  return <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12.5, fontStyle: 'italic' }}>{label}</div>
}
