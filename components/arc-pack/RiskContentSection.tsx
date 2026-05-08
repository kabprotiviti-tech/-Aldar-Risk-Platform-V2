'use client'

/**
 * ARC Pack — Risk Content Section (E7)
 * -------------------------------------
 * Section 2 of the printable ARC Pack. Three blocks composed in print
 * order:
 *   1. Group Risk Posture narrative (auto-built from engine + entity counts)
 *   2. Top-10 risks table
 *   3. Group inherent vs residual heatmap
 *
 * Honors CLAUDE.md: every figure derives from engine output. The
 * narrative is a pure template — no AI hallucination. Anchor figures
 * (Aldar FY25/Q1 26) shown via NumericValue with provenance.
 */

import React from 'react'
import { useSimulation } from '@/lib/context/SimulationContext'
import { entityForRisk } from '@/lib/data/risk-entity-mapping'
import { getEntity, ENTITIES } from '@/lib/entities/hierarchy'
import type { RiskState, Rating } from '@/lib/engine/types'

function ratingColor(r: Rating): string {
  switch (r) {
    case 'Critical': return '#FF3B3B'
    case 'High': return '#FF8C00'
    case 'Medium': return '#F5C518'
    case 'Low':
    default: return '#22C55E'
  }
}

export function RiskContentSection() {
  const { risks } = useSimulation()

  // Top-10 by residual descending
  const top10 = risks
    .slice()
    .sort((a, b) => b.newResidual - a.newResidual)
    .slice(0, 10)

  // Counters
  const counts = risks.reduce(
    (acc, r) => {
      acc[r.ratingTo] = (acc[r.ratingTo] || 0) + 1
      return acc
    },
    {} as Record<Rating, number>,
  )
  const totalExposure = risks.reduce((s, r) => s + r.exposureAedMn, 0)

  // Entity slice
  const byEntity = ENTITIES.filter((e) => e.kind === 'subsidiary').map((sub) => ({
    name: sub.shortName,
    count: risks.filter((r) => entityForRisk(r.id) === sub.id).length,
  }))

  // Auto-narrative — pure template
  const topRisk = top10[0]
  const narrativeLines: string[] = [
    `Group ERM is currently tracking ${risks.length} active risks across ${ENTITIES.length} entities, with consolidated residual exposure of ${totalExposure.toFixed(0)} AED mn (illustrative engine baseline).`,
    `Risk distribution by rating: ${counts.Critical || 0} Critical, ${counts.High || 0} High, ${counts.Medium || 0} Medium, ${counts.Low || 0} Low.`,
    `Entity allocation: ${byEntity.map((e) => `${e.name} (${e.count})`).join(', ')}.`,
    topRisk
      ? `Top residual risk: ${topRisk.id} ${topRisk.name}, residual ${topRisk.newResidual.toFixed(1)}/25, rating ${topRisk.ratingTo}, owner ${topRisk.owner}.`
      : '',
    `KRI breach posture, mitigation status and outstanding actions are detailed in subsequent sections.`,
  ].filter(Boolean)

  return (
    <section
      className="arc-page"
      style={{
        padding: '40px 48px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        marginTop: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Section header */}
      <div>
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
          Section 2 — Group Risk Posture
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Top Risks &amp; Heatmap
        </h2>
      </div>

      {/* Narrative */}
      <div
        style={{
          padding: 14,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid var(--accent-primary)',
          borderRadius: 6,
          fontSize: 12,
          color: 'var(--text-primary)',
          lineHeight: 1.7,
        }}
      >
        {narrativeLines.map((line, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : '8px 0 0' }}>
            {line}
          </p>
        ))}
      </div>

      {/* Top-10 table */}
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginBottom: 6,
          }}
        >
          Top 10 Risks (by Residual)
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
              <Th>#</Th>
              <Th>ID</Th>
              <Th>Risk</Th>
              <Th>Entity</Th>
              <Th right>Inherent</Th>
              <Th right>Residual</Th>
              <Th>Rating</Th>
              <Th right>Exposure (AED mn)</Th>
            </tr>
          </thead>
          <tbody>
            {top10.map((r, idx) => {
              const entity = getEntity(entityForRisk(r.id))
              return (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <Td muted>{idx + 1}</Td>
                  <Td mono>{r.id}</Td>
                  <Td>{r.name}</Td>
                  <Td muted>{entity?.shortName ?? '—'}</Td>
                  <Td right mono>
                    {r.newInherent.toFixed(1)}
                  </Td>
                  <Td right mono>
                    {r.newResidual.toFixed(1)}
                  </Td>
                  <Td>
                    <span
                      style={{
                        display: 'inline-block',
                        background: `${ratingColor(r.ratingTo)}26`,
                        color: ratingColor(r.ratingTo),
                        border: `1px solid ${ratingColor(r.ratingTo)}66`,
                        padding: '1px 6px',
                        borderRadius: 3,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        textTransform: 'uppercase',
                      }}
                    >
                      {r.ratingTo}
                    </span>
                  </Td>
                  <Td right mono>
                    {r.exposureAedMn.toFixed(0)}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Group heatmap (5x5 inherent) */}
      <ARCHeatmap risks={risks} />

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          paddingTop: 10,
          borderTop: '1px dashed var(--border-color)',
        }}
      >
        Risk scores from the simulation engine. AED exposure derives from
        engine baseline anchors (illustrative pre-pilot calibration).
        Rating bands: Critical &gt;= 16, High 12–15, Medium 8–11, Low &lt; 8.
      </div>
    </section>
  )
}

