'use client'

/**
 * ChampionDashboard — Block 2 P4b
 * --------------------------------
 * Risk Champion landing per BCG-locked design — the ONE persona where
 * data-entry primary actions are appropriate (1st-line operator).
 *
 * Killer Q: "What's overdue from me and what's escalating?"
 *
 * Widgets (subsidiary-scoped):
 *   • My Actions Inbox — drafts in progress + mitigations due
 *   • KRI quick-entry tiles — direct enter, no full table
 *   • My subsidiary heatmap snapshot — only their entity
 *   • Control test calendar (link)
 *   • Quick CTAs: Add Risk · Enter KRI Value · Escalate to Group
 */

import React from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Plus,
  Gauge,
  AlertTriangle,
  ArrowUp,
  Activity,
  ListChecks,
  ChevronRight,
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
  RiskDraftProvider,
  useRiskDrafts,
} from '@/lib/context/RiskDraftContext'
import { RISKS } from '@/lib/engine/seedData'
import { KRI_DEFINITIONS } from '@/lib/data/kri-definitions'
import { computeKRIStatus, STATUS_META } from '@/lib/data/kri-status'
import { entityForRisk } from '@/lib/data/risk-entity-mapping'
import { getEntity } from '@/lib/entities/hierarchy'
import { usePersona } from '@/lib/context/PersonaContext'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'
import { ExternalIntelligenceFeed } from '@/components/home/ExternalIntelligenceFeed'
import { TrustFooter } from '@/components/provenance/TrustFooter'
import { Sparkline, baselineSeries } from '@/components/ui/Sparkline'

export function ChampionDashboard() {
  return (
    <SimulationProvider>
      <RiskDraftProvider>
        <KRIThresholdsProvider>
          <KRIEntriesProvider>
            <MitigationActionsProvider>
              <ChampionInner />
            </MitigationActionsProvider>
          </KRIEntriesProvider>
        </KRIThresholdsProvider>
      </RiskDraftProvider>
    </SimulationProvider>
  )
}

