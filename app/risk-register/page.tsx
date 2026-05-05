'use client'

/**
 * Risk Register — Module 2 (deep)
 * --------------------------------
 * Read-only list view (C1). Subsequent micro-patches add:
 *   C2 detail drawer · C3 add/edit form · C4 mitigation actions ·
 *   C5 status workflow · C6 heatmap · C7 AI register critic
 *
 * Honors CLAUDE.md: every column either reflects sourced engine output
 * or is clearly labeled (e.g. "Status workflow ships in C5").
 */

import React, { useMemo, useState } from 'react'
import { SimulationProvider, useSimulation } from '@/lib/context/SimulationContext'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import type { RiskState, Rating } from '@/lib/engine/types'

// ── Rating colour helper ────────────────────────────────────────────────
function ratingColor(r: Rating): string {
  switch (r) {
    case 'Critical':
      return 'var(--risk-critical)'
    case 'High':
      return 'var(--risk-high)'
    case 'Medium':
      return 'var(--risk-medium)'
    case 'Low':
    default:
      return 'var(--risk-low)'
  }
}

function RatingPill({ rating }: { rating: Rating }) {
  const c = ratingColor(rating)
  return (
    <span
      style={{
        display: 'inline-block',
        background: `${c}26`,
        color: c,
        border: `1px solid ${c}66`,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {rating}
    </span>
  )
}

// ── Inner content (uses simulation context) ─────────────────────────────
function RiskRegisterContent() {
  const { risks } = useSimulation()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const categories = useMemo(() => {
    const set = new Set<string>()
    risks.forEach((r) => set.add(r.category))
    return ['all', ...Array.from(set).sort()]
  }, [risks])

  const filtered: RiskState[] = useMemo(() => {
    const q = query.trim().toLowerCase()
    return risks.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
      if (!q) return true
      return (
        r.id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      )
    })
  }, [risks, query, categoryFilter])

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header + status badge */}
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
            Risk Register
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
            Cause-Event-Impact register for Aldar Group. Inherent and residual scores are
            computed from the simulation engine&rsquo;s baseline drivers.
            Click any row for details · Add/Edit / Mitigation actions / Status workflow
            ship in subsequent patches (C2-C7).
          </p>
        </div>
        <StatusBadge tier="LIVE" note={`${risks.length} risks · sourced from engine`} />
      </div>

      {/* Search + filter row */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="search"
          placeholder="Search by ID, name, owner, category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: '1 1 280px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            padding: '8px 12px',
            fontSize: 13,
          }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            padding: '8px 12px',
            fontSize: 13,
            minWidth: 200,
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All categories' : c}
            </option>
          ))}
        </select>
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            marginLeft: 'auto',
          }}
        >
          Showing {filtered.length} of {risks.length}
        </span>
      </div>

      {/* Register table */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 12,
          }}
        >
          <thead>
            <tr style={{ background: 'var(--bg-primary)' }}>
              <Th>ID</Th>
              <Th>Risk Name</Th>
              <Th>Category</Th>
              <Th>Owner</Th>
              <Th right>Inherent</Th>
              <Th right>Residual</Th>
              <Th>Rating</Th>
              <Th right>Exposure (AED mn)</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 32,
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontStyle: 'italic',
                  }}
                >
                  No risks match the current filter.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr
                key={r.id}
                style={{
                  borderTop: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'background 80ms ease',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--bg-hover)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
                onClick={() => {
                  // C2 will replace this with a real drawer
                  console.log('Risk row clicked', r.id)
                }}
                title="Detail drawer ships in Patch C2"
              >
                <Td mono>{r.id}</Td>
                <Td>{r.name}</Td>
                <Td>{r.category}</Td>
                <Td muted>{r.owner}</Td>
                <Td right mono>
                  {r.newInherent.toFixed(1)}
                </Td>
                <Td right mono>
                  {r.newResidual.toFixed(1)}
                </Td>
                <Td>
                  <RatingPill rating={r.ratingTo} />
                </Td>
                <Td right mono>
                  {r.exposureAedMn.toFixed(0)}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footnote */}
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          padding: '4px 0',
        }}
      >
        Inherent / Residual scores derive from the simulation engine&rsquo;s
        baseline drivers (see CLAUDE.md). Exposure (AED mn) uses each
        risk&rsquo;s financial-anchor reference — click ⓘ on any anchor in the
        Executive Impact Panel for the source-vs-Aldar comparison.
      </div>
    </div>
  )
}

// ── Tiny presentational helpers ─────────────────────────────────────────
function Th({
  children,
  right,
}: {
  children: React.ReactNode
  right?: boolean
}) {
  return (
    <th
      style={{
        textAlign: right ? 'right' : 'left',
        fontSize: 10,
        fontWeight: 700,
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        padding: '10px 12px',
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
        padding: '10px 12px',
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

// ── Page wrapper that provides simulation context ───────────────────────
export default function RiskRegisterPage() {
  return (
    <SimulationProvider>
      <RiskRegisterContent />
    </SimulationProvider>
  )
}
