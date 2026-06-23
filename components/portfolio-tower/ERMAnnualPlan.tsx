'use client'

/**
 * ERMAnnualPlan — Module 4 / M4.2 + Patch E3
 * -------------------------------------------
 * 12-month grid of ERM cycle activities. Seed activities are baked-in
 * (illustrative). E3 makes the calendar INTERACTIVE: AVP can add custom
 * activities — they persist to localStorage, fire audit-trail events,
 * and appear in the correct month chip with a remove control.
 *
 * Honors CLAUDE.md: seeded activities labelled illustrative; user-added
 * activities are attributed via the createdBy field on the persisted record.
 */

import React, { useState } from 'react'
import { Calendar, Plus, X, Check, Clock, AlertTriangle, Circle, ChevronDown, type LucideIcon } from 'lucide-react'
import {
  useERMPlanActivities,
  type PlanActivityCategory,
  type PlanActivity,
  type PlanActivityStatus,
} from '@/lib/context/ERMPlanActivitiesContext'
import { Modal } from '@/components/ui/Modal'

interface SeedActivity {
  id: string
  title: string
  description: string
  months: number[]
  category: PlanActivityCategory
  seeded: true
}

const SEED_ACTIVITIES: SeedActivity[] = [
  { id: 'a1', title: 'Risk Appetite Refresh', description: 'Annual review of group risk appetite & tolerance', months: [1, 2], category: 'governance', seeded: true },
  { id: 'a2', title: 'ERM Framework Update', description: 'Refresh ERM framework, taxonomy, ISO 31000 alignment', months: [3, 4], category: 'governance', seeded: true },
  { id: 'a3', title: 'KRI Monthly Reporting', description: 'Monthly KRI dashboard cycle to Group ERM Head', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], category: 'monitoring', seeded: true },
  { id: 'a4', title: 'ARC Quarterly Review', description: 'Audit & Risk Committee review of register, KRIs, breach log', months: [3, 6, 9, 12], category: 'review', seeded: true },
  { id: 'a5', title: 'Risk Champion Training', description: 'Training cycle for first-line risk champions', months: [5, 6], category: 'training', seeded: true },
  { id: 'a6', title: 'Subsidiary Register Refresh', description: 'Each subsidiary refreshes its register; cascades to Group', months: [7, 8], category: 'review', seeded: true },
  { id: 'a7', title: 'External Audit Walkthrough', description: 'External auditor walks risk register + control library', months: [10, 11], category: 'review', seeded: true },
  { id: 'a8', title: 'Board Annual Report', description: 'Year-end ERM report to the board, ARC pack', months: [12], category: 'reporting', seeded: true },
]

const CATEGORY_META: Record<
  PlanActivityCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  governance: { label: 'Governance', color: '#A855F7', bg: 'rgba(168,85,247,0.20)', border: 'rgba(168,85,247,0.55)' },
  review: { label: 'Review', color: '#2D9EFF', bg: 'rgba(45,158,255,0.20)', border: 'rgba(45,158,255,0.55)' },
  training: { label: 'Training', color: '#22C55E', bg: 'rgba(34,197,94,0.20)', border: 'rgba(34,197,94,0.55)' },
  monitoring: { label: 'Monitoring', color: '#F5C518', bg: 'rgba(245,197,24,0.20)', border: 'rgba(245,197,24,0.55)' },
  reporting: { label: 'Reporting', color: '#E4002B', bg: 'rgba(228,0,43,0.20)', border: 'rgba(228,0,43,0.55)' },
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── Status (lifecycle the user sets) + derived urgency ──────────────────
// "Due" and "Overdue" are NOT stored — they are computed from the user-set
// lifecycle status plus the activity's scheduled months vs. today's month.
type PlanState = 'completed' | 'overdue' | 'in_progress' | 'due' | 'planned'

/** Real current month (1..12). Drives Due / Overdue. */
const CURRENT_MONTH = new Date().getMonth() + 1

function deriveState(months: number[], status: PlanActivityStatus): PlanState {
  if (status === 'completed') return 'completed'
  if (months.length === 0) return status === 'in_progress' ? 'in_progress' : 'planned'
  const max = Math.max(...months)
  const min = Math.min(...months)
  if (max < CURRENT_MONTH) return 'overdue' // scheduled window has passed, not completed
  if (status === 'in_progress') return 'in_progress'
  if (min <= CURRENT_MONTH && CURRENT_MONTH <= max) return 'due' // inside the window now
  return 'planned' // window is still in the future
}

const STATE_META: Record<
  PlanState,
  { label: string; color: string; bg: string; border: string; Icon: LucideIcon }
