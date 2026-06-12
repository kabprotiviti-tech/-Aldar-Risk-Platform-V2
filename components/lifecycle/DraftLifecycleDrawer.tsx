'use client'

/**
 * DraftLifecycleDrawer — Phase 0
 * Slide-in panel for driving a drafted risk through the governance gate.
 * Kept separate from the engine-risk RiskDetailDrawer (different data shape)
 * so the existing drawer is untouched.
 */

import React from 'react'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import type { RiskDraft } from '@/lib/context/RiskDraftContext'
import { LifecyclePanel } from './LifecyclePanel'
import { LifecycleBadge } from './LifecycleBadge'
import { getUser } from '@/lib/data/erm-users'
import type { RiskLifecycleState } from '@/lib/lifecycle/riskLifecycle'

export function DraftLifecycleDrawer({ draft, onClose }: { draft: RiskDraft | null; onClose: () => void }) {
  if (!draft) return null
  const owner = getUser(draft.ownerUserId)
  return (
    <>
      <motion.div
        onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 60 }}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(460px, 94vw)',
          background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-color)',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.2)', zIndex: 61, overflowY: 'auto', padding: '18px 18px 40px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-tertiary)' }}>{draft.id}</span>
              <LifecycleBadge state={(draft.lifecycle as RiskLifecycleState) || 'draft'} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{draft.name}</h3>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
              {draft.category}{owner ? ` · Owner: ${owner.name} (${owner.title})` : draft.owner ? ` · Owner: ${draft.owner}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
            <X size={18} />
          </button>
        </div>

        {draft.cause && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
            <strong>Cause:</strong> {draft.cause}<br />
            {draft.event && <><strong>Event:</strong> {draft.event}<br /></>}
            {draft.impact && <><strong>Impact:</strong> {draft.impact}</>}
          </div>
        )}

        <LifecyclePanel draft={draft} />
      </motion.div>
    </>
  )
}
