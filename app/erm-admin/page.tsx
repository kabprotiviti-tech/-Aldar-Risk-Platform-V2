'use client'

/**
 * ERM Admin — Phase 3
 *  1.2  User management
 *  6.3  Reporting cut-offs (freeze / version / sign-off)
 *  P2.3 Scenario library (save / version / compare)
 */

import React, { useMemo, useState } from 'react'
import { Users, FileLock2, GitCompare, Plus, Trash2, Stamp, Camera } from 'lucide-react'
import { UserDirectoryProvider, useUserDirectory } from '@/lib/context/UserDirectoryContext'
import { ReportingCyclesProvider, useReportingCycles, type ReportPack } from '@/lib/context/ReportingCyclesContext'
import { ScenarioLibraryProvider, useScenarioLibrary, type SavedScenario } from '@/lib/context/ScenarioLibraryContext'
import { type ErmRole } from '@/lib/data/erm-users'
import { RISKS } from '@/lib/engine/seedData'
import { bandForScore, liveScore } from '@/lib/data/risk-history'
import { isFlagOn } from '@/lib/featureFlags'

type Tab = 'users' | 'reporting' | 'scenarios'

export default function ErmAdminPage() {
  return (
    <UserDirectoryProvider>
      <ReportingCyclesProvider>
        <ScenarioLibraryProvider>
          <Inner />
        </ScenarioLibraryProvider>
      </ReportingCyclesProvider>
    </UserDirectoryProvider>
  )
}

function Inner() {
  const [tab, setTab] = useState<Tab>('users')
  if (!isFlagOn('erm_reporting')) return <div style={{ padding: 24, color: 'var(--text-tertiary)' }}>This module is not enabled.</div>
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 18px 60px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>ERM Administration</h1>
      <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginBottom: 18 }}>
        Manage users &amp; roles, freeze versioned reporting cut-offs, and save / compare scenarios. Illustrative, persists in this browser.
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, borderBottom: '1px solid var(--border-color)' }}>
        <TabBtn active={tab === 'users'} onClick={() => setTab('users')} icon={<Users size={14} />} label="Users & Roles" />
        <TabBtn active={tab === 'reporting'} onClick={() => setTab('reporting')} icon={<FileLock2 size={14} />} label="Reporting Cut-offs" />
        <TabBtn active={tab === 'scenarios'} onClick={() => setTab('scenarios')} icon={<GitCompare size={14} />} label="Scenario Library" />
      </div>
      {tab === 'users' && <UsersTab />}
      {tab === 'reporting' && <ReportingTab />}
      {tab === 'scenarios' && <ScenariosTab />}
    </div>
  )
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: active ? 'var(--accent-primary)' : 'var(--text-tertiary)', borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent', marginBottom: -1 }}>{icon}{label}</button>
}

const inp: React.CSSProperties = { width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12.5 }
const lbl: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 3 }
const th: React.CSSProperties = { textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4, padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }
const td: React.CSSProperties = { fontSize: 12, color: 'var(--text-secondary)', padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }
const ROLES: ErmRole[] = ['ERM Administrator', 'Risk Champion', 'Risk Owner', 'Control Owner', 'Group CRO', 'ARC Chair']

