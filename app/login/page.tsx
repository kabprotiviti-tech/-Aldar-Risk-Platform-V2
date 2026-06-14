'use client'

/**
 * /login — Tier-1 redesign
 * -------------------------
 * Full-screen split-pane entry surface for ABC Risk Platform.
 *
 * LEFT pane: brand hero with animated gradient mesh, the ABC value
 * proposition, and trust strip (ADX-listed · ISO 31000 · COSO ERM ·
 * SCA Code).
 *
 * RIGHT pane: clean signin form → persona tiles → (optional) subsidiary
 * picker. 3-step flow with a visible breadcrumb.
 *
 * Honors CLAUDE.md: every assertion is either factual ("ADX:ABC") or
 * tagged illustrative ("pre-pilot mock SSO").
 */

import React, { useEffect, useState } from 'react'
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
  Sparkles,
  Check,
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
  'arc-chair': Gavel,
}

const PERSONA_ACCENT: Record<PersonaId, string> = {
  'group-cro': '#E4002B',
  'risk-champion': '#2D9EFF',
  'subsidiary-ceo': '#A855F7',
  'arc-chair': '#F5C518',
}

type Step = 'credentials' | 'persona' | 'subsidiary'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, persona, logout } = usePersona()
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('risk.head@protiviti.com')
  const [password, setPassword] = useState('demo-pass-1234')
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Force the page to show — if user was previously authenticated, they
  // explicitly arrived here so DO NOT auto-redirect away. Let them choose.

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
        width: '100vw',
        display: 'flex',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* LEFT BRAND PANE */}
      <BrandPane />

      {/* RIGHT FORM PANE */}
      <div
        style={{
          flex: '1 1 520px',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '36px clamp(24px, 6vw, 64px)',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Crumb step={step} />
          {isAuthenticated && persona && (
            <button
              onClick={() => {
                logout()
                setStep('credentials')
              }}
              title="Currently signed in — click to start fresh"
              style={{
                fontSize: 10,
                fontWeight: 600,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '6px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}
            >
              Signed in as {persona.title} · sign in again
            </button>
          )}
        </div>

        <div style={{ marginTop: 28, maxWidth: 520 }}>
          {step === 'credentials' && (
            <CredentialsStep
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              error={error}
              onSubmit={handleCredentialsSubmit}
              isAuthenticated={isAuthenticated}
              currentPersona={persona}
              onEnter={() => {
                if (persona) router.push(persona.landing)
              }}
            />
          )}

          {step === 'persona' && (
            <PersonaStep onPick={handlePersonaPick} onBack={() => setStep('credentials')} />
          )}

          {step === 'subsidiary' && selectedPersona && (
            <SubsidiaryStep
              persona={selectedPersona}
              onPick={handleSubsidiaryPick}
              onBack={() => setStep('persona')}
            />
          )}
        </div>

        <div style={{ flex: 1 }} />

        <FooterStrip />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// LEFT BRAND PANE
// ─────────────────────────────────────────────────────────────────────

function BrandPane() {
  return (
    <div
      style={{
        flex: '0 1 560px',
        minWidth: 380,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '36px clamp(28px, 5vw, 56px)',
        background:
          'linear-gradient(140deg, #FFFFFF 0%, #F5F6F8 58%, #FBEDEF 100%)',
        color: 'var(--text-primary)',
        borderRight: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
      className="hidden md:flex"
    >
      {/* Static gradient orbs — the infinite pulse-animation on these large
          blurred layers forced a full-viewport re-rasterise every frame and
          froze the page on low-GPU corporate laptops. Now painted once. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -160,
          right: -120,
          width: 460,
          height: 460,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(228,0,43,0.12) 0%, rgba(228,0,43,0) 60%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: -200,
          left: -120,
          width: 540,
          height: 540,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(15,23,41,0.05) 0%, rgba(15,23,41,0) 60%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(at 20% 30%, rgba(168,85,247,0.08) 0%, transparent 40%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top — brand */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #E4002B 0%, #B8001F 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(228,0,43,0.45)',
          }}
        >
          <Shield size={22} color="#fff" />
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
            }}
          >
            Protiviti · Demo tenant: ABC Holdings
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>PROS — Protiviti Risk Operating System</div>
        </div>
      </div>

      {/* Middle — pitch + live product glimpse */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 500 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 18, padding: '5px 12px', borderRadius: 999, background: 'rgba(228,0,43,0.06)', border: '1px solid var(--border-accent)' }}>
          <Sparkles size={12} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-secondary)', letterSpacing: 0.3 }}>AI-enabled Enterprise Risk &amp; Control</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(30px, 4.2vw, 44px)',
            lineHeight: 1.08,
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.025em',
            background: 'linear-gradient(118deg, #0F1729 0%, #2A3550 60%, #E4002B 125%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          The Group&rsquo;s risk,<br />in one clear view.
        </h1>
        <p
          style={{
            marginTop: 16,
            fontSize: 14.5,
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            maxWidth: 430,
          }}
        >
          External signals, the live register, KRIs and the board pack — brought
          into one decision surface for leadership and the ARC.
        </p>

        <ProductGlimpse />
      </div>

      {/* Bottom — trust strip */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          paddingTop: 18,
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: 18,
          flexWrap: 'wrap',
          fontSize: 9,
          color: 'var(--text-tertiary)',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        <span>ADX-listed</span>
        <span>·</span>
        <span>ISO 31000</span>
        <span>·</span>
        <span>COSO ERM</span>
        <span>·</span>
        <span>SCA Code</span>
        <span>·</span>
        <span>IIA 3 Lines</span>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// Illustrative live-posture preview card — makes the hero feel like a real
// product (the single biggest "tier-1" signal on a login screen).
function ProductGlimpse() {
  // Decorative 5×5 grid only — shown BLURRED behind a lock. Group-level
  // posture (exposure, risk counts) must NEVER be visible pre-auth, and is
  // role-scoped after sign-in (a Risk Champion only sees their entity).
  const HEAT = ['l','l','m','h','c','l','m','m','h','h','l','m','h','h','m','m','m','h','c','h','l','l','m','h','c']
  const COLOR: Record<string, string> = {
    c: 'var(--risk-critical)', h: 'var(--risk-high)', m: 'var(--risk-medium)', l: 'var(--risk-low)',
  }
  return (
    <div style={{ marginTop: 26 }}>
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
          padding: 18,
          maxWidth: 400,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className="animate-live-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--risk-low)', display: 'inline-block' }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>ABC Holdings · Risk cockpit</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 700, color: 'var(--accent-primary)', background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', borderRadius: 999, padding: '2px 8px' }}>
            <Lock size={10} /> Role-scoped
          </span>
        </div>

        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
          <div aria-hidden style={{ filter: 'blur(7px)', opacity: 0.5, padding: 10, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {HEAT.map((k, i) => (
              <span key={i} style={{ height: 22, borderRadius: 4, background: COLOR[k] }} />
            ))}
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', padding: '8px 14px' }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <Lock size={16} />
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>Your risk posture unlocks at sign-in</span>
            <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', maxWidth: 290, lineHeight: 1.5 }}>Views are role-scoped — Risk Champions see only their entity; the Group CRO sees the consolidated view.</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 16 }}>
        {['ISO 31000 · COSO ERM', 'Role-based access', 'UAE-native regulators'].map((t) => (
          <span key={t} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 999, padding: '4px 11px' }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

function Pitch({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
      <span style={{ color: 'var(--accent-primary)', display: 'inline-flex' }}>{icon}</span>
      {text}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// RIGHT PANE PARTS
// ─────────────────────────────────────────────────────────────────────

function Crumb({ step }: { step: Step }) {
  const items: { id: Step; label: string }[] = [
    { id: 'credentials', label: 'Sign in' },
    { id: 'persona', label: 'Persona' },
    { id: 'subsidiary', label: 'Scope' },
  ]
  const idx = items.findIndex((i) => i.id === step)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {items.map((it, i) => {
        const active = i === idx
        const done = i < idx
        return (
          <React.Fragment key={it.id}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                color: active
                  ? 'var(--accent-primary)'
                  : done
                  ? 'var(--text-secondary)'
                  : 'var(--text-tertiary)',
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: active
                    ? 'var(--accent-primary)'
                    : done
                    ? 'rgba(34,197,94,0.18)'
                    : 'var(--bg-secondary)',
                  color: active
                    ? 'var(--on-accent)'
                    : done
                    ? '#22C55E'
                    : 'var(--text-tertiary)',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {done ? <Check size={10} /> : i + 1}
              </span>
              {it.label}
            </span>
            {i < items.length - 1 && (
              <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>›</span>
            )}
          </React.Fragment>
        )
      })}
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
  isAuthenticated,
  currentPersona,
  onEnter,
}: {
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  error: string | null
  onSubmit: (e: React.FormEvent) => void
  isAuthenticated: boolean
  currentPersona: Persona | null
  onEnter: () => void
}) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: -0.3,
          }}
        >
          Welcome back
        </h2>
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          Sign in with any email + password — the demo accepts everything. The
          persona you select next determines which view you land on.
        </p>
      </div>

      {/* If already authenticated, offer Enter-Platform shortcut */}
      {isAuthenticated && currentPersona && (
        <div
          style={{
            padding: 14,
            background: 'rgba(34,197,94,0.10)',
            border: '1px solid rgba(34,197,94,0.40)',
            borderLeft: '3px solid #22C55E',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Check size={18} style={{ color: '#22C55E', flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 12, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
            Currently signed in as <strong style={{ color: 'var(--text-primary)' }}>{currentPersona.title}</strong>.
            <button
              type="button"
              onClick={onEnter}
              style={{
                marginLeft: 8,
                background: '#22C55E',
                color: '#fff',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Enter platform →
            </button>
            <span style={{ marginLeft: 8, color: 'var(--text-tertiary)' }}>
              or sign in fresh below
            </span>
          </div>
        </div>
      )}

      <Field icon={<AtSign size={14} />} label="Email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="firstname.lastname@protiviti.com"
          style={inputStyle}
          autoFocus
        />
      </Field>

      <Field icon={<Lock size={14} />} label="Password">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="•••••••••"
          style={inputStyle}
        />
      </Field>

      {error && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--risk-critical)',
            padding: '8px 12px',
            background: 'rgba(255,59,59,0.10)',
            border: '1px solid rgba(255,59,59,0.40)',
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        style={{
          marginTop: 2,
          background: 'linear-gradient(135deg, #E4002B 0%, #B8001F 100%)',
          color: 'var(--on-accent)',
          border: 'none',
          padding: '12px 18px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: '0 10px 24px rgba(228,0,43,0.35)',
        }}
      >
        Continue
        <ArrowRight size={14} />
      </button>

      <div
        style={{
          padding: '10px 14px',
          background: 'rgba(245,197,24,0.10)',
          border: '1px solid rgba(245,197,24,0.40)',
          borderLeft: '3px solid #F5C518',
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: '#F5C518' }}>Pre-pilot demo</strong> — any
        credentials accepted. Pilot wires ABC SSO + enterprise IdP +
        field-level RBAC.
      </div>
    </form>
  )
}

function PersonaStep({ onPick, onBack }: { onPick: (p: Persona) => void; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: -0.3 }}>
          Choose your persona
        </h2>
        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Each persona lands on a different default view with different
          permissions. Pilot binds this via SSO + RBAC.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PERSONAS.map((p) => {
          const Icon = PERSONA_ICONS[p.id]
          const accent = PERSONA_ACCENT[p.id]
          return (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              style={{
                textAlign: 'left',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderLeft: `4px solid ${accent}`,
                borderRadius: 10,
                padding: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease',
                color: 'inherit',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'var(--bg-hover)'
                el.style.transform = 'translateX(4px)'
                el.style.boxShadow = `0 8px 24px ${accent}22`
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'var(--bg-secondary)'
                el.style.transform = 'translateX(0)'
                el.style.boxShadow = 'none'
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${accent}22`,
                  border: `1px solid ${accent}55`,
                  color: accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {p.title}
                  </span>
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: accent,
                      background: `${accent}1f`,
                      border: `1px solid ${accent}55`,
                      padding: '1px 6px',
                      borderRadius: 3,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {p.line}
                  </span>
                  {p.requiresSubsidiary && (
                    <span
                      title="Requires a subsidiary scope"
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        color: 'var(--text-tertiary)',
                        border: '1px solid var(--border-color)',
                        padding: '1px 5px',
                        borderRadius: 3,
                        letterSpacing: 0.4,
                        textTransform: 'uppercase',
                      }}
                    >
                      + Scope
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {p.subtitle}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: 4 }}>
                  "{p.killerQuestion}"
                </div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            </button>
          )
        })}
      </div>

      <button onClick={onBack} style={backBtnStyle}>
        ← Back to sign in
      </button>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: -0.3 }}>
          Pick your subsidiary
        </h2>
        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {persona.title}s are scoped to a single subsidiary's risk register. Pilot
          binds this from your user record.
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
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderTop: `3px solid ${sub.color}`,
              borderRadius: 10,
              padding: 14,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              transition: 'transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'var(--bg-hover)'
              el.style.transform = 'translateY(-2px)'
              el.style.boxShadow = `0 10px 24px ${sub.color}33`
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'var(--bg-secondary)'
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: sub.color }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {sub.shortName}
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.55 }}>
              {sub.description}
            </div>
          </button>
        ))}
      </div>

      <button onClick={onBack} style={backBtnStyle}>
        ← Back to personas
      </button>
    </div>
  )
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 12,
            color: 'var(--text-tertiary)',
            pointerEvents: 'none',
            display: 'inline-flex',
          }}
        >
          {icon}
        </span>
        {children}
      </span>
    </label>
  )
}

function FooterStrip() {
  return (
    <div
      style={{
        marginTop: 28,
        paddingTop: 18,
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        fontSize: 10,
        color: 'var(--text-tertiary)',
      }}
    >
      <span>© 2026 ABC Holdings · Demo</span>
      <span>·</span>
      <span>Built for the Board, not for the spreadsheet</span>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  padding: '12px 14px 12px 38px',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
}

const backBtnStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 6,
  padding: '7px 14px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  cursor: 'pointer',
  marginTop: 8,
}
