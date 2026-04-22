'use client'

/**
 * BoardModeToggle
 * ---------------
 * Small pill-shaped switch shown at the top of the workbench.
 * Flips the app into a 90-second board-demo view via BoardModeContext.
 */

import React from 'react'
import { useBoardMode } from '@/lib/context/BoardModeContext'

export function BoardModeToggle() {
  const { boardMode, toggle } = useBoardMode()

  return (
    <button
      onClick={toggle}
      aria-pressed={boardMode}
      title={boardMode ? 'Switch to full analyst view' : 'Switch to Board Mode (simplified)'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: boardMode ? 'var(--accent-primary)' : 'var(--bg-secondary)',
        color: boardMode ? 'var(--on-accent)' : 'var(--text-secondary)',
        border: '1px solid var(--border-primary)',
        padding: '6px 12px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'background 120ms ease',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: boardMode ? 'var(--on-accent)' : 'var(--text-tertiary)',
        }}
      />
      {boardMode ? 'Board Mode ON' : 'Board Mode'}
    </button>
  )
}
