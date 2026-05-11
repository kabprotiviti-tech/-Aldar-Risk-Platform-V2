'use client'

/**
 * Risk Register — Module 2 (deep)
 * --------------------------------
 * Read-only list view (C1). Subsequent micro-patches add:
 *   C2 detail drawer · C3 add/edit form · C4 mitigation actions ·
 *   C5 status workflow · C6 heatmap · C7 AI register critic
 *
 * Honors CLAUDE.md: every column either reflects sourced engine output
 * or is clearly labeled (e.g. "Status workflow ships in C5").
 */

import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { SimulationProvider, useSimulation } from '@/lib/context/SimulationContext'
import { RiskDraftProvider, useRiskDrafts, type RiskDraft, type RiskStatus } from '@/lib/context/RiskDraftContext'
import { MitigationActionsProvider, useMitigationActions } from '@/lib/context/MitigationActionsContext'
import { KRIThresholdsProvider } from '@/lib/context/KRIThresholdsContext'
import { KRIEntriesProvider } from '@/lib/context/KRIEntriesContext'
import { EscalationsProvider } from '@/lib/context/EscalationsContext'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'
import { RiskDetailDrawer } from '@/components/risk-register/RiskDetailDrawer'
import { RiskFormModal } from '@/components/risk-register/RiskFormModal'
import { RiskHeatmap } from '@/components/risk-register/RiskHeatmap'
import { AIRegisterCriticPanel } from '@/components/risk-register/AIRegisterCriticPanel'
import type { RiskState, Rating } from '@/lib/engine/types'

// A unified row type that covers both engine RiskState and user draft.
// Drafts have only the static RiskDef fields so engine-derived columns
// (residual, exposure, contributing drivers) are absent — shown as "—".
type RegisterRow =
  | { kind: 'engine'; risk: RiskState }
  | { kind: 'draft'; draft: RiskDraft }

// ── Rating colour helper ────────────────────────────────────────────────
function ratingColor(r: Rating): string {
  switch (r) {
    case 'Critical':
      return 'var(--risk-critical)'
    case 'High':
      return 'var(--risk-high)'
    case 'Medium':
      return 'var(--risk-medium)'
    case 'Low':
    default:
      return 'var(--risk-low)'
  }
}

