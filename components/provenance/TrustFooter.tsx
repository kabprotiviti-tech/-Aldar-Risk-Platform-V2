'use client'

/**
 * TrustFooter — Batch 7
 * ----------------------
 * Single shared footer surfaced on every senior dashboard. States the
 * data status ("Illustrative POC data — pending client validation"),
 * source type, confidence tier, and (optionally) that persona binding
 * is locked to login.
 *
 * Mounting this consistently across CRO / Champion / Sub-CEO / IA /
 * ARC dashboards is part of the CLAUDE.md provenance contract: every
 * surface where a senior reads numbers must declare what those
 * numbers ARE.
 */

import React from 'react'
import { BASELINE_RISK_POSTURE } from '@/lib/data/baselineRiskPosture'

interface TrustFooterProps {
  /** Show the "Persona binding: locked to login" badge. Default true. */
  showPersonaBinding?: boolean
  /** Optional override for the validation note. */
  note?: string
}

export function TrustFooter({ showPersonaBinding = true, note }: TrustFooterProps) {
  return (
    <div
      style={{
        marginTop: 8,
        padding: '8px 12px',
        borderRadius: 6,
        border: '1px dashed var(--border-color)',
        background: 'rgba(245,197,24,0.06)',
        fontSize: 10,
        color: 'var(--text-tertiary)',
        letterSpacing: 0.3,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <span>
        <span style={{ color: '#F5C518', fontWeight: 700, marginRight: 6 }}>●</span>
        {note ?? BASELINE_RISK_POSTURE.validationNote}
      </span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span>
        Source: <strong style={{ color: 'var(--text-secondary)' }}>{BASELINE_RISK_POSTURE.sourceType}</strong>
      </span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span>
        Confidence: <strong style={{ color: 'var(--text-secondary)' }}>{BASELINE_RISK_POSTURE.dataConfidence}</strong>
      </span>
      {showPersonaBinding && (
        <>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>
            Persona: <strong style={{ color: 'var(--accent-primary)' }}>locked to login</strong>
          </span>
        </>
      )}
    </div>
  )
}
