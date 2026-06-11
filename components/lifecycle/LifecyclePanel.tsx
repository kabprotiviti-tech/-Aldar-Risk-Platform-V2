'use client'

/**
 * LifecyclePanel — Phase 0
 * The interactive governance gate for a single risk draft. Drops into the
 * risk detail drawer. Shows the tracker, the gated action (Submit / Approve
 * / Reject / Sign off — only enabled for the right persona), an owner picker
 * on submit, an optional note, and the append-only approval trail.
 *
 * Demo-real: state persists in the browser via RiskDraftContext. No backend.
 */

import React, { useState } from 'react'
import { CheckCircle2, XCircle, Send, Stamp, ShieldCheck } from 'lucide-react'
import { useRiskDrafts, type RiskDraft, type Actor } from '@/lib/context/RiskDraftContext'
import { usePersona } from '@/lib/context/PersonaContext'
import { LifecycleTracker } from './LifecycleBadge'
import {
  type RiskLifecycleState,
  type LifecycleDecision,
  availableDecision,
  canDecide,
  LIFECYCLE_META,
} from '@/lib/lifecycle/riskLifecycle'
import { assignableOwners } from '@/lib/data/erm-users'

const GATE_HINT: Record<LifecycleDecision, string> = {
  submit: 'the Risk Champion / Owner (1st line)',
  approve: 'the Group CRO (2nd line)',
  reject: 'the Group CRO (2nd line)',
  signoff: 'the ARC Chair (governing body)',
}

export function LifecyclePanel({ draft }: { draft: RiskDraft }) {
  const { decide, updateDraft } = useRiskDrafts()
  const { persona, session } = usePersona()
  const personaId = session.personaId
  const [note, setNote] = useState('')
  const [ownerId, setOwnerId] = useState(draft.ownerUserId || '')

  const state = (draft.lifecycle as RiskLifecycleState) || 'draft'
  const primary = availableDecision(state)

  // The actor is whoever is acting NOW (the current persona), not the risk owner.
  const actor: Actor = {
    userId: null,
    name: persona ? persona.title : 'Demo user',
    role: persona ? persona.title : 'Demo',
  }

  function run(decision: LifecycleDecision) {
    if (decision === 'submit' && ownerId && ownerId !== draft.ownerUserId) {
      updateDraft(draft.id, { ownerUserId: ownerId })
    }
    decide(draft.id, decision, actor, note.trim() || undefined)
    setNote('')
  }

  const canPrimary = primary ? canDecide(state, primary, personaId) : false
  const canRejectNow = state === 'under_review' && canDecide(state, 'reject', personaId)

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '14px 16px', background: 'var(--bg-secondary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <ShieldCheck size={15} style={{ color: 'var(--accent-primary)' }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>Governance lifecycle</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-tertiary)' }}>
          Enforced gate · maker → checker → sign-off
        </span>
      </div>

      <div style={{ padding: '6px 4px 14px' }}>
        <LifecycleTracker state={state} />
      </div>

      {/* Owner picker (only meaningful before submit) */}
      {(state === 'draft' || state === 'rejected') && (
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>
            Risk owner (assign)
          </label>
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            style={{ width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12 }}
          >
            <option value="">— select owner —</option>
            {assignableOwners().map((u) => (
              <option key={u.id} value={u.id}>{u.name} · {u.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Note */}
      {primary && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={state === 'under_review' ? 'Reviewer note (optional)…' : 'Note (optional)…'}
          rows={2}
          style={{ width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12, resize: 'vertical', marginBottom: 10 }}
        />
      )}

      {/* Actions */}
      {primary ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ActionButton
            label={primary === 'submit' ? 'Submit for review' : primary === 'approve' ? 'Approve' : 'Sign off & publish'}
            icon={primary === 'submit' ? <Send size={13} /> : primary === 'approve' ? <CheckCircle2 size={13} /> : <Stamp size={13} />}
            tone="primary"
            disabled={!canPrimary || (primary === 'submit' && !ownerId)}
            onClick={() => run(primary)}
          />
          {canRejectNow && (
            <ActionButton label="Send back" icon={<XCircle size={13} />} tone="danger" disabled={false} onClick={() => run('reject')} />
          )}
          {!canPrimary && (
            <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', alignSelf: 'center' }}>
              Only {GATE_HINT[primary]} can do this — switch persona to act.
            </span>
          )}
          {primary === 'submit' && !ownerId && canPrimary && (
            <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', alignSelf: 'center' }}>Assign an owner first.</span>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: LIFECYCLE_META.published.color }}>
          <CheckCircle2 size={15} /> Published to the register — fully approved &amp; signed off.
        </div>
      )}

      {/* Approval trail */}
      {draft.approvals && draft.approvals.length > 0 && (
        <div style={{ marginTop: 14, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 6 }}>Approval trail</div>
          {draft.approvals.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 11, marginBottom: 5 }}>
              <span style={{ color: LIFECYCLE_META[a.to].color, fontWeight: 700, minWidth: 78 }}>{LIFECYCLE_META[a.to].label}</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {a.byName} · {new Date(a.at).toLocaleDateString()}{a.note ? ` — "${a.note}"` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActionButton({ label, icon, tone, disabled, onClick }: { label: string; icon: React.ReactNode; tone: 'primary' | 'danger'; disabled: boolean; onClick: () => void }) {
  const bg = disabled ? 'var(--bg-tertiary)' : tone === 'danger' ? 'rgba(180,35,24,0.1)' : 'var(--accent-primary)'
  const color = disabled ? 'var(--text-tertiary)' : tone === 'danger' ? '#B42318' : '#fff'
  const border = tone === 'danger' ? '1px solid rgba(180,35,24,0.4)' : 'none'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border, background: bg, color, fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {icon}{label}
    </button>
  )
}
