'use client'

/**
 * SubsidiaryCEODashboard — Block 2 P4c
 * --------------------------------------
 * Killer Q: "How is MY P&L tracking and what is Group escalating to me?"
 *
 * Widgets (entity-scoped):
 *   • Subsidiary heatmap snapshot (own entity only)
 *   • Top 5 risks at my subsidiary
 *   • KRI strip — entity-relevant indicators
 *   • Items Group has escalated TO this subsidiary
 *   • Single CTA: Open Portfolio Tower
 */

import React from 'react'
import Link from 'next/link'
import { Building2, AlertTriangle, ArrowDown, FileBarChart } from 'lucide-react'
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
import { RISKS } from '@/lib/engine/seedData'
import { KRI_DEFINITIONS } from '@/lib/data/kri-definitions'
import { computeKRIStatus, STATUS_META } from '@/lib/data/kri-status'
import { entityForRisk } from '@/lib/data/risk-entity-mapping'
import { getEntity } from '@/lib/entities/hierarchy'
import { usePersona } from '@/lib/context/PersonaContext'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'
import { TrustFooter } from '@/components/provenance/TrustFooter'
import { Sparkline, baselineSeries } from '@/components/ui/Sparkline'
import { ExternalIntelligenceFeed } from '@/components/home/ExternalIntelligenceFeed'

export function SubsidiaryCEODashboard() {
  return (
    <SimulationProvider>
      <KRIThresholdsProvider>
        <KRIEntriesProvider>
          <MitigationActionsProvider>
            <Inner />
          </MitigationActionsProvider>
        </KRIEntriesProvider>
      </KRIThresholdsProvider>
    </SimulationProvider>
  )
}

function Inner() {
  const { session } = usePersona()
  const { risks } = useSimulation()
  const { latestFor } = useKRIEntries()
  const { thresholdsFor } = useKRIThresholds()
  const { actions, isOverdue } = useMitigationActions()

  const scope = session.entityScope
  const entity = scope ? getEntity(scope) : null

  const myRisks = risks.filter((r) => (scope ? entityForRisk(r.id) === scope : true))
  // Pull driverImpacts from RISKS (RiskDef) — RiskState surfaces
  // `contributingDrivers` only post-simulation.
  const myRiskIdSet = new Set(myRisks.map((r) => r.id))
  const myDriverIds = new Set(
    RISKS
      .filter((r) => myRiskIdSet.has(r.id))
      .flatMap((r) => r.driverImpacts.map((di) => di.driverId)),
  )
  const myKRIs = KRI_DEFINITIONS.filter((k) => myDriverIds.has(k.driverId))
  const myRiskIds = new Set(myRisks.map((r) => r.id))
  const myActions = actions.filter((a) => myRiskIds.has(a.riskId) && a.status !== 'closed')
  const overdue = myActions.filter(isOverdue).length

  const totalExposure = myRisks.reduce((s, r) => s + r.exposureAedMn, 0)
  const top5 = [...myRisks]
    .sort((a, b) => b.newResidual - a.newResidual)
    .slice(0, 5)

  return (
    <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <IllustrativeDataBanner pilotFeeds={`${entity?.name ?? 'Subsidiary'} P&L + segment ledger feed`} />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Building2 size={20} style={{ color: '#A855F7' }} />
            CEO — {entity?.shortName ?? 'Subsidiary'}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', maxWidth: 780, lineHeight: 1.55 }}>
            <em>"How is MY P&L tracking and what is Group escalating to me?"</em> — accountable executive view, own-subsidiary only.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <StatusBadge tier="MVP" />
          <Link href="/portfolio-tower" style={ctaPrimary}>
            <FileBarChart size={12} />
            Portfolio Tower
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        <KPI label={`${entity?.shortName ?? 'Sub'} Risks`} value={myRisks.length} accent="#A855F7" sparkSeed={5} />
        <KPI label="Total Exposure" value={`${(totalExposure / 1000).toFixed(2)}`} unit="AED bn" accent="#FF6600" sparkSeed={19} sparkAnchor={totalExposure / 1000} />
        <KPI label="Open Actions" value={myActions.length} sub={overdue > 0 ? `${overdue} overdue` : 'on track'} subColor={overdue > 0 ? '#FF3B3B' : '#22C55E'} accent="#2D9EFF" sparkSeed={33} />
        <KPI label="Linked KRIs" value={myKRIs.length} accent="#22C55E" sparkSeed={51} />
      </div>

      <Section title="Top 5 Risks at this Subsidiary" subtitle="By residual exposure" accent="#FF6600" icon={<AlertTriangle size={14} />} cta={<Link href="/risk-register" style={ctaSmall}>All risks →</Link>}>
        {top5.length === 0 ? (
          <Empty>No engine risks tagged to {entity?.shortName ?? 'this subsidiary'} in the seed register.</Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {top5.map((r) => (
              <Link key={r.id} href={`/risk-register?focus=${r.id}`} style={rowLinkStyle}>
                <span style={monoStyle}>{r.id}</span>
                <span style={{ flex: 1, color: 'var(--text-primary)' }}>{r.name}</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                  {r.newResidual.toFixed(1)}/25 · {r.exposureAedMn.toFixed(0)} AED mn
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="Subsidiary KRI Strip" subtitle="Indicators on subsidiary risk drivers" accent="#22C55E" icon={<ArrowDown size={14} />}>
        {myKRIs.length === 0 ? (
          <Empty>No KRIs match this subsidiary's drivers.</Empty>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6 }}>
            {myKRIs.map((k) => {
              const t = thresholdsFor(k)
              const latest = latestFor(k.id)
              const meta = latest ? STATUS_META[computeKRIStatus(latest.value, t, k.direction)] : { label: 'No Data', color: '#888', bg: '#88888822', border: '#88888855' }
              return (
                <Link key={k.id} href="/kri" style={{ ...rowLinkStyle, borderLeft: `3px solid ${meta.color}` }}>
                  <span style={monoStyle}>{k.id}</span>
                  <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: 11 }}>{k.name}</span>
                  <span style={{ fontSize: 9, color: meta.color, fontWeight: 700 }}>{meta.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </Section>

      <div
        style={{
          padding: 12,
          background: 'var(--bg-secondary)',
          border: '1px dashed var(--border-color)',
          borderLeft: '3px solid var(--accent-primary)',
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>Group escalations to {entity?.shortName ?? 'this subsidiary'}:</strong>{' '}
        ship in P8 (Approvals queue). Pilot wires real Group → Subsidiary escalation feed.
      </div>

      <ExternalIntelligenceFeed limit={4} />

      <TrustFooter />
    </div>
  )
}

// shared bits
function KPI({ label, value, accent, sub, subColor, unit, sparkSeed, sparkAnchor }: { label: string; value: number | string; accent: string; sub?: string; subColor?: string; unit?: string; sparkSeed?: number; sparkAnchor?: number }) {
  const anchor = typeof sparkAnchor === 'number' ? sparkAnchor : typeof value === 'number' ? value : 0
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderTop: `3px solid ${accent}`, borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: accent }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
          {unit && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{unit}</span>}
        </span>
        {typeof sparkSeed === 'number' && (
          <Sparkline values={baselineSeries(anchor || 1, 10, sparkSeed)} width={56} height={20} color={accent} />
        )}
      </div>
      {sub && <span style={{ fontSize: 10, color: subColor ?? 'var(--text-tertiary)', fontWeight: 600 }}>{sub}</span>}
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
