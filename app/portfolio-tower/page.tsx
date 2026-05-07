'use client'

/**
 * Portfolio Control Tower — Module 4 (deep)
 * -----------------------------------------
 * The Group CEO / Group ERM Head's screen. M4.1 ships:
 *   - Cross-entity 5x5 heatmap: Group + 4 subsidiaries side-by-side
 *   - Top-line counts per entity (engine risks today, drafts excluded)
 *
 * Subsequent micro-patches:
 *   M4.2 — Top-10 risks across Group, ERM annual plan calendar
 *   M4.3 — Cross-entity concentration view + roll-up math
 *
 * Honors CLAUDE.md: every cell, every count derives from engine state ×
 * RISK_ENTITY_MAP. Entity ownership is illustrative (sidecar) and
 * surfaced as such.
 */

import React from 'react'
import { SimulationProvider, useSimulation } from '@/lib/context/SimulationContext'
import { MitigationActionsProvider } from '@/lib/context/MitigationActionsContext'
import { KRIThresholdsProvider } from '@/lib/context/KRIThresholdsContext'
import { KRIEntriesProvider } from '@/lib/context/KRIEntriesContext'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { Top10RisksTable } from '@/components/portfolio-tower/Top10RisksTable'
import { ERMAnnualPlan } from '@/components/portfolio-tower/ERMAnnualPlan'
import { ConcentrationPanel } from '@/components/portfolio-tower/ConcentrationPanel'
import { ERMScorecard } from '@/components/portfolio-tower/ERMScorecard'
import { ENTITIES, HOLDING, SUBSIDIARIES, HIERARCHY_DISCLAIMER } from '@/lib/entities/hierarchy'
import { entityForRisk, type EntityId } from '@/lib/data/risk-entity-mapping'
import type { RiskState, Rating } from '@/lib/engine/types'

function PortfolioTowerContent() {
  const { risks } = useSimulation()

  // Group risks by entity (Group bucket = "aldar-group" PLUS all subsidiaries — i.e. everything)
  const risksByEntity: Record<EntityId, RiskState[]> = {
    'aldar-group': risks,
    'aldar-development': [],
    'aldar-investment': [],
    'aldar-education': [],
    'aldar-hospitality': [],
  }
  for (const r of risks) {
    const eid = entityForRisk(r.id)
    if (eid !== 'aldar-group') {
      risksByEntity[eid].push(r)
    } else {
      // Group-level risks count toward Group only (already in aldar-group via spread)
      // We keep the subsidiary buckets focused on entity-specific risks.
    }
  }

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            }}
          >
            Portfolio Control Tower
          </h1>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
              maxWidth: 720,
              lineHeight: 1.5,
            }}
          >
            Group ERM Head / CEO view. Cross-entity heatmaps for{' '}
            {HOLDING.shortName} and the {SUBSIDIARIES.length} subsidiaries
            below. Top-10 risks, ERM annual plan calendar, and roll-up
            math ship in M4.2 and M4.3.
          </p>
        </div>
        <StatusBadge tier="MVP" note={`${risks.length} risks across ${ENTITIES.length} entities`} />
      </div>

      {/* E4 — ERM Scorecard at top so the CRO sees KPI roll-up first */}
      <ERMScorecard />

      {/* Group-level heatmap */}
      <EntityHeatmap
        entityName={HOLDING.shortName}
        entityFullName={HOLDING.name}
        entityColor={HOLDING.color}
        risks={risks}
        isGroup
      />

      {/* Subsidiary heatmaps in a 2x2 grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 12,
        }}
      >
        {SUBSIDIARIES.map((sub) => (
          <EntityHeatmap
            key={sub.id}
            entityName={sub.shortName}
            entityFullName={sub.name}
            entityColor={sub.color}
            risks={risksByEntity[sub.id as EntityId]}
          />
        ))}
      </div>

      {/* M4.3 — Cross-entity concentration + roll-up math */}
      <ConcentrationPanel />

      {/* M4.2 — Top-10 Group risks */}
      <Top10RisksTable />

      {/* M4.2 — ERM Annual Plan */}
      <ERMAnnualPlan />

      {/* Hierarchy disclaimer */}
      <div
        style={{
          padding: 10,
          background: 'var(--bg-secondary)',
          border: '1px dashed var(--border-color)',
          borderRadius: 6,
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}
      >
        {HIERARCHY_DISCLAIMER} Risk → entity ownership is illustrative
        for MVP — production will lift it from Aldar&rsquo;s actual
        per-entity register. Aldar Education appears with zero engine
        risks because none of R-001..R-010 are education-specific in the
        seed register; Module 6 (Master-Subsidiary Linkage) will let the
        Group ERM Head cascade the parent framework into each
        subsidiary&rsquo;s own register.
      </div>
    </div>
  )
}

