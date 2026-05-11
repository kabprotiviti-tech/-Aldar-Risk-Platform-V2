'use client'

/**
 * CRODashboard — Block 2 P4a
 * ---------------------------
 * Group CRO landing per BCG-partner locked design.
 *
 * Killer Q (8s test): "What changed in our top-10 risks since last ARC,
 * and is anything outside appetite?"
 *
 * Widgets (consume-only, no data entry — that's the whole point):
 *   • Exception strip — top 5 risks breaching appetite, delta vs prior
 *   • Appetite gauges — 6 RAG dials, one per Group Appetite category
 *   • Attention queue — items awaiting CRO sign-off (escalations, drafts)
 *   • Emerging signals — recent audit-trail movements (last 24/72h)
 *   • Trend sparklines — KRI breach count + overdue actions
 *   • One CTA: Open ARC Pack
 *
 * Honors CLAUDE.md: every figure derives from existing engine / context
 * state. No fabricated AED.
 */

import React from 'react'
import Link from 'next/link'
import {
  Crown,
  AlertTriangle,
  Inbox,
  TrendingUp,
  Sparkles,
  FileBarChart,
  ChevronRight,
  ShieldQuestion,
  ShieldCheck,
} from 'lucide-react'
import { SimulationProvider, useSimulation } from '@/lib/context/SimulationContext'
import { KRIThresholdsProvider, useKRIThresholds } from '@/lib/context/KRIThresholdsContext'
import { KRIEntriesProvider, useKRIEntries } from '@/lib/context/KRIEntriesContext'
import {
  MitigationActionsProvider,
  useMitigationActions,
} from '@/lib/context/MitigationActionsContext'
import {
  EscalationsProvider,
  useEscalations,
} from '@/lib/context/EscalationsContext'
import { RiskAppetiteProvider, useRiskAppetite } from '@/lib/context/RiskAppetiteContext'
import { useAuditTrail } from '@/lib/context/AuditTrailContext'
import { KRI_DEFINITIONS } from '@/lib/data/kri-definitions'
import { computeKRIStatus } from '@/lib/data/kri-status'
import { APPETITE_LEVEL_META } from '@/lib/data/group-appetite-statements'
import { entityForRisk } from '@/lib/data/risk-entity-mapping'
import { getEntity } from '@/lib/entities/hierarchy'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'
import { usePersona } from '@/lib/context/PersonaContext'

interface Props {
  variant?: 'primary' | 'fallback'
  persona?: string
}

export function CRODashboard(props: Props = {}) {
  return (
    <SimulationProvider>
      <KRIThresholdsProvider>
        <KRIEntriesProvider>
          <MitigationActionsProvider>
            <EscalationsProvider>
              <RiskAppetiteProvider>
                <CRODashboardInner {...props} />
              </RiskAppetiteProvider>
            </EscalationsProvider>
          </MitigationActionsProvider>
        </KRIEntriesProvider>
      </KRIThresholdsProvider>
    </SimulationProvider>
  )
}

