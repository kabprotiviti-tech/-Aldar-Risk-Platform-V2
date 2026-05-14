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
import Link from 'next/link'
import { SimulationProvider, useSimulation } from '@/lib/context/SimulationContext'
import { MitigationActionsProvider } from '@/lib/context/MitigationActionsContext'
import { KRIThresholdsProvider } from '@/lib/context/KRIThresholdsContext'
import { KRIEntriesProvider } from '@/lib/context/KRIEntriesContext'
import { EscalationsProvider } from '@/lib/context/EscalationsContext'
import { ERMPlanActivitiesProvider } from '@/lib/context/ERMPlanActivitiesContext'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'
import { Top10RisksTable } from '@/components/portfolio-tower/Top10RisksTable'
import { ERMAnnualPlan } from '@/components/portfolio-tower/ERMAnnualPlan'
import { ConcentrationPanel } from '@/components/portfolio-tower/ConcentrationPanel'
import { ERMScorecard } from '@/components/portfolio-tower/ERMScorecard'
import { EscalatedToGroupPanel } from '@/components/portfolio-tower/EscalatedToGroupPanel'
import { ENTITIES, HOLDING, SUBSIDIARIES, HIERARCHY_DISCLAIMER } from '@/lib/entities/hierarchy'
import { entityForRisk, type EntityId } from '@/lib/data/risk-entity-mapping'
import type { RiskState, Rating } from '@/lib/engine/types'
import { RISKS } from '@/lib/engine/seedData'
import { usePersona } from '@/lib/context/PersonaContext'