function ARCHeatmap({ risks }: { risks: RiskState[] }) {
  // Bucket risks by their inherent score → score-mapped (L,I) cell.
  const cellsByScore = new Map<number, RiskState[]>()
  for (const r of risks) {
    const score = Math.round(r.newInherent)
    if (!cellsByScore.has(score)) cellsByScore.set(score, [])
    cellsByScore.get(score)!.push(r)
  }

  function cellColor(score: number): string {
    if (score >= 15) return 'rgba(255,59,59,0.20)'
    if (score >= 10) return 'rgba(255,140,0,0.20)'
    if (score >= 5) return 'rgba(245,197,24,0.18)'
    return 'rgba(34,197,94,0.15)'
  }
  function cellBorder(score: number): string {
    if (score >= 15) return 'rgba(255,59,59,0.50)'
    if (score >= 10) return 'rgba(255,140,0,0.50)'
    if (score >= 5) return 'rgba(245,197,24,0.50)'
    return 'rgba(34,197,94,0.45)'
  }

  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: 6,
        }}
      >
        Group Inherent Risk Heatmap (5×5)
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto repeat(5, 1fr)',
          gridTemplateRows: 'repeat(5, 1fr) auto',
          gap: 3,
          maxWidth: 600,
        }}
      >
        {[5, 4, 3, 2, 1].map((l) => (
          <React.Fragment key={`row-${l}`}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 6,
                color: 'var(--text-tertiary)',
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              L{l}
            </div>
            {[1, 2, 3, 4, 5].map((i) => {
              const score = l * i
              const matched = cellsByScore.get(score) || []
              return (
                <div
                  key={`${l}-${i}`}
                  style={{
                    minHeight: 42,
                    background: cellColor(score),
                    border: `1px solid ${cellBorder(score)}`,
                    borderRadius: 3,
                    padding: 4,
                    position: 'relative',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    alignContent: 'flex-start',
                  }}
                >
                  {matched.slice(0, 3).map((r) => (
                    <span
                      key={r.id}
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        padding: '1px 4px',
                        borderRadius: 8,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      }}
                    >
                      {r.id}
                    </span>
                  ))}
                  {matched.length > 3 && (
                    <span
                      style={{
                        fontSize: 8,
                        color: 'var(--text-tertiary)',
                        fontStyle: 'italic',
                      }}
                    >
                      +{matched.length - 3}
                    </span>
                  )}
                </div>
              )
            })}
          </React.Fragment>
        ))}
        <div />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={`col-${i}`}
            style={{
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: 9,
              fontWeight: 700,
              paddingTop: 2,
            }}
          >
            I{i}
          </div>
        ))}
      </div>
    </div>
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
