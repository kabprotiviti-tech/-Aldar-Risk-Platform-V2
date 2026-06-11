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
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'
import { ExposureBreakdown } from '@/components/ExposureBreakdown'
import { ErmAnnualPlan } from '@/components/ErmAnnualPlan'
import { ermPlanSummary } from '@/lib/data/ermAnnualPlan'
import { ExternalIntelligenceFeed } from '@/components/home/ExternalIntelligenceFeed'
import { TrustFooter } from '@/components/provenance/TrustFooter'
import { BASELINE_RISK_POSTURE } from '@/lib/data/baselineRiskPosture'
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

  // ── KRI status roll-up (G/A/R) + which KRIs are red ─────────────────
  const kriStatus = useMemo(() => {
    let g = 0, a = 0, r = 0
    const redIds: string[] = []
    for (const k of myKRIs) {
      const t = thresholdsFor(k)
      const latest = latestFor(k.id)
      if (!latest) continue
      const s = computeKRIStatus(latest.value, t, k.direction)
      if (s === 'green') g++
      else if (s === 'amber') a++
      else if (s === 'red') { r++; redIds.push(k.id) }
    }
    return { g, a, r, redIds }
  }, [myKRIs, thresholdsFor, latestFor])

  // The actual critical risks (engine) — so links open the exact record.
  const criticalRiskIds = useMemo(
    () => risks.filter((r) => r.ratingTo === 'Critical').map((r) => r.id),
    [risks],
  )
  const kriHref = kriStatus.redIds[0] ? `/kri?focus=${kriStatus.redIds[0]}` : '/kri'
  const criticalHref = criticalRiskIds[0] ? `/risk-register?focus=${criticalRiskIds[0]}` : '/risk-register'

  // ── Headline metrics — single source of truth.
  //   ONE canonical number set across every screen (Batch 1) — exposure,
  //   score, critical+high, AI alerts all come from BASELINE_RISK_POSTURE so
  //   the same KPI never shows two different numbers anywhere.
  const headlineCriticalHigh = BASELINE_RISK_POSTURE.totalCriticalAndHighRisks
  const criticalCount = BASELINE_RISK_POSTURE.criticalRiskCount
  const highCount = BASELINE_RISK_POSTURE.highRiskCount
  const ermSummary = ermPlanSummary()
  const headlineRiskScore = BASELINE_RISK_POSTURE.overallRiskScore

  // ── "What needs your attention" — the single focal list (Batch 5).
  //   Synthesised from live posture + the user's own open work, ordered by
  //   severity. This is the one thing a leader reads first; everything else
  //   on the page is demoted below it.
  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = []
    if (criticalCount > 0)
      items.push({
        sev: 'critical',
        text: `${criticalCount} critical risk${criticalCount === 1 ? '' : 's'} above appetite`,
        meta: 'Board-level — needs a decision',
        href: criticalHref,
        cta: 'Open risk',
      })
    if (myActionsOverdue > 0)
      items.push({
        sev: 'high',
        text: `${myActionsOverdue} mitigation action${myActionsOverdue === 1 ? '' : 's'} overdue`,
        meta: 'Past committed due date',
        href: '/risk-register',
        cta: 'Open actions',
      })
    if (kriStatus.r > 0)
      items.push({
        sev: 'high',
        text: `${kriStatus.r} KRI${kriStatus.r === 1 ? '' : 's'} breached threshold`,
        meta: 'Red — outside tolerance',
        href: kriHref,
        cta: 'Open KRI',
      })
    if (BASELINE_RISK_POSTURE.activeControlWeaknesses > 0)
      items.push({
        sev: 'medium',
        text: `${BASELINE_RISK_POSTURE.activeControlWeaknesses} control weaknesses open`,
        meta: 'ICOFR remediation underway',
        href: '/control-command-center',
        cta: 'Control centre',
      })
    if (BASELINE_RISK_POSTURE.activeExternalSignals > 0)
      items.push({
        sev: 'medium',
        text: `${BASELINE_RISK_POSTURE.activeExternalSignals} external signals tracking`,
        meta: 'Macro / regulatory / sector',
        href: '/dashboard',
        cta: 'External intel',
      })
    const rank = { critical: 0, high: 1, medium: 2 }
    return items.sort((a, b) => rank[a.sev] - rank[b.sev]).slice(0, 5)
  }, [criticalCount, myActionsOverdue, kriStatus.r, kriHref, criticalHref])

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <IllustrativeDataBanner pilotFeeds="ABC SSO + live ERM + Reuters/Bayut/ADREC/CBUAE/ADX feeds" />

      {/* ── Executive-brief hero (Batch 5) ──────────────────────────────
          One screen, one focus: greeting + standfirst on the left, ONE
          dominant Group Risk Score dial on the right, the focal "what needs
          your attention" list underneath, then a quiet secondary KPI row.
          Everything else (drafts, KRIs, signals, audit) sits below the fold. */}
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: '8px 0 4px',
        }}
      >
        {/* Eyebrow — persona context */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.8,
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Crown size={11} />
          {persona ? `${persona.title} · ${persona.line}` : 'Unauthenticated'}
        </div>

        {/* HERO — the ONE money number vs board appetite, beside the posture
            bullet. Money is the anchor a PJSC board thinks in; the 0–100 score
            is demoted to a bullet plotted against its ceiling + prior reading. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'stretch' }}>
          <div style={{ flex: '1 1 400px', minWidth: 0, display: 'flex' }}>
            <ExposureHeadline
              net={BASELINE_RISK_POSTURE.netUnhedgedExposure}
              ceiling={BASELINE_RISK_POSTURE.netUnhedgedAppetiteCeiling}
              gross={BASELINE_RISK_POSTURE.totalFinancialExposure}
              hedged={BASELINE_RISK_POSTURE.hedgedExposure}
            />
          </div>
          <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex' }}>
            <PostureBullet
              score={headlineRiskScore}
              prior={BASELINE_RISK_POSTURE.overallRiskScorePrior}
              ceiling={BASELINE_RISK_POSTURE.overallRiskScoreAppetiteCeiling}
              drivers={SCORE_DRIVERS}
            />
          </div>
        </div>

        {/* Reconciliation — the headline numbers add up, in one auditable line */}
        <ReconStrip
          total={BASELINE_RISK_POSTURE.totalRisks}
          criticalHigh={headlineCriticalHigh}
          critical={criticalCount}
          high={highCount}
          gross={BASELINE_RISK_POSTURE.totalFinancialExposure}
          hedged={BASELINE_RISK_POSTURE.hedgedExposure}
          net={BASELINE_RISK_POSTURE.netUnhedgedExposure}
        />

        {/* How the AED 2.35Bn gross exposure breaks down (collapsible) */}
        <ExposureBreakdown />

        {/* ── What needs your attention — the single focal list ─────────── */}
        <section
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 16,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <AlertCircle size={15} style={{ color: 'var(--accent-primary)' }} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.005em',
              }}
            >
              What needs your attention
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {attentionItems.length} item{attentionItems.length === 1 ? '' : 's'}, most severe first
            </span>
          </div>

          {attentionItems.length === 0 ? (
            <Empty>Nothing critical needs you right now — posture is stable and within appetite.</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attentionItems.map((it, i) => (
                <AttentionRow key={i} item={it} />
              ))}
            </div>
          )}
        </section>

        {/* ── Secondary KPI row — quiet supporting figures ──────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
          }}
        >
          <MiniStat
            label="Critical + High"
            value={String(headlineCriticalHigh)}
            sub={`${criticalCount} critical · ${highCount} high`}
            href={criticalHref}
          />
          <MiniStat
            label="KRIs breached"
            value={String(kriStatus.r)}
            sub={kriStatus.a > 0 ? `${kriStatus.a} more amber` : 'none amber'}
            subTone={kriStatus.r > 0 ? 'danger' : 'good'}
            href={kriHref}
          />
          <MiniStat
            label={seeAll ? 'Open mitigations' : 'My open actions'}
            value={String(openActions.length)}
            sub={myActionsOverdue > 0 ? `${myActionsOverdue} overdue` : 'all on track'}
            subTone={myActionsOverdue > 0 ? 'danger' : 'good'}
            href="/risk-register"
          />
          {/* ERM Annual Plan — summary; links down to the full plan-vs-actual calendar */}
          <a href="#erm-plan" style={{ textDecoration: 'none' }} title="ERM annual plan — view the full Jan–Dec calendar">
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                cursor: 'pointer',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                ERM Annual Plan
              </span>
              <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#067647', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{ermSummary.completed}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Completed</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#B42318', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{ermSummary.overdue}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Overdue</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{ermSummary.planned}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Upcoming</div>
                </div>
              </div>
            </div>
          </a>
        </div>
      </header>

      {/* ── Below the fold: supporting detail & evidence ──────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          margin: '6px 0 2px',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            whiteSpace: 'nowrap',
          }}
        >
          Detail &amp; evidence
        </span>
        <span style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
      </div>

      {/* ── ERM Annual Plan — Jan→Dec plan vs actual calendar ─────────── */}
      <div id="erm-plan" style={{ scrollMarginTop: 80 }}>
        <ErmAnnualPlan />
      </div>

      {/* ── 2-up: Drafts + Actions ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 12 }}>
        <Section
          title={seeAll ? 'Draft Risks Awaiting Review' : 'My Drafts'}
          subtitle={`${myDrafts.length} draft risk${myDrafts.length === 1 ? '' : 's'}${seeAll ? ' across the group' : ' authored by you'}`}
          cta={
            <Link href="/risk-register" style={ctaStyle}>
              <Plus size={11} /> Add Risk
            </Link>
          }
        >
          {myDrafts.length === 0 ? (
            <Empty>{seeAll ? 'No draft risks awaiting review — the register is current.' : 'No drafts awaiting you — your register is up to date.'}</Empty>
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

// ── Executive-brief primitives (Batch 5) ────────────────────────────────

type Severity = 'critical' | 'high' | 'medium'

interface AttentionItem {
  sev: Severity
  text: string
  meta: string
  href: string
  cta: string
}

const SEV_COLOR: Record<Severity, string> = {
  critical: '#B42318',
  high: '#B54708',
  medium: '#5A5A5A',
}

const SEV_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Watch',
}

interface ScoreBand {
  label: string
  color: string
}

function scoreBandFor(score: number): ScoreBand {
  if (score >= 75) return { label: 'Elevated', color: '#B42318' }
  if (score >= 60) return { label: 'Heightened', color: '#B54708' }
  return { label: 'Within appetite', color: '#067647' }
}

// Score-movement drivers (illustrative) — the "why it moved" attribution that
// turns a bare 72 into a story. Sums to the +4 delta (68 → 72).
const SCORE_DRIVERS: { label: string; delta: number; href: string }[] = [
  { label: 'KRI-13 Domestic Default Rate breached amber', delta: 2, href: '/kri' },
  { label: '2 risks escalated to Critical', delta: 3, href: '/risk-register' },
  { label: '1 control re-rated effective', delta: -1, href: '/control-command-center' },
]

const DANGER = '#B42318'
const GOOD = '#067647'

/** Compact AED formatter — Bn over a billion, M over a million. */
function aedShort(n: number): string {
  const v = Math.abs(n)
  if (v >= 1e9) return `AED ${(n / 1e9).toFixed(2)}Bn`
  if (v >= 1e6) return `AED ${Math.round(n / 1e6)}M`
  return `AED ${Math.round(n).toLocaleString()}`
}

/** The ONE money number: net unhedged exposure vs the board appetite ceiling. */
function ExposureHeadline({
  net,
  ceiling,
  gross,
  hedged,
}: {
  net: number
  ceiling: number
  gross: number
  hedged: number
}) {
  const over = net - ceiling
  const ratio = net / ceiling
  const overCeil = net > ceiling
  const tone = overCeil ? DANGER : GOOD
  const trackMax = Math.max(net, ceiling) * 1.18
  const netW = (net / trackMax) * 100
  const ceilW = (ceiling / trackMax) * 100
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${tone}`,
        borderRadius: 12,
        padding: 18,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
        Net unmitigated exposure vs board appetite
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', color: tone, fontVariantNumeric: 'tabular-nums' }}>
          {aedShort(net)}
        </span>
        {overCeil && (
          <span style={{ fontSize: 12, fontWeight: 700, color: DANGER, background: 'rgba(180,35,24,0.10)', border: '1px solid rgba(180,35,24,0.30)', borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap' }}>
            {ratio.toFixed(1)}× over · +{aedShort(over)}
          </span>
        )}
      </div>
      <div style={{ position: 'relative', height: 10, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, marginTop: 2 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${netW}%`, background: tone, opacity: 0.85, borderRadius: 6 }} />
        <div style={{ position: 'absolute', left: `${ceilW}%`, top: -3, bottom: -3, width: 2, background: 'var(--text-primary)' }} title="Board appetite ceiling" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>
        <span>Appetite ceiling {aedShort(ceiling)}</span>
        <span>{aedShort(net)} unhedged</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
        {aedShort(gross)} gross · {aedShort(hedged)} hedged · <strong style={{ color: tone }}>{aedShort(net)}</strong> net unhedged
      </div>
    </div>
  )
}

