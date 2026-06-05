'use client'

/**
 * UAE Risk Library + Peer Benchmark — Module 12 (L1 + L2)
 * --------------------------------------------------------
 * Two-tab page:
 *   (L1) Risk Library — 12 sector-specific risk scenarios that ABC's
 *        peer set discloses; Risk Champions can review and lift any
 *        into the Risk Register.
 *   (L2) Peer Benchmark — disclosure-depth grid comparing ABC with
 *        Emaar / DAMAC / Sobha / Arabtec across 8 ERM categories.
 */

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Search, BarChart3 } from 'lucide-react'
import {
  RISK_LIBRARY,
  CATEGORY_META,
  type RiskLibraryEntry,
  type RiskLibraryCategory,
} from '@/lib/data/uae-risk-library'
import {
  BENCHMARK_CATEGORIES,
  PEERS,
  BAND_META,
  type DisclosureBand,
} from '@/lib/data/peer-benchmark'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'

type Tab = 'library' | 'benchmark'

export default function RiskLibraryPage() {
  const [tab, setTab] = useState<Tab>('library')
  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <IllustrativeDataBanner pilotFeeds="ABC Compliance + ERM peer-disclosure benchmarking from 2024/2025 annual reports" />

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
            <BookOpen size={20} style={{ color: 'var(--accent-primary)' }} />
            UAE Risk Library
          </h1>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
              maxWidth: 820,
              lineHeight: 1.55,
            }}
          >
            A curated library of risk scenarios common to UAE listed
            real-estate. Use the library as a starter pack for new
            subsidiary registers.
          </p>
        </div>
        <StatusBadge
          tier="MVP"
          note={`${RISK_LIBRARY.length} library entries`}
        />
      </div>

      <LibraryView />
    </div>
  )
}

function TabBtn({
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
        background: 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        border: 'none',
        borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
        padding: '10px 14px',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  )
}

function LibraryView() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return RISK_LIBRARY.filter((r) => {
      if (cat !== 'all' && r.category !== cat) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.aldarRelevance.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      )
    })
  }, [query, cat])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', display: 'flex', alignItems: 'center' }}>
          <Search
            size={13}
            style={{ position: 'absolute', left: 10, color: 'var(--text-tertiary)', pointerEvents: 'none' }}
          />
          <input
            type="search"
            placeholder="Search library by id, name, narrative…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              padding: '8px 12px 8px 30px',
              fontSize: 13,
            }}
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
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
          <option value="all">All categories</option>
          {(Object.keys(CATEGORY_META) as RiskLibraryCategory[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_META[c].label}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
          Showing {filtered.length} of {RISK_LIBRARY.length}
        </span>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
        {filtered.map((r) => (
          <LibraryCard key={r.id} r={r} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontStyle: 'italic',
            fontSize: 12,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
          }}
        >
          No library entries match the current filter.
        </div>
      )}
    </div>
  )
}

