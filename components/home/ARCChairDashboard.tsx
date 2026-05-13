'use client'

/**
 * ARCChairDashboard — Block 2 P4e
 * --------------------------------
 * Killer Q: "Has anything material happened since the last ARC meeting —
 * is management on top of it?"
 *
 * Widgets (read-only, board-level synthesis):
 *   • "Since last meeting" delta — new red risks, closed items, overdue
 *   • Top risks for next ARC (top 5 by residual)
 *   • Risk Appetite proposals pending approval
 *   • Pending escalations awaiting board direction
 *   • Single CTA: Open ARC Pack
 */

import React from 'react'
import Link from 'next/link'
import {
  Gavel,
  AlertTriangle,
  ShieldQuestion,
  ArrowUp,
  FileBarChart,
  Clock,
} from 'lucide-react'
import {
  SimulationProvider,
  useSimulation,
} from '@/lib/context/SimulationContext'
import {
  KRIThresholdsProvider,
  useKRIThresholds,
} from '@/lib/context/KRIThresholdsContext'
import {
  KRIEntriesProvider,
  useKRIEntries,
} from '@/lib/context/KRIEntriesContext'
import {
  MitigationActionsProvider,
  useMitigationActions,
} from '@/lib/context/MitigationActionsContext'
import {
  EscalationsProvider,
  useEscalations,
} from '@/lib/context/EscalationsContext'
import {
  RiskAppetiteProvider,
  useRiskAppetite,
} from '@/lib/context/RiskAppetiteContext'
import { useAuditTrail } from '@/lib/context/AuditTrailContext'
import { KRI_DEFINITIONS } from '@/lib/data/kri-definitions'
import { computeKRIStatus } from '@/lib/data/kri-status'
import {
  CONFIDENTIAL_ITEMS,
  CATEGORY_META as CONFIDENTIAL_CAT_META,
  countsBySeverity,
  countsByCategory,
} from '@/lib/data/arc-confidential'
import { can } from '@/lib/rbac/policy'
import { usePersona } from '@/lib/context/PersonaContext'
import { EyeOff } from 'lucide-react'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'
import { TrustFooter } from '@/components/provenance/TrustFooter'
import { ExternalIntelligenceFeed } from '@/components/home/ExternalIntelligenceFeed'
import { Sparkline, baselineSeries } from '@/components/ui/Sparkline'

export function ARCChairDashboard() {
  return (
    <SimulationProvider>
      <KRIThresholdsProvider>
        <KRIEntriesProvider>
          <MitigationActionsProvider>
            <EscalationsProvider>
              <RiskAppetiteProvider>
                <Inner />
              </RiskAppetiteProvider>
            </EscalationsProvider>
          </MitigationActionsProvider>
        </KRIEntriesProvider>
      </KRIThresholdsProvider>
    </SimulationProvider>
  )
}

