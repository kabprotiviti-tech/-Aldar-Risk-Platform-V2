'use client'

/**
 * Modal — small primitive that handles the boring stuff:
 *   - fixed-position backdrop with blur
 *   - Esc key closes
 *   - click outside closes
 *   - z-index ladder consistent across all modals
 *   - aria-modal + role="dialog" + aria-label
 *   - body scroll lock while open
 *
 * Future modals (D6 breach log, D8 risk-appetite, etc.) should use this
 * instead of re-implementing the pattern. Existing modals (RiskFormModal,
 * RiskDetailDrawer, KRIThresholdEditor, KRIEntryEditor) can migrate
 * incrementally — they work fine today.
 *
 * Usage:
 *   <Modal open={open} onClose={onClose} ariaLabel="Add risk">
 *     <YourContent />
 *   </Modal>
 */

import React, { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  ariaLabel: string
  children: React.ReactNode
  /** Width preset. 'auto' lets the child decide. */
  size?: 'sm' | 'md' | 'lg' | 'auto'
  /** Disables click-outside-to-close. Esc still works. */
  noBackdropClose?: boolean
  /** Override the default z-index (9100 backdrop / 9101 panel). */
  zIndex?: number
}

const SIZE_MAX_WIDTH: Record<NonNullable<Props['size']>, string | undefined> = {
  sm: 'min(420px, 94vw)',
  md: 'min(560px, 94vw)',
  lg: 'min(800px, 94vw)',
  auto: undefined,
}

export function Modal({
  open,
  onClose,
  ariaLabel,
  children,
  size = 'md',
  noBackdropClose = false,
  zIndex = 9100,
}: Props) {
  // Esc to close
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const maxWidth = SIZE_MAX_WIDTH[size]

  return (
    <>
      <div
        onClick={() => {
          if (!noBackdropClose) onClose()
        }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
          zIndex,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxHeight: '90vh',
          width: maxWidth,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 10,
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
          zIndex: zIndex + 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </>
  )
}