function LibraryCard({ r }: { r: RiskLibraryEntry }) {
  const meta = CATEGORY_META[r.category]
  const lkColor =
    r.likelihood === 'high' ? '#FF3B3B' : r.likelihood === 'medium' ? '#B8001F' : '#22C55E'
  return (
    <article
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${meta.color}`,
        borderRadius: 6,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 10,
            color: 'var(--text-tertiary)',
            fontWeight: 700,
            letterSpacing: 0.4,
            paddingTop: 1,
          }}
        >
          {r.id}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {r.name}
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', marginTop: 2 }}>
            <span
              style={{
                background: `${meta.color}1f`,
                color: meta.color,
                border: `1px solid ${meta.color}55`,
                padding: '1px 6px',
                borderRadius: 3,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}
            >
              {meta.label}
            </span>
            <span
              style={{
                background: `${lkColor}1f`,
                color: lkColor,
                border: `1px solid ${lkColor}55`,
                padding: '1px 6px',
                borderRadius: 3,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}
            >
              {r.likelihood} likelihood
            </span>
          </div>
        </div>
      </header>

      <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
        {r.description}
      </p>

      <div
        style={{
          padding: 8,
          background: 'var(--bg-secondary)',
          borderLeft: `2px solid ${meta.color}`,
          borderRadius: 4,
          fontSize: 10,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>ABC relevance:</strong>{' '}
        {r.aldarRelevance}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 10, color: 'var(--text-tertiary)' }}>
        <span>
          <strong style={{ color: 'var(--text-secondary)' }}>Exposure (illustrative):</strong>{' '}
          AED {r.exposureRangeAedMn[0]}-{r.exposureRangeAedMn[1]} mn
        </span>
        {r.linkedKRIs.length > 0 && (
          <span>
            <strong style={{ color: 'var(--text-secondary)' }}>KRIs:</strong>{' '}
            {r.linkedKRIs.join(', ')}
          </span>
        )}
        {r.linkedRegulators.length > 0 && (
          <span>
            <strong style={{ color: 'var(--text-secondary)' }}>Regulators:</strong>{' '}
            <Link href="/regulator-map" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
              {r.linkedRegulators.join(', ')}
            </Link>
          </span>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          Common Controls
        </div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {r.commonControls.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      <div
        style={{
          paddingTop: 8,
          borderTop: '1px dashed var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
          Applies to: {r.applicableTo.join(', ')}
        </div>
        <Link
          href="/risk-register"
          style={{
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
            textDecoration: 'none',
          }}
        >
          Lift to Register →
        </Link>
      </div>
    </article>
  )
}

function BenchmarkView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          padding: 12,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        Disclosure-depth bands —{' '}
        {(['full', 'partial', 'none'] as DisclosureBand[]).map((b, i) => (
          <span key={b} style={{ marginRight: i === 2 ? 0 : 12 }}>
            <span style={{ color: BAND_META[b].color, marginRight: 4 }}>
              {BAND_META[b].symbol}
            </span>
            <strong>{BAND_META[b].label}:</strong>{' '}
            {b === 'full'
              ? 'explicit, quantified, named'
              : b === 'partial'
                ? 'narrative only, no quantification'
                : 'no public disclosure'}
          </span>
        ))}
      </div>

      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          overflow: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 760 }}>
          <thead>
            <tr style={{ background: 'var(--bg-primary)' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  position: 'sticky',
                  left: 0,
                  background: 'var(--bg-primary)',
                  borderRight: '1px solid var(--border-color)',
                  minWidth: 220,
                }}
              >
                ERM Category
              </th>
              {PEERS.map((p) => (
                <th
                  key={p.id}
                  style={{
                    padding: '10px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                    color: p.id === 'aldar' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    textAlign: 'center',
                    minWidth: 90,
                  }}
                  title={`${p.name} (${p.exchange})`}
                >
                  {p.name.split(' ')[0]}
                  <div
                    style={{
                      fontSize: 8,
                      color: 'var(--text-tertiary)',
                      fontWeight: 500,
                      letterSpacing: 0.3,
                      textTransform: 'none',
                      marginTop: 2,
                    }}
                  >
                    {p.exchange}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BENCHMARK_CATEGORIES.map((c) => (
              <tr key={c.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td
                  style={{
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    position: 'sticky',
                    left: 0,
                    background: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--border-color)',
                    verticalAlign: 'top',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{c.label}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 2, lineHeight: 1.5 }}>
                    {c.description}
                  </div>
                </td>
                {PEERS.map((p) => {
                  const band = c.coverage[p.id] || 'none'
                  const meta = BAND_META[band]
                  return (
                    <td
                      key={p.id}
                      style={{
                        textAlign: 'center',
                        padding: '10px 8px',
                        verticalAlign: 'middle',
                      }}
                      title={`${p.name}: ${meta.label}`}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: `${meta.color}1f`,
                          color: meta.color,
                          border: `1px solid ${meta.color}66`,
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 0.4,
                          textTransform: 'uppercase',
                        }}
                      >
                        <span>{meta.symbol}</span>
                        {meta.label}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          paddingTop: 4,
        }}
      >
        Bands are illustrative pre-pilot. Pilot will rebuild this matrix
        from the Compliance team's structured peer-disclosure benchmark
        using actual 2024/2025 annual report content. ABC's "Audit Trail
        / Governance Forensics" cell is the differentiator that this
        platform delivers and that no peer currently discloses.
      </div>
    </div>
  )
}