function ChampionInner() {
  const { session, persona } = usePersona()
  const { risks } = useSimulation()
  const { drafts } = useRiskDrafts()
  const { actions, isOverdue } = useMitigationActions()
  const { latestFor } = useKRIEntries()
  const { thresholdsFor } = useKRIThresholds()

  const scope = session.entityScope
  const entity = scope ? getEntity(scope) : null

  // Filter to this Champion's subsidiary
  const myRisks = risks.filter((r) => (scope ? entityForRisk(r.id) === scope : true))
  const myRiskIds = new Set([...myRisks.map((r) => r.id), ...drafts.map((d) => d.id)])

  // My drafts (this Champion created them — use createdBy if available)
  const myDrafts = drafts.filter((d) => {
    if (!scope) return true
    // Drafts don't carry entity tags yet — show all drafts for this Champion
    // pending P6 entity scoping work; surface them all but note this in copy.
    return true
  })

  // My open mitigation actions on subsidiary risks
  const myActions = actions.filter(
    (a) => myRiskIds.has(a.riskId) && a.status !== 'closed',
  )
  const overdue = myActions.filter(isOverdue)

  // My KRIs — owner = persona owner mapping
  // Subsidiary champions don't have 1:1 KRI ownership in the seed; show all
  // KRIs but call out the ones connected to subsidiary risks. Pull
  // driverImpacts from RISKS (RiskDef) since RiskState surfaces only the
  // post-simulation `contributingDrivers` field.
  const myRiskIdsForDrivers = new Set(myRisks.map((r) => r.id))
  const myRiskDriverIds = new Set(
    RISKS
      .filter((r) => myRiskIdsForDrivers.has(r.id))
      .flatMap((r) => r.driverImpacts.map((di) => di.driverId)),
  )
  const myKRIs = KRI_DEFINITIONS.filter((k) => myRiskDriverIds.has(k.driverId))

  return (
    <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <IllustrativeDataBanner pilotFeeds={`${entity?.name ?? 'Subsidiary'} project + leasing data`} />

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
            <Briefcase size={20} style={{ color: '#2D9EFF' }} />
            Risk Champion — {entity?.shortName ?? 'Subsidiary'}
          </h1>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
              maxWidth: 780,
              lineHeight: 1.55,
            }}
          >
            <em>"What's overdue from me and what's escalating?"</em> — your
            operational workspace. Submit risks, enter KRI values, run mitigations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Link href="/risk-register" style={ctaPrimary}>
            <Plus size={12} />
            Add Risk
          </Link>
          <Link href="/kri" style={ctaSecondary}>
            <Gauge size={12} />
            Enter KRI
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 10,
        }}
      >
        <KPI label="My Drafts" value={myDrafts.length} accent="#0B6E5B" href="/risk-register" sparkSeed={7} />
        <KPI
          label="My Open Actions"
          value={myActions.length}
          accent="#2D9EFF"
          sub={overdue.length > 0 ? `${overdue.length} overdue` : 'on track'}
          subColor={overdue.length > 0 ? '#FF3B3B' : '#22C55E'}
          sparkSeed={21}
        />
        <KPI
          label="My Subsidiary Risks"
          value={myRisks.length}
          accent="#A855F7"
          href="/risk-register"
          sparkSeed={35}
        />
        <KPI
          label="Linked KRIs"
          value={myKRIs.length}
          accent="#22C55E"
          href="/kri"
          sparkSeed={49}
        />
      </div>

      {/* My Actions Inbox */}
      <Section
        title="My Actions Inbox"
        subtitle={`${myActions.length} open${overdue.length > 0 ? ` · ${overdue.length} overdue` : ''}`}
        accent="#2D9EFF"
        icon={<ListChecks size={14} />}
        cta={
          <Link href="/risk-register" style={ctaSmall}>
            All actions →
          </Link>
        }
      >
        {myActions.length === 0 ? (
          <Empty>
            No mitigation actions in scope yet. Open a risk on Risk Register and add a mitigation action assigned to your team.
          </Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {myActions.slice(0, 6).map((a) => {
              const od = isOverdue(a)
              return (
                <Link
                  key={a.id}
                  href={`/risk-register?focus=${a.riskId}`}
                  style={rowLinkStyle}
                >
                  <span style={monoStyle}>{a.riskId}</span>
                  <span style={{ flex: 1, color: 'var(--text-primary)' }}>{a.name}</span>
                  <span
                    style={{
                      fontSize: 10,
                      color: od ? '#FF3B3B' : 'var(--text-tertiary)',
                      fontWeight: od ? 700 : 500,
                    }}
                  >
                    {od ? `OVERDUE · ${a.dueDate}` : `due ${a.dueDate}`}
                  </span>
                  <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />
                </Link>
              )
            })}
            {myActions.length > 6 && (
              <Link
                href="/risk-register"
                style={{ ...rowLinkStyle, justifyContent: 'center' }}
              >
                +{myActions.length - 6} more →
              </Link>
            )}
          </div>
        )}
      </Section>

      {/* My subsidiary risk strip */}
      <Section
        title={`${entity?.shortName ?? 'My'} Risk Snapshot`}
        subtitle={`${myRisks.length} engine risks tagged to this subsidiary (sorted by inherent)`}
        accent="#0B6E5B"
        icon={<AlertTriangle size={14} />}
        cta={
          <Link href="/portfolio-tower" style={ctaSmall}>
            Open Portfolio Tower →
          </Link>
        }
      >
        {myRisks.length === 0 ? (
          <Empty>
            No engine risks tagged to {entity?.shortName ?? 'this subsidiary'} in the seed register.
            Pilot will populate from the subsidiary's actual risk register.
          </Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[...myRisks]
              .sort((a, b) => b.baseInherent - a.baseInherent)
              .slice(0, 5)
              .map((r) => (
                <Link
                  key={r.id}
                  href={`/risk-register?focus=${r.id}`}
                  style={rowLinkStyle}
                >
                  <span style={monoStyle}>{r.id}</span>
                  <span style={{ flex: 1, color: 'var(--text-primary)' }}>{r.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    {r.baseInherent.toFixed(0)}/25 inherent
                  </span>
                </Link>
              ))}
          </div>
        )}
      </Section>

      {/* KRI quick-entry tiles */}
      <Section
        title="KRI Quick Entry"
        subtitle={`${myKRIs.length} KRIs touch this subsidiary's risks`}
        accent="#A855F7"
        icon={<Activity size={14} />}
        cta={
          <Link href="/kri" style={ctaSmall}>
            All KRIs →
          </Link>
        }
      >
        {myKRIs.length === 0 ? (
          <Empty>No KRIs tied to your subsidiary risks. Add subsidiary risks first to see linked KRIs.</Empty>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 8,
            }}
          >
            {myKRIs.slice(0, 6).map((k) => {
              const t = thresholdsFor(k)
              const latest = latestFor(k.id)
              const meta = latest
                ? STATUS_META[computeKRIStatus(latest.value, t, k.direction)]
                : { label: 'No Data', color: '#888888', bg: '#88888822', border: '#88888855' }
              return (
                <Link
                  key={k.id}
                  href="/kri"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `3px solid ${meta.color}`,
                    borderRadius: 6,
                    padding: 10,
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={monoStyle}>{k.id}</span>
                    <span
                      style={{
                        background: `${meta.color}22`,
                        color: meta.color,
                        border: `1px solid ${meta.color}66`,
                        padding: '1px 5px',
                        borderRadius: 3,
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        textTransform: 'uppercase',
                        marginLeft: 'auto',
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {k.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    {latest ? `${latest.value} · ${latest.period}` : 'No entries yet — click to enter'}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Section>

      {/* External market / regulator / macro / sector signals —
          1st-line needs the same external context the CRO sees so a
          champion entering a draft risk knows the market backdrop. */}
      <ExternalIntelligenceFeed limit={4} />

      {/* Escalate CTA strip */}
      <div
        style={{
          padding: 12,
          background: 'var(--bg-secondary)',
          border: '1px dashed var(--border-color)',
          borderLeft: '3px solid #FF3B3B',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          fontSize: 11,
          color: 'var(--text-secondary)',
        }}
      >
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>Need to escalate?</strong> Risks
          breaching {entity?.shortName ?? 'subsidiary'} appetite go to Group ERM via
          the risk drawer's <em>Escalate to Group</em> button.
        </span>
        <Link href="/risk-register" style={{ ...ctaSmall, color: '#FF3B3B' }}>
          <ArrowUp size={11} />
          Open Risk Register →
        </Link>
      </div>

      <TrustFooter />
    </div>
  )
}

function KPI({
  label,
  value,
  accent,
  href,
  sub,
  subColor,
  sparkSeed,
}: {
  label: string
  value: number
  accent: string
  href?: string
  sub?: string
  subColor?: string
  sparkSeed?: number
}) {
  const inner = (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${accent}`,
        borderRadius: 8,
        padding: '10px 12px',
        cursor: href ? 'pointer' : 'default',
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: accent,
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        {typeof sparkSeed === 'number' && (
          <Sparkline values={baselineSeries(value || 1, 10, sparkSeed)} width={56} height={20} color={accent} />
        )}
      </div>
      {sub && (
        <span style={{ fontSize: 10, color: subColor ?? 'var(--text-tertiary)', fontWeight: 600 }}>
          {sub}
        </span>
      )}
    </div>
  )
  return href ? (
    <Link href={href} style={{ textDecoration: 'none' }}>
      {inner}
    </Link>
  ) : (
    inner
  )
}

function Section({
  title,
  subtitle,
  accent,
  icon,
  cta,
  children,
}: {
  title: string
  subtitle: string
  accent: string
  icon: React.ReactNode
  cta?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `4px solid ${accent}`,
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              color: accent,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {icon}
            {title}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {subtitle}
          </div>
        </div>
        {cta}
      </div>
      {children}
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 14,
        textAlign: 'center',
        color: 'var(--text-tertiary)',
        fontStyle: 'italic',
        fontSize: 11,
        background: 'var(--bg-primary)',
        border: '1px dashed var(--border-color)',
        borderRadius: 6,
      }}
    >
      {children}
    </div>
  )
}

const monoStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--text-tertiary)',
  letterSpacing: 0.4,
}

const rowLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 4,
  fontSize: 11,
  textDecoration: 'none',
  color: 'inherit',
}

const ctaPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'var(--accent-primary)',
  color: 'var(--on-accent)',
  border: 'none',
  padding: '7px 14px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  cursor: 'pointer',
  textDecoration: 'none',
}

const ctaSecondary: React.CSSProperties = {
  ...ctaPrimary,
  background: 'transparent',
  color: 'var(--accent-primary)',
  border: '1px solid var(--accent-primary)',
}

const ctaSmall: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'transparent',
  color: 'var(--accent-primary)',
  border: '1px solid var(--border-color)',
  padding: '4px 10px',
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  cursor: 'pointer',
  textDecoration: 'none',
}
