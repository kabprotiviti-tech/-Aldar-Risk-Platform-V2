'use client'

/**
 * KRI Engine — Module 3 (deep)
 * -----------------------------
 * D1 ships the read-only definition table. Subsequent micro-patches:
 *   D2 threshold config · D3 manual entry · D4 traffic-light status ·
 *   D5 6-month trend · D6 breach event log · D7 risk linkage UI ·
 *   D8 risk-appetite link.
 *
 * Honors CLAUDE.md: KRI baselines are sourced from the engine driver
 * provenance (most are `illustrative` indices) — labels are honest.
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { Pencil, PlusCircle } from 'lucide-react'
import { SimulationProvider, useSimulation } from '@/lib/context/SimulationContext'
import {
  KRIThresholdsProvider,
  useKRIThresholds,
} from '@/lib/context/KRIThresholdsContext'
import {
  KRIEntriesProvider,
  useKRIEntries,
} from '@/lib/context/KRIEntriesContext'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'
import { NumericValue } from '@/components/provenance/NumericValue'
import { KRIThresholdEditor } from '@/components/kri/KRIThresholdEditor'
import { KRIEntryEditor } from '@/components/kri/KRIEntryEditor'
import { KRISparkline } from '@/components/kri/KRISparkline'
import { KRIBreachHistoryModal } from '@/components/kri/KRIBreachHistoryModal'
import { KRI_DEFINITIONS, type KRIDefinition } from '@/lib/data/kri-definitions'
import { computeKRIStatus, STATUS_META, type KRIStatus } from '@/lib/data/kri-status'
import { usePersona } from '@/lib/context/PersonaContext'
import { can } from '@/lib/rbac/policy'
import { computeBreachHistory } from '@/lib/data/kri-breach-history'
import type { Driver } from '@/lib/engine/types'

function KRIContent() {
  const { persona } = usePersona()
  const canEditThresholds = can(persona?.id ?? null, 'kri:edit-threshold')
  const canEnterValue = can(persona?.id ?? null, 'kri:enter-value')
  const { drivers } = useSimulation()
  const [editingKriId, setEditingKriId] = useState<string | null>(null)
  const [entryKriId, setEntryKriId] = useState<string | null>(null)
  const [breachKriId, setBreachKriId] = useState<string | null>(null)

  // Deep-link: /kri?focus=KRI-NN scrolls to and briefly highlights that KRI.
  React.useEffect(() => {
    const focusId = new URLSearchParams(window.location.search).get('focus')
    if (!focusId) return
    const t = setTimeout(() => {
      const el = document.getElementById(`kri-${focusId}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const prev = el.style.backgroundColor
      el.style.transition = 'background-color 0.4s ease'
      el.style.backgroundColor = 'var(--accent-glow)'
      setTimeout(() => { el.style.backgroundColor = prev }, 2200)
    }, 350)
    return () => clearTimeout(t)
  }, [])
  const editingKri = editingKriId
    ? KRI_DEFINITIONS.find((k) => k.id === editingKriId) ?? null
    : null
  const entryKri = entryKriId
    ? KRI_DEFINITIONS.find((k) => k.id === entryKriId) ?? null
    : null
  const breachKri = breachKriId
    ? KRI_DEFINITIONS.find((k) => k.id === breachKriId) ?? null
    : null

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <IllustrativeDataBanner pilotFeeds="ABC PMS / Yardi / SAP for live KRI feeds" />
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
          <h1 className="ui-page-title">
            Key Risk Indicators
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
            The 8 KRIs ABC tracks across the development, investment,
            and sales pipelines. Current values flow from the simulation
            engine drivers; thresholds are user-editable per KRI and
            persist locally. Manual entry, traffic-light status, breach
            events, 6-month trend charts and risk-appetite linkage are
            all wired — click any KRI row to drill in.
          </p>
        </div>
        <StatusBadge tier="MVP" note={`${KRI_DEFINITIONS.length} KRIs tracked`} />
      </div>

      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 1180, borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 64 }} />{/* ID */}
            <col style={{ width: 240 }} />{/* KRI Name */}
            <col style={{ width: 130 }} />{/* Owner */}
            <col style={{ width: 90 }} />{/* Frequency */}
            <col style={{ width: 110 }} />{/* Current Value */}
            <col style={{ width: 120 }} />{/* Latest Entry */}
            <col style={{ width: 90 }} />{/* Status */}
            <col style={{ width: 120 }} />{/* 6-mo Trend */}
            <col style={{ width: 80 }} />{/* Breaches */}
            <col style={{ width: 110 }} />{/* Thresholds */}
            <col style={{ width: 100 }} />{/* Linked Risks */}
            <col style={{ width: 96 }} />{/* Source */}
          </colgroup>
          <thead>
            <tr style={{ background: 'var(--bg-primary)' }}>
              <Th>ID</Th>
              <Th>KRI Name</Th>
              <Th>Owner</Th>
              <Th>Frequency</Th>
              <Th right>Driver Value</Th>
              <Th>Latest Reading</Th>
              <Th center>Status</Th>
              <Th>6-mo Trend</Th>
              <Th center>Breaches</Th>
              <Th>Thresholds</Th>
              <Th>Linked Risks</Th>
              <Th>Source</Th>
            </tr>
          </thead>
          <tbody>
            {KRI_DEFINITIONS.map((kri) => (
              <KRIRow
                key={kri.id}
                kri={kri}
                drivers={drivers}
                onEditThresholds={canEditThresholds ? () => setEditingKriId(kri.id) : undefined}
                onAddEntry={canEnterValue ? () => setEntryKriId(kri.id) : undefined}
                onOpenBreaches={() => setBreachKriId(kri.id)}
              />
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          padding: '4px 0',
        }}
      >
        <strong style={{ color: 'var(--text-secondary)' }}>Driver Value</strong> = current
        simulation-engine reading (normalised index, 100 = budget / plan).{' '}
        <strong style={{ color: 'var(--text-secondary)' }}>Latest Reading</strong> = most recent
        manual KRI entry. Most baseline values are normalized indices
        — click ⓘ on any value to see source and calibration plan. Live
        feeds from ABC PMS / Yardi / SAP are wired in pilot.
      </div>

      {/* Threshold editor modal (D2) */}
      {editingKri && (
        <>
          <div
            onClick={() => setEditingKriId(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(2px)',
              zIndex: 9100,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9101,
            }}
          >
            <KRIThresholdEditor
              kri={editingKri}
              onClose={() => setEditingKriId(null)}
            />
          </div>
        </>
      )}

      {/* Manual entry modal (D3) */}
      {entryKri && (
        <KRIEntryEditor kri={entryKri} onClose={() => setEntryKriId(null)} />
      )}

      {/* Breach history modal (D6) */}
      <KRIBreachHistoryModal kri={breachKri} onClose={() => setBreachKriId(null)} />
    </div>
  )
}