// ── 1.2 Users ────────────────────────────────────────────────────────────
function UsersTab() {
  const { users, add, update, remove } = useUserDirectory()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ name: '', role: 'Risk Champion' as ErmRole, title: '', entity: 'aldar-group' })

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}><Plus size={14} />{open ? 'Close' : 'Add user'}</button>
      {open && (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 14, background: 'var(--bg-primary)', marginBottom: 14, display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 1.5fr auto', gap: 10, alignItems: 'end' }}>
          <div><label style={lbl}>Name</label><input style={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><label style={lbl}>Role</label><select style={inp} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as ErmRole })}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
          <div><label style={lbl}>Title</label><input style={inp} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><label style={lbl}>Entity</label><input style={inp} value={f.entity} onChange={(e) => setF({ ...f, entity: e.target.value })} /></div>
          <button onClick={() => { if (f.name.trim()) { add({ name: f.name.trim(), role: f.role, title: f.title, entity: f.entity as never, persona: 'risk-champion' }); setF({ ...f, name: '', title: '' }); setOpen(false) } }} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Create</button>
        </div>
      )}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead><tr><th style={th}>Name</th><th style={th}>Role</th><th style={th}>Title</th><th style={th}>Entity</th><th style={th}></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ ...td, color: 'var(--text-primary)', fontWeight: 600 }}>{u.name}</td>
                <td style={td}>
                  <select value={u.role} onChange={(e) => update(u.id, { role: e.target.value as ErmRole })} style={{ ...inp, padding: '3px 6px', fontSize: 11.5, width: 'auto' }}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
                </td>
                <td style={td}>{u.title}</td>
                <td style={td}>{u.entity}</td>
                <td style={td}><button onClick={() => remove(u.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><Trash2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── 6.3 Reporting cut-offs ───────────────────────────────────────────────
function livePosture(): ReportPack['posture'] {
  let critical = 0, high = 0, medium = 0, low = 0
  for (const r of RISKS) {
    const band = bandForScore(liveScore(r))
    if (band === 'Critical') critical++; else if (band === 'High') high++; else if (band === 'Medium') medium++; else low++
  }
  return { critical, high, medium, low, totalExposureAedM: 900 }
}

function ReportingTab() {
  const { packs, createPack, signOff, remove } = useReportingCycles()
  const [label, setLabel] = useState('Q2 2026 ARC pack')
  const [cutOff, setCutOff] = useState('2026-06-30')

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap', marginBottom: 16, border: '1px solid var(--border-color)', borderRadius: 10, padding: 14, background: 'var(--bg-primary)' }}>
        <div style={{ flex: '1 1 220px' }}><label style={lbl}>Pack label</label><input style={inp} value={label} onChange={(e) => setLabel(e.target.value)} /></div>
        <div><label style={lbl}>Cut-off date</label><input type="date" style={inp} value={cutOff} onChange={(e) => setCutOff(e.target.value)} /></div>
        <button onClick={() => createPack(label, cutOff, livePosture())} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}><Camera size={14} /> Freeze cut-off</button>
      </div>
      {packs.length === 0 && <Empty label="No reporting cut-offs frozen yet. Freeze one to create an immutable, versioned pack." />}
      {packs.map((p) => (
        <div key={p.id} style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '12px 16px', background: 'var(--bg-secondary)', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10.5, color: 'var(--text-tertiary)' }}>{p.id}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#1D4ED8', background: '#1D4ED81a', border: '1px solid #1D4ED840', borderRadius: 999, padding: '1px 8px' }}>v{p.version}</span>
            {p.status === 'signed'
              ? <span style={{ fontSize: 10, fontWeight: 700, color: '#067647', background: '#0676471a', border: '1px solid #06764740', borderRadius: 999, padding: '1px 8px' }}>Signed · {p.signedBy}</span>
              : <span style={{ fontSize: 10, fontWeight: 700, color: '#B54708', background: '#B547081a', border: '1px solid #B5470840', borderRadius: 999, padding: '1px 8px' }}>Draft</span>}
            <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-tertiary)' }}>cut-off {p.cutOffDate} · frozen {new Date(p.frozenAt).toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 6 }}>
            Frozen posture: <strong style={{ color: '#7A0019' }}>{p.posture.critical} Critical</strong> · {p.posture.high} High · {p.posture.medium} Medium · {p.posture.low} Low · net exposure AED {p.posture.totalExposureAedM}m
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            {p.status === 'draft' && <button onClick={() => signOff(p.id, 'Sir Geoffrey Pike (ARC Chair)')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#fff', background: 'var(--accent-primary)', border: 'none', borderRadius: 7, padding: '5px 11px', cursor: 'pointer' }}><Stamp size={12} /> Sign off</button>}
            <button onClick={() => remove(p.id)} style={{ fontSize: 10.5, color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── P2.3 Scenario library ────────────────────────────────────────────────
function ScenariosTab() {
  const { scenarios, save, remove } = useScenarioLibrary()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ name: '', intensity: 'moderate' as SavedScenario['intensity'], note: '', criticalCount: '5', highCount: '8', exposureAedM: '1180', appetiteBreaches: '3' })
  const [a, setA] = useState('')
  const [b, setB] = useState('')

  const A = scenarios.find((s) => s.id === a)
  const B = scenarios.find((s) => s.id === b)

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}><Plus size={14} />{open ? 'Close' : 'Save scenario'}</button>
      {open && (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 14, background: 'var(--bg-primary)', marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Scenario name</label><input style={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Key vendor failure" /></div>
            <div><label style={lbl}>Intensity</label><select style={inp} value={f.intensity} onChange={(e) => setF({ ...f, intensity: e.target.value as SavedScenario['intensity'] })}>{(['mild', 'moderate', 'severe'] as const).map((i) => <option key={i} value={i}>{i}</option>)}</select></div>
          </div>
          <div style={{ marginBottom: 10 }}><label style={lbl}>Note</label><input style={inp} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
            <div><label style={lbl}>Critical count</label><input style={inp} value={f.criticalCount} onChange={(e) => setF({ ...f, criticalCount: e.target.value })} /></div>
            <div><label style={lbl}>High count</label><input style={inp} value={f.highCount} onChange={(e) => setF({ ...f, highCount: e.target.value })} /></div>
            <div><label style={lbl}>Exposure (AED m)</label><input style={inp} value={f.exposureAedM} onChange={(e) => setF({ ...f, exposureAedM: e.target.value })} /></div>
            <div><label style={lbl}>Appetite breaches</label><input style={inp} value={f.appetiteBreaches} onChange={(e) => setF({ ...f, appetiteBreaches: e.target.value })} /></div>
          </div>
          <button onClick={() => { if (f.name.trim()) { save({ name: f.name.trim(), intensity: f.intensity, note: f.note, outcome: { criticalCount: Number(f.criticalCount), highCount: Number(f.highCount), exposureAedM: Number(f.exposureAedM), appetiteBreaches: Number(f.appetiteBreaches) } }); setF({ ...f, name: '', note: '' }); setOpen(false) } }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Save scenario</button>
        </div>
      )}

      {/* Compare */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 14, marginBottom: 16, background: 'var(--bg-secondary)' }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Compare scenarios</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <select style={{ ...inp, maxWidth: 260 }} value={a} onChange={(e) => setA(e.target.value)}><option value="">— scenario A —</option>{scenarios.map((s) => <option key={s.id} value={s.id}>{s.name} v{s.version}</option>)}</select>
          <select style={{ ...inp, maxWidth: 260 }} value={b} onChange={(e) => setB(e.target.value)}><option value="">— scenario B —</option>{scenarios.map((s) => <option key={s.id} value={s.id}>{s.name} v{s.version}</option>)}</select>
        </div>
        {A && B ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Metric</th><th style={th}>{A.name} v{A.version}</th><th style={th}>{B.name} v{B.version}</th><th style={th}>Δ</th></tr></thead>
            <tbody>
              {([['Critical', 'criticalCount'], ['High', 'highCount'], ['Exposure (AED m)', 'exposureAedM'], ['Appetite breaches', 'appetiteBreaches']] as const).map(([k, key]) => {
                const av = A.outcome[key], bv = B.outcome[key], d = bv - av
                return <tr key={key}><td style={td}>{k}</td><td style={td}>{av}</td><td style={td}>{bv}</td><td style={{ ...td, fontWeight: 700, color: d > 0 ? '#B42318' : d < 0 ? '#067647' : 'var(--text-tertiary)' }}>{d > 0 ? '+' : ''}{d}</td></tr>
              })}
            </tbody>
          </table>
        ) : <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Pick two saved scenarios to compare side-by-side.</div>}
      </div>

      {scenarios.map((s) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border-color)', borderRadius: 9, padding: '10px 14px', background: 'var(--bg-secondary)', marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#1D4ED8', background: '#1D4ED81a', border: '1px solid #1D4ED840', borderRadius: 999, padding: '1px 7px' }}>v{s.version}</span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{s.intensity}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.outcome.criticalCount} Critical · {s.outcome.highCount} High · AED {s.outcome.exposureAedM}m · {s.outcome.appetiteBreaches} breaches{s.note ? ` · ${s.note}` : ''}</div>
          </div>
          <button onClick={() => remove(s.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><Trash2 size={13} /></button>
        </div>
      ))}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12.5, fontStyle: 'italic' }}>{label}</div>
}