function CRODashboardInner({ variant = 'primary', persona }: Props) {
  const { risks } = useSimulation()
  const { latestFor } = useKRIEntries()
  const { thresholdsFor } = useKRIThresholds()
  const { actions, isOverdue } = useMitigationActions()
  const { escalations } = useEscalations()
  const { allEffective, pendingProposals } = useRiskAppetite()
  const { events } = useAuditTrail()
  const { session } = usePersona()

  // 1) Top-5 risks by residual exposure (proxy for "breaching appetite")
  const top5 = [...risks]
    .sort((a, b) => b.newResidual - a.newResidual)
    .slice(0, 5)
    .map((r) => {
      const inherent = r.baseInherent
      const residual = r.newResidual
      const delta = residual - inherent
      return { ...r, delta }
    })

  // 2) KRI breach posture — count R/A/G across all KRIs
  const kriPosture = KRI_DEFINITIONS.reduce(
    (acc, k) => {
      const t = thresholdsFor(k)
      const latest = latestFor(k.id)
      if (!latest) {
        acc.noData++
        return acc
      }
      const status = computeKRIStatus(latest.value, t, k.direction)
      acc[status]++
      return acc
    },
    { green: 0, amber: 0, red: 0, noData: 0 } as Record<string, number>,
  )

  // 3) Open mitigations + overdue count
  const openActions = actions.filter((a) => a.status !== 'closed')
  const overdueCount = openActions.filter(isOverdue).length

  // 4) Pending escalations awaiting CRO acknowledgement
  const pendingEsc = escalations.filter((e) => e.status === 'pending')

  // 5) Pending appetite proposals (CRO is approver in many cases)
  const pendingApp = pendingProposals()

  // 6) Recent activity — last 5 events
  const recentEvents = events
    .slice()
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 5)

  // 7) Appetite gauges — show effective appetite levels by category (6 cats)
  const appetiteStatements = allEffective()
  const appetiteByCategory = new Map<string, { level: string; count: number }>()
  for (const s of appetiteStatements) {
    const cur = appetiteByCategory.get(s.category)
    if (!cur) appetiteByCategory.set(s.category, { level: s.level, count: 1 })
    else cur.count++
  }

  const totalExposure = risks.reduce((s, r) => s + r.exposureAedMn, 0)

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <IllustrativeDataBanner pilotFeeds="Aldar live ERM feeds (PMS / Yardi / SAP / escrow)" />

      {/* Header */}
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
            <Crown size={20} style={{ color: '#FF6600' }} />
            Group CRO Cockpit
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
            <em>"What changed in our top-10 risks since last ARC, and is anything
            outside appetite?"</em> — single-pane synthesis for the Group ERM Head.
            Decisions, not data entry.
          </p>
          {variant === 'fallback' && persona && (
            <div
              style={{
                marginTop: 8,
                padding: '6px 10px',
                fontSize: 10,
                background: 'rgba(245,197,24,0.10)',
                border: '1px solid rgba(245,197,24,0.40)',
                borderRadius: 4,
                color: 'var(--text-secondary)',
                display: 'inline-block',
              }}
            >
              Persona <strong>{persona}</strong> sees the CRO view temporarily —
              dedicated dashboard ships in upcoming P4 patch.
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <StatusBadge tier="MVP" note={session.displayName ? `${session.displayName}` : undefined} />
          <Link href="/arc-pack" style={ctaPrimary}>
            <FileBarChart size={12} />
            Open ARC Pack
          </Link>
        </div>
      </div>

      {/* Exception strip — top 5 by residual */}
      <Section
        title="Top 5 — Highest Residual Risk"
        subtitle="Sorted by residual score, with delta vs inherent baseline"
        accent="#FF3B3B"
        icon={<AlertTriangle size={14} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {top5.map((r, i) => {
            const e = getEntity(entityForRisk(r.id))
            const upArrow = r.delta > 0.5
            return (
              <Link
                key={r.id}
                href={`/risk-register?focus=${r.id}`}
                style={rowLinkStyle}
              >
                <span style={rankBadge}>{i + 1}</span>
                <span style={monoStyle}>{r.id}</span>
                <span style={{ flex: 1, color: 'var(--text-primary)' }}>{r.name}</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                  {e?.shortName ?? '—'}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    color: 'var(--text-primary)',
                    minWidth: 60,
                    textAlign: 'right',
                  }}
                >
                  {r.newResidual.toFixed(1)}/25
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: upArrow ? '#FF3B3B' : 'var(--text-tertiary)',
                    minWidth: 50,
                    textAlign: 'right',
                  }}
                >
                  {r.delta > 0 ? '+' : ''}
                  {r.delta.toFixed(1)} {upArrow ? '↑' : '·'}
                </span>
              </Link>
            )
          })}
        </div>
      </Section>

      {/* Two-column row: Appetite gauges + Attention queue */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 12 }}>
        <Section
          title="Risk Appetite — Posture by Category"
          subtitle={`${appetiteStatements.length} statements · ${pendingApp.length} pending approval`}
          accent="#F5C518"
          icon={<ShieldQuestion size={14} />}
          cta={
            <Link href="/risk-appetite" style={ctaSmall}>
              Review →
            </Link>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {Array.from(appetiteByCategory.entries()).map(([cat, info]) => {
              const meta = APPETITE_LEVEL_META[info.level as keyof typeof APPETITE_LEVEL_META]
              return (
                <div
                  key={cat}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `3px solid ${meta?.color ?? '#888'}`,
                    borderRadius: 6,
                    padding: '6px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {cat}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: meta?.color ?? '#888' }}>
                    {meta?.label ?? info.level}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                    {info.count} statement{info.count === 1 ? '' : 's'}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        <Section
          title="Attention Queue"
          subtitle="Items awaiting CRO sign-off"
          accent="#2D9EFF"
          icon={<Inbox size={14} />}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <QueueRow
              label="Pending escalations to Group"
              count={pendingEsc.length}
              href="/portfolio-tower"
            />
            <QueueRow
              label="Appetite proposals awaiting approval"
              count={pendingApp.length}
              href="/risk-appetite"
            />
            <QueueRow
              label="Open mitigation actions"
              count={openActions.length}
              sublabel={overdueCount > 0 ? `${overdueCount} overdue` : 'on track'}
              sublabelColor={overdueCount > 0 ? '#FF3B3B' : '#22C55E'}
              href="/risk-register"
            />
            <QueueRow
              label="Red-status KRIs"
              count={kriPosture.red}
              sublabel={`${kriPosture.amber} amber · ${kriPosture.green} green · ${kriPosture.noData} no data`}
              href="/kri"
            />
          </div>
        </Section>
      </div>

      {/* Trend strip */}
      <Section
        title="Trend Sparklines"
        subtitle="Group-level posture (illustrative)"
        accent="#A855F7"
        icon={<TrendingUp size={14} />}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
          <TrendTile
            label="Total Risk Exposure"
            value={`${(totalExposure / 1000).toFixed(2)}`}
            unit="AED bn"
            sub={`${risks.length} active risks`}
          />
          <TrendTile
            label="KRI Breach Count (R+A)"
            value={`${kriPosture.red + kriPosture.amber}`}
            unit={`/ ${KRI_DEFINITIONS.length}`}
            sub={`${kriPosture.red} red · ${kriPosture.amber} amber`}
          />
          <TrendTile
            label="Overdue Mitigations"
            value={`${overdueCount}`}
            unit="actions"
            sub={`${openActions.length} open total`}
          />
          <TrendTile
            label="Audit Events Today"
            value={`${recentEvents.filter((e) => sameDay(new Date(e.at), new Date())).length}`}
            unit="events"
            sub={`${events.length} total · localStorage`}
          />
        </div>
      </Section>

      {/* Emerging signals — recent audit-trail movement */}
      <Section
        title="Emerging Signals — Last 5 Audit Events"
        subtitle="Recent platform activity surfaced for CRO awareness"
        accent="#22C55E"
        icon={<Sparkles size={14} />}
        cta={
          <Link href="/audit-trail" style={ctaSmall}>
            <ShieldCheck size={11} /> Full Trail →
          </Link>
        }
      >
        {recentEvents.length === 0 ? (
          <Empty>
            No audit events yet. Activity from Risk Register edits, KRI entries,
            escalations and appetite proposals will appear here.
          </Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recentEvents.map((e) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'baseline',
                  padding: '6px 10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 4,
                  fontSize: 11,
                }}
              >
                <span style={{ ...monoStyle, fontSize: 9 }}>
                  {new Date(e.at).toLocaleTimeString('en-AE', {
                    timeZone: 'Asia/Dubai',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                    minWidth: 80,
                  }}
                >
                  {e.category}
                </span>
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

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
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
        padding: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 10,
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

function QueueRow({
  label,
  count,
  href,
  sublabel,
  sublabelColor,
}: {
  label: string
  count: number
  href: string
  sublabel?: string
  sublabelColor?: string
}) {
  return (
    <Link href={href} style={{ ...rowLinkStyle, justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{label}</span>
        {sublabel && (
          <span style={{ fontSize: 9, color: sublabelColor ?? 'var(--text-tertiary)', fontWeight: 600 }}>
            {sublabel}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: count > 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)',
            minWidth: 24,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count}
        </span>
        <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />
      </div>
    </Link>
  )
}

function TrendTile({
  label,
  value,
  unit,
  sub,
}: {
  label: string
  value: string
  unit: string
  sub: string
}) {
  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        padding: 10,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{unit}</span>
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 4 }}>{sub}</div>
    </div>
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

const rankBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 18,
  height: 18,
  borderRadius: 3,
  background: 'rgba(255,59,59,0.16)',
  color: '#FF3B3B',
  fontSize: 10,
  fontWeight: 700,
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
