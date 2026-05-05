'use client'

/**
 * RiskFormModal
 * -------------
 * Modal form for creating or editing a risk in Cause-Event-Impact format.
 * - Create mode: opens with empty fields and an auto-generated DRAFT-NNN id
 * - Edit mode: pre-fills with the supplied draft and rewrites it on save
 *
 * Validation: required fields enforced inline; submit disabled until valid.
 *
 * Honors CLAUDE.md: no auto-generation of likelihood/impact scores.
 * Every value is user-attributed; nothing is invented.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useRiskDrafts, type RiskDraft } from '@/lib/context/RiskDraftContext'
import { useSimulation } from '@/lib/context/SimulationContext'
import { FINANCIAL_ANCHORS } from '@/lib/engine/seedData'
import type { RiskDef } from '@/lib/engine/types'

// ── Duplicate-detection helpers ─────────────────────────────────────────
function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Token-based Jaccard similarity, 0..1. Cheap, no external deps. */
function similarity(a: string, b: string): number {
  const ta = new Set(normalize(a).split(/\W+/).filter((t) => t.length >= 3))
  const tb = new Set(normalize(b).split(/\W+/).filter((t) => t.length >= 3))
  if (ta.size === 0 || tb.size === 0) return 0
  let inter = 0
  ta.forEach((t) => { if (tb.has(t)) inter += 1 })
  const union = ta.size + tb.size - inter
  return union === 0 ? 0 : inter / union
}

/** Result of a dup check against the existing register. */
interface DupCheck {
  /** Exact normalized-name match — must block save. */
  exactMatch: { id: string; name: string; source: 'engine' | 'draft' } | null
  /** Similar matches (similarity >= 0.55), shown as warnings. */
  similar: Array<{ id: string; name: string; source: 'engine' | 'draft'; score: number }>
}

type Mode = 'create' | 'edit'

interface Props {
  open: boolean
  mode: Mode
  initial?: RiskDraft | null
  onClose: () => void
  onSaved?: (draft: RiskDraft) => void
}

const CATEGORIES: RiskDef['category'][] = [
  'Strategic',
  'Financial',
  'Operational',
  'Project/Construction',
  'Market/Sales',
  'External/Geopolitical',
]

const ANCHOR_OPTIONS: { key: keyof typeof FINANCIAL_ANCHORS; label: string }[] = [
  { key: 'portfolioRevenueAedMn', label: 'Group Revenue' },
  { key: 'activeProjectGdvAedMn', label: 'Active Project GDV' },
  { key: 'recurringRentalNoiAedMn', label: 'Recurring Rental NOI' },
  { key: 'hospitalityRevenueAedMn', label: 'Hospitality Revenue' },
  { key: 'annualCapexAedMn', label: 'Annual Capex' },
  { key: 'annualOffPlanSalesAedMn', label: 'Off-Plan Sales' },
]

interface FormState {
  id: string
  name: string
  category: RiskDef['category']
  cause: string
  event: string
  impact: string
  baseLikelihood: number
  baseImpact: number
  owner: string
  anchorKey: keyof typeof FINANCIAL_ANCHORS
  sensitivityCoefficient: number
  financialWeight: number
}

function emptyForm(nextId: string): FormState {
  return {
    id: nextId,
    name: '',
    category: 'Operational',
    cause: '',
    event: '',
    impact: '',
    baseLikelihood: 3,
    baseImpact: 3,
    owner: '',
    anchorKey: 'portfolioRevenueAedMn',
    sensitivityCoefficient: 0.05,
    financialWeight: 0.05,
  }
}

function fromDraft(draft: RiskDraft): FormState {
  // Find which anchor this draft maps to (by reference equality)
  let key: keyof typeof FINANCIAL_ANCHORS = 'portfolioRevenueAedMn'
  for (const opt of ANCHOR_OPTIONS) {
    if (FINANCIAL_ANCHORS[opt.key] === draft.financialBaseAedMn) {
      key = opt.key
      break
    }
  }
  return {
    id: draft.id,
    name: draft.name,
    category: draft.category,
    cause: draft.cause,
    event: draft.event,
    impact: draft.impact,
    baseLikelihood: draft.baseLikelihood,
    baseImpact: draft.baseImpact,
    owner: draft.owner,
    anchorKey: key,
    sensitivityCoefficient: draft.sensitivityCoefficient,
    financialWeight: draft.financialWeight,
  }
}

