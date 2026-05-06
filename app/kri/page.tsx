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
import { Pencil } from 'lucide-react'
import { SimulationProvider, useSimulation } from '@/lib/context/SimulationContext'
import {
  KRIThresholdsProvider,
  useKRIThresholds,
} from '@/lib/context/KRIThresholdsContext'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { NumericValue } from '@/components/provenance/NumericValue'
import { KRIThresholdEditor } from '@/components/kri/KRIThresholdEditor'
import { KRI_DEFINITIONS, type KRIDefinition } from '@/lib/data/kri-definitions'
import type { Driver } from '@/lib/engine/types'

function KRIContent() {
  const { drivers } = useSimulation()
  const [editingKriId, setEditingKriId] = useState<string | null>(null)
  const editingKri = editingKriId
    ? KRI_DEFINITIONS.find((k) => k.id === editingKriId) ?? null
    : null

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
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
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
            The 8 KRIs Aldar tracks across the development, investment,
            and sales pipelines. Current values flow from the simulation
            engine drivers; thresholds are user-editable per KRI and
            persist locally. Manual entry, traffic-light status, breach
            events and trend charts ship in patches D3–D7. Risk-appetite
            linkage ships in D8.
          </p>
        </div>
        <StatusBadge tier="MVP" note={`${KRI_DEFINITIONS.length} KRIs · thresholds in D2`} />
      </div>

      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--bg-primary)' }}>
              <Th>ID</Th>
              <Th>KRI Name</Th>
              <Th>Owner</Th>
              <Th>Frequency</Th>
              <Th right>Current Value</Th>
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
                onEditThresholds={() => setEditingKriId(kri.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          padding: '4px 0',
        }}
      >
        Most baseline values are normalized indices (100 = budget / plan)
        — click ⓘ on any value to see source and calibration plan. Live
        feeds from Aldar PMS / Yardi / SAP are wired in pilot.
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
    </div>
  )
}

function KRIRow({
  kri,
  drivers,
  onEditThresholds,
}: {
  kri: KRIDefinition
  drivers: Driver[]
  onEditThresholds: () => void
}) {
  const driver = drivers.find((d) => d.id === kri.driverId)
  const { thresholdsFor, isOverridden } = useKRIThresholds()
  const t = thresholdsFor(kri)
  const overridden = isOverridden(kri.id)
  return (
    <tr style={{ borderTop: '1px solid var(--border-color)' }}>
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
              <span
                key={rid}
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '1px 5px',
                  borderRadius: 3,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {rid}
              </span>
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
  placeholder: { label: 'Placeholder', color: '#FF8C00' },
  ai_hypothesis: { label: 'AI Hypothesis', color: '#A855F7' },
} as const

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

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
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
        <KRIContent />
      </KRIThresholdsProvider>
    </SimulationProvider>
  )
}