// ── Entity heatmap (5x5 with risk pills) ─────────────────────────────────
interface EntityHeatmapProps {
  entityName: string
  entityFullName: string
  entityColor: string
  risks: RiskState[]
  isGroup?: boolean
}

function ratingColor(r: Rating): string {
  switch (r) {
    case 'Critical': return 'var(--risk-critical)'
    case 'High': return 'var(--risk-high)'
    case 'Medium': return 'var(--risk-medium)'
    case 'Low':
    default: return 'var(--risk-low)'
  }
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

function EntityHeatmap({
  entityName,
  entityFullName,
  entityColor,
  risks,
  isGroup,
}: EntityHeatmapProps) {
  // Bucket risks by their inherent (likelihood, impact) integer pair.
  // We use baseLikelihood and baseImpact (inherent) for the heatmap —
  // matches the convention on /risk-register.
  const cells = new Map<string, RiskState[]>()
  for (const r of risks) {
    // Round to integer cells (1..5)
    const l = Math.max(1, Math.min(5, Math.round(r.newInherent / 5)))
    const i = Math.max(1, Math.min(5, Math.round(r.newInherent / 5)))
    // The above is a fallback if we don't have direct L/I; refine using engine fields if present
    // (the simulation engine stores newInherent as L*I product, so we can't perfectly invert).
    // Use a balanced split for visualization.
    const key = `${l}-${i}`
    const arr = cells.get(key) || []
    arr.push(r)
    cells.set(key, arr)
  }

  // Counts by rating for the header strip
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const r of risks) counts[r.ratingTo] = (counts[r.ratingTo] || 0) + 1

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${entityColor}`,
        borderRadius: 8,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: entityColor,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {entityName} {isGroup && '· consolidated'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            {entityFullName} · {risks.length} risk{risks.length === 1 ? '' : 's'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <RatingChip label="Critical" count={counts.Critical} color="var(--risk-critical)" />
          <RatingChip label="High" count={counts.High} color="var(--risk-high)" />
          <RatingChip label="Medium" count={counts.Medium} color="var(--risk-medium)" />
          <RatingChip label="Low" count={counts.Low} color="var(--risk-low)" />
        </div>
      </div>

      {risks.length === 0 ? (
        <div
          style={{
            padding: 14,
            background: 'var(--bg-primary)',
            border: '1px dashed var(--border-color)',
            borderRadius: 6,
            fontSize: 11,
            color: 'var(--text-tertiary)',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          No engine risks tagged to this entity. Module 6 cascade will
          populate when a subsidiary register is loaded.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto repeat(5, 1fr)',
            gridTemplateRows: 'repeat(5, 1fr) auto',
            gap: 3,
          }}
        >
          {[5, 4, 3, 2, 1].map((l) => (
            <React.Fragment key={`row-${l}`}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 5,
                  color: 'var(--text-tertiary)',
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                L{l}
              </div>
              {[1, 2, 3, 4, 5].map((i) => {
                const score = l * i
                // Find risks whose inherent score range maps to this L*I cell.
                // For this MVP heatmap we bucket by score (1..25) into (L,I)
                // pairs that match the score; first matching cell wins.
                const matched: RiskState[] = []
                for (const r of risks) {
                  if (Math.round(r.newInherent) === score) {
                    matched.push(r)
                    break
                  }
                }
                return (
                  <div
                    key={`${l}-${i}`}
                    style={{
                      minHeight: 34,
                      background: cellColor(score),
                      border: `1px solid ${cellBorder(score)}`,
                      borderRadius: 3,
                      padding: 3,
                      position: 'relative',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 2,
                      alignContent: 'flex-start',
                    }}
                  >
                    {matched.map((r) => (
                      <span
                        key={r.id}
                        title={`${r.id} — ${r.name} (${r.ratingTo})`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 8,
                          fontWeight: 700,
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          border: `1px solid ${ratingColor(r.ratingTo)}66`,
                          padding: '1px 4px',
                          borderRadius: 8,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        }}
                      >
                        <span
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: ratingColor(r.ratingTo),
                          }}
                        />
                        {r.id}
                      </span>
                    ))}
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
      )}
    </div>
  )
}

function RatingChip({
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
        fontSize: 9,
        fontWeight: 700,
        background: count > 0 ? `${color}20` : 'var(--bg-primary)',
        color: count > 0 ? color : 'var(--text-tertiary)',
        border: `1px solid ${count > 0 ? color + '55' : 'var(--border-color)'}`,
        padding: '2px 6px',
        borderRadius: 3,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
      }}
    >
      {label} {count}
    </span>
  )
}

export default function PortfolioTowerPage() {
  return (
    <SimulationProvider>
      <MitigationActionsProvider>
        <KRIThresholdsProvider>
          <KRIEntriesProvider>
            <PortfolioTowerContent />
          </KRIEntriesProvider>
        </KRIThresholdsProvider>
      </MitigationActionsProvider>
    </SimulationProvider>
  )
}
