'use client'

/**
 * ConcentrationPanel — Module 4 / M4.3
 * -------------------------------------
 * The CRO's killer-question screen: "Where is my Group exposure
 * actually concentrated, and what would change if I tighten appetite?"
 *
 * Three sub-views (composed side-by-side or stacked):
 *  1. By Entity     — AED exposure per subsidiary (% of Group)
 *  2. By Category   — Project / Construction vs Financial vs etc.
 *  3. By Driver     — top 5 drivers ranked by sum of risk contributions
 *
 * Plus an explicit roll-up formula panel that states the math behind
 * the Group AED so nothing feels like magic.
 *
 * Honors CLAUDE.md: every figure is engine output × entity map. Formula
 * is shown explicitly. Entity ownership is illustrative (sidecar) and
 * surfaced via the page-level disclaimer.
 */

import React from 'react'
import { Network, Sigma } from 'lucide-react'
import { useSimulation } from '@/lib/context/SimulationContext'
import { entityForRisk, type EntityId } from '@/lib/data/risk-entity-mapping'
import { ENTITIES, getEntity } from '@/lib/entities/hierarchy'
import type { RiskState } from '@/lib/engine/types'

interface AggregateRow {
  label: string
  color: string
  totalAed: number
  count: number
}

function formatMn(v: number): string {
  return `${v >= 0 ? '' : '-'}${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })} mn`
}

