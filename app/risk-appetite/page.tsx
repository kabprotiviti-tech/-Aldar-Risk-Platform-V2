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
import { ShieldQuestion, Pencil, RotateCcw, Check, X, Clock } from 'lucide-react'
import {
  RiskAppetiteProvider,
  useRiskAppetite,
  type AppetiteOverride,
} from '@/lib/context/RiskAppetiteContext'
import {
  APPETITE_CATEGORY_META,
  APPETITE_LEVEL_META,
  type AppetiteCategory,
  type AppetiteLevel,
  type GroupAppetiteStatement,
} from '@/lib/data/group-appetite-statements'
import { usePersona } from '@/lib/context/PersonaContext'
import { can } from '@/lib/rbac/policy'
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
  const {
    allEffective,
    isOverridden,
    hasPending,
    pendingProposals,
    proposeChange,
    approveProposal,
    rejectProposal,
    resetOverride,
  } = useRiskAppetite()
  const { persona } = usePersona()
  const canPropose = can(persona?.id ?? null, 'appetite:propose')
  const canApprove = can(persona?.id ?? null, 'appetite:approve')
  const canReset = can(persona?.id ?? null, 'appetite:reset')
  const statements = allEffective()
  const [editing, setEditing] = useState<GroupAppetiteStatement | null>(null)
  const pending = pendingProposals()

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
        pilotFeeds="Approved appetite framework signed off by ABC Audit & Risk Committee."
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
            note={`${statements.length} statements${overriddenCount > 0 ? ` · ${overriddenCount} approved overrides` : ''}${pending.length > 0 ? ` · ${pending.length} pending approval` : ''}`}
          />
        </div>
      </div>

      {/* Pending approval queue */}
      {pending.length > 0 && (
        <section
          style={{
            background: 'rgba(245,197,24,0.08)',
            border: '1px solid rgba(245,197,24,0.40)',
            borderLeft: '4px solid #F5C518',
            borderRadius: 8,
            padding: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Clock size={14} style={{ color: '#F5C518' }} />
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#F5C518',
                letterSpacing: 0.6,
                textTransform: 'uppercase',
              }}
            >
              Pending Approval ({pending.length})
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
              ARC Chair / Group ERM Head reviews each proposal before it becomes effective.
            </div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {pending.map((p) => {
              const base = statements.find((s) => s.id === p.id)
              if (!base) return null
              return (
                <PendingProposalCard
                  key={p.id}
                  baseStatement={base}
                  override={p.override}
                  canApprove={canApprove}
                  onApprove={() => approveProposal(p.id)}
                  onReject={() => {
                    const reason = window.prompt(
                      `Reject proposal for ${p.id}? Optional reason:`,
                      '',
                    )
                    if (reason === null) return
                    rejectProposal(p.id, undefined, reason || undefined)
                  }}
                />
              )
            })}
          </div>
        </section>
      )}

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
                  pending={hasPending(s.id)}
                  canPropose={canPropose}
                  canReset={canReset}
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
            proposeChange(editing.id, patch)
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
  pending,
  canPropose,
  canReset,
  onEdit,
  onReset,
}: {
  s: GroupAppetiteStatement
  overridden: boolean
  pending: boolean
  canPropose: boolean
  canReset: boolean
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
                title="An approved override is currently effective"
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
                Approved Override
              </span>
            )}
            {pending && (
              <span
                title="A change has been proposed and is awaiting approval"
                style={{
                  background: 'rgba(245,197,24,0.16)',
                  color: '#F5C518',
                  border: '1px solid rgba(245,197,24,0.55)',
                  padding: '1px 6px',
                  borderRadius: 3,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                Pending Approval
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {canPropose && (
            <button
              onClick={onEdit}
              title={pending ? 'Replace pending proposal' : 'Propose change to appetite statement'}
              style={iconBtnStyle}
            >
              <Pencil size={12} />
              {pending ? 'Re-propose' : 'Propose Change'}
            </button>
          )}
          {overridden && canReset && (
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

function PendingProposalCard({
  baseStatement,
  override,
  canApprove,
  onApprove,
  onReject,
}: {
  baseStatement: GroupAppetiteStatement
  override: AppetiteOverride
  canApprove: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const proposedLevel = override.level ?? baseStatement.level
  const lvl = APPETITE_LEVEL_META[proposedLevel]
  const baseLvl = APPETITE_LEVEL_META[baseStatement.level]
  const levelChanged = override.level && override.level !== baseStatement.level
  const statementChanged =
    override.statement !== undefined && override.statement !== baseStatement.statement
  const approvedByChanged =
    override.approvedBy !== undefined && override.approvedBy !== baseStatement.approvedBy
  const reviewedChanged =
    override.lastReviewed !== undefined && override.lastReviewed !== baseStatement.lastReviewed

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
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 10,
                color: 'var(--text-tertiary)',
                fontWeight: 600,
              }}
            >
              {baseStatement.id}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              {baseStatement.title}
            </span>
            <span
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
              Proposed: {lvl.label}
              {levelChanged && (
                <span style={{ color: 'var(--text-tertiary)', marginLeft: 4 }}>
                  (was {baseLvl.label})
                </span>
              )}
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            Proposed by {override.proposedBy ?? 'unknown'}{' '}
            {override.proposedAt
              ? `· ${new Date(override.proposedAt).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })}`
              : null}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {canApprove ? (
            <>
              <button
                onClick={onApprove}
                style={{
                  ...iconBtnStyle,
                  background: '#22C55E',
                  color: '#fff',
                  border: '1px solid #22C55E',
                }}
                title="Approve — proposal becomes the effective statement"
              >
                <Check size={12} />
                Approve
              </button>
              <button
                onClick={onReject}
                style={{
                  ...iconBtnStyle,
                  background: 'transparent',
                  color: 'var(--risk-critical)',
                  border: '1px solid var(--risk-critical)',
                }}
                title="Reject — proposal is discarded; default remains effective"
              >
                <X size={12} />
                Reject
              </button>
            </>
          ) : (
            <span
              title="Only Group CRO / ARC Chair can approve appetite proposals"
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                padding: '4px 8px',
                border: '1px solid var(--border-color)',
                borderRadius: 3,
              }}
            >
              Awaiting CRO / ARC Chair
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          fontSize: 11,
          lineHeight: 1.55,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Current (effective)
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>{baseStatement.statement}</div>
        </div>
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#F5C518',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Proposed{statementChanged ? '' : ' (no change)'}
          </div>
          <div
            style={{
              color: statementChanged ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontStyle: statementChanged ? 'normal' : 'italic',
            }}
          >
            {override.statement ?? baseStatement.statement}
          </div>
        </div>
      </div>

      {(approvedByChanged || reviewedChanged) && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            paddingTop: 8,
            marginTop: 8,
            borderTop: '1px dashed var(--border-color)',
            fontSize: 10,
            color: 'var(--text-tertiary)',
          }}
        >
          {approvedByChanged && (
            <span>
              <strong style={{ color: 'var(--text-secondary)' }}>Approved-by →</strong>{' '}
              {override.approvedBy}
            </span>
          )}
          {reviewedChanged && (
            <span>
              <strong style={{ color: 'var(--text-secondary)' }}>Last-reviewed →</strong>{' '}
              {override.lastReviewed}
            </span>
          )}
        </div>
      )}
    </div>
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