function AppetiteChip({ kri }: { kri: KRIDefinition }) {
  const [open, setOpen] = useState(false)
  const ref = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const a = kri.riskAppetite
  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={`Risk Appetite — approved ${a.approvedBy}, last reviewed ${a.lastReviewed}`}
        style={{
          background: 'transparent',
          border: '1px solid rgba(45,158,255,0.45)',
          color: '#2D9EFF',
          borderRadius: 3,
          padding: '1px 5px',
          cursor: 'pointer',
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          lineHeight: 1.2,
        }}
      >
        Appetite
      </button>
      {open && (
        <div
          role="dialog"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 50,
            width: 280,
            background: 'var(--bg-card)',
            border: '1px solid rgba(45,158,255,0.45)',
            borderRadius: 6,
            padding: 10,
            boxShadow: '0 10px 24px rgba(0,0,0,0.45)',
            fontSize: 11,
            color: 'var(--text-primary)',
            textAlign: 'left',
            lineHeight: 1.55,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#2D9EFF',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Risk Appetite Statement
          </div>
          <div style={{ color: 'var(--text-primary)', marginBottom: 6 }}>
            {a.statement}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
            Approved by <strong style={{ color: 'var(--text-secondary)' }}>{a.approvedBy}</strong>
            {' · '}Last reviewed <strong style={{ color: 'var(--text-secondary)' }}>{a.lastReviewed}</strong>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 9,
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
              borderTop: '1px dashed var(--border-color)',
              paddingTop: 6,
            }}
          >
            Thresholds anchor to this appetite. Editing thresholds in
            production will flow through the appetite-governance process
            (G1 module — pending).
          </div>
        </div>
      )}
    </span>
  )
}

