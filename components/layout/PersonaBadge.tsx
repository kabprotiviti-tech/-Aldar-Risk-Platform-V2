'use client'

/**
 * PersonaBadge — Block 2 P2
 * --------------------------
 * Header chip showing the logged-in persona + entity scope, with a
 * dropdown for Switch persona (→ /login) and Logout. Reads
 * PersonaContext; renders an unobtrusive "Sign in" link when no persona
 * is set (visiting any non-login page without a session).
 */

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Crown,
  Briefcase,
  Building2,
  ClipboardCheck,
  Gavel,
  ChevronDown,
  LogOut,
  RefreshCw,
  UserCircle2,
  type LucideIcon,
} from 'lucide-react'
import { usePersona } from '@/lib/context/PersonaContext'
import type { PersonaId } from '@/lib/personas'
import { getEntity } from '@/lib/entities/hierarchy'

const PERSONA_ICONS: Record<PersonaId, LucideIcon> = {
  'group-cro': Crown,
  'risk-champion': Briefcase,
  'subsidiary-ceo': Building2,
  'internal-audit': ClipboardCheck,
  'arc-chair': Gavel,
}

const PERSONA_ACCENT: Record<PersonaId, string> = {
  'group-cro': '#FF6600',
  'risk-champion': '#2D9EFF',
  'subsidiary-ceo': '#A855F7',
  'internal-audit': '#22C55E',
  'arc-chair': '#F5C518',
}

export function PersonaBadge() {
  const router = useRouter()
  const { session, persona, isAuthenticated, logout } = usePersona()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  // Close on outside click
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

  if (!isAuthenticated || !persona) {
    return (
      <button
        onClick={() => router.push('/login')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: 7,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-accent)',
          color: 'var(--accent-primary)',
          fontSize: '0.72rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <UserCircle2 size={13} />
        <span>Sign in</span>
      </button>
    )
  }

  const Icon = PERSONA_ICONS[persona.id]
  const accent = PERSONA_ACCENT[persona.id]
  const entity = session.entityScope ? getEntity(session.entityScope) : null
  const scopeLabel = entity ? entity.shortName : 'Group'

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={`Logged in as ${persona.title} (${scopeLabel})`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          borderRadius: 7,
          background: 'var(--bg-card)',
          border: `1px solid ${accent}66`,
          color: 'var(--text-primary)',
          fontSize: '0.72rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            borderRadius: 4,
            background: `${accent}22`,
            color: accent,
            flexShrink: 0,
          }}
        >
          <Icon size={11} />
        </span>
        <span className="hidden sm:inline" style={{ color: accent }}>
          {persona.title}
        </span>
        <span
          className="hidden md:inline"
          style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.62rem',
            letterSpacing: 0.4,
          }}
        >
          · {scopeLabel}
        </span>
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
            padding: 8,
            zIndex: 100,
          }}
        >
          {/* Identity header */}
          <div
            style={{
              padding: '6px 8px 10px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: accent,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              {persona.line}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {persona.title}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Scope: <strong style={{ color: 'var(--text-secondary)' }}>{scopeLabel}</strong>
            </div>
            {session.displayName && (
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
                {session.displayName}
              </div>
            )}
          </div>

          {/* Actions */}
          <button
            onClick={() => {
              setOpen(false)
              logout()
              router.push('/login')
            }}
            style={menuItemStyle}
          >
            <RefreshCw size={11} />
            <span style={{ flex: 1 }}>Switch persona</span>
          </button>
          <button
            onClick={() => {
              setOpen(false)
              logout()
              router.push('/login')
            }}
            style={{ ...menuItemStyle, color: 'var(--risk-critical)' }}
          >
            <LogOut size={11} />
            <span style={{ flex: 1 }}>Logout</span>
          </button>

          <div
            style={{
              padding: '6px 8px',
              marginTop: 4,
              borderTop: '1px solid var(--border-color)',
              fontSize: 9,
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            Pre-pilot demo. Switching persona logs you out so context
            state (drafts, KRI entries, escalations) starts clean for the
            new role.
          </div>
        </div>
      )}
    </div>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '7px 10px',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  borderRadius: 4,
  textAlign: 'left',
}
