'use client'

/**
 * Top10RisksTable — Module 4 / M4.2
 * ----------------------------------
 * Group-wide top-10 ranked risks. Sortable by residual score (default),
 * inherent score, or AED exposure. Each row shows the owning entity
 * pulled from the entity-mapping sidecar.
 *
 * Honors CLAUDE.md: every cell derives from engine state + entity map.
 * No fabricated AED. Trend arrow comes from delta vs baseline (engine
 * computes this). Rank tie-broken alphabetically by id.
 */

import React, { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useSimulation } from '@/lib/context/SimulationContext'
import { entityForRisk } from '@/lib/data/risk-entity-mapping'
import { getEntity } from '@/lib/entities/hierarchy'
import type { RiskState, Rating } from '@/lib/engine/types'

type SortKey = 'residual' | 'inherent' | 'exposure'

function ratingColor(r: Rating): string {
  switch (r) {
    case 'Critical': return 'var(--risk-critical)'
    case 'High': return 'var(--risk-high)'
    case 'Medium': return 'var(--risk-medium)'
    case 'Low':
    default: return 'var(--risk-low)'
  }
}

export function Top10RisksTable() {
  const { risks } = useSimulation()
  const [sortKey, setSortKey] = useState<SortKey>('residual')

  const sorted = useMemo(() => {
    const copy = [...risks]
    copy.sort((a, b) => {
      const av =
        sortKey === 'residual'
          ? a.newResidual
          : sortKey === 'inherent'
            ? a.newInherent
            : a.exposureAedMn
      const bv =
        sortKey === 'residual'
          ? b.newResidual
          : sortKey === 'inherent'
            ? b.newInherent
            : b.exposureAedMn
      if (bv !== av) return bv - av
      return a.id.localeCompare(b.id)
    })
    return copy.slice(0, 10)
  }, [risks, sortKey])

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
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
            }}
          >
            Top 10 Risks · Group
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Ranked by {sortKey === 'residual' ? 'residual score' : sortKey === 'inherent' ? 'inherent score' : 'AED exposure'}
          </div>
        </div>
        <div
          style={{
            display: 'inline-flex',
            gap: 4,
            padding: 3,
            background: 'var(--bg-primary)',
            borderRadius: 6,
            border: '1px solid var(--border-color)',
          }}
        >
          <SortButton active={sortKey === 'residual'} onClick={() => setSortKey('residual')}>
            Residual
          </SortButton>
          <SortButton active={sortKey === 'inherent'} onClick={() => setSortKey('inherent')}>
            Inherent
          </SortButton>
          <SortButton active={sortKey === 'exposure'} onClick={() => setSortKey('exposure')}>
            Exposure
          </SortButton>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'var(--bg-primary)' }}>
            <Th>#</Th>
            <Th>ID</Th>
            <Th>Risk</Th>
            <Th>Entity</Th>
            <Th>Owner</Th>
            <Th right>Inherent</Th>
            <Th right>Residual</Th>
            <Th>Rating</Th>
            <Th right>Exposure</Th>
            <Th>Δ</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, idx) => {
            const entityId = entityForRisk(r.id)
            const entity = getEntity(entityId)
            const trend = r.deltaExposureAedMn
            return (
              <tr key={r.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <Td muted>{idx + 1}</Td>
                <Td mono>{r.id}</Td>
                <Td>{r.name}</Td>
                <Td>
                  {entity && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 10,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: entity.color,
                          flexShrink: 0,
                        }}
                      />
                      {entity.shortName}
                    </span>
                  )}
                </Td>
                <Td muted>{r.owner}</Td>
                <Td right mono>{r.newInherent.toFixed(1)}</Td>
                <Td right mono>{r.newResidual.toFixed(1)}</Td>
                <Td>
                  <span
                    style={{
                      display: 'inline-block',
                      background: `${ratingColor(r.ratingTo)}26`,
                      color: ratingColor(r.ratingTo),
                      border: `1px solid ${ratingColor(r.ratingTo)}66`,
                      padding: '2px 8px',
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
                <Td right mono>{r.exposureAedMn.toFixed(0)} mn</Td>
                <Td>
                  {Math.abs(trend) < 0.1 ? (
                    <Minus size={11} style={{ color: 'var(--text-tertiary)' }} />
                  ) : trend > 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--risk-high)' }}>
                      <TrendingUp size={11} />
                      <span style={{ fontSize: 9 }}>+{trend.toFixed(0)}</span>
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--risk-low)' }}>
                      <TrendingDown size={11} />
                      <span style={{ fontSize: 9 }}>{trend.toFixed(0)}</span>
                    </span>
                  )}
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div
        style={{
          padding: '6px 14px',
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        Δ shows change in AED exposure vs baseline scenario. Entity ownership
        is illustrative for MVP; pilot lifts from Aldar register.
      </div>
    </div>
  )
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'var(--accent-primary)' : 'transparent',
        color: active ? 'var(--on-accent)' : 'var(--text-secondary)',
        border: 'none',
        padding: '4px 10px',
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </button>
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
        padding: '8px 10px',
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
        padding: '8px 10px',
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
