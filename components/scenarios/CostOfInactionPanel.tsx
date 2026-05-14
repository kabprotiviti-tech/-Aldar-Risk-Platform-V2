'use client'

/**
 * CostOfInactionPanel — Batch N
 * ------------------------------
 * Two-part executive insight block for /scenarios:
 *   1. "Cost of inaction" — projected exposure if no mitigating action
 *      is taken on the top scenarios, vs baseline. Single hero number
 *      with breakdown by scenario.
 *   2. Tiered response plan — immediate / 30-day / 90-day / board
 *      decision categories with illustrative recommended actions.
 *
 * Numbers are illustrative baseline-derived. Pilot will tie this to
 * the engine's actual scenario outputs.
 */

import React from 'react'
import { AlertTriangle, Zap, Calendar, Crown } from 'lucide-react'
import { BASELINE_RISK_POSTURE } from '@/lib/data/baselineRiskPosture'
import { formatCurrencyShort } from '@/lib/utils/formatters'

interface ResponseAction {
  label: string
  detail: string
  owner: string
}

const RESPONSE_PLAN: Record<'immediate' | '30day' | '90day' | 'board', ResponseAction[]> = {
  immediate: [
    {
      label: 'Activate 13-week cash hedge top-up',
      detail: 'CFO directive — close +AED 250M FX hedge gap on overseas-buyer book.',
      owner: 'Group CFO',
    },
    {
      label: 'Freeze new GMP commitments',
      detail: 'Pause new contractor GMP awards until Suez-disruption pricing settles.',
      owner: 'CRO + CDO',
    },
  ],
  '30day': [
    {
      label: 'Dual-source MEP + facade panel',
      detail: 'Onboard regional alternate; split 60/25/15 volume.',
      owner: 'Procurement Head',
    },
    {
      label: 'KRI threshold re-baseline',
      detail: 'Refresh amber/red boundaries on KRI-10/13/15 with post-Q1 26 data.',
      owner: 'ERM Head',
    },
  ],
  '90day': [
    {
      label: 'Stage-gate critical-path freeze',
      detail: 'Dual sign-off (Project Director + Group ERM) for any CP alteration.',
      owner: 'CDO',
    },
    {
      label: 'Contractor panel pruning',
      detail: 'Drop bottom-decile by past performance; quarterly re-assessment.',
      owner: 'Procurement Head',
    },
  ],
  board: [
    {
      label: 'Approve appetite increase on concentration tolerance',
      detail: 'GA-CMP-01 — proposed +12% concentration tolerance to support FY26 launch tranche.',
      owner: 'ARC Chair',
    },
    {
      label: 'Note cyber + IT-resilience capex uplift',
      detail: 'AED 35M one-time for SOC modernisation + DR site upgrade.',
      owner: 'Board',
    },
  ],
}

export function CostOfInactionPanel() {
  // Illustrative cost of inaction: baseline net unhedged exposure projected
  // 12 months forward without mitigation. Tagged illustrative.
  const baselineExp = BASELINE_RISK_POSTURE.netUnhedgedExposure
  const projectedDeterioration = baselineExp * 0.42 // illustrative 42% deterioration multiplier
  const costOfInaction = projectedDeterioration

  return (
    <section
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid var(--risk-high, #FF8C00)',
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--risk-high, #FF8C00)', textTransform: 'uppercase', letterSpacing: 0.8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={12} /> Cost of inaction
          </div>
          <div style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrencyShort(costOfInaction, 'AED')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 600, lineHeight: 1.45 }}>
            Projected 12-month exposure deterioration if no mitigating action is taken on top scenarios. Baseline net-unhedged exposure {formatCurrencyShort(baselineExp, 'AED')} × 42% illustrative shock multiplier.
          </div>
        </div>
        <span
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
            whiteSpace: 'nowrap',
          }}
        >
          Illustrative · pre-pilot
        </span>
      </div>

      {/* Response plan — 4 tiered columns */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.005em', marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Recommended response plan
          <span style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 700 }}>
            · 4 tiers
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
          <Tier title="Immediate" icon={<Zap size={11} />} color="var(--risk-critical, #FF3B3B)" actions={RESPONSE_PLAN.immediate} />
          <Tier title="Within 30 days" icon={<Calendar size={11} />} color="var(--risk-high, #FF8C00)" actions={RESPONSE_PLAN['30day']} />
          <Tier title="Within 90 days" icon={<Calendar size={11} />} color="var(--state-warning, #F5C518)" actions={RESPONSE_PLAN['90day']} />
          <Tier title="Board decision" icon={<Crown size={11} />} color="var(--accent-primary)" actions={RESPONSE_PLAN.board} />
        </div>
      </div>
    </section>
  )
}

function Tier({ title, icon, color, actions }: { title: string; icon: React.ReactNode; color: string; actions: ResponseAction[] }) {
  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${color}`,
        borderRadius: 6,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {icon} {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {actions.map((a) => (
          <div key={a.label} style={{ fontSize: 11, lineHeight: 1.4 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{a.detail}</div>
            <div style={{ fontSize: 9, color: color, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 2 }}>
              Owner · {a.owner}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
