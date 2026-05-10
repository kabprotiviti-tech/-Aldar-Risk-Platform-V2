'use client'

/**
 * Personal Dashboard — Module 13 (M13)
 * -------------------------------------
 * Role-aware "My Day" view. Aggregates the four things a Risk Champion /
 * KRI Owner / Group ERM Head needs to see first thing in the morning:
 *
 *   1. My drafts              — RiskDrafts I've authored (createdBy match)
 *   2. My open mitigations    — actions assigned to me (owner match)
 *      with overdue chip
 *   3. My KRIs                — KRIs I own + latest status traffic-light
 *   4. Recent audit activity  — last 10 audit events (cross-module)
 *
 * Pre-pilot we have no real RBAC, so the user picks their persona via a
 * top-of-page selector. Pilot wires SSO + role-based filtering.
 *
 * Honors CLAUDE.md: every count derives from persisted contexts. No
 * fabricated numerics. AED figures inherit existing provenance.
 */

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  UserCircle2,
  AlertCircle,
  Activity,
  Inbox,
  Pencil,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import {
  SimulationProvider,
  useSimulation,
} from '@/lib/context/SimulationContext'
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
import { KRI_DEFINITIONS } from '@/lib/data/kri-definitions'
import { computeKRIStatus, STATUS_META } from '@/lib/data/kri-status'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'

const PERSONAS = [
  { id: 'champion', label: 'Risk Champion', match: ['Risk Champion (demo)', 'Risk Champion'] },
  { id: 'erm', label: 'Group ERM Head', match: ['Group ERM Head (demo)', 'Group ERM Head'] },
  { id: 'cdo', label: 'Chief Development Officer', match: ['Chief Development Officer'] },
  { id: 'invest', label: 'Head of Aldar Investment', match: ['Head of Aldar Investment'] },
  { id: 'sales', label: 'Head of Sales', match: ['Head of Sales'] },
] as const

type PersonaId = (typeof PERSONAS)[number]['id']

const STORAGE_PERSONA = 'aldar-my-dashboard-persona-v1'

