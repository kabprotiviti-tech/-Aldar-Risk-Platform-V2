'use client'

/**
 * ExposureClimax — Batch B (Kill the toy, win the climax)
 * ------------------------------------------------------
 * The panel's verdict on the old version was blunt: a count-up animation that
 * animated *value, not meaning* — "earthwork, pathetic". Boards trust numbers
 * that hold still. So this is now a STATIC, presenter-stepped Exposure Bridge:
 *
 *   Baseline → Under stress → If we do nothing (12-mo cost of inaction)
 *
 * All three AED figures are set whole and permanently visible. The board
 * appetite ceiling is one dashed line drawn across all three. The presenter
 * advances acts with a click; the ONLY motion is a ≤250ms emphasis fade (the
 * active bar brightens, the others dim) — no counting, no auto-play, no glow.
 * The decision punchline renders once, permanently. The same static render is
 * what prints into the ARC Pack stress exhibit.
 *
 * Numbers derive from BASELINE_RISK_POSTURE so they reconcile everywhere.
 */

import React, { useState } from 'react'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { BASELINE_RISK_POSTURE } from '@/lib/data/baselineRiskPosture'

const NET = BASELINE_RISK_POSTURE.netUnhedgedExposure // 0.90bn
const CEILING = BASELINE_RISK_POSTURE.netUnhedgedAppetiteCeiling // 0.60bn

interface Act {
  key: string
  label: string
  sub: string
  value: number
  color: string
  caption: string
}

const ACTS: Act[] = [
  {
    key: 'baseline',
    label: 'Baseline',
    sub: 'Today',
    value: NET,
    color: '#B54708',
    caption: 'Net unhedged exposure today — already over the board appetite ceiling.',
  },
  {
    key: 'stressed',
    label: 'Under stress',
    sub: 'Severe shock',
    value: NET * 1.7,
    color: '#C2410C',
    caption: 'Suez disruption + rate shock + overseas-buyer default, at severe intensity.',
  },
  {
    key: 'inaction',
    label: 'If we do nothing',
    sub: '12-month',
    value: NET * 2.41,
    color: '#9F1B1F',
    caption: 'Unmitigated, the gap compounds across four quarters.',
  },
]

const AVOIDED = ACTS[2].value - ACTS[0].value // ~1.27bn
const COST_TO_ACT = 'AED 35M'

function aed(n: number): string {
  const v = Math.abs(n)
  if (v >= 1e9) return `AED ${(n / 1e9).toFixed(2)}Bn`
  return `AED ${Math.round(n / 1e6)}M`
}

const CHART_H = 200
const MAX = ACTS[2].value * 1.12

export function ExposureClimax() {
  const [active, setActive] = useState(2) // land on the climax; presenter steps back to tell it

  const current = ACTS[active]

  return (
    <section
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `4px solid ${current.color}`,
        borderRadius: 14,
        padding: 24,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .xb-bar, .xb-col { transition: none !important; }
        }
      `}</style>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--accent-primary)' }}>
            The number that matters
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 560, lineHeight: 1.5 }}>
            {current.caption}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0} style={stepBtn(active === 0)}>
            ‹ Prev
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums', minWidth: 34, textAlign: 'center' }}>
            {active + 1}/3
          </span>
          <button onClick={() => setActive((a) => Math.min(ACTS.length - 1, a + 1))} disabled={active === ACTS.length - 1} style={stepBtn(active === ACTS.length - 1)}>
            Next ›
          </button>
          <span
            style={{
              fontSize: 9, fontWeight: 700, color: '#B54708', background: 'rgba(181,71,8,0.10)',
              border: '1px solid rgba(181,71,8,0.35)', padding: '3px 8px', borderRadius: 4,
              letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}
          >
            Illustrative
          </span>
        </div>
      </div>

      {/* bridge chart — bars + appetite line share ONE baseline (chart bottom);
          x-labels sit in a separate row beneath so nothing shifts the scale. */}
      <div style={{ marginBottom: 8 }}>
        {/* chart box: value labels overflow above; bars bottom-align to baseline */}
        <div style={{ position: 'relative', height: CHART_H, paddingTop: 36, overflow: 'visible' }}>
          {/* appetite ceiling line — measured from the same baseline as bars */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: (CEILING / MAX) * CHART_H,
              borderTop: '1.5px dashed var(--text-tertiary)',
              display: 'flex',
              justifyContent: 'flex-end',
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', padding: '0 6px', transform: 'translateY(-50%)' }}>
              Board appetite {aed(CEILING)}
            </span>
          </div>

          {/* bars */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 36, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 8 }}>
            {ACTS.map((a, i) => {
              const h = (a.value / MAX) * CHART_H
              const isActive = i === active
              const delta = i > 0 ? a.value - ACTS[i - 1].value : null
              return (
                <div
                  key={a.key}
                  className="xb-col"
                  onClick={() => setActive(i)}
                  style={{ flex: 1, maxWidth: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: isActive ? 22 : 18, fontWeight: 700, color: a.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, transition: 'font-size 0.2s ease' }}>
                    {aed(a.value)}
                  </div>
                  {delta !== null && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', margin: '2px 0' }}>
                      +{aed(delta)}
                    </div>
                  )}
                  <div
                    className="xb-bar"
                    style={{
                      width: '70%',
                      maxWidth: 96,
                      height: Math.max(2, h),
                      marginTop: 6,
                      background: a.color,
                      opacity: isActive ? 1 : 0.55,
                      borderRadius: '6px 6px 0 0',
                      transition: 'opacity 0.25s ease',
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* x-labels row — aligned to the same columns */}
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: 8, marginTop: 8 }}>
          {ACTS.map((a, i) => {
            const isActive = i === active
            return (
              <div key={a.key} onClick={() => setActive(i)} style={{ flex: 1, maxWidth: 150, textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 600, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {a.label}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                  {a.sub}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* decision punchline — permanent */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 16px',
          borderRadius: 10,
          background: 'var(--bg-sunken, var(--bg-primary))',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid #067647',
          flexWrap: 'wrap',
        }}
      >
        <ShieldCheck size={20} style={{ color: '#067647', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Acting now costs {COST_TO_ACT} — and avoids {aed(AVOIDED)} of deterioration.
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            The recommended response plan below routes that decision for board sign-off.
          </div>
        </div>
        <a
          href="/respond/approvals"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
            fontSize: 12, fontWeight: 700, textDecoration: 'none', background: '#067647', color: '#fff', whiteSpace: 'nowrap',
          }}
        >
          Route the decision <ChevronRight size={14} />
        </a>
      </div>
    </section>
  )
}

function stepBtn(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 11px',
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: disabled ? 'var(--text-tertiary)' : 'var(--text-secondary)',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
  }
}
