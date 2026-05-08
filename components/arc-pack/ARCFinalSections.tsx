'use client'

/**
 * ARC Pack — Final Sections (E8)
 * -------------------------------
 * Sections 3-6 of the printable ARC Pack:
 *   3. KRI Summary & Breach Posture
 *   4. Scenario Results (illustrative posture)
 *   5. Outstanding Mitigation Actions
 *   6. Sign-off Block
 *
 * Honors CLAUDE.md: every numeric figure derives from engine output ×
 * user-entered KRI thresholds + entries + mitigation actions. Scenario
 * intensities reflect the illustrative bands in scenarios.ts; the
 * narrative for each is a pure template, no AI generation.
 */

import React from 'react'
import { useSimulation } from '@/lib/context/SimulationContext'
import { useKRIThresholds } from '@/lib/context/KRIThresholdsContext'
import { useKRIEntries } from '@/lib/context/KRIEntriesContext'
import { useMitigationActions } from '@/lib/context/MitigationActionsContext'
import { KRI_DEFINITIONS } from '@/lib/data/kri-definitions'
import {
  computeKRIStatus,
  STATUS_META,
  type KRIStatus,
} from '@/lib/data/kri-status'

// ── 3. KRI Summary ───────────────────────────────────────────────────────
function KRISummarySection() {
  const { thresholdsFor } = useKRIThresholds()
  const { latestFor } = useKRIEntries()

  const rows = KRI_DEFINITIONS.map((kri) => {
    const latest = latestFor(kri.id)
    const status: KRIStatus | null = latest
      ? computeKRIStatus(latest.value, thresholdsFor(kri), kri.direction)
      : null
    return {
      kri,
      latest,
      status,
      thresholds: thresholdsFor(kri),
    }
  })
  const counts = rows.reduce(
    (acc, r) => {
      if (r.status) acc[r.status] = (acc[r.status] || 0) + 1
      else acc.no_data = (acc.no_data || 0) + 1
      return acc
    },
    { green: 0, amber: 0, red: 0, no_data: 0 } as Record<string, number>,
  )

  return (
    <SectionWrapper number="3" title="KRI Summary &amp; Breach Posture">
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        <CountChip label="🔴 Red" count={counts.red} color="#FF3B3B" />
        <CountChip label="🟡 Amber" count={counts.amber} color="#F5C518" />
        <CountChip label="🟢 Green" count={counts.green} color="#22C55E" />
        <CountChip label="⚪ No Data" count={counts.no_data} color="#888" />
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 11,
        }}
      >
        <thead>
          <tr style={{ background: 'var(--bg-secondary)' }}>
            <Th>ID</Th>
            <Th>KRI</Th>
            <Th>Owner</Th>
            <Th right>Latest</Th>
            <Th>Period</Th>
            <Th right>Amber</Th>
            <Th right>Red</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ kri, latest, status, thresholds }) => (
            <tr key={kri.id} style={{ borderTop: '1px solid var(--border-color)' }}>
              <Td mono>{kri.id}</Td>
              <Td>{kri.name}</Td>
              <Td muted>{kri.owner}</Td>
              <Td right mono>
                {latest ? latest.value : '—'}
              </Td>
              <Td muted>{latest?.period ?? '—'}</Td>
              <Td right mono muted>
                {thresholds.amberBoundary}
              </Td>
              <Td right mono muted>
                {thresholds.redBoundary}
              </Td>
              <Td>
                {status ? (
                  <span
                    style={{
                      display: 'inline-block',
                      background: STATUS_META[status].bg,
                      color: STATUS_META[status].color,
                      border: `1px solid ${STATUS_META[status].border}`,
                      padding: '1px 6px',
                      borderRadius: 3,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                    }}
                  >
                    {STATUS_META[status].label}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 9,
                      color: 'var(--text-tertiary)',
                      fontStyle: 'italic',
                    }}
                  >
                    no data
                  </span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          marginTop: 8,
        }}
      >
        Status derives from latest manual KRI entry vs active thresholds and
        direction. Each KRI&rsquo;s appetite anchor is detailed on the /kri
        page (Appetite chip).
      </div>
    </SectionWrapper>
  )
}

