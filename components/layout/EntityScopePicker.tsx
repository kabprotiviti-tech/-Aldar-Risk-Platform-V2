'use client'

/**
 * EntityScopePicker — Block 2 P6
 * --------------------------------
 * Header-mounted dropdown letting CRO / Internal Audit / ARC Chair
 * switch the active subsidiary scope. Champion / Subsidiary CEO see a
 * locked badge (their user record sets the scope at login).
 *
 * Reads/writes PersonaContext.session.entityScope.
 */

import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Lock, Globe2 } from 'lucide-react'
import { usePersona } from '@/lib/context/PersonaContext'
import { SUBSIDIARIES, ENTITIES } from '@/lib/entities/hierarchy'
import type { EntityId } from '@/lib/data/risk-entity-mapping'

const SCOPE_LOCKED_PERSONAS = new Set(['risk-champion', 'subsidiary-ceo'])

export function EntityScopePicker() {
  const { persona, session, setEntityScope } = usePersona()
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

  if (!persona) return null

  const locked = SCOPE_LOCKED_PERSONAS.has(persona.id)
  const currentEntity = session.entityScope
    ? ENTITIES.find((e) => e.id === session.entityScope)
    : null
  const label = currentEntity ? currentEntity.shortName : 'Group'

  if (locked) {
    return (
      <div
        title="Your scope is locked to your user record. Pilot binds this via SSO."
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 7,
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <Lock size={11} />
        <span className="hidden sm:inline">{label}</span>
      </div>
    )
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Switch active subsidiary scope"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 7,
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }}
      >
        <Globe2 size={11} style={{ color: 'var(--accent-primary)' }} />
        <span className="hidden sm:inline">Scope:</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{label}</span>
        <ChevronDown size={11} style={{ color: 'var(--text-tertiary)' }} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            minWidth: 220,
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
            Filter platform views to
          </div>
          <ScopeOption
            label="Group (all subsidiaries)"
            active={!session.entityScope}
            onClick={() => {
              setEntityScope(null)
              setOpen(false)
            }}
          />
          {SUBSIDIARIES.map((s) => (
            <ScopeOption
              key={s.id}
              label={s.shortName}
              hint={s.country}
              accent={s.color}
              active={session.entityScope === s.id}
              onClick={() => {
                setEntityScope(s.id as EntityId)
                setOpen(false)
              }}
            />
          ))}
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
            Switching scope filters Portfolio Tower, Risk Register, and KRI
            views to the selected entity. CRO / IA / ARC default to Group.
          </div>
        </div>
      )}
    </div>
  )
}

function ScopeOption({
  label,
  hint,
  accent,
  active,
  onClick,
}: {
  label: string
  hint?: string
  accent?: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        width: '100%',
        padding: '6px 8px',
        background: active ? 'var(--accent-glow)' : 'transparent',
        border: 'none',
        color: 'var(--text-primary)',
        fontSize: 11,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        borderRadius: 4,
        textAlign: 'left',
      }}
    >
      {accent && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: accent,
            flexShrink: 0,
          }}
        />
      )}
      <span style={{ flex: 1 }}>{label}</span>
      {hint && (
        <span
          style={{
            fontSize: 9,
            color: 'var(--text-tertiary)',
            letterSpacing: 0.4,
          }}
        >
          {hint}
        </span>
      )}
    </button>
  )
}
