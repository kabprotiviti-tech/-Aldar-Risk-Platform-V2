'use client'

/**
 * ERMAnnualPlan — Module 4 / M4.2
 * --------------------------------
 * 12-month grid of illustrative ERM cycle activities. Pure visualization
 * of an illustrative plan (Risk Appetite Refresh, Framework Update,
 * Training, ARC reviews, KRI cadence). Pilot will let the AVP edit each
 * activity with assignment + status.
 *
 * Honors CLAUDE.md: every activity is illustrative and surfaced as such
 * via the page-level disclaimer. No fabricated AED.
 */

import React from 'react'
import { Calendar } from 'lucide-react'

interface Activity {
  id: string
  title: string
  description: string
  /** Months 1..12 covered by this activity (Jan = 1). */
  months: number[]
  /** Visual category (drives the colour band). */
  category: 'governance' | 'review' | 'training' | 'monitoring' | 'reporting'
}

const ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    title: 'Risk Appetite Refresh',
    description: 'Annual review of group risk appetite & tolerance',
    months: [1, 2],
    category: 'governance',
  },
  {
    id: 'a2',
    title: 'ERM Framework Update',
    description: 'Refresh ERM framework, taxonomy, ISO 31000 alignment',
    months: [3, 4],
    category: 'governance',
  },
  {
    id: 'a3',
    title: 'KRI Monthly Reporting',
    description: 'Monthly KRI dashboard cycle to Group ERM Head',
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    category: 'monitoring',
  },
  {
    id: 'a4',
    title: 'ARC Quarterly Review',
    description: 'Audit & Risk Committee review of register, KRIs, breach log',
    months: [3, 6, 9, 12],
    category: 'review',
  },
  {
    id: 'a5',
    title: 'Risk Champion Training',
    description: 'Training cycle for first-line risk champions',
    months: [5, 6],
    category: 'training',
  },
  {
    id: 'a6',
    title: 'Subsidiary Register Refresh',
    description: 'Each subsidiary refreshes its register; cascades to Group',
    months: [7, 8],
    category: 'review',
  },
  {
    id: 'a7',
    title: 'External Audit Walkthrough',
    description: 'External auditor walks risk register + control library',
    months: [10, 11],
    category: 'review',
  },
  {
    id: 'a8',
    title: 'Board Annual Report',
    description: 'Year-end ERM report to the board, ARC pack',
    months: [12],
    category: 'reporting',
  },
]

const CATEGORY_META: Record<
  Activity['category'],
  { label: string; color: string; bg: string; border: string }
> = {
  governance: {
    label: 'Governance',
    color: '#A855F7',
    bg: 'rgba(168,85,247,0.20)',
    border: 'rgba(168,85,247,0.55)',
  },
  review: {
    label: 'Review',
    color: '#2D9EFF',
    bg: 'rgba(45,158,255,0.20)',
    border: 'rgba(45,158,255,0.55)',
  },
  training: {
    label: 'Training',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.20)',
    border: 'rgba(34,197,94,0.55)',
  },
  monitoring: {
    label: 'Monitoring',
    color: '#F5C518',
    bg: 'rgba(245,197,24,0.20)',
    border: 'rgba(245,197,24,0.55)',
  },
  reporting: {
    label: 'Reporting',
    color: '#FF6600',
    bg: 'rgba(255,102,0,0.20)',
    border: 'rgba(255,102,0,0.55)',
  },
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function ERMAnnualPlan() {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Calendar size={11} />
            ERM Annual Plan · 2026
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Illustrative cycle. Pilot lets the AVP edit each activity with
            assignment, status, and approval.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(Object.keys(CATEGORY_META) as Activity['category'][]).map((cat) => {
            const m = CATEGORY_META[cat]
            return (
              <span
                key={cat}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 9,
                  fontWeight: 700,
                  color: m.color,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 1,
                    background: m.color,
                  }}
                />
                {m.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            minWidth: 720,
            borderCollapse: 'collapse',
            fontSize: 10,
            tableLayout: 'fixed',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  padding: '6px 8px',
                  width: 200,
                  whiteSpace: 'nowrap',
                }}
              >
                Activity
              </th>
              {MONTH_LABELS.map((m) => (
                <th
                  key={m}
                  style={{
                    textAlign: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '6px 4px',
                  }}
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTIVITIES.map((a) => {
              const meta = CATEGORY_META[a.category]
              return (
                <tr key={a.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td
                    style={{
                      padding: '6px 8px',
                      verticalAlign: 'top',
                      borderLeft: `2px solid ${meta.color}`,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {a.description}
                    </div>
                  </td>
                  {MONTH_LABELS.map((_, idx) => {
                    const monthNum = idx + 1
                    const active = a.months.includes(monthNum)
                    return (
                      <td
                        key={idx}
                        style={{
                          padding: '6px 4px',
                          textAlign: 'center',
                          background: active ? meta.bg : 'transparent',
                          border: active
                            ? `1px solid ${meta.border}`
                            : '1px solid transparent',
                        }}
                      >
                        {active && (
                          <span
                            title={`${a.title} · ${MONTH_LABELS[idx]}`}
                            style={{
                              display: 'inline-block',
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: meta.color,
                            }}
                          />
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