> = {
  completed: { label: 'Completed', color: '#22C55E', bg: 'rgba(34,197,94,0.16)', border: 'rgba(34,197,94,0.5)', Icon: Check },
  overdue: { label: 'Overdue', color: '#E4002B', bg: 'rgba(228,0,43,0.16)', border: 'rgba(228,0,43,0.5)', Icon: AlertTriangle },
  in_progress: { label: 'In Progress', color: '#2D9EFF', bg: 'rgba(45,158,255,0.16)', border: 'rgba(45,158,255,0.5)', Icon: Clock },
  due: { label: 'Due', color: '#B8860B', bg: 'rgba(245,197,24,0.20)', border: 'rgba(245,197,24,0.6)', Icon: Clock },
  planned: { label: 'Planned', color: 'var(--text-tertiary)', bg: 'var(--bg-primary)', border: 'var(--border-color)', Icon: Circle },
}

const LIFECYCLE_OPTIONS: { value: PlanActivityStatus; label: string; hint: string }[] = [
  { value: 'planned', label: 'Planned', hint: 'Scheduled, not started' },
  { value: 'in_progress', label: 'In Progress', hint: 'Work underway' },
  { value: 'completed', label: 'Completed', hint: 'Done for this cycle' },
]

type Row =
  | { kind: 'seed'; row: SeedActivity }
  | { kind: 'custom'; row: PlanActivity }

