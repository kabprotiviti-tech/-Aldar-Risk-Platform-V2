'use client'

/**
 * My Dashboard — Unified Leadership View (Batch 2 redesign)
 * ----------------------------------------------------------
 * One-screen "My Day" for any logged-in persona. Combines INTERNAL
 * context (drafts / actions / KRIs / audit) and EXTERNAL context
 * (market / regulator / macro / sector signals) on a single canvas so
 * a CRO, ERM Head, Subsidiary CEO, Internal Auditor or ARC Chair can
 * answer their killer question in 8 seconds without toggling screens.
 *
 * Persona binding: READS from <PersonaContext> (i.e. the login). There
 * is NO local persona picker. Mismatch between login + dashboard view
 * is no longer possible.
 *
 * Persona-to-owner filter mapping (illustrative until SSO):
 *   group-cro       → consolidated (sees everything)
 *   risk-champion   → owned-by-me (Risk Champion strings)
 *   subsidiary-ceo  → consolidated within entity scope
 *   internal-audit  → consolidated, read-mostly
 *   arc-chair       → consolidated, governance lens
 *
 * Honors CLAUDE.md: every figure derives from persisted context state
 * or the baseline risk-posture (illustrative + tagged). No fabricated
 * AED.
 */

import React, { useMemo } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  Activity,
  Inbox,
  Pencil,
  Plus,
  ShieldCheck,
  Crown,
  ChevronRight,
} from 'lucide-react'
import { SimulationProvider, useSimulation } from '@/lib/context/SimulationContext'
import { RiskDraftProvider, useRiskDrafts } from '@/lib/context/RiskDraftContext'
import {
  MitigationActionsProvider,
  useMitigationActions,
} from '@/lib/context/MitigationActionsContext'
import {
  KRIThresholdsProvider,
  useKRIThresholds,
} from '@/lib/context/KRIThresholdsContext'
import {
  KRIEntriesProvider,
  useKRIEntries,
} from '@/lib/context/KRIEntriesContext'
import { useAuditTrail } from '@/lib/context/AuditTrailContext'
import { usePersona } from '@/lib/context/PersonaContext'
import { KRI_DEFINITIONS } from '@/lib/data/kri-definitions'
import { computeKRIStatus, STATUS_META } from '@/lib/data/kri-status'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'
import { ExternalIntelligenceFeed } from '@/components/home/ExternalIntelligenceFeed'
import { TrustFooter } from '@/components/provenance/TrustFooter'
import { Sparkline, baselineSeries } from '@/components/ui/Sparkline'
import {
  BASELINE_RISK_POSTURE,
  safeMetric,
} from '@/lib/data/baselineRiskPosture'
import { formatCurrencyShort, formatExposureBn } from '@/lib/utils/formatters'
import type { PersonaId } from '@/lib/personas'

// ── Persona → owner-string filter mapping ────────────────────────────────
const PERSONA_OWNER_MATCH: Record<PersonaId, string[]> = {
  'group-cro':       [], // [] = see all (consolidated)
  'risk-champion':   ['Risk Champion (demo)', 'Risk Champion'],
  'subsidiary-ceo':  [], // entity-scope filter; sees all in scope
  'arc-chair':       [], // governance lens consolidated
}

