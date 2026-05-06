'use client'

/**
 * MitigationActionsSection
 * ------------------------
 * Compact CRUD table for mitigation actions on a single risk. Embedded
 * inside the RiskDetailDrawer.
 *
 * Status: Open · In Progress · Closed (+ auto-Overdue chip when due date
 * has passed and status is not closed).
 */

import React, { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import {
  useMitigationActions,
  type MitigationAction,
  type ActionStatus,
} from '@/lib/context/MitigationActionsContext'

interface Props {
  riskId: string
}

const STATUS_META: Record<ActionStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'var(--text-secondary)' },
  in_progress: { label: 'In Progress', color: 'var(--accent-primary)' },
  closed: { label: 'Closed', color: 'var(--risk-low)' },
}

interface FormState {
  name: string
  owner: string
  dueDate: string
  status: ActionStatus
  description: string
}

const emptyForm: FormState = {
  name: '',
  owner: '',
  dueDate: '',
  status: 'open',
  description: '',
}

export function MitigationActionsSection({ riskId }: Props) {
  const { actionsForRisk, addAction, updateAction, removeAction, isOverdue } =
    useMitigationActions()
  const actions = actionsForRisk(riskId)

  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  function startAdd() {
    setForm(emptyForm)
    setEditingId(null)
    setAdding(true)
  }

  function startEdit(a: MitigationAction) {
    setForm({
      name: a.name,
      owner: a.owner,
      dueDate: a.dueDate,
      status: a.status,
      description: a.description || '',
    })
    setEditingId(a.id)
    setAdding(true)
  }

  function cancel() {
    setAdding(false)
    setEditingId(null)
  }

  function save() {
    if (form.name.trim().length < 3) return
    if (form.owner.trim().length < 2) return
    if (!form.dueDate) return

    if (editingId) {
      updateAction(editingId, {
        riskId,
        name: form.name.trim(),
        owner: form.owner.trim(),
        dueDate: form.dueDate,
        status: form.status,
        description: form.description.trim() || undefined,
      })
    } else {
      addAction({
        riskId,
        name: form.name.trim(),
        owner: form.owner.trim(),
        dueDate: form.dueDate,
        status: form.status,
        description: form.description.trim() || undefined,
      })
    }
    cancel()
  }

  const formValid =
    form.name.trim().length >= 3 &&
    form.owner.trim().length >= 2 &&
    !!form.dueDate

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            margin: 0,
          }}
        >
          Mitigation Actions ({actions.length})
        </h3>
        {!adding && (
          <button
            onClick={startAdd}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              border: '1px solid var(--border-color)',
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
            <Plus size={11} />
            Add Action
          </button>
        )}
      </div>

      {/* Empty state */}
      {actions.length === 0 && !adding && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            fontStyle: 'italic',
            padding: '8px 0',
          }}
        >
          No mitigation actions tracked for this risk yet.
        </div>
      )}

      {/* Actions list */}
      {actions.map((a) => {
        const overdue = isOverdue(a)
        const statusMeta = STATUS_META[a.status]
        return (
          <div
            key={a.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 6,
              padding: '8px 10px',
              background: 'var(--bg-secondary)',
              border: `1px solid ${overdue ? 'rgba(255,59,59,0.45)' : 'var(--border-color)'}`,
              borderRadius: 6,
              fontSize: 11,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {a.name}
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--text-tertiary)' }}>
                  Owner: <strong style={{ color: 'var(--text-secondary)' }}>{a.owner}</strong>
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  Due: <strong style={{ color: overdue ? 'var(--risk-critical)' : 'var(--text-secondary)' }}>{a.dueDate}</strong>
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    background: `${statusMeta.color}1f`,
                    color: statusMeta.color,
                    border: `1px solid ${statusMeta.color}55`,
                    padding: '1px 6px',
                    borderRadius: 3,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {statusMeta.label}
                </span>
                {overdue && (
                  <span
                    style={{
                      display: 'inline-block',
                      background: 'rgba(255,59,59,0.18)',
                      color: 'var(--risk-critical)',
                      border: '1px solid rgba(255,59,59,0.45)',
                      padding: '1px 6px',
                      borderRadius: 3,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    Overdue
                  </span>
                )}
              </div>
              {a.description && (
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                  {a.description}
                </span>
              )}
            </div>
            <div style={{ display: 'inline-flex', gap: 4 }}>
              <button
                onClick={() => startEdit(a)}
                title="Edit action"
                style={iconBtnStyle}
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete action "${a.name}"?`)) removeAction(a.id)
                }}
                title="Delete action"
                style={{ ...iconBtnStyle, color: 'var(--risk-critical)' }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        )
      })}

      {/* Add / Edit form */}
      {adding && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 10,
            background: 'var(--bg-hover)',
            border: '1px dashed var(--accent-primary)',
            borderRadius: 6,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Action name" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Tighten escrow installment monitoring"
                style={inputStyle}
              />
            </Field>
            <Field label="Owner" required>
              <input
                type="text"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                placeholder="e.g. Head of Treasury"
                style={inputStyle}
              />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Due date" required>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ActionStatus })}
                style={inputStyle}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </Field>
          </div>
          <Field label="Description (optional)">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief context or expected outcome"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 44 }}
            />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button
              onClick={cancel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                borderRadius: 4,
                padding: '5px 10px',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}
            >
              <X size={11} />
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!formValid}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: formValid ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: formValid ? 'var(--on-accent)' : 'var(--text-tertiary)',
                border: 'none',
                borderRadius: 4,
                padding: '5px 12px',
                fontSize: 10,
                fontWeight: 700,
                cursor: formValid ? 'pointer' : 'not-allowed',
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}
            >
              <Check size={11} />
              {editingId ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

// ── tiny helpers ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 4,
  color: 'var(--text-primary)',
  padding: '5px 8px',
  fontSize: 11,
  fontFamily: 'inherit',
}

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  borderRadius: 3,
  padding: 3,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--risk-critical)', marginLeft: 3 }}>*</span>}
      </span>
      {children}
    </label>
  )
}