export function ERMAnnualPlan() {
  const { activities, removeActivity, statuses, setStatus } = useERMPlanActivities()
  const [open, setOpen] = useState(false)
  const [statusFor, setStatusFor] = useState<{ id: string; title: string; months: number[] } | null>(null)

  const rows: Row[] = [
    ...SEED_ACTIVITIES.map<Row>((r) => ({ kind: 'seed', row: r })),
    ...activities.map<Row>((r) => ({ kind: 'custom', row: r })),
  ]

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
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
            Seeded illustrative cycle plus AVP-added activities. Click <strong>+ Add Activity</strong> to schedule a new item,
            or click any activity&rsquo;s <strong>status chip</strong> to mark it Planned / In Progress / Completed.
            <span style={{ fontStyle: 'italic' }}> Due &amp; Overdue are derived from today&rsquo;s date against the schedule.</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
            {(['completed', 'due', 'overdue', 'in_progress', 'planned'] as PlanState[]).map((s) => {
              const m = STATE_META[s]
              const Icon = m.Icon
              return (
                <span
                  key={s}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: m.color, letterSpacing: 0.3, textTransform: 'uppercase' }}
                >
                  <Icon size={9} />
                  {m.label}
                </span>
              )
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {(Object.keys(CATEGORY_META) as PlanActivityCategory[]).map((cat) => {
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
                <span style={{ width: 6, height: 6, borderRadius: 1, background: m.color }} />
                {m.label}
              </span>
            )
          })}
          <button
            onClick={() => setOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--accent-primary)',
              color: 'var(--on-accent)',
              border: 'none',
              padding: '5px 10px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            <Plus size={11} />
            Add Activity
          </button>
        </div>
      </div>

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
            {rows.map((r) => {
              const isCustom = r.kind === 'custom'
              const meta = CATEGORY_META[r.row.category]
              const months = r.row.months
              const rawStatus: PlanActivityStatus = statuses[r.row.id] ?? 'planned'
              const state = deriveState(months, rawStatus)
              return (
                <tr key={r.row.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td
                    style={{
                      padding: '6px 8px',
                      verticalAlign: 'top',
                      borderLeft: `2px solid ${meta.color}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                        {r.row.title}
                        {isCustom && (
                          <span
                            style={{
                              marginLeft: 6,
                              background: 'rgba(228,0,43,0.16)',
                              color: 'var(--accent-primary)',
                              border: '1px solid rgba(228,0,43,0.4)',
                              padding: '1px 5px',
                              borderRadius: 3,
                              fontSize: 8,
                              fontWeight: 700,
                              letterSpacing: 0.4,
                              textTransform: 'uppercase',
                              verticalAlign: 'middle',
                            }}
                          >
                            New
                          </span>
                        )}
                      </div>
                      <StatusPill
                        state={state}
                        onClick={() =>
                          setStatusFor({ id: r.row.id, title: r.row.title, months })
                        }
                      />
                      {isCustom && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove "${r.row.title}" from the plan?`)) {
                              removeActivity(r.row.id)
                            }
                          }}
                          title="Remove user-added activity"
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: 3,
                            padding: 2,
                            cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                            display: 'inline-flex',
                          }}
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {r.row.description}
                    </div>
                  </td>
                  {MONTH_LABELS.map((_, idx) => {
                    const monthNum = idx + 1
                    const active = months.includes(monthNum)
                    return (
                      <td
                        key={idx}
                        style={{
                          padding: '6px 4px',
                          textAlign: 'center',
                          background: active ? meta.bg : 'transparent',
                          border: active ? `1px solid ${meta.border}` : '1px solid transparent',
                        }}
                      >
                        {active && (
                          <span
                            title={`${r.row.title} · ${MONTH_LABELS[idx]}`}
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

      {open && <AddActivityModal onClose={() => setOpen(false)} />}

      {statusFor && (
        <StatusModal
          id={statusFor.id}
          title={statusFor.title}
          months={statusFor.months}
          current={statuses[statusFor.id] ?? 'planned'}
          onSet={(s) => {
            setStatus(statusFor.id, s, statusFor.title)
            setStatusFor(null)
          }}
          onClose={() => setStatusFor(null)}
        />
      )}
    </div>
  )
}

// ── Status chip (shows derived state) + picker modal ────────────────────
function StatusPill({ state, onClick }: { state: PlanState; onClick: () => void }) {
  const m = STATE_META[state]
  const Icon = m.Icon
  return (
    <button
      onClick={onClick}
      title="Update status (Planned / In Progress / Completed)"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: m.bg,
        color: m.color,
        border: `1px solid ${m.border}`,
        padding: '2px 7px',
        borderRadius: 999,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={10} />
      {m.label}
      <ChevronDown size={9} style={{ opacity: 0.7 }} />
    </button>
  )
}

function StatusModal({
  id,
  title,
  months,
  current,
  onSet,
  onClose,
}: {
  id: string
  title: string
  months: number[]
  current: PlanActivityStatus
  onSet: (s: PlanActivityStatus) => void
  onClose: () => void
}) {
  const derived = deriveState(months, current)
  const dm = STATE_META[derived]
  const windowLabel =
    months.length === 0
      ? 'no month scheduled'
      : months.length === 1
        ? MONTH_LABELS[months[0] - 1]
        : `${MONTH_LABELS[Math.min(...months) - 1]}–${MONTH_LABELS[Math.max(...months) - 1]}`

  return (
    <Modal open onClose={onClose} ariaLabel="Update activity status" size="md">
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-tertiary)',
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            ERM Annual Plan · Update Status
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {title}
          </h3>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Scheduled: <strong style={{ color: 'var(--text-secondary)' }}>{windowLabel}</strong>
            <span style={{ color: 'var(--border-color)' }}>·</span>
            Currently:
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: dm.color, fontWeight: 700 }}>
              <dm.Icon size={11} />
              {dm.label}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LIFECYCLE_OPTIONS.map((opt) => {
            const active = opt.value === current
            return (
              <button
                key={opt.value}
                onClick={() => onSet(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  background: active ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                  border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{opt.label}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{opt.hint}</span>
                </span>
                {active && <Check size={14} style={{ color: 'var(--accent-primary)' }} />}
              </button>
            )
          })}
        </div>

        <div style={{ fontSize: 9.5, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
          &ldquo;Due&rdquo; and &ldquo;Overdue&rdquo; are derived from this schedule against today&rsquo;s date — not set
          manually. Marking an activity <strong>Completed</strong> clears its Due/Overdue flag.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={btnSecondaryStyle}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

function AddActivityModal({ onClose }: { onClose: () => void }) {
  const { addActivity } = useERMPlanActivities()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<PlanActivityCategory>('governance')
  const [months, setMonths] = useState<number[]>([])
  const [createdBy, setCreatedBy] = useState('AVP (demo)')

  function toggleMonth(m: number) {
    setMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)))
  }

  const canSave = title.trim().length > 0 && months.length > 0

  return (
    <Modal open onClose={onClose} ariaLabel="Add ERM Plan Activity" size="lg">
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-tertiary)',
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            ERM Annual Plan
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Add Activity
          </h3>
        </div>

        <label style={labelStyle}>
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. CRO Quarterly Townhall"
            style={inputStyle}
            autoFocus
          />
        </label>

        <label style={labelStyle}>
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Short description of the activity"
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={labelStyle}>
            <span>Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PlanActivityCategory)}
              style={inputStyle}
            >
              {(Object.keys(CATEGORY_META) as PlanActivityCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            <span>Owner / Author</span>
            <input
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Months <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(click to toggle — at least one required)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {MONTH_LABELS.map((label, i) => {
              const m = i + 1
              const active = months.includes(m)
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMonth(m)}
                  style={{
                    background: active ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: active ? 'var(--on-accent)' : 'var(--text-secondary)',
                    border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    padding: '6px 0',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: 0.4,
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6 }}>
          <button onClick={onClose} style={btnSecondaryStyle}>
            Cancel
          </button>
          <button
            onClick={() => {
              addActivity({
                title: title.trim(),
                description: description.trim(),
                category,
                months,
                createdBy: createdBy.trim() || 'AVP (demo)',
              })
              onClose()
            }}
            disabled={!canSave}
            style={{
              ...btnPrimaryStyle,
              opacity: canSave ? 1 : 0.5,
              cursor: canSave ? 'pointer' : 'not-allowed',
            }}
          >
            Add to Plan
          </button>
        </div>
      </div>
    </Modal>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 11,
  color: 'var(--text-secondary)',
  fontWeight: 600,
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  padding: '8px 10px',
  fontSize: 13,
}

const btnPrimaryStyle: React.CSSProperties = {
  background: 'var(--accent-primary)',
  color: 'var(--on-accent)',
  border: 'none',
  borderRadius: 6,
  padding: '8px 14px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
}

const btnSecondaryStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 6,
  padding: '8px 14px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  cursor: 'pointer',
}
