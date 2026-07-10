'use client'

/**
 * Decision Intelligence — response options for a run/saved scenario.
 * ------------------------------------------------------------------
 * Given the drivers the user moved (and their AED contributions), this surfaces
 * ONLY the curated actions that address those drivers, ranked by impact ÷
 * effort. Each card shows: how much it mitigates (single mid-point %),
 * feasibility + time-to-effect, illustrative cost band, a plain rationale, and
 * the honest cross-business trade-off.
 *
 * Nothing here is model-generated at runtime — see lib/data/mitigationLibrary.
 * Recommendations are decision-support hypotheses for leadership to approve.
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, ChevronDown, TrendingDown, AlertTriangle, Clock, Wallet, Gauge } from 'lucide-react'
import { formatCurrencyShort } from '@/lib/utils/formatters'
import {
  rankMitigations,
  COST_LABEL,
  type Feasibility,
  type RankedMitigation,
} from '@/lib/data/mitigationLibrary'

const aedM = (m: number) => formatCurrencyShort(m * 1e6, 'AED')

const FEASIBILITY_COLOR: Record<Feasibility, string> = {
  High: 'var(--risk-low)',
  Medium: 'var(--risk-medium)',
  Low: 'var(--risk-high)',
}

export function DecisionIntelligencePanel({
  driverContribM,
  totalStressM,
}: {
  /** driver key → AED-million contribution in this run */
  driverContribM: Record<string, number>
  /** total AED-million added by the scenario (for the combined-reduction note) */
  totalStressM: number
}) {
  const ranked = rankMitigations(driverContribM)
  if (ranked.length === 0) return null

  // Combined potential is capped at the stress added — actions overlap, so we
  // do not claim the naive sum. Shown as an illustrative envelope only.
  const rawSum = ranked.reduce((s, r) => s + r.impactAedM, 0)
  const combinedM = Math.min(rawSum, totalStressM)

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--bg-card)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '16px 18px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <Lightbulb size={15} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Decision intelligence</span>
            <PendingPill />
          </div>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-secondary)', maxWidth: 720 }}>
            Response options mapped to the drivers in this scenario, ranked by return on effort. Each shows how much of the stress it could remove, how feasible it is, what it costs, and where else it lands in the business.
          </p>
        </div>
        <div style={{ textAlign: 'right', minWidth: 150 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>Combined potential</div>
          <div style={{ fontSize: 'clamp(20px,2.2vw,26px)', fontWeight: 700, color: 'var(--risk-low)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            up to {aedM(combinedM)}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 4 }}>if the top actions are taken together</div>
        </div>
      </div>

      {/* Ranked actions */}
      <div>
        {ranked.map((r, i) => (
          <ActionRow key={r.action.id} r={r} rank={i + 1} />
        ))}
      </div>

      {/* Footer trail */}
      <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontStyle: 'italic', lineHeight: 1.5, padding: '10px 18px', borderTop: '1px solid var(--border-color)' }}>
        Mitigation %, feasibility, cost and cross-business impact are illustrative and curated, pending calibration against Aldar&rsquo;s books in pilot. Ranking is impact ÷ effort, where effort blends feasibility, cost and time-to-effect. These are decision-support hypotheses for leadership approval, not automated advice.
      </div>
    </div>
  )
}

function ActionRow({ r, rank }: { r: RankedMitigation; rank: number }) {
  const [open, setOpen] = useState(rank === 1)
  const { action } = r

  return (
    <div style={{ borderTop: rank === 1 ? 'none' : '1px solid var(--border-color)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 14, alignItems: 'center', padding: '13px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-glow)', color: 'var(--accent-primary)', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontVariantNumeric: 'tabular-nums' }}>{rank}</span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>{action.title}</span>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{action.owner}</span>
        </span>
        <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 800, color: 'var(--risk-low)', fontVariantNumeric: 'tabular-nums' }}>
            <TrendingDown size={13} /> −{action.reductionPct}%
          </span>
          <span style={{ display: 'block', fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1 }}>≈ {aedM(r.impactAedM)} off</span>
        </span>
        <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 18px 16px 54px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{action.rationale}</p>

              {/* Chips: feasibility · time · cost · score */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Chip icon={<Gauge size={12} />} label="Feasibility" value={action.feasibility} color={FEASIBILITY_COLOR[action.feasibility]} />
                {action.timeToEffect && <Chip icon={<Clock size={12} />} label="Time to effect" value={action.timeToEffect} />}
                <Chip icon={<Wallet size={12} />} label="Cost" value={COST_LABEL[action.costBand]} illustrative />
                <Chip icon={<Gauge size={12} />} label="Return on effort" value={r.score >= 10 ? 'High' : r.score >= 4 ? 'Moderate' : 'Lower'} />
              </div>

              {/* Cross-business trade-off */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 12px' }}>
                <AlertTriangle size={14} style={{ color: 'var(--risk-medium)', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>Cross-business impact</div>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{action.tradeoff}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Chip({ icon, label, value, color, illustrative }: { icon: React.ReactNode; label: string; value: string; color?: string; illustrative?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--border-color)', borderRadius: 8, padding: '4px 10px', background: 'var(--bg-primary)' }}>
      <span style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</span>
      {illustrative && <span style={{ fontSize: 8.5, fontWeight: 700, color: '#B8860B' }} title="Illustrative — pending calibration">◦</span>}
    </span>
  )
}

function PendingPill() {
  return <span style={{ fontSize: 9, fontWeight: 700, color: '#B8860B', background: 'rgba(245,197,24,0.14)', border: '1px solid rgba(245,197,24,0.45)', padding: '1px 7px', borderRadius: 999, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Pending approval</span>
}
