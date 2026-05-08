'use client'

/**
 * Risk Appetite Statements — Module 9 (G1)
 * -----------------------------------------
 * Group ERM Head + ARC view: every group-level appetite statement on
 * one screen, grouped by category, with override → audit trail.
 *
 * Demo flow:
 *   - "Show me what we said we tolerate" → /risk-appetite
 *   - Group ERM Head edits a statement → audit trail captures it
 *   - ARC sign-off date and approving body shown per statement
 *
 * Honors CLAUDE.md: every statement is illustrative until ARC signs the
 * pilot framework; banner says so. Edits are user-attributed via the
 * actor field on the override and a system audit event.
 */

import React, { useMemo, useState } from 'react'
import { ShieldQuestion, Pencil, RotateCcw } from 'lucide-react'
import {
  RiskAppetiteProvider,
  useRiskAppetite,
} from '@/lib/context/RiskAppetiteContext'
import {
  APPETITE_CATEGORY_META,
  APPETITE_LEVEL_META,
  type AppetiteCategory,
  type AppetiteLevel,
  type GroupAppetiteStatement,
} from '@/lib/data/group-appetite-statements'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'
import { Modal } from '@/components/ui/Modal'

const CATEGORY_ORDER: AppetiteCategory[] = [
  'financial',
  'strategic',
  'operational',
  'compliance',
  'reputational',
  'esg',
]

