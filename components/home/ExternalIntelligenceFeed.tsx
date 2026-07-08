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
  ArrowRight,
  ChevronDown,
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
  /** The priority action this signal drives — keeps the feed coherent with
   *  the Priority Actions panel (same wording both ways). */
  recommendedAction?: string
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
  alert: { color: '#0A5F4F', icon: AlertTriangle },
}

// Illustrative curated set — pilot replaces with live feed.
// Ordered so the first five signals map 1:1 to the five Priority Actions on
// the dashboard: each `recommendedAction` is the exact action it triggers, so
// the External Intelligence feed and the Priority Actions panel read as ONE
// signal -> decision thread (and stay coherent even when the live AI is down).
const INTEL: IntelItem[] = [
  {
    id: 'intel-steel',
    source: 'Reuters · MENA construction',
    category: 'macro',
    headline: 'Steel + cement spot prices +4% WoW (Suez disruption)',
    detail:
      'Project cost-overrun risk on active GMP contracts up; consider hedge top-up.',
    signal: 'down',
    touches: ['R-001', 'R-007'],
    ago: '12 min ago',
    recommendedAction: 'Activate Fixed-Price Provisions & Multi-Source Supply Chain — Construction',
  },
  {
    id: 'intel-cyber',
    source: 'NCA · National Cyber Security',
    category: 'regulator',
    headline: 'NCA advisory: OT/BMS targeting campaign across GCC',
    detail:
      'Nation-state actor targeting building-management & OT networks; smart-building assets exposed.',
    signal: 'alert',
    touches: ['R-006'],
    ago: '40 min ago',
    recommendedAction: 'Emergency OT/IT Security Audit — Smart Building Infrastructure',
  },
  {
    id: 'intel-eibor',
    source: 'CBUAE · Central Bank',
    category: 'macro',
    headline: 'EIBOR 3M holds at 4.42% — Fed pause priced in',
    detail:
      'Buyer affordability stress unchanged; HNI mortgage demand soft at current rates.',
    signal: 'neutral',
    touches: ['R-008', 'R-001', 'KRI-13'],
    ago: '1 h ago',
    recommendedAction: 'Activate HNI Buyer Retention & Mortgage Flexibility Program',
  },
  {
    id: 'intel-vacancy',
    source: 'Bayut · sector index',
    category: 'sector',
    headline: 'Commercial vacancy down 0.6pts in Q1 26',
    detail:
      'Market tightening, but ABC retail vacancy (8.5%) still lags the 5.2% benchmark.',
    signal: 'up',
    touches: ['R-004', 'KRI-10', 'KRI-15'],
    ago: '2 h ago',
    recommendedAction: 'Retail Vacancy Repositioning & Receivables Recovery',
  },
  {
    id: 'intel-revpar',
    source: 'DCT Abu Dhabi · tourism',
    category: 'sector',
    headline: 'Abu Dhabi hotel RevPAR −3.2% as Q1 event calendar thins',
    detail:
      'Softer corporate & MICE demand into the shoulder season; occupancy pressure on Yas hotels.',
    signal: 'down',
    touches: ['R-004'],
    ago: '3 h ago',
    recommendedAction: 'Launch Corporate Long-Stay & Bridging Event Campaign — Hospitality',
  },
  {
    id: 'intel-priceindex',
    source: 'ADREC · Abu Dhabi Real Estate Centre',
    category: 'market',
    headline: 'Abu Dhabi residential price index +1.8% MoM',
    detail:
      'Off-plan absorption strong across Saadiyat & Yas. Supportive for KRI-14 baseline.',
    signal: 'up',
    touches: ['R-003', 'R-008', 'KRI-14'],
    ago: '4 h ago',
  },
  {
    id: 'intel-mollak',
    source: 'DLD · Dubai Land Department',
    category: 'regulator',
    headline: 'Mollak escrow audit window opens Q3 FY26',
    detail:
      'Cross-emirate JV exposure: review GA-CMP-01 evidence pack pre-audit.',
    signal: 'alert',
    touches: ['R-009'],
    ago: '5 h ago',
  },
  {
    id: 'intel-circular',
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
  const [openId, setOpenId] = React.useState<string | null>(null)
  // Order the feed so it lines up row-for-row with the Priority Actions panel
  // (which is sorted by priority: HNI, Fixed-Price, OT/IT, Long-Stay, Retail).
  const ACTION_ORDER = ['HNI Buyer', 'Fixed-Price', 'OT/IT', 'Long-Stay', 'Retail Vacancy']
  const rankOf = (it: IntelItem) => {
    const i = ACTION_ORDER.findIndex((k) => (it.recommendedAction || '').includes(k))
    return i < 0 ? 99 : i
  }
  const items = [...INTEL].sort((a, b) => rankOf(a) - rankOf(b)).slice(0, limit)
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
              onClick={() => setOpenId(openId === it.id ? null : it.id)}
              style={{
                background: 'var(--bg-primary)',
                border: openId === it.id ? '1px solid var(--border-accent)' : '1px solid var(--border-color)',
                boxShadow: openId === it.id ? 'var(--shadow-sm)' : 'none',
                borderRadius: 6,
                padding: 12,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
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
                      gap: 6,
                    }}
                    title={`Signal direction: ${it.signal}`}
                  >
                    <SigIcon size={12} style={{ color: sig.color }} />
                    <ChevronDown size={13} style={{ color: 'var(--text-tertiary)', transform: openId === it.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
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
                {it.recommendedAction && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '5px 9px', borderRadius: 7, background: 'var(--accent-glow)', border: '1px solid var(--border-accent)' }}>
                    <ArrowRight size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: 10.5, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 9.5 }}>Drives · </span>
                      {it.recommendedAction}
                    </span>
                  </div>
                )}
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
                            background: 'rgba(11, 110, 91,0.10)',
                            border: '1px solid rgba(11, 110, 91,0.40)',
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
                {openId === it.id && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border-color)' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                      Intelligence read
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      {`This ${cat.label.toLowerCase()} signal ${it.signal === 'up' ? 'is supportive for' : it.signal === 'down' ? 'adds pressure to' : it.signal === 'alert' ? 'flags emerging risk to' : 'is broadly neutral for'} ${it.touches.length} tracked register item${it.touches.length === 1 ? '' : 's'} (${it.touches.join(', ')}). Source: ${it.source}.`}
                      {it.recommendedAction ? ` Recommended response — ${it.recommendedAction} — see the matching row in Priority Actions below.` : ''}
                    </div>
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