export function ConcentrationPanel() {
  const { risks } = useSimulation()
  const groupTotal = risks.reduce((s, r) => s + r.exposureAedMn, 0)

  // ── By Entity ────────────────────────────────────────────────────────
  const byEntity: Record<EntityId, AggregateRow> = {
    'aldar-group': { label: 'ABC Group', color: '#C9A84C', totalAed: 0, count: 0 },
    'aldar-development': { label: 'ABC Development', color: '#FF6600', totalAed: 0, count: 0 },
    'aldar-investment': { label: 'ABC Investment', color: '#2D9EFF', totalAed: 0, count: 0 },
    'aldar-education': { label: 'ABC Education', color: '#22C55E', totalAed: 0, count: 0 },
    'aldar-hospitality': { label: 'ABC Hospitality', color: '#A855F7', totalAed: 0, count: 0 },
  }
  for (const r of risks) {
    const eid = entityForRisk(r.id)
    byEntity[eid].totalAed += r.exposureAedMn
    byEntity[eid].count += 1
  }
  const entityRows = (Object.values(byEntity) as AggregateRow[]).sort(
    (a, b) => b.totalAed - a.totalAed,
  )

  // ── By Category ──────────────────────────────────────────────────────
  const categoryColors: Record<string, string> = {
    'Project/Construction': '#FF6600',
    'Financial': '#2D9EFF',
    'Operational': '#22C55E',
    'Strategic': '#A855F7',
    'Market/Sales': '#F5C518',
    'External/Geopolitical': '#FF3B3B',
  }
  const byCategory = new Map<string, AggregateRow>()
  for (const r of risks) {
    const cat = r.category
    const row = byCategory.get(cat) || {
      label: cat,
      color: categoryColors[cat] || 'var(--accent-primary)',
      totalAed: 0,
      count: 0,
    }
    row.totalAed += r.exposureAedMn
    row.count += 1
    byCategory.set(cat, row)
  }
  const categoryRows = Array.from(byCategory.values()).sort(
    (a, b) => b.totalAed - a.totalAed,
  )

  // ── Driver concentration ─────────────────────────────────────────────
  // Sum each driver's |contributionPoints| across all risks and rank top 5.
  const driverScores = new Map<string, { name: string; total: number }>()
  for (const r of risks) {
    for (const d of r.contributingDrivers) {
      const cur = driverScores.get(d.driverId) || { name: d.driverName, total: 0 }
      cur.total += Math.abs(d.contributionPoints)
      driverScores.set(d.driverId, cur)
    }
  }
  const topDrivers = Array.from(driverScores.entries())
    .map(([id, v]) => ({ id, name: v.name, total: v.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  const maxDriverScore = topDrivers[0]?.total || 1

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Network size={11} />
          Cross-Entity Concentration
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
          Where Group exposure concentrates today. Editing thresholds, scenarios,
          or driver values flows into this panel automatically.
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {/* By Entity */}
        <ConcentrationBlock
          title="By Entity"
          rows={entityRows}
          total={groupTotal}
          subtitle={`${entityRows.filter((r) => r.count > 0).length} entities with risks`}
        />
        {/* By Category */}
        <ConcentrationBlock
          title="By Risk Category"
          rows={categoryRows}
          total={groupTotal}
          subtitle={`${categoryRows.length} categories`}
        />
        {/* By Driver */}
        <div
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              }}
            >
              By Driver (top 5)
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Sum of |contribution pts| across all risks — what&rsquo;s
              actually moving the register.
            </div>
          </div>
          {topDrivers.length === 0 ? (
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              No driver activity in current scenario — all drivers at baseline.
            </div>
          ) : (
            topDrivers.map((d) => {
              const pct = (d.total / maxDriverScore) * 100
              return (
                <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      fontSize: 10,
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)' }}>
                      <strong style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                        {d.id}
                      </strong>{' '}
                      {d.name}
                    </span>
                    <span
                      style={{
                        color: 'var(--text-tertiary)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {d.total.toFixed(1)} pts
                    </span>
                  </div>
                  <div
                    style={{
                      height: 5,
                      background: 'var(--bg-secondary)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(2, pct)}%`,
                        background: 'var(--accent-primary)',
                      }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Roll-up math */}
      <RollUpMath risks={risks} groupTotal={groupTotal} byEntity={byEntity} />
    </div>
  )
}

// ── Concentration block (entity / category bars) ────────────────────────
function ConcentrationBlock({
  title,
  rows,
  total,
  subtitle,
}: {
  title: string
  rows: AggregateRow[]
  total: number
  subtitle?: string
}) {
  const max = Math.max(...rows.map((r) => r.totalAed), 1)
  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      {rows.map((r) => {
        const pct = total > 0 ? (r.totalAed / total) * 100 : 0
        const barPct = max > 0 ? (r.totalAed / max) * 100 : 0
        return (
          <div key={r.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                fontSize: 10,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-primary)' }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 1,
                    background: r.color,
                    flexShrink: 0,
                  }}
                />
                {r.label}
                {r.count === 0 && (
                  <span
                    style={{
                      fontSize: 8,
                      color: 'var(--text-tertiary)',
                      fontStyle: 'italic',
                      marginLeft: 4,
                    }}
                  >
                    no risks
                  </span>
                )}
              </span>
              <span
                style={{
                  color: 'var(--text-tertiary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatMn(r.totalAed)} · {pct.toFixed(0)}%
              </span>
            </div>
            <div
              style={{
                height: 5,
                background: 'var(--bg-secondary)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(barPct === 0 ? 0 : 2, barPct)}%`,
                  background: r.color,
                  opacity: r.count === 0 ? 0.25 : 1,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Roll-up math (explicit formula) ─────────────────────────────────────
function RollUpMath({
  risks,
  groupTotal,
  byEntity,
}: {
  risks: RiskState[]
  groupTotal: number
  byEntity: Record<EntityId, AggregateRow>
}) {
  return (
    <div
      style={{
        padding: 12,
        background: 'var(--bg-primary)',
        border: '1px dashed var(--border-color)',
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <Sigma size={11} />
        Group Roll-Up · How the Group AED is built
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-primary)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 4,
          padding: '8px 10px',
          lineHeight: 1.7,
          overflowX: 'auto',
        }}
      >
        Group AED ={' '}
        {ENTITIES.filter((e) => e.kind === 'subsidiary')
          .map((e) => {
            const row = byEntity[e.id as EntityId]
            return `${e.shortName}(${row?.totalAed.toFixed(0) ?? 0})`
          })
          .join(' + ')}{' '}
        + Group-level
        <br />
        <span style={{ color: 'var(--text-tertiary)' }}>
          ={' '}
          {ENTITIES.filter((e) => e.kind === 'subsidiary')
            .map((e) => byEntity[e.id as EntityId]?.totalAed.toFixed(0) ?? '0')
            .join(' + ')}{' '}
          + {byEntity['aldar-group'].totalAed.toFixed(0)}{' '}
          ={' '}
          <strong style={{ color: 'var(--accent-primary)' }}>
            {groupTotal.toFixed(0)} AED mn
          </strong>
        </span>
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}
      >
        Each entity total is the sum of <code>exposureAedMn</code> across its
        tagged risks (entity ownership from sidecar). Group-level = risks
        whose ownership is the holding (treasury, regulatory). Per-risk
        exposure derives from the simulation engine: financialBaseAedMn ×
        sensitivityCoefficient × residual factor. Click any risk on /risk-register
        to see its individual breakdown with provenance.
      </div>
    </div>
  )
}
