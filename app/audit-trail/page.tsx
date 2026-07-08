'use client'

/**
 * Audit Trail — Module 8
 * -----------------------
 * Append-only timeline of every meaningful platform action. Powers the
 * CRO's killer question: "Who changed what, when, and why."
 *
 * Read-only timeline + CSV export for the external auditor. Pilot moves
 * the underlying store to tamper-proof immutable storage with SIEM
 * integration.
 */

import React, { useCallback, useMemo, useState } from 'react'
import { Download, Search, Trash2, ShieldCheck } from 'lucide-react'
import {
  useAuditTrail,
} from '@/lib/context/AuditTrailContext'
import { usePersona } from '@/lib/context/PersonaContext'
import {
  type AuditCategory,
  type AuditAction,
  type AuditEvent,
} from '@/lib/context/AuditTrailContext'
import { StatusBadge } from '@/components/provenance/StatusBadge'

const CATEGORY_META: Record<
  AuditCategory,
  { label: string; color: string }
> = {
  risk: { label: 'Risk', color: '#0B6E5B' },
  mitigation: { label: 'Mitigation', color: '#22C55E' },
  kri_entry: { label: 'KRI Entry', color: '#2D9EFF' },
  kri_threshold: { label: 'KRI Threshold', color: '#F5C518' },
  escalation: { label: 'Escalation', color: '#A855F7' },
  system: { label: 'System', color: '#888888' },
  ai: { label: 'AI Suggestion', color: '#B8860B' },
}

const ACTION_META: Record<AuditAction, { label: string; color: string }> = {
  create: { label: 'Create', color: 'var(--risk-low)' },
  update: { label: 'Update', color: 'var(--accent-primary)' },
  delete: { label: 'Delete', color: 'var(--risk-critical)' },
  status_change: { label: 'Status Change', color: 'var(--risk-medium)' },
  login: { label: 'Login', color: 'var(--text-secondary)' },
  export: { label: 'Export', color: 'var(--text-secondary)' },
  audit_cleared: { label: 'Audit Cleared', color: 'var(--risk-critical)' },
  ai_suggestion: { label: 'AI Suggestion', color: '#B8860B' },
}

