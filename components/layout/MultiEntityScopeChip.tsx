'use client'

/**
 * MultiEntityScopeChip — Header companion to EntityScopePicker
 * -------------------------------------------------------------
 * Lets a user pick multiple subsidiary entities at once. Compatible
 * with the single-scope EntityScopePicker — both surfaces work side
 * by side and `useMultiEntityScope().inScopeRisk()` does the right
 * thing whether 0, 1, or many entities are selected.
 *
 * Hidden for personas whose scope is locked at login (Champion,
 * Sub-CEO single-entity).
 */

import React, { useEffect, useRef, useState } from 'react'
import { Layers, ChevronDown, X } from 'lucide-react'
import { usePersona } from '@/lib/context/PersonaContext'
import { useMultiEntityScope } from '@/lib/context/MultiEntityScopeContext'
import { SUBSIDIARIES } from '@/lib/entities/hierarchy'
import type { EntityId } from '@/lib/data/risk-entity-mapping'

const LOCKED = new Set(['risk-champion'])

export function MultiEntityScopeChip() {
  const { persona } = usePersona()
  const { scopes, isMultiActive, toggle, clear } = useMultiEntityScope()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handle)
    return () => window.removeEventListener('mousedown', handle)
  }, [open])

  if (!persona || LOCKED.has(persona.id)) return null

  const label = isMultiActive ? `+${scopes.length} subs` : 'Multi'

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={isMultiActive ? `Cross-entity scope: ${scopes.join(', ')}` : 'Add cross-entity scope'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 10px',
          background: isMultiActive ? 'var(--accent-glow)' : 'var(--bg-card)',
          border: `1px solid ${isMultiActive ? 'var(--border-accent)' : 'var(--border-color)'}`,
          borderRadius: 7,
          fontSize: '0.7rem',
          fontWeight: 600,
          color: isMultiActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }}
      >
        <Layers size={11} style={{ color: 'var(--accent-primary)' }} />
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown size={11} style={{ color: 'var(--text-tertiary)' }} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            minWidth: 240,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            boxShadow: '0 16px 32px rgba(0,0,0,0.45)',
            padding: 6,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: '4px 8px',
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            Cross-entity scope
          </div>
          {SUBSIDIARIES.map((s) => {
            const checked = scopes.includes(s.id as EntityId)
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id as EntityId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '6px 8px',
                  background: checked ? 'var(--accent-glow)' : 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 11,
                  fontWeight: checked ? 700 : 500,
                  cursor: 'pointer',
                  borderRadius: 4,
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    border: `1px solid ${checked ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background: checked ? 'var(--accent-primary)' : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  {checked && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>✓</span>}
                </span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{s.shortName}</span>
                <span style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: 0.4 }}>{s.country}</span>
              </button>
            )
          })}
          {isMultiActive && (
            <button
              onClick={() => {
                clear()
                setOpen(false)
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 6,
                padding: '5px 8px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <X size={10} /> Clear multi-scope
            </button>
          )}
          <div
            style={{
              padding: '6px 8px 2px',
              marginTop: 4,
              borderTop: '1px solid var(--border-color)',
              fontSize: 9,
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            Select multiple subsidiaries to filter Portfolio Tower, Risk
            Register, KRIs across a cross-entity view. Group-level risks
            always remain visible.
          </div>
        </div>
      )}
    </div>
  )
}
