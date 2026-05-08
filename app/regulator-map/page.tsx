'use client'

/**
 * UAE Regulator Map — Module 11 (I1)
 * -----------------------------------
 * Single-screen view of every regulator whose mandate touches Aldar.
 * Roles, obligations, reporting cadence, and linked Group Appetite
 * Statements. Static reference page — pilot will replace with the live
 * compliance obligations register and per-regulator deadline tracker.
 */

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Landmark, Search } from 'lucide-react'
import {
  REGULATORS,
  TIER_META,
  type Regulator,
  type RegulatorTier,
} from '@/lib/data/uae-regulators'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'

const TIER_ORDER: RegulatorTier[] = ['federal', 'market', 'emirate', 'sector']

export default function RegulatorMapPage() {
  const [query, setQuery] = useState('')
  const [tier, setTier] = useState<string>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return REGULATORS.filter((r) => {
      if (tier !== 'all' && r.tier !== tier) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.acronym.toLowerCase().includes(q) ||
        r.mandate.toLowerCase().includes(q) ||
        r.obligations.some((o) => o.toLowerCase().includes(q))
      )
    })
  }, [query, tier])

  const grouped = useMemo(() => {
    const m = new Map<RegulatorTier, Regulator[]>()
    for (const t of TIER_ORDER) m.set(t, [])
    for (const r of filtered) m.get(r.tier)?.push(r)
    return m
  }, [filtered])

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <IllustrativeDataBanner pilotFeeds="Aldar Compliance team's authoritative obligations register and per-regulator deadline tracker" />

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
            <Landmark size={20} style={{ color: 'var(--accent-primary)' }} />
            UAE Regulator Map
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
            Every regulator whose mandate touches Aldar — federal,
            emirate-level, market, and sector. Each card lists the body's
            authority, Aldar's key obligations, the reporting cadence, and
            the Group Appetite Statements that anchor our tolerance for
            non-compliance.
          </p>
        </div>
        <StatusBadge tier="MVP" note={`${REGULATORS.length} regulators mapped`} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', display: 'flex', alignItems: 'center' }}>
          <Search
            size={13}
            style={{ position: 'absolute', left: 10, color: 'var(--text-tertiary)', pointerEvents: 'none' }}
          />
          <input
            type="search"
            placeholder="Search regulator name, acronym, or obligation…"
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
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            padding: '8px 12px',
            fontSize: 13,
            minWidth: 160,
          }}
        >
          <option value="all">All tiers</option>
          <option value="federal">Federal</option>
          <option value="market">Market</option>
          <option value="emirate">Emirate</option>
          <option value="sector">Sector</option>
        </select>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
          Showing {filtered.length} of {REGULATORS.length}
        </span>
      </div>

      {/* Tier sections */}
      {TIER_ORDER.map((t) => {
        const list = grouped.get(t) || []
        if (list.length === 0) return null
        const meta = TIER_META[t]
        return (
          <section
            key={t}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderLeft: `4px solid ${meta.color}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: meta.color,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              {meta.label} Regulators
            </div>
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              }}
            >
              {list.map((r) => (
                <RegulatorCard key={r.id} r={r} accent={meta.color} />
              ))}
            </div>
          </section>
        )
      })}

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          paddingTop: 8,
          borderTop: '1px dashed var(--border-color)',
        }}
      >
        Mandate summaries and obligations are illustrative pre-pilot. Pilot
        will wire the live compliance obligations register with per-deadline
        tracking, evidence attachment, and ARC-pack roll-up.
      </div>
    </div>
  )
}

function RegulatorCard({ r, accent }: { r: Regulator; accent: string }) {
  return (
    <article
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${accent}`,
        borderRadius: 6,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            background: `${accent}1f`,
            color: accent,
            border: `1px solid ${accent}55`,
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            flexShrink: 0,
          }}
        >
          {r.acronym}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {r.name}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: 0.4 }}>
            {r.website}
          </div>
        </div>
      </header>

      <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
        {r.mandate}
      </p>

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
          Aldar's Obligations
        </div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {r.obligations.map((o, i) => (
            <li key={i} style={{ marginBottom: 2 }}>
              {o}
            </li>
          ))}
        </ul>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 10,
          color: 'var(--text-tertiary)',
          paddingTop: 8,
          borderTop: '1px dashed var(--border-color)',
        }}
      >
        <span>
          <strong style={{ color: 'var(--text-secondary)' }}>Cadence:</strong> {r.cadence}
        </span>
        {r.linkedAppetiteIds.length > 0 && (
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Appetite:</strong>
            {r.linkedAppetiteIds.map((id) => (
              <Link
                key={id}
                href="/risk-appetite"
                style={{
                  background: 'rgba(255,102,0,0.14)',
                  color: 'var(--accent-primary)',
                  border: '1px solid rgba(255,102,0,0.4)',
                  padding: '1px 6px',
                  borderRadius: 3,
                  fontSize: 9,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  textDecoration: 'none',
                  fontWeight: 700,
                  letterSpacing: 0.4,
                }}
              >
                {id}
              </Link>
            ))}
          </span>
        )}
      </div>
    </article>
  )
}