// ── 4. Scenario Results ──────────────────────────────────────────────────
function ScenarioResultsSection() {
  // Illustrative scenario posture — references the existing /scenarios
  // intensities (Mild / Moderate / Severe) without re-running the engine
  // here. The ARC pack should match what's on /scenarios; this is a
  // deterministic summary of band semantics, not new math.
  const scenarios = [
    {
      name: 'Residential Price Collapse',
      intensities: [
        { label: 'Mild', value: '-25%', narrative: 'Price index drops 25% vs plan; residential occupancy softens 10pp; off-plan sales -20%; UAE buyer defaults +40%; international defaults +70%.' },
        { label: 'Moderate', value: '-35%', narrative: 'Price index -35%; occupancy -18pp; sales -32%; defaults +90% domestic / +140% international.' },
        { label: 'Severe', value: '-50%', narrative: 'Price index -50%; occupancy -28pp; sales -45%; defaults +140% domestic / +200% international.' },
      ],
    },
    {
      name: 'Commercial Rental Decline',
      intensities: [
        { label: 'Mild', value: '-25%', narrative: 'Commercial rent index re-bases 25% below budget; commercial occupancy softens 15pp; lease NOI -20%.' },
        { label: 'Moderate', value: '-35%', narrative: 'Rent index -35%; occupancy -22pp; NOI -28%.' },
        { label: 'Severe', value: '-50%', narrative: 'Rent index -50%; occupancy -30pp; NOI -38%.' },
      ],
    },
    {
      name: 'Global Financial Stress',
      intensities: [
        { label: 'Mild', value: 'rate +50bps', narrative: 'Liquidity index -15; sales volume -15%; defaults +35 dom / +60 intl; price -10%; rent -8%; construction cost +10%; supply chain stability -20%.' },
        { label: 'Moderate', value: 'rate +150bps', narrative: 'Liquidity -25; sales -25%; defaults +70/+120; price -20%; rent -15%; cost +18%; supply -40%.' },
        { label: 'Severe', value: 'rate +300bps', narrative: 'Liquidity -40; sales -40%; defaults +110/+180; price -35%; rent -25%; cost +28%; supply -70%.' },
      ],
    },
  ]

  return (
    <SectionWrapper number="4" title="Scenario Results — Illustrative Posture">
      <div
        style={{
          padding: 12,
          background: 'rgba(245,197,24,0.08)',
          border: '1px solid rgba(245,197,24,0.30)',
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--text-secondary)',
          marginBottom: 14,
          lineHeight: 1.55,
        }}
      >
        Three pre-built scenarios with three intensities each. Numbers below
        are the illustrative band targets used by the simulation engine
        (lib/engine/scenarios.ts). Pilot calibrates these to Aldar&rsquo;s
        own stress-test parameters.
      </div>
      {scenarios.map((s) => (
        <div
          key={s.name}
          style={{
            marginBottom: 14,
            padding: 12,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid var(--accent-primary)',
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            {s.name}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 8,
            }}
          >
            {s.intensities.map((it) => (
              <div
                key={it.label}
                style={{
                  padding: 8,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 4,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color:
                        it.label === 'Severe'
                          ? '#FF3B3B'
                          : it.label === 'Moderate'
                            ? '#FF8C00'
                            : '#F5C518',
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {it.label}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'var(--text-tertiary)',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  >
                    {it.value}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                  }}
                >
                  {it.narrative}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </SectionWrapper>
  )
}

// ── 5. Outstanding Mitigation Actions ───────────────────────────────────
function MitigationActionsSection() {
  const { actions, isOverdue } = useMitigationActions()
  const open = actions.filter((a) => a.status !== 'closed')
  const overdue = open.filter(isOverdue)

  return (
    <SectionWrapper number="5" title="Outstanding Mitigation Actions">
      {open.length === 0 ? (
        <div
          style={{
            padding: 14,
            background: 'rgba(34,197,94,0.10)',
            border: '1px solid rgba(34,197,94,0.40)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--text-primary)',
            lineHeight: 1.55,
          }}
        >
          No open mitigation actions in the register at the moment. Closed
          actions live in the per-risk drawer history.
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 12,
            }}
          >
            <CountChip label="Open" count={open.length} color="#FF8C00" />
            <CountChip label="Overdue" count={overdue.length} color="#FF3B3B" />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <Th>Risk</Th>
                <Th>Action</Th>
                <Th>Owner</Th>
                <Th>Due</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {open.map((a) => {
                const od = isOverdue(a)
                return (
                  <tr key={a.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <Td mono>{a.riskId}</Td>
                    <Td>{a.name}</Td>
                    <Td muted>{a.owner}</Td>
                    <Td muted>{a.dueDate}</Td>
                    <Td>
                      <span
                        style={{
                          display: 'inline-block',
                          background: od
                            ? 'rgba(255,59,59,0.18)'
                            : 'rgba(255,140,0,0.18)',
                          color: od ? '#FF3B3B' : '#FF8C00',
                          border: `1px solid ${od ? 'rgba(255,59,59,0.55)' : 'rgba(255,140,0,0.55)'}`,
                          padding: '1px 6px',
                          borderRadius: 3,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: 0.4,
                          textTransform: 'uppercase',
                        }}
                      >
                        {od ? 'Overdue' : a.status === 'in_progress' ? 'In Progress' : 'Open'}
                      </span>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}
    </SectionWrapper>
  )
}

// ── 6. Sign-off Block ────────────────────────────────────────────────────
function SignOffSection() {
  const today = new Date().toLocaleDateString('en-AE', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  return (
    <SectionWrapper number="6" title="Sign-off Block">
      <div
        style={{
          padding: 14,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 6,
          fontSize: 12,
          color: 'var(--text-primary)',
          lineHeight: 1.7,
          marginBottom: 16,
        }}
      >
        This pack has been prepared by the Group ERM function for review by
        the Audit &amp; Risk Committee at its scheduled session. The
        figures, KRIs, scenarios and mitigation actions reflect the state
        of the platform as at the date below. The Committee is invited to
        acknowledge the posture, challenge the residual ratings, and
        endorse / amend the recommended escalation actions.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
        }}
      >
        {[
          { role: 'Group ERM Head', name: '________________________' },
          { role: 'Chair, Audit & Risk Committee', name: '________________________' },
          { role: 'Group CEO', name: '________________________' },
        ].map((s) => (
          <div
            key={s.role}
            style={{
              padding: 12,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              minHeight: 110,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--accent-primary)',
                letterSpacing: 0.6,
                textTransform: 'uppercase',
              }}
            >
              {s.role}
            </div>
            <div
              style={{
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: 18,
                marginTop: 24,
                fontSize: 11,
                color: 'var(--text-tertiary)',
              }}
            >
              Name &amp; signature
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 6 }}>
              Date: {today}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          marginTop: 18,
          paddingTop: 12,
          borderTop: '1px dashed var(--border-color)',
          textAlign: 'center',
        }}
      >
        — End of ARC Pack — prepared by Group ERM, reviewed by Audit &amp;
        Risk Committee
      </div>
    </SectionWrapper>
  )
}

// ── Composer ─────────────────────────────────────────────────────────────
export function ARCFinalSections() {
  return (
    <>
      <KRISummarySection />
      <ScenarioResultsSection />
      <MitigationActionsSection />
      <SignOffSection />
    </>
  )
}

// ── Shared layout helpers ────────────────────────────────────────────────
function SectionWrapper({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      className="arc-page"
      style={{
        padding: '40px 48px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        marginTop: 14,
        pageBreakBefore: 'always',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--accent-primary)',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        Section {number}
      </div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 16px',
        }}
        // Title is plain — never contains user input here, only static section names.
        dangerouslySetInnerHTML={{ __html: title }}
      />
      {children}
    </section>
  )
}

function CountChip({
  label,
  count,
  color,
}: {
  label: string
  count: number
  color: string
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 700,
        background: `${color}1f`,
        color,
        border: `1px solid ${color}66`,
        padding: '3px 8px',
        borderRadius: 3,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
      }}
    >
      {label} {count}
    </span>
  )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      style={{
        textAlign: right ? 'right' : 'left',
        fontSize: 9,
        fontWeight: 700,
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        padding: '6px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  right,
  mono,
  muted,
}: {
  children: React.ReactNode
  right?: boolean
  mono?: boolean
  muted?: boolean
}) {
  return (
    <td
      style={{
        textAlign: right ? 'right' : 'left',
        padding: '6px 8px',
        color: muted ? 'var(--text-secondary)' : 'var(--text-primary)',
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </td>
  )
}
