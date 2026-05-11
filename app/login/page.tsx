'use client'

/**
 * /login — Block 2 P1
 * --------------------
 * Themed mock SSO login. Email + password fields accept any value; the
 * real authentication is the persona tile selection. Two-step flow for
 * Risk Champion and Subsidiary CEO: pick persona → pick subsidiary.
 *
 * Pre-pilot — no real auth. Banner says so. Pilot wires Aldar SSO.
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield,
  ArrowRight,
  Lock,
  AtSign,
  Crown,
  Briefcase,
  Building2,
  ClipboardCheck,
  Gavel,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react'
import { usePersona } from '@/lib/context/PersonaContext'
import { PERSONAS, type PersonaId, type Persona } from '@/lib/personas'
import { ENTITIES } from '@/lib/entities/hierarchy'
import type { EntityId } from '@/lib/data/risk-entity-mapping'

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

type Step = 'credentials' | 'persona' | 'subsidiary'

export default function LoginPage() {
  const router = useRouter()
  const { login } = usePersona()
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('demo@aldar.com')
  const [password, setPassword] = useState('•••••••••')
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim()) {
      setError('Email is required (any value accepted in the demo).')
      return
    }
    setStep('persona')
  }

  function handlePersonaPick(p: Persona) {
    setSelectedPersona(p)
    if (p.requiresSubsidiary) {
      setStep('subsidiary')
    } else {
      login({ personaId: p.id, displayName: email })
      router.push(p.landing)
    }
  }

  function handleSubsidiaryPick(entityId: EntityId) {
    if (!selectedPersona) return
    login({
      personaId: selectedPersona.id,
      entityScope: entityId,
      displayName: email,
    })
    router.push(selectedPersona.landing)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 20% 20%, rgba(255,102,0,0.10), transparent 50%), radial-gradient(circle at 80% 80%, rgba(45,158,255,0.10), transparent 50%), var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 'min(960px, 100%)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 36,
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* Brand strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: 'var(--accent-primary)',
              color: 'var(--on-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Aldar Risk Platform
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-tertiary)',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Aldar SSO · ADX-Listed PJSC
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <StepIndicator step={step} />
          </div>
        </div>

        {/* Pre-pilot banner */}
        <div
          role="note"
          style={{
            padding: '8px 12px',
            background: 'rgba(245,197,24,0.10)',
            border: '1px solid rgba(245,197,24,0.40)',
            borderLeft: '3px solid #F5C518',
            borderRadius: 6,
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: '#F5C518' }}>Pre-pilot demo</strong> — any
          credentials are accepted. Pilot wires real Aldar SSO with
          enterprise-IdP and field-level RBAC. Selecting a persona below
          determines the role-based view you land on.
        </div>

        {step === 'credentials' && (
          <CredentialsStep
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            error={error}
            onSubmit={handleCredentialsSubmit}
          />
        )}

        {step === 'persona' && <PersonaStep onPick={handlePersonaPick} />}

        {step === 'subsidiary' && selectedPersona && (
          <SubsidiaryStep
            persona={selectedPersona}
            onPick={handleSubsidiaryPick}
            onBack={() => setStep('persona')}
          />
        )}
      </div>
    </div>
  )
}

function StepIndicator({ step }: { step: Step }) {
  const items: { id: Step; label: string }[] = [
    { id: 'credentials', label: 'Sign in' },
    { id: 'persona', label: 'Persona' },
    { id: 'subsidiary', label: 'Scope' },
  ]
  const idx = items.findIndex((i) => i.id === step)
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {items.map((it, i) => (
        <React.Fragment key={it.id}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: i <= idx ? 'var(--accent-primary)' : 'var(--text-tertiary)',
            }}
          >
            {it.label}
          </span>
          {i < items.length - 1 && (
            <span style={{ color: 'var(--text-tertiary)' }}>›</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function CredentialsStep({
  email,
  setEmail,
  password,
  setPassword,
  error,
  onSubmit,
}: {
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  error: string | null
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 4,
          }}
        >
          Sign in
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
          Enter any email + password to proceed. The persona selector on the
          next step determines your role.
        </p>
      </div>

      <label style={fieldLabel}>
        <span>Email</span>
        <div style={fieldWrap}>
          <AtSign size={14} style={fieldIcon} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="firstname.lastname@aldar.com"
            style={fieldInput}
            autoFocus
          />
        </div>
      </label>

      <label style={fieldLabel}>
        <span>Password</span>
        <div style={fieldWrap}>
          <Lock size={14} style={fieldIcon} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="•••••••••"
            style={fieldInput}
          />
        </div>
      </label>

      {error && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--risk-critical)',
            padding: '6px 10px',
            background: 'rgba(255,59,59,0.10)',
            border: '1px solid rgba(255,59,59,0.40)',
            borderRadius: 4,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        style={{
          marginTop: 4,
          background: 'var(--accent-primary)',
          color: 'var(--on-accent)',
          border: 'none',
          padding: '10px 16px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        Continue
        <ArrowRight size={13} />
      </button>
    </form>
  )
}

function PersonaStep({ onPick }: { onPick: (p: Persona) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 4,
          }}
        >
          Choose your persona
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
          Each persona lands on a different default view. Pilot binds this to
          the user record automatically via SSO + RBAC.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 10,
        }}
      >
        {PERSONAS.map((p) => {
          const Icon = PERSONA_ICONS[p.id]
          const accent = PERSONA_ACCENT[p.id]
          return (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              style={{
                textAlign: 'left',
                background: 'var(--bg-primary)',
                border: `1px solid var(--border-color)`,
                borderLeft: `3px solid ${accent}`,
                borderRadius: 8,
                padding: 14,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-primary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    background: `${accent}1f`,
                    color: accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {p.title}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: accent,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {p.line}
                  </div>
                </div>
                {p.requiresSubsidiary && (
                  <span
                    title="This persona requires a subsidiary scope"
                    style={{
                      fontSize: 8,
                      color: 'var(--text-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 3,
                      padding: '1px 5px',
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Scope
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {p.subtitle}
              </p>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-tertiary)',
                  fontStyle: 'italic',
                  paddingTop: 6,
                  borderTop: '1px dashed var(--border-color)',
                }}
              >
                "{p.killerQuestion}"
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SubsidiaryStep({
  persona,
  onPick,
  onBack,
}: {
  persona: Persona
  onPick: (e: EntityId) => void
  onBack: () => void
}) {
  const subs = ENTITIES.filter(
    (e) => e.kind === 'subsidiary' && persona.validSubsidiaries.includes(e.id as EntityId),
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 4,
          }}
        >
          {persona.title} — choose subsidiary
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
          {persona.title}s are scoped to a single subsidiary's risk register.
          The pilot would assign this from the user record; here you choose.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 10,
        }}
      >
        {subs.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onPick(sub.id as EntityId)}
            style={{
              textAlign: 'left',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderLeft: `3px solid ${sub.color}`,
              borderRadius: 8,
              padding: 14,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: sub.color,
                }}
              />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                {sub.shortName}
              </div>
              <CheckCircle2 size={12} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              {sub.description}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        style={{
          alignSelf: 'flex-start',
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        ← Back to personas
      </button>
    </div>
  )
}

const fieldLabel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 11,
  color: 'var(--text-secondary)',
  fontWeight: 600,
}
const fieldWrap: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
}
const fieldIcon: React.CSSProperties = {
  position: 'absolute',
  left: 10,
  color: 'var(--text-tertiary)',
  pointerEvents: 'none',
}
const fieldInput: React.CSSProperties = {
  flex: 1,
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  padding: '10px 12px 10px 32px',
  fontSize: 13,
}