function Inner() {
  const { persona } = usePersona()
  const canSeeConfidential = can(persona?.id ?? null, 'arc:confidential')
  const { risks } = useSimulation()
  const { latestFor } = useKRIEntries()
  const { thresholdsFor } = useKRIThresholds()
  const { actions, isOverdue } = useMitigationActions()
  const { escalations } = useEscalations()
  const { pendingProposals } = useRiskAppetite()
  const { events } = useAuditTrail()

  // 30-day "since last meeting" window (illustrative — pilot reads ARC date register)
  const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString()
  const recentEvents = events.filter((e) => e.at >= cutoff)

  const top5 = [...risks].sort((a, b) => b.newResidual - a.newResidual).slice(0, 5)
  const overdue = actions.filter(isOverdue).length
  const pendingEsc = escalations.filter((e) => e.status === 'pending')
  const pendingApp = pendingProposals()

  const kriRed = KRI_DEFINITIONS.reduce((n, k) => {
    const t = thresholdsFor(k)
    const latest = latestFor(k.id)
    if (!latest) return n
    return computeKRIStatus(latest.value, t, k.direction) === 'red' ? n + 1 : n
  }, 0)

  return (
    <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <IllustrativeDataBanner pilotFeeds="ARC minutes register + IA confidential findings + whistleblower system" />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Gavel size={20} style={{ color: '#F5C518' }} />
            ARC Chair — Audit & Risk Committee
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', maxWidth: 780, lineHeight: 1.55 }}>
            <em>"Has anything material happened since the last ARC meeting — is management on top of it?"</em> — read-only board oversight view.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <StatusBadge tier="MVP" />
          <Link href="/arc-pack" style={ctaPrimary}>
            <FileBarChart size={12} />
            Open ARC Pack
          </Link>
        </div>
      </div>

      <Section title="Since Last Meeting (30-day window)" subtitle="Material movement awaiting board awareness" accent="#F5C518" icon={<Clock size={14} />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          <DeltaTile label="Audit events" value={recentEvents.length} accent="#F5C518" sparkSeed={9} />
          <DeltaTile label="Red KRIs" value={kriRed} accent="#FF3B3B" sparkSeed={25} />
          <DeltaTile label="Overdue mitigations" value={overdue} accent="#FF8C00" sparkSeed={39} />
          <DeltaTile label="Pending escalations" value={pendingEsc.length} accent="#A855F7" sparkSeed={53} />
        </div>
      </Section>

      <Section title="Top 5 Risks for Next ARC" subtitle="By residual exposure" accent="#FF3B3B" icon={<AlertTriangle size={14} />} cta={<Link href="/risk-register" style={ctaSmall}>Open register →</Link>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {top5.map((r) => (
            <Link key={r.id} href={`/risk-register?focus=${r.id}`} style={rowLinkStyle}>
              <span style={monoStyle}>{r.id}</span>
              <span style={{ flex: 1, color: 'var(--text-primary)' }}>{r.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                residual {r.newResidual.toFixed(1)}/25
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10 }}>
        <Section title="Pending Approvals" subtitle="Risk Appetite proposals awaiting ARC decision" accent="#A855F7" icon={<ShieldQuestion size={14} />} cta={<Link href="/risk-appetite" style={ctaSmall}>Review →</Link>}>
          {pendingApp.length === 0 ? (
            <Empty>No proposals pending. ERM Head proposes changes from /risk-appetite.</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {pendingApp.slice(0, 5).map((p) => (
                <Link key={p.id} href="/risk-appetite" style={rowLinkStyle}>
                  <span style={monoStyle}>{p.id}</span>
                  <span style={{ flex: 1, color: 'var(--text-primary)' }}>
                    Proposed by {p.override.proposedBy ?? 'unknown'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section title="Pending Escalations" subtitle="Operational escalations awaiting Group / Board direction" accent="#FF8C00" icon={<ArrowUp size={14} />} cta={<Link href="/portfolio-tower" style={ctaSmall}>Portfolio Tower →</Link>}>
          {pendingEsc.length === 0 ? (
            <Empty>No pending escalations. Risk Champions raise these from /risk-register.</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {pendingEsc.slice(0, 5).map((e) => (
                <Link key={e.id} href={`/risk-register?focus=${e.riskId}`} style={rowLinkStyle}>
                  <span style={monoStyle}>{e.riskId}</span>
                  <span style={{ flex: 1, color: 'var(--text-primary)' }}>{e.riskName}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    by {e.escalatedBy}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* External intelligence — restored decision-intelligence feed */}
      <ExternalIntelligenceFeed limit={4} />

      {canSeeConfidential ? <ConfidentialPanel /> : <ConfidentialBlind />}

      <TrustFooter />
    </div>
  )
}

function ConfidentialPanel() {
  const sev = countsBySeverity()
  const byCat = countsByCategory()
  return (
    <section
      style={{
        background: 'rgba(168,85,247,0.06)',
        border: '1px solid rgba(168,85,247,0.40)',
        borderLeft: '4px solid #A855F7',
        borderRadius: 8,
        padding: 14,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 12,
          fontSize: 8,
          fontWeight: 700,
          color: '#A855F7',
          background: 'rgba(168,85,247,0.18)',
          border: '1px solid rgba(168,85,247,0.55)',
          padding: '2px 6px',
          borderRadius: 3,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        Executive Session · ARC + IA Only
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#A855F7',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        Confidential Items
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 10, maxWidth: 720, lineHeight: 1.5 }}>
        Field-level RBAC. Whistleblower / IA drafts / litigation / external
        auditor open points. SCA Code Art. 31 independence — ARC Chair sees
        this; Group ERM Head does not.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 12 }}>
        <SevTile label="High severity" value={sev.high} color="#FF3B3B" />
        <SevTile label="Medium severity" value={sev.medium} color="#FF8C00" />
        <SevTile label="Low severity" value={sev.low} color="#22C55E" />
        <SevTile label="Total open" value={sev.total} color="#A855F7" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
        {CONFIDENTIAL_ITEMS.map((item) => {
          const cat = CONFIDENTIAL_CAT_META[item.category]
          const sevColor =
            item.severity === 'high' ? '#FF3B3B' : item.severity === 'medium' ? '#FF8C00' : '#22C55E'
          return (
            <div
              key={item.id}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${cat.color}`,
                borderRadius: 6,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={monoStyle}>{item.id}</span>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: cat.color,
                    background: `${cat.color}1f`,
                    border: `1px solid ${cat.color}55`,
                    padding: '1px 5px',
                    borderRadius: 3,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                  }}
                >
                  {cat.label}
                </span>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: sevColor,
                    marginLeft: 'auto',
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                  }}
                >
                  {item.severity}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                {item.title}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {item.summary}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                opened {item.openedAt} · owner {item.owner}
              </div>
            </div>
          )
        })}
      </div>

      <div
        style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px dashed rgba(168,85,247,0.40)',
          fontSize: 9,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
        }}
      >
        Illustrative pre-pilot. Pilot wires whistleblower system + IA workpapers +
        Legal matters register + external auditor management-letter feed.
      </div>
    </section>
  )
}

function ConfidentialBlind() {
  return (
    <section
      style={{
        background: 'var(--bg-secondary)',
        border: '1px dashed var(--border-color)',
        borderLeft: '3px solid var(--text-tertiary)',
        borderRadius: 8,
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 11,
        color: 'var(--text-tertiary)',
        fontStyle: 'italic',
      }}
    >
      <EyeOff size={14} />
      <span>
        <strong style={{ color: 'var(--text-secondary)' }}>Executive Session content hidden.</strong>{' '}
        Whistleblower, draft IA findings, litigation register and external auditor letters
        are visible only to ARC Chair / Chief Internal Auditor (SCA Code Art. 31 independence).
      </span>
    </section>
  )
}

function SevTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: `1px solid ${color}55`,
        borderRadius: 6,
        padding: '8px 10px',
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
    </div>
  )
}

function DeltaTile({ label, value, accent, sparkSeed }: { label: string; value: number; accent: string; sparkSeed?: number }) {
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderLeft: `3px solid ${accent}`, borderRadius: 6, padding: '8px 10px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{value}</div>
        {typeof sparkSeed === 'number' && (
          <Sparkline values={baselineSeries(value || 1, 10, sparkSeed)} width={52} height={18} color={accent} />
        )}
      </div>
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
const ctaPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-primary)', color: 'var(--on-accent)', border: 'none', padding: '7px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none' }
const ctaSmall: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent', color: 'var(--accent-primary)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none' }