function BreachCell({
  totalBreaches,
  recentBreach,
  onClick,
}: {
  totalBreaches: number
  recentBreach: import('@/lib/data/kri-breach-history').BreachEvent | null
  onClick: () => void
}) {
  if (totalBreaches === 0) {
    return (
      <span
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
        }}
        title="No status transitions in entry history"
      >
        none
      </span>
    )
  }
  const accent =
    recentBreach && recentBreach.newStatus === 'red'
      ? 'var(--risk-critical)'
      : recentBreach && recentBreach.newStatus === 'amber'
        ? 'var(--risk-medium)'
        : 'var(--risk-low)'
  return (
    <button
      onClick={onClick}
      title="Click to open breach history"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 1,
        background: 'transparent',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 4,
        padding: '4px 8px',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
        {totalBreaches} event{totalBreaches === 1 ? '' : 's'}
      </span>
      {recentBreach && (
        <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
          {recentBreach.period} ·{' '}
          {recentBreach.previousStatus ?? 'first'} → {recentBreach.newStatus}
        </span>
      )}
    </button>
  )
}

function KRIRow({
  kri,
  drivers,
  onEditThresholds,
  onAddEntry,
  onOpenBreaches,
}: {
  kri: KRIDefinition
  drivers: Driver[]
  onEditThresholds?: () => void
  onAddEntry?: () => void
  onOpenBreaches: () => void
}) {
  const driver = drivers.find((d) => d.id === kri.driverId)
  const { thresholdsFor, isOverridden } = useKRIThresholds()
  const { latestFor, entriesFor } = useKRIEntries()
  const t = thresholdsFor(kri)
  const overridden = isOverridden(kri.id)
  const latest = latestFor(kri.id)
  const history = entriesFor(kri.id)
  const breachEvents = computeBreachHistory(history, t, kri.direction)
  const totalBreaches = breachEvents.length
  const recentBreach = breachEvents.length > 0 ? breachEvents[breachEvents.length - 1] : null
  return (
    <tr id={`kri-${kri.id}`} style={{ borderTop: '1px solid var(--border-color)', scrollMarginTop: 80 }}>
      <Td mono>{kri.id}</Td>
      <Td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{kri.name}</span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            {kri.description}
          </span>
        </div>
      </Td>
      <Td muted>{kri.owner}</Td>
      <Td>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {kri.frequency}
        </span>
      </Td>
      <Td right>
        <NumericValue
          data={{
            ...kri.baselineProvenance,
            value: driver ? driver.adjustedValue : kri.baselineProvenance.value,
          }}
        />
      </Td>
      <Td>
        {latest ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 700 }}>
              {latest.value}{' '}
              <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, fontSize: 10 }}>
                {kri.defaultThresholds.unit}
              </span>
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
              {latest.period} · {latest.enteredBy}
            </span>
          </div>
        ) : onAddEntry ? (
          <button
            onClick={onAddEntry}
            title="Add first manual entry"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              border: '1px dashed var(--border-color)',
              color: 'var(--accent-primary)',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            <PlusCircle size={11} />
            Add value
          </button>
        ) : (
          <span style={{ fontSize: 9, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            no entry yet
          </span>
        )}
        {latest && onAddEntry && (
          <button
            onClick={onAddEntry}
            title="Add or update an entry"
            style={{
              display: 'inline-flex',
              marginTop: 4,
              alignItems: 'center',
              gap: 3,
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: 3,
              padding: '2px 6px',
              fontSize: 9,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            <PlusCircle size={9} />
            New
          </button>
        )}
      </Td>
      <Td center>
        <StatusPill
          value={latest ? latest.value : null}
          thresholds={t}
          direction={kri.direction}
        />
      </Td>
      <Td>
        <KRISparkline
          entries={history}
          thresholds={t}
          direction={kri.direction}
        />
      </Td>
      <Td center>
        <BreachCell
          totalBreaches={totalBreaches}
          recentBreach={recentBreach}
          onClick={onOpenBreaches}
        />
      </Td>
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--risk-medium)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            A:{t.amberBoundary}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--risk-critical)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            R:{t.redBoundary}
          </span>
          {overridden && (
            <span
              title="Overridden — click Edit to view"
              style={{
                fontSize: 8,
                fontWeight: 700,
                background: 'rgba(168,85,247,0.18)',
                color: '#A855F7',
                border: '1px solid rgba(168,85,247,0.45)',
                padding: '0 4px',
                borderRadius: 3,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              custom
            </span>
          )}
          <AppetiteChip kri={kri} />
          {onEditThresholds && (
            <button
              onClick={onEditThresholds}
              title="Edit thresholds"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                borderRadius: 3,
                padding: 3,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Pencil size={10} />
            </button>
          )}
        </div>
      </Td>
      <Td>
        {kri.linkedRiskIds.length === 0 ? (
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            none
          </span>
        ) : (
          <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
            {kri.linkedRiskIds.map((rid) => (
              <Link
                key={rid}
                href={`/risk-register?focus=${rid}`}
                title={`Open ${rid} drill-down`}
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  background: 'var(--bg-primary)',
                  color: 'var(--accent-primary)',
                  border: '1px solid rgba(11, 110, 91,0.4)',
                  padding: '1px 5px',
                  borderRadius: 3,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  textDecoration: 'none',
                }}
              >
                {rid}
              </Link>
            ))}
          </div>
        )}
      </Td>
      <Td>
        <ReliabilityChip tier={kri.baselineProvenance.reliability} />
      </Td>
    </tr>
  )
}

