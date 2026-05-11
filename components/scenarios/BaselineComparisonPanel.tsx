'use client'

/**
 * BaselineComparisonPanel — Patch E5
 * -----------------------------------
 * Side-by-side FY24 vs FY25 group headlines so the user sees the
 * sourced baseline the scenario engine is anchored against (FY25) next
 * to the prior-year audited comparator (FY24). Each value is rendered
 * via NumericValue with full provenance click-through.
 *
 * Honors CLAUDE.md: every number is verified and cited to the published
 * Aldar press release / FY24 Integrated AR. YoY% is computed inline,
 * tagged as derived.
 */

import React from 'react'
import { BarChart3 } from 'lucide-react'
import { NumericValue } from '@/components/provenance/NumericValue'
import {
  ALDAR_FY25_GROUP_REVENUE,
  ALDAR_FY25_GROUP_EBITDA,
  ALDAR_FY25_NET_PROFIT_AFTER_TAX,
  ALDAR_FY25_GROUP_SALES,
} from '@/lib/data/aldar-financials'
import {
  ALDAR_FY24_GROUP_REVENUE,
  ALDAR_FY24_GROUP_EBITDA,
  ALDAR_FY24_NET_PROFIT_AFTER_TAX,
  ALDAR_FY24_GROUP_SALES,
} from '@/lib/data/aldar-fy24'

interface Row {
  label: string
  fy24: typeof ALDAR_FY24_GROUP_REVENUE
  fy25: typeof ALDAR_FY25_GROUP_REVENUE
}

const ROWS: Row[] = [
  { label: 'Group Revenue', fy24: ALDAR_FY24_GROUP_REVENUE, fy25: ALDAR_FY25_GROUP_REVENUE },
  { label: 'Group EBITDA', fy24: ALDAR_FY24_GROUP_EBITDA, fy25: ALDAR_FY25_GROUP_EBITDA },
  { label: 'Net Profit (after tax)', fy24: ALDAR_FY24_NET_PROFIT_AFTER_TAX, fy25: ALDAR_FY25_NET_PROFIT_AFTER_TAX },
  { label: 'Group Sales', fy24: ALDAR_FY24_GROUP_SALES, fy25: ALDAR_FY25_GROUP_SALES },
]

function yoyPct(fy25: number, fy24: number): number {
  if (!fy24) return 0
  return ((fy25 - fy24) / fy24) * 100
}

export function BaselineComparisonPanel() {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BarChart3 size={14} style={{ color: 'var(--accent-primary)' }} />
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Baseline Anchors · FY24 vs FY25
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--text-tertiary)',
            marginLeft: 'auto',
          }}
        >
          Scenario engine is anchored against FY25. FY24 shown as audited comparator.
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 12,
            minWidth: 540,
          }}
        >
          <thead>
            <tr style={{ background: 'var(--bg-primary)' }}>
              <Th>Metric</Th>
              <Th right>FY2024 (audited)</Th>
              <Th right>FY2025</Th>
              <Th right>YoY</Th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => {
              const yoy = yoyPct(r.fy25.value, r.fy24.value)
              const yoyColor =
                yoy > 5
                  ? 'var(--risk-low)'
                  : yoy < -5
                    ? 'var(--risk-high)'
                    : 'var(--text-secondary)'
              return (
                <tr key={r.label} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <Td>{r.label}</Td>
                  <Td right mono>
                    <NumericValue data={r.fy24} />
                  </Td>
                  <Td right mono>
                    <NumericValue data={r.fy25} />
                  </Td>
                  <Td right mono>
                    <span style={{ color: yoyColor, fontWeight: 700 }}>
                      {yoy >= 0 ? '+' : ''}
                      {yoy.toFixed(1)}%
                    </span>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          paddingTop: 4,
          borderTop: '1px dashed var(--border-color)',
        }}
      >
        Each cell traces to its source — click any value to see the
        provenance card. FY25 figures from Aldar Q4 FY2025 press release
        (Feb 2026); FY24 figures from Aldar FY2024 Integrated Annual
        Report. YoY % is derived.
      </div>
    </div>
  )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      style={{
        textAlign: right ? 'right' : 'left',
        fontSize: 9,
        fontWeight: 700,
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        padding: '6px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  right,
  mono,
}: {
  children: React.ReactNode
  right?: boolean
  mono?: boolean
}) {
  return (
    <td
      style={{
        textAlign: right ? 'right' : 'left',
        padding: '8px 10px',
        color: 'var(--text-primary)',
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </td>
  )
}
