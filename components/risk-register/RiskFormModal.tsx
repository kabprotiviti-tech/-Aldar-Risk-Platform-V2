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
import { X } from 'lucide-react'
import { useRiskDrafts, type RiskDraft } from '@/lib/context/RiskDraftContext'
import { FINANCIAL_ANCHORS } from '@/lib/engine/seedData'
import type { RiskDef } from '@/lib/engine/types'

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
  const { addDraft, updateDraft, nextDraftId } = useRiskDrafts()
  const [form, setForm] = useState<FormState>(emptyForm('DRAFT-001'))
  const [errors, setErrors] = useState<Record<string, string>>({})

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
              style={inputStyle}
            />
          </Field>

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