function AuditTrailContent() {
  const { events, exportCSV, clear } = useAuditTrail()
  const { session, persona } = usePersona()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events
      .slice()
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .filter((e) => {
        if (categoryFilter !== 'all' && e.category !== categoryFilter) return false
        if (actionFilter !== 'all' && e.action !== actionFilter) return false
        if (!q) return true
        return (
          e.summary.toLowerCase().includes(q) ||
          e.actor.toLowerCase().includes(q) ||
          (e.targetId || '').toLowerCase().includes(q)
        )
      })
  }, [events, query, categoryFilter, actionFilter])

  const handleExport = useCallback(() => {
    const csv = exportCSV()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aldar-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [exportCSV])

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            className="ui-page-title"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
          >
            <ShieldCheck size={20} style={{ color: 'var(--accent-primary)' }} />
            Audit Trail
          </h1>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
              maxWidth: 760,
              lineHeight: 1.5,
            }}
          >
            Append-only event log. Every meaningful change to risks,
            mitigation actions, KRI entries, thresholds and escalations is
            captured here with timestamp + actor. Pilot moves this to a
            tamper-proof immutable store with SIEM integration.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge tier="MVP" note={`${events.length} events captured`} />
          <button
            onClick={handleExport}
            disabled={events.length === 0}
            title="Export the full timeline as CSV (for external audit)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: events.length === 0 ? 'var(--bg-secondary)' : 'var(--accent-primary)',
              color: events.length === 0 ? 'var(--text-tertiary)' : 'var(--on-accent)',
              border: 'none',
              padding: '7px 14px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: events.length === 0 ? 'not-allowed' : 'pointer',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: '1 1 280px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 10,
              color: 'var(--text-tertiary)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            placeholder="Search by actor, summary, or target id…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              padding: '8px 12px 8px 30px',
              fontSize: 13,
            }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All categories</option>
          <option value="risk">Risk</option>
          <option value="mitigation">Mitigation</option>
          <option value="kri_entry">KRI Entry</option>
          <option value="kri_threshold">KRI Threshold</option>
          <option value="escalation">Escalation</option>
          <option value="system">System</option>
          <option value="ai">AI Suggestion</option>
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="status_change">Status Change</option>
          <option value="export">Export</option>
        </select>
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            marginLeft: 'auto',
          }}
        >
          Showing {filtered.length} of {events.length}
        </span>
      </div>

      {/* Timeline */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
              fontSize: 12,
              lineHeight: 1.55,
            }}
          >
            {events.length === 0
              ? 'No audit events yet. Add a draft risk on /risk-register, edit a KRI threshold, escalate to Group, or update a mitigation action — every action is logged here.'
              : 'No events match the current filter.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'var(--bg-primary)' }}>
                <Th>Timestamp</Th>
                <Th>Category</Th>
                <Th>Action</Th>
                <Th>Actor</Th>
                <Th>Target</Th>
                <Th>Summary</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <AuditRow key={e.id} event={e} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          padding: '4px 0',
        }}
      >
        Local browser store (localStorage); pilot moves this to a
        tamper-proof immutable backend. Events are append-only from the
        UI. CSV export is timestamp-sorted ascending for chronological
        review by external auditors.
      </div>

      {/* Demo-reset clear button — small, low-emphasis */}
      {events.length > 0 && (
        <button
          onClick={() => {
            const reason = prompt(`Clear all ${events.length} audit events from this browser?\n\nProvide a reason (mandatory — written to the tombstone audit event):`)
            if (reason && reason.trim()) {
              clear({
                actor: session.displayName || 'demo-user',
                reason: reason.trim(),
                personaId: persona?.id ?? null,
              })
            }
          }}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-tertiary)',
            borderRadius: 4,
            padding: '4px 10px',
            fontSize: 9,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
          title="Demo reset only — pilot's tamper-proof store will not allow this"
        >
          <Trash2 size={9} />
          Clear (demo reset)
        </button>
      )}
    </div>
  )
}

function AuditRow({ event }: { event: AuditEvent }) {
  const cat = CATEGORY_META[event.category]
  const act = ACTION_META[event.action]
  const ts = new Date(event.at)
  const dateStr = ts.toLocaleDateString('en-AE', { timeZone: 'Asia/Dubai' })
  const timeStr = ts.toLocaleTimeString('en-AE', {
    timeZone: 'Asia/Dubai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  return (
    <tr style={{ borderTop: '1px solid var(--border-color)' }}>
      <Td muted mono>
        <div>{dateStr}</div>
        <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{timeStr} GST</div>
      </Td>
      <Td>
        <span
          style={{
            display: 'inline-block',
            background: `${cat.color}1f`,
            color: cat.color,
            border: `1px solid ${cat.color}66`,
            padding: '1px 6px',
            borderRadius: 3,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {cat.label}
        </span>
      </Td>
      <Td>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: act.color,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {act.label}
        </span>
      </Td>
      <Td muted>{event.actor}</Td>
      <Td mono muted>
        {event.targetId || '—'}
      </Td>
      <Td>{event.summary}</Td>
    </tr>
  )
}

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  padding: '8px 12px',
  fontSize: 13,
  minWidth: 160,
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: 'left',
        fontSize: 9,
        fontWeight: 700,
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        padding: '8px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  mono,
  muted,
}: {
  children: React.ReactNode
  mono?: boolean
  muted?: boolean
}) {
  return (
    <td
      style={{
        padding: '8px 10px',
        color: muted ? 'var(--text-secondary)' : 'var(--text-primary)',
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined,
        fontVariantNumeric: 'tabular-nums',
        verticalAlign: 'top',
      }}
    >
      {children}
    </td>
  )
}

export default function AuditTrailPage() {
  // AuditTrailProvider is mounted at the root layout.
  return <AuditTrailContent />
}
