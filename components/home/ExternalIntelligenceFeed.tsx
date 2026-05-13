'use client'

/**
 * ExternalIntelligenceFeed — Block 3 #6 (extended)
 * --------------------------------------------------
 * Restored news / decision-intelligence widget for the CRO + Subsidiary
 * CEO + ARC Chair landing pages. Replaces the rich `/dashboard` ticker
 * that was deprecated in P7 — the executive view now carries an
 * external-signals strip with provenance.
 *
 * CLAUDE.md compliance: every news item is illustrative pre-pilot and
 * labelled "External signal · curated". Pilot wires real feeds (Reuters,
 * Bayut, ADREC indices, CBUAE rate moves, ADX market notices).
 */

import React from 'react'
import Link from 'next/link'
import {
  Radio,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Globe2,
  Newspaper,
  Building2,
  Banknote,
  type LucideIcon,
} from 'lucide-react'

interface IntelItem {
  id: string
  source: string
  category: 'market' | 'regulator' | 'macro' | 'sector'
  headline: string
  detail: string
  /** "+N% / -N% / event" — color-coded direction. */
  signal: 'up' | 'down' | 'neutral' | 'alert'
  /** Risk IDs in the engine register this signal touches. */
  touches: string[]
  /** Relative time string e.g. "12 min ago" / "2 h ago". */
  ago: string
}

const CATEGORY_META: Record<
  IntelItem['category'],
  { label: string; color: string; icon: LucideIcon }
> = {
  market: { label: 'Market', color: '#2D9EFF', icon: Building2 },
  regulator: { label: 'Regulator', color: '#A855F7', icon: Newspaper },
  macro: { label: 'Macro', color: '#F5C518', icon: Globe2 },
  sector: { label: 'Sector', color: '#22C55E', icon: Banknote },
}

const SIGNAL_META: Record<
  IntelItem['signal'],
  { color: string; icon: LucideIcon }
> = {
  up: { color: '#22C55E', icon: TrendingUp },
  down: { color: '#FF3B3B', icon: TrendingDown },
  neutral: { color: '#7F8CA3', icon: Radio },
  alert: { color: '#FF8C00', icon: AlertTriangle },
}

// Illustrative curated set — pilot replaces with live feed.
const INTEL: IntelItem[] = [
  {
    id: 'intel-1',
    source: 'ADREC · Abu Dhabi Real Estate Centre',
    category: 'market',
    headline: 'Abu Dhabi residential price index +1.8% MoM',
    detail:
      'Off-plan absorption strong across Saadiyat & Yas. Supportive for KRI-14 baseline.',
    signal: 'up',
    touches: ['R-003', 'R-008', 'KRI-14'],
    ago: '12 min ago',
  },
  {
    id: 'intel-2',
    source: 'CBUAE · Central Bank',
    category: 'macro',
    headline: 'EIBOR 3M holds at 4.42% — Fed pause priced in',
    detail:
      'Buyer affordability stress unchanged; treasury hedge book valuation neutral.',
    signal: 'neutral',
    touches: ['R-008', 'KRI-13'],
    ago: '38 min ago',
  },
  {
    id: 'intel-3',
    source: 'DLD · Dubai Land Department',
    category: 'regulator',
    headline: 'Mollak escrow audit window opens Q3 FY26',
    detail:
      'Cross-emirate JV exposure: review GA-CMP-01 evidence pack pre-audit.',
    signal: 'alert',
    touches: ['R-009'],
    ago: '1 h ago',
  },
  {
    id: 'intel-4',
    source: 'Bayut · sector index',
    category: 'sector',
    headline: 'Commercial vacancy down 0.6pts in Q1 26',
    detail:
      'Yas Mall + ADGM corridor tightening. Positive for KRI-10 / KRI-15.',
    signal: 'up',
    touches: ['R-004', 'KRI-10', 'KRI-15'],
    ago: '3 h ago',
  },
  {
    id: 'intel-5',
    source: 'Reuters · MENA construction',
    category: 'macro',
    headline: 'Steel + cement spot prices +4% WoW (Suez disruption)',
    detail:
      'Project cost-overrun risk on active GMP contracts up; consider hedge top-up.',
    signal: 'down',
    touches: ['R-001', 'R-007'],
    ago: '5 h ago',
  },
  {
    id: 'intel-6',
    source: 'ADX · listing rules',
    category: 'regulator',
    headline: 'Continuous-disclosure circular #2026/04 issued',
    detail:
      'Material-information window tightened to 24h. IR pre-clearance workflow already aligned.',
    signal: 'neutral',
    touches: ['R-009'],
    ago: '6 h ago',
  },
]

interface Props {
  /** Limit number of items shown. Default 6. */
  limit?: number
}

export function ExternalIntelligenceFeed({ limit = 6 }: Props) {
  const items = INTEL.slice(0, limit)
  return (
    <section
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        padding: 16,
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.005em',
            }}
          >
            <Radio size={14} style={{ color: 'var(--accent-primary)' }} />
            External signals · decision intelligence
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
            Curated market / regulator / macro / sector items touching active risks.
            Each item lists the engine risks + KRIs it moves.
          </div>
        </div>
        <span
          title="Pilot wires Reuters / Bayut / ADREC / CBUAE / ADX feeds"
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: '#F5C518',
            background: 'rgba(245,197,24,0.10)',
            border: '1px solid rgba(245,197,24,0.40)',
            padding: '2px 8px',
            borderRadius: 3,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          Illustrative · curated
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it) => {
          const cat = CATEGORY_META[it.category]
          const sig = SIGNAL_META[it.signal]
          const CatIcon = cat.icon
          const SigIcon = sig.icon
          return (
            <article
              key={it.id}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                padding: 12,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: `${cat.color}1f`,
                  color: cat.color,
                  border: `1px solid ${cat.color}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CatIcon size={14} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: cat.color,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {cat.label}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>·</span>
                  <span
                    style={{
                      fontSize: 9,
                      color: 'var(--text-tertiary)',
                      letterSpacing: 0.3,
                    }}
                  >
                    {it.source}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>·</span>
                  <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{it.ago}</span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: sig.color,
                    }}
                    title={`Signal direction: ${it.signal}`}
                  >
                    <SigIcon size={12} />
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.4,
                  }}
                >
                  {it.headline}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    marginTop: 4,
                    lineHeight: 1.55,
                  }}
                >
                  {it.detail}
                </div>
                {it.touches.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 4,
                      flexWrap: 'wrap',
                      marginTop: 6,
                    }}
                  >
                    {it.touches.map((t) => {
                      const isRisk = /^R-/.test(t)
                      const href = isRisk
                        ? `/risk-register?focus=${t}`
                        : '/kri'
                      return (
                        <Link
                          key={t}
                          href={href}
                          title={`Drill into ${t}`}
                          style={{
                            fontFamily:
                              'ui-monospace, SFMono-Regular, Menlo, monospace',
                            fontSize: 9,
                            fontWeight: 700,
                            color: 'var(--accent-primary)',
                            background: 'rgba(255,102,0,0.10)',
                            border: '1px solid rgba(255,102,0,0.40)',
                            padding: '1px 6px',
                            borderRadius: 3,
                            letterSpacing: 0.4,
                            textDecoration: 'none',
                          }}
                        >
                          {t}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