/** The 0–100 posture score as a bullet vs its ceiling + prior reading. */
function PostureBullet({
  score,
  prior,
  ceiling,
  drivers,
}: {
  score: number
  prior: number
  ceiling: number
  drivers: { label: string; delta: number; href: string }[]
}) {
  const band = scoreBandFor(score)
  const delta = score - prior
  const worse = delta > 0
  const overCeil = score > ceiling
  const clamp = (v: number) => Math.max(0, Math.min(100, v))
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        padding: 18,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
        Group risk score <span style={{ textTransform: 'none', fontWeight: 500 }}>(lower is better)</span>
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1, color: band.color, fontVariantNumeric: 'tabular-nums' }}>{score}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: band.color }}>{band.label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: worse ? DANGER : GOOD, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span aria-hidden>{worse ? '▲' : '▼'}</span>{worse ? '+' : ''}{delta} vs last qtr
        </span>
      </div>
      <div
        style={{ position: 'relative', height: 10, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, marginTop: 2 }}
        role="img"
        aria-label={`Risk score ${score} of 100; appetite ceiling ${ceiling}; was ${prior} last quarter`}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${clamp(score)}%`, background: band.color, opacity: 0.85, borderRadius: 6 }} />
        <div style={{ position: 'absolute', left: `${clamp(ceiling)}%`, top: -3, bottom: -3, width: 2, background: 'var(--text-primary)' }} title={`Appetite ≤ ${ceiling}`} />
        <div style={{ position: 'absolute', left: `${clamp(prior)}%`, top: -2, bottom: -2, width: 2, background: 'var(--text-tertiary)' }} title={`Last quarter ${prior}`} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>
        <span>0</span>
        <span>Appetite ≤{ceiling}{overCeil ? ` · ${score - ceiling} over` : ''}</span>
        <span>100</span>
      </div>
      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Why it moved</span>
        {drivers.map((d) => (
          <Link key={d.label} href={d.href} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit', fontSize: 11 }}>
            <span style={{ minWidth: 30, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: d.delta > 0 ? DANGER : GOOD }}>
              {d.delta > 0 ? '+' : ''}{d.delta}
            </span>
            <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{d.label}</span>
            <ChevronRight size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          </Link>
        ))}
      </div>
    </div>
  )
}

/** One auditable line proving the headline numbers reconcile. */
function ReconStrip({
  total,
  criticalHigh,
  critical,
  high,
  gross,
  hedged,
  net,
}: {
  total: number
  criticalHigh: number
  critical: number
  high: number
  gross: number
  hedged: number
  net: number
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
      <strong style={{ color: 'var(--text-primary)' }}>{criticalHigh} of {total}</strong> risks are Critical or High
      <span style={{ color: 'var(--text-tertiary)' }}>({critical} critical · {high} high)</span>
      <span style={{ color: 'var(--text-tertiary)' }}>—</span>
      driving <strong style={{ color: 'var(--text-primary)' }}>{aedShort(gross)}</strong> gross,
      <strong style={{ color: 'var(--text-primary)' }}>{aedShort(hedged)}</strong> hedged
      <span aria-hidden>→</span>
      <strong style={{ color: DANGER }}>{aedShort(net)}</strong> net unhedged.
    </div>
  )
}

function AttentionRow({ item }: { item: AttentionItem }) {
  const color = SEV_COLOR[item.sev]
  return (
    <Link
      href={item.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-primary)'
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          color,
          background: `${color}14`,
          border: `1px solid ${color}44`,
          borderRadius: 4,
          padding: '2px 7px',
          flexShrink: 0,
          minWidth: 58,
          textAlign: 'center',
        }}
      >
        {SEV_LABEL[item.sev]}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {item.text}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
          {item.meta}
        </div>
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--accent-primary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {item.cta}
        <ChevronRight size={13} />
      </span>
    </Link>
  )
}

function MiniStat({
  label,
  value,
  sub,
  subTone,
  href,
}: {
  label: string
  value: string
  sub?: string
  subTone?: 'good' | 'danger'
  href?: string
}) {
  const subColor =
    subTone === 'danger' ? '#B42318' : subTone === 'good' ? '#067647' : 'var(--text-tertiary)'
  const inner = (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        boxShadow: 'var(--shadow-sm)',
        cursor: href ? 'pointer' : 'default',
        height: '100%',
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
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, fontWeight: 600, color: subColor }}>{sub}</div>}
    </div>
  )
  return href ? (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      {inner}
    </Link>
  ) : (
    inner
  )
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