function RatingPill({ rating }: { rating: Rating }) {
  const c = ratingColor(rating)
  return (
    <span
      style={{
        display: 'inline-block',
        background: `${c}26`,
        color: c,
        border: `1px solid ${c}66`,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {rating}
    </span>
  )
}

// ── Inner content (uses simulation context) ─────────────────────────────
function RiskRegisterContent() {
  const { risks } = useSimulation()
  const { drafts, removeDraft } = useRiskDrafts()
  const { actionsForRisk, isOverdue } = useMitigationActions()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected, setSelected] = useState<RiskState | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RiskDraft | null>(null)

  // Drill-down: ?focus=R-NNN auto-opens the matching risk drawer.
  // We read the URL directly (window.location.search) instead of
  // next/navigation's useSearchParams so the route does not need to opt
  // out of static prerender (useSearchParams forces a Suspense boundary).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const focusId = params.get('focus')
    if (!focusId) return
    const match = risks.find((r) => r.id === focusId)
    if (match) setSelected(match)
  }, [risks])

  // Per-risk action summary helper.
  function summarizeActions(riskId: string) {
    const list = actionsForRisk(riskId)
    const total = list.length
    const overdue = list.filter(isOverdue).length
    return { total, overdue }
  }

  // Combined rows: engine first, then drafts
  const allRows: RegisterRow[] = useMemo(() => {
    return [
      ...risks.map<RegisterRow>((r) => ({ kind: 'engine', risk: r })),
      ...drafts.map<RegisterRow>((d) => ({ kind: 'draft', draft: d })),
    ]
  }, [risks, drafts])

  const categories = useMemo(() => {
    const set = new Set<string>()
    allRows.forEach((row) => {
      if (row.kind === 'engine') set.add(row.risk.category)
      else set.add(row.draft.category)
    })
    return ['all', ...Array.from(set).sort()]
  }, [allRows])

  const filtered: RegisterRow[] = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allRows.filter((row) => {
      const cat = row.kind === 'engine' ? row.risk.category : row.draft.category
      if (categoryFilter !== 'all' && cat !== categoryFilter) return false

      // Status filter
      if (statusFilter !== 'all') {
        const id = row.kind === 'engine' ? row.risk.id : row.draft.id
        const summary = summarizeActions(id)
        if (statusFilter === 'overdue') {
          if (summary.overdue === 0) return false
        } else {
          // For drafts use explicit status. For engine risks derive from actions:
          //   no actions or all closed → 'closed'
          //   any open action → 'open'
          //   any in_progress (and none open) → 'in_progress'
          let derived: string
          if (row.kind === 'draft') {
            derived = row.draft.status || 'open'
          } else {
            const acts = actionsForRisk(row.risk.id)
            if (acts.length === 0) derived = 'open'
            else if (acts.every((a) => a.status === 'closed')) derived = 'closed'
            else if (acts.some((a) => a.status === 'open')) derived = 'open'
            else derived = 'in_progress'
          }
          if (derived !== statusFilter) return false
        }
      }

      if (!q) return true
      const id = row.kind === 'engine' ? row.risk.id : row.draft.id
      const name = row.kind === 'engine' ? row.risk.name : row.draft.name
      const owner = row.kind === 'engine' ? row.risk.owner : row.draft.owner
      return (
        id.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        owner.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q)
      )
    })
  }, [allRows, query, categoryFilter, statusFilter, actionsForRisk, summarizeActions])

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <IllustrativeDataBanner pilotFeeds="Aldar segment P&L for AED exposure baselines" />
      {/* Header + status badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Risk Register
          </h1>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
              maxWidth: 720,
              lineHeight: 1.5,
            }}
          >
            Cause-Event-Impact register for Aldar Group. Inherent and residual scores
            for engine risks come from the simulation. User-added risks are stored
            locally as DRAFT and persist between sessions in this browser.
            Mitigation actions / Status workflow / Heatmap ship in C4-C7.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--accent-primary)',
              color: 'var(--on-accent)',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            <Plus size={14} />
            Add Risk
          </button>
          <StatusBadge
            tier="LIVE"
            note={`${risks.length} engine + ${drafts.length} draft`}
          />
        </div>
      </div>

      {/* Search + filter row */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="search"
          placeholder="Search by ID, name, owner, category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: '1 1 280px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            padding: '8px 12px',
            fontSize: 13,
          }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            padding: '8px 12px',
            fontSize: 13,
            minWidth: 200,
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All categories' : c}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            padding: '8px 12px',
            fontSize: 13,
            minWidth: 160,
          }}
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
          <option value="overdue">Has overdue actions</option>
        </select>
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            marginLeft: 'auto',
          }}
        >
          Showing {filtered.length} of {risks.length}
        </span>
      </div>

      {/* AI Register Critic (C7) */}
      <AIRegisterCriticPanel />

      {/* Heatmap (C6) — sits above the register table */}
      <RiskHeatmap onSelectRisk={(r) => setSelected(r)} />

      {/* Register table */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 12,
          }}
        >
          <thead>
            <tr style={{ background: 'var(--bg-primary)' }}>
              <Th>ID</Th>
              <Th>Risk Name</Th>
              <Th>Category</Th>
              <Th>Owner</Th>
              <Th right>Inherent</Th>
              <Th right>Residual</Th>
              <Th>Rating</Th>
              <Th right>Exposure (AED mn)</Th>
              <Th>Mitigations</Th>
              <Th>Manage</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    padding: 32,
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontStyle: 'italic',
                  }}
                >
                  No risks match the current filter.
                </td>
              </tr>
            )}
            {filtered.map((row) =>
              row.kind === 'engine' ? (
                <tr
                  key={row.risk.id}
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background 80ms ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--bg-hover)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                  onClick={() => setSelected(row.risk)}
                  title="Open detail drawer"
                >
                  <Td mono>{row.risk.id}</Td>
                  <Td>{row.risk.name}</Td>
                  <Td>{row.risk.category}</Td>
                  <Td muted>{row.risk.owner}</Td>
                  <Td right mono>{row.risk.newInherent.toFixed(1)}</Td>
                  <Td right mono>{row.risk.newResidual.toFixed(1)}</Td>
                  <Td><RatingPill rating={row.risk.ratingTo} /></Td>
                  <Td right mono>{row.risk.exposureAedMn.toFixed(0)}</Td>
                  <Td>
                    <ActionSummary {...summarizeActions(row.risk.id)} />
                  </Td>
                  <Td>
                    <span
                      style={{
                        fontSize: 9,
                        color: 'var(--text-tertiary)',
                        fontStyle: 'italic',
                      }}
                    >
                      engine
                    </span>
                  </Td>
                </tr>
              ) : (
                <tr
                  key={row.draft.id}
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    background: 'rgba(245,197,24,0.04)',
                  }}
                >
                  <Td mono>{row.draft.id}</Td>
                  <Td>
                    {row.draft.name}{' '}
                    <DraftBadge />
                  </Td>
                  <Td>{row.draft.category}</Td>
                  <Td muted>{row.draft.owner}</Td>
                  <Td right mono>
                    {(row.draft.baseLikelihood * row.draft.baseImpact).toFixed(1)}
                  </Td>
                  <Td right mono muted>—</Td>
                  <Td>
                    <DraftStatusPill status={row.draft.status || 'open'} />
                  </Td>
                  <Td right mono muted>—</Td>
                  <Td>
                    <ActionSummary {...summarizeActions(row.draft.id)} />
                  </Td>
                  <Td>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditing(row.draft)
                          setFormOpen(true)
                        }}
                        title="Edit draft"
                        style={iconButtonStyle}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Delete ${row.draft.id} — ${row.draft.name}?`)) {
                            removeDraft(row.draft.id)
                          }
                        }}
                        title="Delete draft"
                        style={{ ...iconButtonStyle, color: 'var(--risk-critical)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* Footnote */}
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          padding: '4px 0',
        }}
      >
        Inherent / Residual scores derive from the simulation engine&rsquo;s
        baseline drivers. Exposure (AED mn) uses each
        risk&rsquo;s financial-anchor reference — click any row to open the
        detail drawer (Cause/Event/Impact, controls, contributing drivers,
        provenance).
      </div>

      {/* Slide-in detail drawer */}
      <RiskDetailDrawer risk={selected} onClose={() => setSelected(null)} />

      {/* Add / Edit risk modal */}
      <RiskFormModal
        open={formOpen}
        mode={editing ? 'edit' : 'create'}
        initial={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

function ActionSummary({ total, overdue }: { total: number; overdue: number }) {
  if (total === 0) {
    return (
      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
        none
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{total}</span>
      {overdue > 0 && (
        <span
          style={{
            background: 'rgba(255,59,59,0.18)',
            color: 'var(--risk-critical)',
            border: '1px solid rgba(255,59,59,0.45)',
            padding: '0 6px',
            borderRadius: 3,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {overdue} overdue
        </span>
      )}
    </span>
  )
}

const DRAFT_STATUS_META: Record<RiskStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'var(--text-secondary)' },
  in_progress: { label: 'In Progress', color: 'var(--accent-primary)' },
  closed: { label: 'Closed', color: 'var(--risk-low)' },
}

function DraftStatusPill({ status }: { status: RiskStatus }) {
  const m = DRAFT_STATUS_META[status]
  return (
    <span
      style={{
        display: 'inline-block',
        background: `${m.color}1f`,
        color: m.color,
        border: `1px solid ${m.color}66`,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {m.label}
    </span>
  )
}

function DraftBadge() {
  return (
    <span
      style={{
        marginLeft: 8,
        display: 'inline-block',
        background: 'rgba(245,197,24,0.18)',
        color: '#F5C518',
        border: '1px solid rgba(245,197,24,0.35)',
        padding: '1px 6px',
        borderRadius: 3,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      }}
    >
      Draft
    </span>
  )
}

const iconButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  borderRadius: 4,
  padding: 4,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

// ── Tiny presentational helpers ─────────────────────────────────────────
function Th({
  children,
  right,
}: {
  children: React.ReactNode
  right?: boolean
}) {
  return (
    <th
      style={{
        textAlign: right ? 'right' : 'left',
        fontSize: 10,
        fontWeight: 700,
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        padding: '10px 12px',
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
  muted,
}: {
  children: React.ReactNode
  right?: boolean
  mono?: boolean
  muted?: boolean
}) {
  return (
    <td
      style={{
        textAlign: right ? 'right' : 'left',
        padding: '10px 12px',
        color: muted ? 'var(--text-secondary)' : 'var(--text-primary)',
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </td>
  )
}

// ── Page wrapper providing simulation + draft + mitigation + KRI + escalations ──
export default function RiskRegisterPage() {
  return (
    <SimulationProvider>
      <RiskDraftProvider>
        <MitigationActionsProvider>
          <KRIThresholdsProvider>
            <KRIEntriesProvider>
              <EscalationsProvider>
                <RiskRegisterContent />
              </EscalationsProvider>
            </KRIEntriesProvider>
          </KRIThresholdsProvider>
        </MitigationActionsProvider>
      </RiskDraftProvider>
    </SimulationProvider>
  )
}