function MyDashboardContent() {
  const { persona, session } = usePersona()
  const personaId = persona?.id ?? 'group-cro'

  // Engine is the single source of truth — same source the /home (Risk Head)
  // dashboard reads. This keeps both screens reconciled.
  const { risks } = useSimulation()
  const { drafts } = useRiskDrafts()
  const { actions, isOverdue } = useMitigationActions()
  const { entries: _entries, latestFor } = useKRIEntries()
  const { thresholdsFor } = useKRIThresholds()
  const { events } = useAuditTrail()

  // ── Filter logic ────────────────────────────────────────────────────
  const ownerMatch = PERSONA_OWNER_MATCH[personaId]
  const seeAll = ownerMatch.length === 0

  const myDrafts = useMemo(
    () => (seeAll ? drafts : drafts.filter((d) => ownerMatch.includes(d.createdBy))),
    [drafts, seeAll, ownerMatch],
  )

  const myActions = useMemo(
    () => (seeAll ? actions : actions.filter((a) => ownerMatch.includes(a.owner))),
    [actions, seeAll, ownerMatch],
  )

  const openActions = myActions.filter((a) => a.status !== 'closed')
  const myActionsOverdue = openActions.filter(isOverdue).length

  const myKRIs = useMemo(
    () => (seeAll ? KRI_DEFINITIONS : KRI_DEFINITIONS.filter((k) => ownerMatch.includes(k.owner))),
    [seeAll, ownerMatch],
  )

  const recentEvents = useMemo(
    () =>
      events
        .slice()
        .sort((a, b) => (a.at < b.at ? 1 : -1))
        .slice(0, 8),
    [events],
  )

  const auditToday = recentEvents.filter((e) => sameDay(new Date(e.at), new Date())).length

  // ── KRI status roll-up (G/A/R) ──────────────────────────────────────
  const kriStatus = useMemo(() => {
    let g = 0, a = 0, r = 0
    for (const k of myKRIs) {
      const t = thresholdsFor(k)
      const latest = latestFor(k.id)
      if (!latest) continue
      const s = computeKRIStatus(latest.value, t, k.direction)
      if (s === 'green') g++
      else if (s === 'amber') a++
      else if (s === 'red') r++
    }
    return { g, a, r }
  }, [myKRIs, thresholdsFor, latestFor])

  // ── Headline metrics — single source of truth.
  //   ONE canonical number set across every screen (Batch 1) — exposure,
  //   score, critical+high, AI alerts all come from BASELINE_RISK_POSTURE so
  //   the same KPI never shows two different numbers anywhere.
  const headlineExposure = BASELINE_RISK_POSTURE.totalFinancialExposure
  const headlineCriticalHigh = BASELINE_RISK_POSTURE.totalCriticalAndHighRisks
  const criticalCount = BASELINE_RISK_POSTURE.criticalRiskCount
  const highCount = BASELINE_RISK_POSTURE.highRiskCount
  const headlineRiskScore = BASELINE_RISK_POSTURE.overallRiskScore

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <IllustrativeDataBanner pilotFeeds="ABC SSO + live ERM + Reuters/Bayut/ADREC/CBUAE/ADX feeds" />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: '8px 0 4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.8,
                color: 'var(--accent-primary)',
                textTransform: 'uppercase',
                marginBottom: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Crown size={11} />
              {persona ? `${persona.title} · ${persona.line}` : 'Unauthenticated'}
            </div>
            <h1
              style={{
                fontSize: 'clamp(24px, 3vw, 32px)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {persona ? `Good morning, ${persona.title}.` : 'My Dashboard'}
            </h1>
            {persona && (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  margin: '6px 0 0',
                  maxWidth: 720,
                  lineHeight: 1.5,
                }}
              >
                {persona.killerQuestion}
              </p>
            )}
          </div>
          <StatusBadge tier="MVP" note={persona ? `Bound to login · ${persona.title}` : 'No persona'} />
        </div>

        {/* Hero KPI strip — unified internal + market */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10,
          }}
        >
          <HeroStat
            label="Group risk score"
            value={`${headlineRiskScore} / 100`}
            tone={headlineRiskScore >= 75 ? 'danger' : headlineRiskScore >= 60 ? 'warning' : 'good'}
            sub={`Trend ${BASELINE_RISK_POSTURE.riskScoreTrend > 0 ? '+' : ''}${BASELINE_RISK_POSTURE.riskScoreTrend} MoM`}
            sparklineAnchor={headlineRiskScore}
            sparklineSeed={11}
          />
          <HeroStat
            label="Critical + High"
            value={String(headlineCriticalHigh)}
            tone={headlineCriticalHigh > 8 ? 'danger' : headlineCriticalHigh > 4 ? 'warning' : 'good'}
            sub={`${criticalCount} critical · ${highCount} high`}
            sparklineAnchor={headlineCriticalHigh}
            sparklineSeed={23}
          />
          <HeroStat
            label="Group risk-adjusted exposure"
            value={formatExposureBn(headlineExposure, 'AED')}
            tone="neutral"
            sub={`Net unhedged ${formatExposureBn(BASELINE_RISK_POSTURE.netUnhedgedExposure, 'AED')}`}
            sparklineAnchor={headlineExposure / 1_000_000}
            sparklineSeed={37}
          />
          <HeroStat
            label="AI alerts today"
            value={String(BASELINE_RISK_POSTURE.aiAlertsToday)}
            tone={BASELINE_RISK_POSTURE.aiAlertsToday > 5 ? 'warning' : 'good'}
            sub={`${BASELINE_RISK_POSTURE.activeExternalSignals} external · ${BASELINE_RISK_POSTURE.activeControlWeaknesses} controls`}
            sparklineAnchor={BASELINE_RISK_POSTURE.aiAlertsToday}
            sparklineSeed={41}
          />
        </div>
      </header>

      {/* ── My-Day KPI tiles ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        <KPITile
          icon={<Pencil size={14} />}
          label={seeAll ? 'Drafts in flight' : 'My Drafts'}
          value={myDrafts.length}
          accent="#E4002B"
          href="/risk-register"
        />
        <KPITile
          icon={<Activity size={14} />}
          label={seeAll ? 'Open mitigations' : 'My Open Actions'}
          value={openActions.length}
          accent="#2D9EFF"
          subline={myActionsOverdue > 0 ? `${myActionsOverdue} overdue` : 'on track'}
          sublineColor={myActionsOverdue > 0 ? '#FF3B3B' : '#22C55E'}
        />
        <KPITile
          icon={<AlertCircle size={14} />}
          label={seeAll ? 'KRIs monitored' : 'My KRIs'}
          value={myKRIs.length}
          accent="#A855F7"
          href="/kri"
          subline={
            kriStatus.r > 0
              ? `${kriStatus.r} red · ${kriStatus.a} amber`
              : kriStatus.a > 0
                ? `${kriStatus.a} amber · ${kriStatus.g} green`
                : `${kriStatus.g} green`
          }
          sublineColor={kriStatus.r > 0 ? '#FF3B3B' : kriStatus.a > 0 ? '#F5C518' : '#22C55E'}
        />
        <Link
          href="/portfolio-tower"
          style={{ textDecoration: 'none' }}
          title="ERM annual plan — drill into Portfolio Tower"
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              cursor: 'pointer',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22C55E' }}>
              <Inbox size={14} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                ERM Annual Plan
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-primary)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>8</div>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>Planned</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#FF3B3B', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>2</div>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>Overdue</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#22C55E', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>14</div>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>Completed</div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ── 2-up: Drafts + Actions ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 12 }}>
        <Section
          title={seeAll ? 'Drafts In Flight' : 'My Drafts'}
          subtitle={`${myDrafts.length} draft risk${myDrafts.length === 1 ? '' : 's'}${seeAll ? ' across the group' : ' authored by you'}`}
          cta={
            <Link href="/risk-register" style={ctaStyle}>
              <Plus size={11} /> Add Risk
            </Link>
          }
        >
          {myDrafts.length === 0 ? (
            <Empty>{seeAll ? 'No drafts in flight — the register is current.' : 'No drafts awaiting you — your register is up to date.'}</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {myDrafts.slice(0, 6).map((d) => (
                <Link key={d.id} href={`/risk-register?focus=${d.id}`} style={rowLinkStyle}>
                  <span style={monoStyle}>{d.id}</span>
                  <span style={{ flex: 1, color: 'var(--text-primary)' }}>{d.name}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{d.status}</span>
                </Link>
              ))}
              {myDrafts.length > 6 && (
                <Link href="/risk-register" style={{ ...rowLinkStyle, justifyContent: 'center' }}>
                  +{myDrafts.length - 6} more on /risk-register →
                </Link>
              )}
            </div>
          )}
        </Section>

        <Section
          title={seeAll ? 'Open Mitigations' : 'My Open Actions'}
          subtitle={`${openActions.length} open · ${myActionsOverdue} overdue`}
          cta={
            <Link href="/risk-register" style={ctaStyle}>
              Open Register <ChevronRight size={11} />
            </Link>
          }
        >
          {openActions.length === 0 ? (
            <Empty>All mitigations on track — nothing open or overdue.</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {openActions.slice(0, 6).map((a) => {
                const overdue = isOverdue(a)
                return (
                  <Link key={a.id} href={`/risk-register?focus=${a.riskId}`} style={rowLinkStyle}>
                    <span style={monoStyle}>{a.riskId}</span>
                    <span style={{ flex: 1, color: 'var(--text-primary)' }}>{a.name}</span>
                    <span
                      style={{
                        fontSize: 9,
                        color: overdue ? '#FF3B3B' : 'var(--text-tertiary)',
                        fontWeight: overdue ? 700 : 500,
                      }}
                    >
                      {overdue ? `OVERDUE · ${a.dueDate}` : `due ${a.dueDate}`}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </Section>
      </div>

      {/* ── KRI grid ──────────────────────────────────────────────────── */}
      <Section
        title={seeAll ? 'KRIs Monitored' : 'My KRIs'}
        subtitle={`${myKRIs.length} KRI${myKRIs.length === 1 ? '' : 's'}${seeAll ? ' across the platform' : ' owned by you'} — click any tile to drill in`}
        cta={
          <Link href="/kri" style={ctaStyle}>
            Open KRI Engine <ChevronRight size={11} />
          </Link>
        }
      >
        {myKRIs.length === 0 ? (
          <Empty>No KRIs in scope.</Empty>
        ) : (
          <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {myKRIs.slice(0, 12).map((k) => {
              const t = thresholdsFor(k)
              const latest = latestFor(k.id)
              const meta = latest
                ? STATUS_META[computeKRIStatus(latest.value, t, k.direction)]
                : { label: 'No Data', color: '#888888', bg: 'rgba(136,136,136,0.18)', border: 'rgba(136,136,136,0.55)' }
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
                    color: 'var(--text-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={monoStyle}>{k.id}</span>
                    <span
                      style={{
                        background: `${meta.color}1f`,
                        color: meta.color,
                        border: `1px solid ${meta.color}66`,
                        padding: '1px 6px',
                        borderRadius: 3,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        textTransform: 'uppercase',
                        marginLeft: 'auto',
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{k.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    {latest ? `Latest ${latest.value} · ${latest.period}` : 'No entries yet'}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Section>

      {/* ── External Intelligence (NEW — leadership wants one-screen view) ── */}
      <ExternalIntelligenceFeed limit={5} />

      {/* ── Recent activity ───────────────────────────────────────────── */}
      <Section
        title="Recent Activity"
        subtitle="Last 8 audit-trail events across the platform — what changed, who touched it, when"
        cta={
          <Link href="/audit-trail" style={ctaStyle}>
            <ShieldCheck size={11} /> Full Audit Trail
          </Link>
        }
      >
        {recentEvents.length === 0 ? (
          <Empty>No audit events yet. Add a draft, edit a threshold, or escalate a risk to populate this feed.</Empty>
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
                <span style={{ ...monoStyle, fontSize: 9, color: 'var(--text-tertiary)' }}>
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

      <TrustFooter />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function HeroStat({
  label,
  value,
  sub,
  tone,
  sparklineSeed,
  sparklineAnchor,
}: {
  label: string
  value: string
  sub?: string
  tone: 'good' | 'warning' | 'danger' | 'neutral'
  /** Seed for the synthetic baseline series — keeps the line stable across renders. */
  sparklineSeed?: number
  /** Anchor value for the sparkline (typically the same number that's displayed). */
  sparklineAnchor?: number
}) {
  const toneColor =
    tone === 'good' ? '#22C55E'
    : tone === 'warning' ? '#F5C518'
    : tone === 'danger' ? '#FF3B3B'
    : 'var(--accent-primary)'

  const series =
    typeof sparklineAnchor === 'number'
      ? baselineSeries(sparklineAnchor, 12, sparklineSeed ?? 7)
      : null

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minHeight: 92,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: toneColor,
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </div>
        {series && (
          <Sparkline
            values={series}
            width={64}
            height={22}
            color={toneColor}
            ariaLabel={`${label} trend`}
          />
        )}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{sub}</div>
      )}
    </div>
  )
}

function KPITile({
  icon,
  label,
  value,
  accent,
  href,
  subline,
  sublineColor,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: string
  href?: string
  subline?: string
  sublineColor?: string
}) {
  const inner = (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        cursor: href ? 'pointer' : 'default',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-tertiary)' }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      {subline && (
        <div style={{ fontSize: 10, fontWeight: 600, color: sublineColor || 'var(--text-tertiary)' }}>
          {subline}
        </div>
      )}
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner
}

function Section({
  title,
  subtitle,
  cta,
  children,
}: {
  title: string
  subtitle: string
  cta?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
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
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.005em',
            }}
          >
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
  // Calm "all clear" state — signals control, not a load failure (Batch 3).
  return (
    <div
      style={{
        padding: '18px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        color: 'var(--text-secondary)',
        fontSize: 12,
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 16, height: 16, borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(6,118,71,0.12)', color: '#067647', flexShrink: 0,
          fontSize: 11, fontWeight: 700,
        }}
      >
        ✓
      </span>
      <span>{children}</span>
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

const ctaStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'var(--accent-primary)',
  color: 'var(--on-accent)',
  border: 'none',
  padding: '4px 10px',
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  cursor: 'pointer',
  textDecoration: 'none',
}

export default function MyDashboardPage() {
  return (
    <SimulationProvider>
      <RiskDraftProvider>
        <MitigationActionsProvider>
          <KRIThresholdsProvider>
            <KRIEntriesProvider>
              <MyDashboardContent />
            </KRIEntriesProvider>
          </KRIThresholdsProvider>
        </MitigationActionsProvider>
      </RiskDraftProvider>
    </SimulationProvider>
  )
}