export function RiskFormModal({ open, mode, initial, onClose, onSaved }: Props) {
  const { addDraft, updateDraft, nextDraftId, drafts } = useRiskDrafts()
  const { risks: engineRisks } = useSimulation()
  const [form, setForm] = useState<FormState>(emptyForm('DRAFT-001'))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [overrideSimilar, setOverrideSimilar] = useState(false)

  // Duplicate detection — runs live as user types the name.
  const dupCheck = useMemo<DupCheck>(() => {
    const name = form.name.trim()
    if (name.length < 3) return { exactMatch: null, similar: [] }
    const norm = normalize(name)
    const editingId = mode === 'edit' && initial ? initial.id : null

    type Candidate = { id: string; name: string; source: 'engine' | 'draft' }
    const candidates: Candidate[] = [
      ...engineRisks
        .filter((r) => r.id !== editingId)
        .map<Candidate>((r) => ({ id: r.id, name: r.name, source: 'engine' as const })),
      ...drafts
        .filter((d) => d.id !== editingId)
        .map<Candidate>((d) => ({ id: d.id, name: d.name, source: 'draft' as const })),
    ]

    let exact: DupCheck['exactMatch'] = null
    const similar: DupCheck['similar'] = []
    for (const c of candidates) {
      if (normalize(c.name) === norm) {
        exact = { id: c.id, name: c.name, source: c.source }
        continue
      }
      const score = similarity(name, c.name)
      if (score >= 0.55) {
        similar.push({ ...c, score })
      }
    }
    similar.sort((a, b) => b.score - a.score)
    return { exactMatch: exact, similar: similar.slice(0, 3) }
  }, [form.name, engineRisks, drafts, mode, initial])

  // Reset override flag whenever the name changes
  useEffect(() => {
    setOverrideSimilar(false)
  }, [form.name])

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) setForm(fromDraft(initial))
    else setForm(emptyForm(nextDraftId()))
    setErrors({})
  }, [open, mode, initial, nextDraftId])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  const inherentScore = useMemo(
    () => form.baseLikelihood * form.baseImpact,
    [form.baseLikelihood, form.baseImpact],
  )

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (form.name.trim().length < 5) e.name = 'Name must be at least 5 characters'
    if (form.name.trim().length > 120) e.name = 'Name too long (max 120)'
    // Hard block on exact duplicate
    if (dupCheck.exactMatch) {
      e.name = `Duplicate: a risk with this name already exists (${dupCheck.exactMatch.id} ${dupCheck.exactMatch.source === 'engine' ? '· engine' : '· draft'}). Edit that risk instead, or rename this one.`
    }
    // Soft block on similar — needs override checkbox
    if (!dupCheck.exactMatch && dupCheck.similar.length > 0 && !overrideSimilar) {
      e.name = e.name || 'Possible duplicate detected — review the similar risks below and confirm to proceed.'
    }
    if (form.owner.trim().length < 2) e.owner = 'Owner is required'
    if (form.cause.trim().length < 10) e.cause = 'Cause must be at least 10 characters'
    if (form.event.trim().length < 10) e.event = 'Event must be at least 10 characters'
    if (form.impact.trim().length < 10) e.impact = 'Impact must be at least 10 characters'
    if (form.baseLikelihood < 1 || form.baseLikelihood > 5)
      e.baseLikelihood = 'Likelihood must be 1–5'
    if (form.baseImpact < 1 || form.baseImpact > 5) e.baseImpact = 'Impact must be 1–5'
    if (form.sensitivityCoefficient < 0 || form.sensitivityCoefficient > 1)
      e.sensitivityCoefficient = 'Sensitivity must be 0–1'
    if (form.financialWeight < 0 || form.financialWeight > 1)
      e.financialWeight = 'Weight must be 0–1'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const base: Omit<RiskDraft, 'createdAt' | 'updatedAt' | 'createdBy'> = {
      id: form.id,
      name: form.name.trim(),
      category: form.category,
      cause: form.cause.trim(),
      event: form.event.trim(),
      impact: form.impact.trim(),
      baseLikelihood: form.baseLikelihood,
      baseImpact: form.baseImpact,
      driverImpacts: [],
      controls: [],
      owner: form.owner.trim(),
      financialBaseAedMn: FINANCIAL_ANCHORS[form.anchorKey],
      sensitivityCoefficient: form.sensitivityCoefficient,
      financialWeight: form.financialWeight,
      source: 'manual_entry' as RiskDef['source'],
    }
    let saved: RiskDraft | null = null
    if (mode === 'edit' && initial) {
      saved = updateDraft(initial.id, base)
    } else {
      saved = addDraft(base)
    }
    if (saved && onSaved) onSaved(saved)
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
          zIndex: 9100,
        }}
      />
      <div
        role="dialog"
        aria-label={mode === 'create' ? 'Add new risk' : `Edit ${form.id}`}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(640px, 94vw)',
          maxHeight: '90vh',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 10,
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
          zIndex: 9101,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--accent-primary)',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              {mode === 'create' ? 'Add Risk' : 'Edit Risk'} · Cause–Event–Impact
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, marginTop: 2 }}>
              {form.id}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: 6,
              padding: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Risk Name" error={errors.name} required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Off-plan Buyer Default Spike"
              style={{
                ...inputStyle,
                borderColor: dupCheck.exactMatch
                  ? 'var(--risk-critical)'
                  : dupCheck.similar.length > 0
                  ? 'var(--risk-medium)'
                  : 'var(--border-color)',
              }}
            />
          </Field>

          {/* Duplicate / similar-risk detection panel */}
          {(dupCheck.exactMatch || dupCheck.similar.length > 0) && (
            <div
              style={{
                padding: 10,
                background: dupCheck.exactMatch
                  ? 'rgba(255,59,59,0.10)'
                  : 'rgba(245,197,24,0.10)',
                border: `1px solid ${
                  dupCheck.exactMatch
                    ? 'rgba(255,59,59,0.45)'
                    : 'rgba(245,197,24,0.40)'
                }`,
                borderRadius: 6,
                fontSize: 11,
                display: 'flex',
                gap: 8,
              }}
            >
              <AlertTriangle
                size={14}
                style={{
                  flexShrink: 0,
                  color: dupCheck.exactMatch
                    ? 'var(--risk-critical)'
                    : 'var(--risk-medium)',
                  marginTop: 2,
                }}
              />
              <div style={{ flex: 1, lineHeight: 1.5 }}>
                {dupCheck.exactMatch && (
                  <>
                    <strong style={{ color: 'var(--risk-critical)' }}>
                      Duplicate risk detected.
                    </strong>{' '}
                    A risk with this exact name already exists:{' '}
                    <strong>{dupCheck.exactMatch.id}</strong>{' '}
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      ({dupCheck.exactMatch.source === 'engine' ? 'engine register' : 'existing draft'})
                    </span>{' '}
                    — <em>{dupCheck.exactMatch.name}</em>. Edit that risk instead, or
                    rename this one.
                  </>
                )}
                {!dupCheck.exactMatch && dupCheck.similar.length > 0 && (
                  <>
                    <strong style={{ color: 'var(--risk-medium)' }}>
                      Possible duplicate.
                    </strong>{' '}
                    {dupCheck.similar.length} similar risk
                    {dupCheck.similar.length > 1 ? 's' : ''} already in the register:
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                      {dupCheck.similar.map((s) => (
                        <li key={s.id} style={{ marginBottom: 2 }}>
                          <strong>{s.id}</strong>{' '}
                          <span style={{ color: 'var(--text-tertiary)' }}>
                            ({s.source === 'engine' ? 'engine' : 'draft'},{' '}
                            {(s.score * 100).toFixed(0)}% match)
                          </span>{' '}
                          — {s.name}
                        </li>
                      ))}
                    </ul>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 8,
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={overrideSimilar}
                        onChange={(e) => setOverrideSimilar(e.target.checked)}
                      />
                      Confirm this is a distinct risk and proceed.
                    </label>
                  </>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Category" required>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as RiskDef['category'] })}
                style={inputStyle}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Owner" error={errors.owner} required>
              <input
                type="text"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                placeholder="e.g. Chief Development Officer"
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Cause (root condition)" error={errors.cause} required>
            <textarea
              value={form.cause}
              onChange={(e) => setForm({ ...form, cause: e.target.value })}
              placeholder="e.g. Tightening UAE retail-mortgage criteria + sustained interest-rate elevation"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }}
            />
          </Field>

          <Field label="Event (what happens)" error={errors.event} required>
            <textarea
              value={form.event}
              onChange={(e) => setForm({ ...form, event: e.target.value })}
              placeholder="e.g. Material increase in escrow installment defaults across active off-plan projects"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }}
            />
          </Field>

          <Field label="Impact (consequence to Aldar)" error={errors.impact} required>
            <textarea
              value={form.impact}
              onChange={(e) => setForm({ ...form, impact: e.target.value })}
              placeholder="e.g. Revenue deferral, refund obligations, distressed re-sales, ARC reporting"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Likelihood (1-5)" error={errors.baseLikelihood} required>
              <input
                type="number"
                min={1}
                max={5}
                step={1}
                value={form.baseLikelihood}
                onChange={(e) => setForm({ ...form, baseLikelihood: Number(e.target.value) })}
                style={inputStyle}
              />
            </Field>
            <Field label="Impact (1-5)" error={errors.baseImpact} required>
              <input
                type="number"
                min={1}
                max={5}
                step={1}
                value={form.baseImpact}
                onChange={(e) => setForm({ ...form, baseImpact: Number(e.target.value) })}
                style={inputStyle}
              />
            </Field>
            <Field label="Inherent Score">
              <div
                style={{
                  ...inputStyle,
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 700,
                  color: inherentScore >= 16 ? 'var(--risk-critical)'
                    : inherentScore >= 12 ? 'var(--risk-high)'
                    : inherentScore >= 8 ? 'var(--risk-medium)'
                    : 'var(--risk-low)',
                }}
              >
                {inherentScore} / 25
              </div>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
            <Field label="Financial Anchor" required>
              <select
                value={form.anchorKey}
                onChange={(e) => setForm({ ...form, anchorKey: e.target.value as FormState['anchorKey'] })}
                style={inputStyle}
              >
                {ANCHOR_OPTIONS.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label} (AED {FINANCIAL_ANCHORS[a.key].toLocaleString()} mn)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sensitivity (0-1)" error={errors.sensitivityCoefficient}>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={form.sensitivityCoefficient}
                onChange={(e) => setForm({ ...form, sensitivityCoefficient: Number(e.target.value) })}
                style={inputStyle}
              />
            </Field>
            <Field label="Portfolio Weight" error={errors.financialWeight}>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={form.financialWeight}
                onChange={(e) => setForm({ ...form, financialWeight: Number(e.target.value) })}
                style={inputStyle}
              />
            </Field>
          </div>

          {/* Calibration disclosure */}
          <div
            style={{
              padding: 10,
              background: 'var(--bg-secondary)',
              border: '1px dashed var(--border-color)',
              borderRadius: 6,
              fontSize: 11,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>DRAFT — calibration pending.</strong>{' '}
            New risks are stored locally and shown in the register with a
            DRAFT badge. Driver impacts and controls are wired during pilot
            once the risk is calibrated against engine sensitivities. The
            risk does not yet flow through the scenario simulation engine.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 14,
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            background: 'var(--bg-secondary)',
            borderRadius: '0 0 10px 10px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              padding: '8px 16px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              background: 'var(--accent-primary)',
              color: 'var(--on-accent)',
              border: 'none',
              padding: '8px 18px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            {mode === 'create' ? 'Add Risk' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── helpers ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: 'inherit',
  fontVariantNumeric: 'tabular-nums',
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--risk-critical)', marginLeft: 4 }}>*</span>}
      </span>
      {children}
      {error && (
        <span style={{ fontSize: 10, color: 'var(--risk-critical)', fontStyle: 'italic' }}>
          {error}
        </span>
      )}
    </label>
  )
}