function MyDashboardContent() {
  const [personaId, setPersonaId] = useState<PersonaId>('champion')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PERSONA)
      if (saved && PERSONAS.find((p) => p.id === saved)) setPersonaId(saved as PersonaId)
    } catch {}
  }, [])

  function pickPersona(id: PersonaId) {
    setPersonaId(id)
    try {
      localStorage.setItem(STORAGE_PERSONA, id)
    } catch {}
  }

  const persona = PERSONAS.find((p) => p.id === personaId)!

  const { drafts } = useRiskDrafts()
  const { actions, isOverdue } = useMitigationActions()
  const { entries, latestFor } = useKRIEntries()
  const { thresholdsFor } = useKRIThresholds()
  const { events } = useAuditTrail()

  const myDrafts = useMemo(
    () => drafts.filter((d) => persona.match.some((m) => m === d.createdBy) || personaId === 'erm'),
    [drafts, persona, personaId],
  )

  const myActions = useMemo(
    () => actions.filter((a) => persona.match.some((m) => a.owner === m) || personaId === 'erm'),
    [actions, persona, personaId],
  )

  const myActionsOverdue = myActions.filter(isOverdue).length

  const myKRIs = useMemo(
    () =>
      KRI_DEFINITIONS.filter((k) =>
        persona.match.some((m) => k.owner === m) || personaId === 'erm',
      ),
    [persona, personaId],
  )

  const recentEvents = useMemo(
    () =>
      events
        .slice()
        .sort((a, b) => (a.at < b.at ? 1 : -1))
        .slice(0, 10),
    [events],
  )

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <IllustrativeDataBanner pilotFeeds="Aldar SSO + role-based filtering wired to actual user identity" />

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
            <UserCircle2 size={20} style={{ color: 'var(--accent-primary)' }} />
            My Dashboard
          </h1>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
              maxWidth: 760,
              lineHeight: 1.55,
            }}
          >
            Role-aware "My Day" view. Until pilot wires SSO + RBAC, pick a
            persona below — the page filters drafts, actions and KRIs by
            illustrative role mapping. The Group ERM Head persona sees
            everything (consolidated view).
          </p>
        </div>
        <StatusBadge tier="MVP" note={`Persona: ${persona.label}`} />
      </div>

      {/* Persona picker */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          padding: 10,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            marginRight: 4,
          }}
        >
          Persona
        </span>
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            onClick={() => pickPersona(p.id)}
            style={{
              background: p.id === personaId ? 'var(--accent-primary)' : 'transparent',
              color: p.id === personaId ? 'var(--on-accent)' : 'var(--text-secondary)',
              border: `1px solid ${p.id === personaId ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              padding: '5px 12px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Tile row: counts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        <KPITile
          icon={<Pencil size={16} />}
          label="My Drafts"
          value={myDrafts.length}
          accent="#FF6600"
          href="/risk-register"
        />
        <KPITile
          icon={<Activity size={16} />}
          label="My Open Actions"
          value={myActions.filter((a) => a.status !== 'closed').length}
          accent="#2D9EFF"
          subline={
            myActionsOverdue > 0
              ? `${myActionsOverdue} overdue`
              : 'on track'
          }
          sublineColor={myActionsOverdue > 0 ? '#FF3B3B' : '#22C55E'}
        />
        <KPITile
          icon={<AlertCircle size={16} />}
          label="My KRIs"
          value={myKRIs.length}
          accent="#A855F7"
          href="/kri"
        />
        <KPITile
          icon={<Inbox size={16} />}
          label="Audit Events Today"
          value={recentEvents.filter((e) => sameDay(new Date(e.at), new Date())).length}
          accent="#22C55E"
          href="/audit-trail"
        />
      </div>

      {/* Drafts + Actions row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 12 }}>
        <Section
          title="My Drafts"
          subtitle={`${myDrafts.length} draft risk${myDrafts.length === 1 ? '' : 's'} authored by this persona`}
          accent="#FF6600"
          cta={
            <Link href="/risk-register" style={ctaStyle}>
              <Plus size={11} /> Add Risk
            </Link>
          }
        >
          {myDrafts.length === 0 ? (
            <Empty>No drafts yet. Use /risk-register to add a new draft risk.</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {myDrafts.slice(0, 6).map((d) => (
                <Link
                  key={d.id}
                  href={`/risk-register?focus=${d.id}`}
                  style={rowLinkStyle}
                >
                  <span style={monoStyle}>{d.id}</span>
                  <span style={{ flex: 1, color: 'var(--text-primary)' }}>{d.name}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                    {d.status}
                  </span>
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
          title="My Open Actions"
          subtitle={`${myActions.filter((a) => a.status !== 'closed').length} open · ${myActionsOverdue} overdue`}
          accent="#2D9EFF"
          cta={
            <Link href="/risk-register" style={ctaStyle}>
              Open Register →
            </Link>
          }
        >
          {myActions.length === 0 ? (
            <Empty>No mitigation actions assigned to this persona yet.</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {myActions
                .filter((a) => a.status !== 'closed')
                .slice(0, 6)
                .map((a) => {
                  const overdue = isOverdue(a)
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

      {/* My KRIs */}
      <Section
        title="My KRIs"
        subtitle={`${myKRIs.length} KRI${myKRIs.length === 1 ? '' : 's'} owned by this persona — click to view trend / threshold / breach history`}
        accent="#A855F7"
        cta={
          <Link href="/kri" style={ctaStyle}>
            Open KRI Engine →
          </Link>
        }
      >
        {myKRIs.length === 0 ? (
          <Empty>No KRIs owned by this persona.</Empty>
        ) : (
          <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {myKRIs.map((k) => {
              const t = thresholdsFor(k)
              const latest = latestFor(k.id)
              const meta = latest
                ? STATUS_META[computeKRIStatus(latest.value, t, k.direction)]
                : {
                    label: 'No Data',
                    color: '#888888',
                    bg: 'rgba(136,136,136,0.18)',
                    border: 'rgba(136,136,136,0.55)',
                  }
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
                    {latest
                      ? `Latest ${latest.value} · ${latest.period}`
                      : 'No entries yet'}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Section>

      {/* Recent audit activity */}
      <Section
        title="Recent Activity"
        subtitle="Last 10 audit-trail events across the platform — what changed, who touched it, when"
        accent="#22C55E"
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
                  padding: '5px 8px',
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
                <span style={{ flex: 1, color: 'var(--text-primary)' }}>
                  {e.summary}
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                  {e.actor}
                </span>
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
        borderTop: `3px solid ${accent}`,
        borderRadius: 8,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        cursor: href ? 'pointer' : 'default',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: accent }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
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
  accent,
  cta,
  children,
}: {
  title: string
  subtitle: string
  accent: string
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
              fontSize: 11,
              fontWeight: 700,
              color: accent,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
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
  return (
    <div
      style={{
        padding: 16,
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