function RiskAppetiteContent() {
  const { allEffective, isOverridden, setOverride, resetOverride } = useRiskAppetite()
  const statements = allEffective()
  const [editing, setEditing] = useState<GroupAppetiteStatement | null>(null)

  const grouped = useMemo(() => {
    const m = new Map<AppetiteCategory, GroupAppetiteStatement[]>()
    for (const cat of CATEGORY_ORDER) m.set(cat, [])
    for (const s of statements) m.get(s.category)?.push(s)
    return m
  }, [statements])

  const overriddenCount = statements.filter((s) => isOverridden(s.id)).length

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <IllustrativeDataBanner
        pilotFeeds="Approved appetite framework signed off by Aldar Audit & Risk Committee."
      />

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
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ShieldQuestion size={20} style={{ color: 'var(--accent-primary)' }} />
            Risk Appetite Statements
          </h1>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
              maxWidth: 800,
              lineHeight: 1.55,
            }}
          >
            The qualitative appetite framework above the per-KRI quantitative
            thresholds. Each statement is sanctioned by the ARC or Board and
            anchors why the amber/red boundaries on /kri are what they are.
            Group ERM Head can edit; every change is captured on the Audit
            Trail.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge
            tier="MVP"
            note={`${statements.length} statements${overriddenCount > 0 ? ` · ${overriddenCount} edited` : ''}`}
          />
        </div>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const list = grouped.get(cat) || []
        if (list.length === 0) return null
        const meta = APPETITE_CATEGORY_META[cat]
        return (
          <section
            key={cat}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: meta.color,
                }}
              />
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                {meta.label}
              </h2>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                — {meta.description}
              </span>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {list.map((s) => (
                <AppetiteCard
                  key={s.id}
                  s={s}
                  overridden={isOverridden(s.id)}
                  onEdit={() => setEditing(s)}
                  onReset={() => resetOverride(s.id)}
                />
              ))}
            </div>
          </section>
        )
      })}

      {editing && (
        <EditAppetiteModal
          statement={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            setOverride(editing.id, patch)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function AppetiteCard({
  s,
  overridden,
  onEdit,
  onReset,
}: {
  s: GroupAppetiteStatement
  overridden: boolean
  onEdit: () => void
  onReset: () => void
}) {
  const lvl = APPETITE_LEVEL_META[s.level]
  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${lvl.color}`,
        borderRadius: 6,
        padding: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 10,
                color: 'var(--text-tertiary)',
                fontWeight: 600,
                letterSpacing: 0.4,
              }}
            >
              {s.id}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {s.title}
            </span>
            <span
              title={lvl.description}
              style={{
                background: `${lvl.color}1f`,
                color: lvl.color,
                border: `1px solid ${lvl.color}66`,
                padding: '2px 8px',
                borderRadius: 3,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {lvl.label}
            </span>
            {overridden && (
              <span
                title="This statement has been edited from its default"
                style={{
                  background: 'rgba(255,102,0,0.16)',
                  color: 'var(--accent-primary)',
                  border: '1px solid rgba(255,102,0,0.4)',
                  padding: '1px 6px',
                  borderRadius: 3,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                Edited
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onEdit}
            title="Edit appetite statement"
            style={iconBtnStyle}
          >
            <Pencil size={12} />
            Edit
          </button>
          {overridden && (
            <button
              onClick={onReset}
              title="Revert to default"
              style={{
                ...iconBtnStyle,
                color: 'var(--text-tertiary)',
              }}
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
        </div>
      </div>

      <p
        style={{
          fontSize: 13,
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          margin: '0 0 10px',
        }}
      >
        {s.statement}
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: 10,
          color: 'var(--text-tertiary)',
          paddingTop: 8,
          borderTop: '1px dashed var(--border-color)',
        }}
      >
        <span>
          <strong style={{ color: 'var(--text-secondary)' }}>Approved by:</strong>{' '}
          {s.approvedBy}
        </span>
        <span>
          <strong style={{ color: 'var(--text-secondary)' }}>Last reviewed:</strong>{' '}
          {s.lastReviewed}
        </span>
        {s.linkedKRIs.length > 0 && (
          <span>
            <strong style={{ color: 'var(--text-secondary)' }}>Linked KRIs:</strong>{' '}
            {s.linkedKRIs.join(', ')}
          </span>
        )}
      </div>
    </div>
  )
}

function EditAppetiteModal({
  statement,
  onClose,
  onSave,
}: {
  statement: GroupAppetiteStatement
  onClose: () => void
  onSave: (patch: {
    statement: string
    level: AppetiteLevel
    approvedBy: string
    lastReviewed: string
  }) => void
}) {
  const [text, setText] = useState(statement.statement)
  const [level, setLevel] = useState<AppetiteLevel>(statement.level)
  const [approvedBy, setApprovedBy] = useState(statement.approvedBy)
  const [lastReviewed, setLastReviewed] = useState(statement.lastReviewed)

  return (
    <Modal open onClose={onClose} ariaLabel={`Edit ${statement.id}`} size="lg">
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
            Edit Risk Appetite — {statement.id}
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {statement.title}
          </h3>
        </div>

        <label style={labelStyle}>
          <span>Appetite Statement</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={labelStyle}>
            <span>Appetite Level</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as AppetiteLevel)}
              style={inputStyle}
            >
              {(['averse', 'minimal', 'cautious', 'open', 'eager'] as AppetiteLevel[]).map((l) => (
                <option key={l} value={l}>
                  {APPETITE_LEVEL_META[l].label}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            <span>Last Reviewed</span>
            <input
              type="date"
              value={lastReviewed}
              onChange={(e) => setLastReviewed(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        <label style={labelStyle}>
          <span>Approved By</span>
          <input
            type="text"
            value={approvedBy}
            onChange={(e) => setApprovedBy(e.target.value)}
            placeholder="e.g. Audit & Risk Committee"
            style={inputStyle}
          />
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6 }}>
          <button onClick={onClose} style={btnSecondaryStyle}>
            Cancel
          </button>
          <button
            onClick={() => onSave({ statement: text, level, approvedBy, lastReviewed })}
            disabled={!text.trim() || !approvedBy.trim() || !lastReviewed}
            style={btnPrimaryStyle}
          >
            Save & Audit
          </button>
        </div>
      </div>
    </Modal>
  )
}

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-color)',
  padding: '4px 10px',
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  cursor: 'pointer',
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
  cursor: 'pointer',
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

export default function RiskAppetitePage() {
  return (
    <RiskAppetiteProvider>
      <RiskAppetiteContent />
    </RiskAppetiteProvider>
  )
}
