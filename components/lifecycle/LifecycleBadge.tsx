'use client'

/**
 * LifecycleBadge + LifecycleTracker — Phase 0
 * Visual surfaces for a risk's governance state. The badge is a compact
 * pill (used in register rows); the tracker is the draft→review→approve→
 * published chain with the current step highlighted (used in the drawer).
 */

import React from 'react'
import { Check } from 'lucide-react'
import {
  LIFECYCLE_META,
  LIFECYCLE_CHAIN,
  type RiskLifecycleState,
} from '@/lib/lifecycle/riskLifecycle'

export function LifecycleBadge({ state }: { state: RiskLifecycleState }) {
  const m = LIFECYCLE_META[state]
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 10.5, fontWeight: 700, letterSpacing: 0.2,
        color: m.color, background: m.bg,
        border: `1px solid ${m.color}33`,
        borderRadius: 999, padding: '2px 9px', whiteSpace: 'nowrap',
      }}
      title={`Governance state: ${m.label}`}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color }} />
      {m.label}
    </span>
  )
}

export function LifecycleTracker({ state }: { state: RiskLifecycleState }) {
  // rejected is off the happy path — show the chain but flag the sent-back state
  const rejected = state === 'rejected'
  const activeIdx = rejected ? 1 : LIFECYCLE_CHAIN.indexOf(state)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
      {LIFECYCLE_CHAIN.map((s, i) => {
        const m = LIFECYCLE_META[s]
        const done = i < activeIdx
        const active = i === activeIdx && !rejected
        const reviewRejected = rejected && i === 1
        const dotColor = reviewRejected ? LIFECYCLE_META.rejected.color : done ? '#067647' : active ? m.color : '#C8C8C2'
        return (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 64 }}>
              <div
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? '#067647' : (active || reviewRejected) ? dotColor : 'transparent',
                  border: `2px solid ${dotColor}`,
                  color: '#fff', flexShrink: 0,
                }}
              >
                {done ? <Check size={12} /> : <span style={{ fontSize: 10, fontWeight: 800, color: (active || reviewRejected) ? '#fff' : dotColor }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: dotColor, textAlign: 'center' }}>
                {reviewRejected ? 'Sent back' : m.short}
              </span>
            </div>
            {i < LIFECYCLE_CHAIN.length - 1 && (
              <div style={{ flex: 1, minWidth: 16, height: 2, background: i < activeIdx ? '#067647' : '#E4E4DF', marginTop: -14 }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