const TIER_META = {
  verified: { label: 'Verified', color: '#22C55E' },
  illustrative: { label: 'Illustrative', color: '#F5C518' },
  placeholder: { label: 'Placeholder', color: '#0A5F4F' },
  ai_hypothesis: { label: 'AI Hypothesis', color: '#A855F7' },
} as const

function StatusPill({
  value,
  thresholds,
  direction,
}: {
  value: number | null
  thresholds: { amberBoundary: number; redBoundary: number; unit: string }
  direction: 'higher_is_better' | 'lower_is_better'
}) {
  if (value === null) {
    return (
      <span
        title="No manual entry yet — add one to compute traffic-light status"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          background: 'rgba(120,120,120,0.18)',
          color: 'var(--text-tertiary)',
          border: '1px solid rgba(120,120,120,0.45)',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        }}
      >
        ⚪ No Data
      </span>
    )
  }
  const status: KRIStatus = computeKRIStatus(value, thresholds, direction)
  const m = STATUS_META[status]
  const dot = status === 'green' ? '🟢' : status === 'amber' ? '🟡' : '🔴'
  return (
    <span
      title={`${m.label} — value ${value} vs amber ${thresholds.amberBoundary}, red ${thresholds.redBoundary}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        background: m.bg,
        color: m.color,
        border: `1px solid ${m.border}`,
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden>{dot}</span>
      {m.label}
    </span>
  )
}

function ReliabilityChip({ tier }: { tier: keyof typeof TIER_META }) {
  const m = TIER_META[tier]
  return (
    <span
      style={{
        display: 'inline-block',
        background: `${m.color}1f`,
        color: m.color,
        border: `1px solid ${m.color}66`,
        padding: '1px 6px',
        borderRadius: 3,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {m.label}
    </span>
  )
}

function Th({ children, right, center }: { children: React.ReactNode; right?: boolean; center?: boolean }) {
  return (
    <th
      style={{
        textAlign: center ? 'center' : right ? 'right' : 'left',
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
  center,
  mono,
  muted,
}: {
  children: React.ReactNode
  right?: boolean
  center?: boolean
  mono?: boolean
  muted?: boolean
}) {
  return (
    <td
      style={{
        textAlign: center ? 'center' : right ? 'right' : 'left',
        padding: '10px 12px',
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

export default function KRIPage() {
  return (
    <SimulationProvider>
      <KRIThresholdsProvider>
        <KRIEntriesProvider>
          <KRIContent />
        </KRIEntriesProvider>
      </KRIThresholdsProvider>
    </SimulationProvider>
  )
}
