'use client'

/**
 * ErmAnnualPlan — the ERM calendar (Jan→Dec) as a plan-vs-actual Gantt.
 * Each row is an ERM activity: a light "planned" bar across its planned
 * month(s), and a coloured "actual" marker showing when it really happened
 * (or its current status). A subtle "today" line marks the current month.
 */

import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  ERM_ACTIVITIES,
  ERM_STATUS_META,
  ERM_CURRENT_MONTH,
  ERM_PLAN_YEAR,
  MONTHS,
  ermPlanSummary,
} from '@/lib/data/ermAnnualPlan'

const COL = 100 / 12 // percent width per month

export function ErmAnnualPlan({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const s = ermPlanSummary()

  return (
    <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', flexWrap: 'wrap' }}
      >
        {open ? <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />}
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          ERM Annual Plan {ERM_PLAN_YEAR} · Plan vs Actual
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <SummaryChip label="Completed" value={s.completed} color="#067647" />
          <SummaryChip label="Overdue" value={s.overdue} color="#B42318" />
          <SummaryChip label="In progress" value={s.inProgress} color="#1D4ED8" />
          <SummaryChip label="Upcoming" value={s.planned} color="#9A9A95" />
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 14px 16px' }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
            {Object.values(ERM_STATUS_META).map((m) => (
              <span key={m.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                {m.label}
              </span>
            ))}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>
              <span style={{ width: 18, height: 8, borderRadius: 3, background: 'var(--border-color)', display: 'inline-block', opacity: 0.8 }} />
              Planned window
            </span>
          </div>

          {/* Scrollable Gantt */}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 640 }}>
              {/* Month header */}
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div style={{ flex: '0 0 200px' }} />
                <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
                  {MONTHS.map((m, i) => (
                    <div key={m} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: 0.4, color: i + 1 === ERM_CURRENT_MONTH ? 'var(--accent-primary)' : 'var(--text-tertiary)', borderLeft: i === 0 ? 'none' : '1px solid var(--border-color)', paddingBottom: 4 }}>
                      {m}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              {ERM_ACTIVITIES.map((act) => {
                const meta = ERM_STATUS_META[act.status]
                const plannedLeft = (act.plannedMonth - 1) * COL
                const plannedWidth = (act.plannedEndMonth - act.plannedMonth + 1) * COL
                const actualLeft = act.actualMonth ? (act.actualMonth - 0.5) * COL : null
                return (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'center', minHeight: 30, borderTop: '1px solid var(--border-color)' }}>
                    {/* Label */}
                    <div style={{ flex: '0 0 200px', paddingRight: 10, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{act.owner}</div>
                    </div>
                    {/* Track */}
                    <div style={{ flex: 1, position: 'relative', height: 30 }}>
                      {/* month gridlines */}
                      {MONTHS.map((_, i) => (
                        <div key={i} style={{ position: 'absolute', left: `${i * COL}%`, top: 0, bottom: 0, width: 1, background: 'var(--border-color)', opacity: i === 0 ? 0 : 0.5 }} />
                      ))}
                      {/* today line */}
                      <div style={{ position: 'absolute', left: `${(ERM_CURRENT_MONTH - 0.5) * COL}%`, top: -2, bottom: -2, width: 2, background: 'var(--accent-primary)', opacity: 0.35 }} title={`Today · ${MONTHS[ERM_CURRENT_MONTH - 1]}`} />
                      {/* planned window bar */}
                      <div
                        style={{
                          position: 'absolute', left: `${plannedLeft}%`, width: `${plannedWidth}%`, top: 11, height: 8,
                          background: act.status === 'overdue' ? 'rgba(180,35,24,0.18)' : 'var(--border-color)',
                          border: act.status === 'overdue' ? '1px dashed #B42318' : '1px solid var(--border-color)',
                          borderRadius: 4,
                        }}
                        title={`Planned: ${MONTHS[act.plannedMonth - 1]}${act.plannedEndMonth !== act.plannedMonth ? `–${MONTHS[act.plannedEndMonth - 1]}` : ''}`}
                      />
                      {/* actual marker */}
                      {actualLeft !== null ? (
                        <div
                          style={{ position: 'absolute', left: `calc(${actualLeft}% - 6px)`, top: 9, width: 12, height: 12, borderRadius: '50%', background: meta.color, border: '2px solid var(--bg-secondary)', boxShadow: '0 0 0 1px var(--border-color)' }}
                          title={`${meta.label} · ${MONTHS[(act.actualMonth as number) - 1]}`}
                        />
                      ) : act.status === 'in-progress' ? (
                        <div
                          style={{ position: 'absolute', left: `calc(${(act.plannedMonth - 0.5) * COL}% - 6px)`, top: 9, width: 12, height: 12, borderRadius: '50%', background: 'transparent', border: `2px solid ${meta.color}` }}
                          title={`${meta.label} · ${MONTHS[act.plannedMonth - 1]}`}
                        />
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: 10 }}>
            Light bar = planned window · coloured dot = when it actually happened (or current status). Illustrative POC data.
          </p>
        </div>
      )}
    </section>
  )
}

function SummaryChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '2px 8px' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
      {value} {label}
    </span>
  )
}
