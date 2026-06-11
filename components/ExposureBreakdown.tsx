'use client'

/**
 * ExposureBreakdown — shows how the AED 2.35Bn GROSS exposure is composed by
 * portfolio segment, then how it reduces to the AED 900M net-unhedged figure
 * shown against appetite. Collapsible so it doesn't crowd the dashboard.
 */

import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  EXPOSURE_SEGMENTS,
  EXPOSURE_GROSS_AED_M,
  EXPOSURE_HEDGED_AED_M,
  EXPOSURE_NET_AED_M,
  EXPOSURE_APPETITE_AED_M,
  aedM,
} from '@/lib/data/exposureBreakdown'

export function ExposureBreakdown({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const max = Math.max(...EXPOSURE_SEGMENTS.map((s) => s.grossAedM))

  return (
    <section
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '11px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {open ? <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />}
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
          How the {aedM(EXPOSURE_GROSS_AED_M)} gross exposure breaks down
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>
          {open ? 'hide' : 'show'} split
        </span>
      </button>

      {open && (
        <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Segment bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {EXPOSURE_SEGMENTS.map((s) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: '0 0 200px', fontSize: 11, color: 'var(--text-secondary)' }}>{s.label}</span>
                <div style={{ flex: 1, height: 14, background: 'var(--bg-primary)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: `${(s.grossAedM / max) * 100}%`, height: '100%', background: 'var(--accent-primary)', opacity: 0.8 }} />
                </div>
                <span style={{ flex: '0 0 90px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {aedM(s.grossAedM)}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 6, borderTop: '1px solid var(--border-color)', marginTop: 2 }}>
              <span style={{ flex: '0 0 200px', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>Gross financial exposure</span>
              <div style={{ flex: 1 }} />
              <span style={{ flex: '0 0 90px', textAlign: 'right', fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {aedM(EXPOSURE_GROSS_AED_M)}
              </span>
            </div>
          </div>

          {/* Gross -> net waterfall line */}
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 12px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{aedM(EXPOSURE_GROSS_AED_M)}</strong> gross
            {'  −  '}
            <strong style={{ color: 'var(--text-primary)' }}>{aedM(EXPOSURE_HEDGED_AED_M)}</strong> hedged
            {'  =  '}
            <strong style={{ color: '#B42318' }}>{aedM(EXPOSURE_NET_AED_M)}</strong> net unhedged
            {'  (vs '}
            <strong style={{ color: 'var(--text-primary)' }}>{aedM(EXPOSURE_APPETITE_AED_M)}</strong> board appetite{')'}
          </div>

          <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
            Note: the per-risk figures on the Portfolio Summary are <strong>residual exposure (after controls)</strong> — a finer,
            much smaller measure — not this gross figure. Both are correct; they answer different questions. Illustrative POC data.
          </p>
        </div>
      )}
    </section>
  )
}
