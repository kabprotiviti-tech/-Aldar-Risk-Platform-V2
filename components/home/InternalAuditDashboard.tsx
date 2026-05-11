'use client'

/**
 * InternalAuditDashboard — Block 2 P4d
 * --------------------------------------
 * Killer Q: "Where is the assurance gap between declared risk and tested controls?"
 *
 * Widgets:
 *   • Assurance coverage heatmap proxy — risks × tested control count
 *   • Open findings aging (proxy: open mitigation actions by age)
 *   • Combined assurance map (3 Lines summary)
 *   • Audit-trail freshness — last events
 *   • Single CTA: Open Audit Trail
 */

import React from 'react'
import Link from 'next/link'
import {
  ClipboardCheck,
  ShieldCheck,
  Activity,
  Layers,
  Search,
} from 'lucide-react'
import {
  SimulationProvider,
  useSimulation,
} from '@/lib/context/SimulationContext'
import {
  MitigationActionsProvider,
  useMitigationActions,
} from '@/lib/context/MitigationActionsContext'
import { useAuditTrail } from '@/lib/context/AuditTrailContext'
import { RISKS } from '@/lib/engine/seedData'
import { THREE_LINES } from '@/lib/data/three-lines-of-defense'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'

export function InternalAuditDashboard() {
  return (
    <SimulationProvider>
      <MitigationActionsProvider>
        <Inner />
      </MitigationActionsProvider>
    </SimulationProvider>
  )
}

function Inner() {
  const { risks } = useSimulation()
  const { actions } = useMitigationActions()
  const { events } = useAuditTrail()

  // Assurance proxy: per risk, count of controls × testing freshness.
  // Control list lives on RiskDef (RISKS), not RiskState — join by id.
  const ranked = [...risks]
    .map((r) => {
      const def = RISKS.find((x) => x.id === r.id)
      const controlCount = def?.controls.length ?? 0
      return {
        id: r.id,
        name: r.name,
        controlCount,
        controlGap: r.baseInherent - controlCount * 2.5, // crude proxy
        residual: r.newResidual,
      }
    })
    .sort((a, b) => b.controlGap - a.controlGap)

  const openFindings = actions.filter((a) => a.status !== 'closed')

  const recentEvents = events
    .slice()
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 6)

  return (
    <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <IllustrativeDataBanner pilotFeeds="Internal Audit Universe + audit-program tracking" />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <ClipboardCheck size={20} style={{ color: '#22C55E' }} />
            Chief Internal Auditor
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', maxWidth: 780, lineHeight: 1.55 }}>
            <em>"Where is the assurance gap between declared risk and tested controls?"</em> — independent assurance, read-mostly.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <StatusBadge tier="MVP" />
          <Link href="/audit-trail" style={ctaPrimary}>
            <ShieldCheck size={12} />
            Audit Trail
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        <KPI label="Risks in Scope" value={risks.length} accent="#22C55E" />
        <KPI label="Open Findings" value={openFindings.length} accent="#FF6600" sub="mitigation actions" />
        <KPI label="Total Audit Events" value={events.length} accent="#2D9EFF" sub="this browser session" />
        <KPI label="3LoD Roles" value={THREE_LINES.reduce((s, l) => s + l.roles.length, 0)} accent="#A855F7" />
      </div>

      <Section title="Assurance Coverage Gap (proxy)" subtitle="Risks with widest gap between inherent score and control count" accent="#FF6600" icon={<Search size={14} />} cta={<Link href="/risk-register" style={ctaSmall}>Open register →</Link>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ranked.slice(0, 6).map((r) => (
            <Link key={r.id} href={`/risk-register?focus=${r.id}`} style={rowLinkStyle}>
              <span style={monoStyle}>{r.id}</span>
              <span style={{ flex: 1, color: 'var(--text-primary)' }}>{r.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{r.controlCount} controls</span>
              <span style={{ fontSize: 10, color: r.controlGap > 5 ? '#FF3B3B' : 'var(--text-tertiary)', fontWeight: 700, minWidth: 50, textAlign: 'right' }}>
                gap {r.controlGap.toFixed(1)}
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Combined Assurance Map" subtitle="3 Lines of Defense — role count by line" accent="#A855F7" icon={<Layers size={14} />} cta={<Link href="/three-lines-of-defense" style={ctaSmall}>Operating model →</Link>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6 }}>
          {THREE_LINES.map((line) => (
            <div key={line.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderLeft: `3px solid ${line.color}`, borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: line.color, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>{line.label.replace('Line ', 'L').replace(' — ', ' · ').split('·')[0]}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{line.roles.length}</div>
              <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>roles defined</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Recent Audit-Trail Activity" subtitle={`${events.length} events captured`} accent="#22C55E" icon={<Activity size={14} />} cta={<Link href="/audit-trail" style={ctaSmall}>Full trail →</Link>}>
        {recentEvents.length === 0 ? (
          <Empty>No audit events yet. Activity from edits and approvals will appear here.</Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recentEvents.map((e) => (
              <div key={e.id} style={rowStaticStyle}>
                <span style={{ ...monoStyle, fontSize: 9 }}>
                  {new Date(e.at).toLocaleTimeString('en-AE', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4, minWidth: 80 }}>{e.category}</span>
                <span style={{ flex: 1, color: 'var(--text-primary)' }}>{e.summary}</span>
                <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{e.actor}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

function KPI({ label, value, accent, sub }: { label: string; value: number; accent: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderTop: `3px solid ${accent}`, borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: accent }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      {sub && <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>{sub}</span>}
    </div>
  )
}

function Section({ title, subtitle, accent, icon, cta, children }: { title: string; subtitle: string; accent: string; icon: React.ReactNode; cta?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderLeft: `4px solid ${accent}`, borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: accent, letterSpacing: 0.5, textTransform: 'uppercase' }}>{icon}{title}</div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{subtitle}</div>
        </div>
        {cta}
      </div>
      {children}
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 14, textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: 11, background: 'var(--bg-primary)', border: '1px dashed var(--border-color)', borderRadius: 6 }}>{children}</div>
}

const monoStyle: React.CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.4 }
const rowLinkStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 4, fontSize: 11, textDecoration: 'none', color: 'inherit' }
const rowStaticStyle: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 10, padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 4, fontSize: 11 }
const ctaPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-primary)', color: 'var(--on-accent)', border: 'none', padding: '7px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none' }
const ctaSmall: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent', color: 'var(--accent-primary)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none' }
