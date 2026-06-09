'use client'

/**
 * ExposureClimax — Batch 6 (Climax mechanics)
 * -------------------------------------------
 * The emotional peak of the demo. ONE number, animated through three
 * acts so a board can *feel* the stakes rather than read a table:
 *
 *   1. Baseline      — where ABC Holdings stands today.
 *   2. Under stress  — the same book at severe combined-scenario intensity.
 *   3. Cost of inaction — what it compounds to over 12 months if nobody acts.
 *
 * The figure counts up between acts and the colour walks green → amber →
 * red. It closes on the decision line: acting now is cheap; doing nothing
 * is not. All three numbers derive from BASELINE_RISK_POSTURE so they
 * reconcile with every other screen.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { animate } from 'framer-motion'
import { Play, RotateCcw, ChevronRight, ShieldCheck } from 'lucide-react'
import { BASELINE_RISK_POSTURE } from '@/lib/data/baselineRiskPosture'
import { formatExposureBn } from '@/lib/utils/formatters'

const NET_UNHEDGED = BASELINE_RISK_POSTURE.netUnhedgedExposure // 0.90bn AED

interface Stage {
  key: string
  label: string
  value: number
  color: string
  caption: string
}

// Multipliers are illustrative and applied to the canonical net-unhedged
// exposure so the climax stays reconciled with the rest of the platform.
const STAGES: Stage[] = [
  {
    key: 'baseline',
    label: 'Baseline net-unhedged exposure',
    value: NET_UNHEDGED,
    color: '#067647',
    caption: 'Where ABC Holdings stands today — hedged book, business as usual.',
  },
  {
    key: 'stressed',
    label: 'Under severe combined stress',
    value: NET_UNHEDGED * 1.7,
    color: '#B54708',
    caption: 'Suez disruption + rate shock + overseas-buyer default, modelled at severe intensity.',
  },
  {
    key: 'inaction',
    label: '12-month cost of inaction',
    value: NET_UNHEDGED * 2.41,
    color: '#B42318',
    caption: 'If no mitigating action is taken, the gap compounds across four quarters.',
  },
]

const AVOIDED = STAGES[2].value - STAGES[0].value // ~1.27bn
const COST_TO_ACT_LABEL = 'AED 35M' // board capex uplift (illustrative)

export function ExposureClimax() {
  const [stage, setStage] = useState(0)
  const [display, setDisplay] = useState(STAGES[0].value)
  const prevValue = useRef(STAGES[0].value)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Animate the headline figure from the previous act's value to the new one.
  useEffect(() => {
    const controls = animate(prevValue.current, STAGES[stage].value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
      onComplete: () => {
        prevValue.current = STAGES[stage].value
      },
    })
    return () => controls.stop()
  }, [stage])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const play = useCallback(() => {
    clearTimers()
    prevValue.current = STAGES[0].value
    setDisplay(STAGES[0].value)
    setStage(0)
    timers.current.push(setTimeout(() => setStage(1), 1500))
    timers.current.push(setTimeout(() => setStage(2), 3300))
  }, [])

  // Auto-play once on mount so the page lands on motion, not a static table.
  useEffect(() => {
    const t = setTimeout(play, 350)
    return () => {
      clearTimeout(t)
      clearTimers()
    }
  }, [play])

  const current = STAGES[stage]

  return (
    <section
      style={{
        position: 'relative',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `4px solid ${current.color}`,
        borderRadius: 14,
        padding: 24,
        overflow: 'hidden',
        transition: 'border-color 0.6s ease',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* faint colour wash that deepens as the stakes rise */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120% 140% at 0% 0%, ${current.color}14 0%, transparent 55%)`,
          transition: 'background 0.6s ease',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
            }}
          >
            The number that matters
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={play} style={btnStyle(true)}>
              <Play size={13} /> Replay
            </button>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#B54708',
                background: 'rgba(181,71,8,0.10)',
                border: '1px solid rgba(181,71,8,0.35)',
                padding: '3px 8px',
                borderRadius: 4,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              Illustrative · pre-pilot
            </span>
          </div>
        </div>

        {/* the figure */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              marginBottom: 4,
              transition: 'color 0.4s ease',
            }}
          >
            {current.label}
          </div>
          <div
            style={{
              fontSize: 'clamp(40px, 7vw, 72px)',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: current.color,
              fontVariantNumeric: 'tabular-nums',
              transition: 'color 0.5s ease',
            }}
          >
            {formatExposureBn(display, 'AED')}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginTop: 8,
              maxWidth: 620,
              lineHeight: 1.5,
              minHeight: 38,
            }}
          >
            {current.caption}
          </div>
        </div>

        {/* three-act stepper */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {STAGES.map((s, i) => {
            const active = i === stage
            const past = i < stage
            return (
              <button
                key={s.key}
                onClick={() => {
                  clearTimers()
                  setStage(i)
                }}
                style={{
                  textAlign: 'left',
                  background: active ? `${s.color}12` : 'var(--bg-primary)',
                  border: `1px solid ${active ? s.color + '66' : 'var(--border-color)'}`,
                  borderTop: `3px solid ${active || past ? s.color : 'var(--border-color)'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: active || past ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    color: active ? s.color : 'var(--text-tertiary)',
                    marginBottom: 3,
                  }}
                >
                  Act {i + 1}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: active ? s.color : 'var(--text-secondary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatExposureBn(s.value, 'AED')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {s.key === 'baseline' ? 'Today' : s.key === 'stressed' ? 'Severe shock' : 'Do nothing, 12 mo'}
                </div>
              </button>
            )
          })}
        </div>

        {/* decision punchline — only once the climax is reached */}
        {stage === 2 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 10,
              background: 'rgba(6,118,71,0.07)',
              border: '1px solid rgba(6,118,71,0.28)',
              flexWrap: 'wrap',
            }}
          >
            <ShieldCheck size={20} style={{ color: '#067647', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                Acting now costs {COST_TO_ACT_LABEL} — and avoids {formatExposureBn(AVOIDED, 'AED')} of deterioration.
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                The recommended response plan below routes that decision for board sign-off.
              </div>
            </div>
            <a
              href="/respond/approvals"
              style={{
                ...btnStyle(true),
                background: '#067647',
                borderColor: '#067647',
                textDecoration: 'none',
              }}
            >
              Route the decision <ChevronRight size={14} />
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

function btnStyle(filled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 13px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    border: `1px solid ${filled ? 'var(--accent-primary)' : 'var(--border-color)'}`,
    background: filled ? 'var(--accent-primary)' : 'var(--bg-primary)',
    color: filled ? '#fff' : 'var(--text-secondary)',
  }
}