function PortfolioTowerContent() {
  const { risks: allRisks } = useSimulation()
  const { session } = usePersona()

  // P6 entity-scope filter: when a subsidiary scope is active, the
  // Group-level heatmap + Concentration + Top-10 narrow to that
  // subsidiary's risks. Per-subsidiary cards stay scoped to themselves
  // regardless (so the viewer still sees the cross-entity context).
  const scope = session.entityScope
  const risks =
    scope && scope !== 'aldar-group'
      ? allRisks.filter((r) => entityForRisk(r.id) === scope)
      : allRisks

  // Group risks by entity (Group bucket = "aldar-group" PLUS all subsidiaries — i.e. everything)
  const risksByEntity: Record<EntityId, RiskState[]> = {
    'aldar-group': allRisks,
    'aldar-development': [],
    'aldar-investment': [],
    'aldar-education': [],
    'aldar-hospitality': [],
  }
  for (const r of allRisks) {
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
      <IllustrativeDataBanner pilotFeeds="Aldar segment P&L for AED exposure baselines" />
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
            below.
          </p>
          {scope && scope !== 'aldar-group' && (
            <div
              style={{
                marginTop: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                background: 'rgba(255,102,0,0.10)',
                border: '1px solid rgba(255,102,0,0.40)',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--accent-primary)',
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}
            >
              Filtered to {scope.replace('aldar-', '')}
            </div>
          )}
        </div>
        <StatusBadge tier="MVP" note={`${risks.length} risks${scope && scope !== 'aldar-group' ? ` · scope ${scope.replace('aldar-', '')}` : ` across ${ENTITIES.length} entities`}`} />
      </div>

      {/* E4 — ERM Scorecard at top so the CRO sees KPI roll-up first */}
      <ERMScorecard />

      {/* E10 — Escalated to Group panel */}
      <EscalatedToGroupPanel />

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
  // Cell drill-down modal state (Batch M).
  const [drilledKey, setDrilledKey] = React.useState<string | null>(null)

  // Bucket risks by their inherent (likelihood, impact) integer pair.
  // BCG-1 audit fix: previously both L and I were rounded from the SAME
  // newInherent value, so every risk plotted on the diagonal (L = I).
  // RiskState carries the product `newInherent`; the original L and I
  // live on the RiskDef (RISKS) as `baseLikelihood` + `baseImpact`. Join
  // by riskId so the heatmap actually shows the L/I distribution.
  const cells = new Map<string, RiskState[]>()
  for (const r of risks) {
    const def = RISKS.find((x) => x.id === r.id)
    const l = Math.max(
      1,
      Math.min(5, def?.baseLikelihood ?? Math.round(Math.sqrt(r.newInherent))),
    )
    const i = Math.max(
      1,
      Math.min(5, def?.baseImpact ?? Math.round(Math.sqrt(r.newInherent))),
    )
    const key = `${l}-${i}`
    const arr = cells.get(key) || []
    arr.push(r)
    cells.set(key, arr)
  }

  const drilledRisks = drilledKey ? cells.get(drilledKey) ?? [] : []
  const [drilledL, drilledI] = drilledKey ? drilledKey.split('-').map(Number) : [0, 0]

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
                // Render risks using the L/I-bucketed `cells` map (joined to
                // RiskDef by id) instead of the old score-based lookup which
                // mis-attributed risks to wrong cells.
                const cellKey = `${l}-${i}`
                const matched = cells.get(cellKey) ?? []
                const hasRisks = matched.length > 0
                return (
                  <button
                    key={cellKey}
                    type="button"
                    onClick={() => hasRisks && setDrilledKey(cellKey)}
                    disabled={!hasRisks}
                    aria-label={hasRisks ? `Drill into ${matched.length} risk${matched.length === 1 ? '' : 's'} at L${l} × I${i}` : `No risks at L${l} × I${i}`}
                    title={hasRisks ? `${matched.length} risk${matched.length === 1 ? '' : 's'} — click to drill` : undefined}
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
                      cursor: hasRisks ? 'pointer' : 'default',
                      textAlign: 'left',
                      font: 'inherit',
                      color: 'inherit',
                      transition: 'transform 120ms ease-out, box-shadow 120ms ease-out',
                    }}
                    onMouseEnter={(e) => {
                      if (hasRisks) {
                        e.currentTarget.style.transform = 'scale(1.04)'
                        e.currentTarget.style.boxShadow = `0 0 0 1px ${cellBorder(score).replace('0.50', '0.90')}`
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {matched.slice(0, 4).map((r) => (
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
                    {matched.length > 4 && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: 'var(--text-tertiary)',
                          padding: '1px 4px',
                        }}
                      >
                        +{matched.length - 4}
                      </span>
                    )}
                  </button>
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

      {/* Cell drill modal — Batch M */}
      {drilledKey && (
        <HeatmapDrillModal
          entityName={entityName}
          entityColor={entityColor}
          likelihood={drilledL}
          impact={drilledI}
          risks={drilledRisks}
          onClose={() => setDrilledKey(null)}
        />
      )}
    </div>
  )
}

// ── Heatmap cell drill modal ──────────────────────────────────────────────
function HeatmapDrillModal({
  entityName,
  entityColor,
  likelihood,
  impact,
  risks,
  onClose,
}: {
  entityName: string
  entityColor: string
  likelihood: number
  impact: number
  risks: RiskState[]
  onClose: () => void
}) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const score = likelihood * impact
  const sortedRisks = [...risks].sort((a, b) => b.newInherent - a.newInherent)

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Risks at L${likelihood} × I${impact} for ${entityName}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'aldar-heatmap-modal-fade-in 220ms ease-out',
      }}
    >
      <style>{`
        @keyframes aldar-heatmap-modal-fade-in {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="dialog"] { animation: none !important; }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 100%)',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${entityColor}`,
          borderRadius: 12,
          boxShadow: 'var(--shadow-lg, 0 32px 64px rgba(0,0,0,0.55))',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: entityColor,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              {entityName}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.005em' }}>
              Likelihood {likelihood} × Impact {impact}
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  background: cellColor(score),
                  border: `1px solid ${cellBorder(score)}`,
                  color: 'var(--text-secondary)',
                  padding: '2px 6px',
                  borderRadius: 3,
                  letterSpacing: 0.4,
                }}
              >
                score {score}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {risks.length} risk{risks.length === 1 ? '' : 's'} mapped to this cell — sorted by residual exposure
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              letterSpacing: 0.4,
            }}
          >
            ESC
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sortedRisks.map((r) => {
            const def = RISKS.find((x) => x.id === r.id)
            return (
              <Link
                key={r.id}
                href={`/risk-register?focus=${r.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${ratingColor(r.ratingTo)}`,
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--text-tertiary)',
                        letterSpacing: 0.4,
                      }}
                    >
                      {r.id}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: ratingColor(r.ratingTo),
                        background: `${ratingColor(r.ratingTo)}1f`,
                        border: `1px solid ${ratingColor(r.ratingTo)}55`,
                        padding: '1px 6px',
                        borderRadius: 3,
                        letterSpacing: 0.4,
                        textTransform: 'uppercase',
                      }}
                    >
                      {r.ratingTo}
                    </span>
                    {def?.category && (
                      <span style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: 0.3 }}>
                        {def.category}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, letterSpacing: '-0.005em' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>Inherent <strong style={{ color: 'var(--text-secondary)' }}>{r.newInherent}</strong></span>
                    <span>Residual <strong style={{ color: 'var(--text-secondary)' }}>{r.newResidual ?? '—'}</strong></span>
                    <span>Exposure <strong style={{ color: 'var(--text-secondary)' }}>AED {r.exposureAedMn} M</strong></span>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Open →
                </span>
              </Link>
            )
          })}
        </div>
      </div>
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
            <EscalationsProvider>
              <ERMPlanActivitiesProvider>
                <PortfolioTowerContent />
              </ERMPlanActivitiesProvider>
            </EscalationsProvider>
          </KRIEntriesProvider>
        </KRIThresholdsProvider>
      </MitigationActionsProvider>
    </SimulationProvider>
  )
}
