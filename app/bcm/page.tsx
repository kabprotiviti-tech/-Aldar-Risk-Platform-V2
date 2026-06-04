'use client'

/**
 * Business Continuity Module (BCM) — Patch F9
 * --------------------------------------------
 * Roadmap placeholder. Per the client's 8-module + BCM contract, BCM is
 * 🔵 ROADMAP tier and ships in Phase 4 (post-pilot scope).
 *
 * This page deliberately contains NO functional content — the demo
 * intent is "visible nav tab → Phase 4 scope page" (per the spec test).
 * Loading the page communicates the roadmap honestly with no fabrication.
 */

import React from 'react'
import Link from 'next/link'
import {
  LifeBuoy,
  ShieldAlert,
  ListChecks,
  ClipboardCheck,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { StatusBadge } from '@/components/provenance/StatusBadge'

interface ScopeItem {
  icon: React.ReactNode
  title: string
  description: string
}

const PHASE_4_SCOPE: ScopeItem[] = [
  {
    icon: <ShieldAlert size={16} />,
    title: 'Business Impact Analysis (BIA)',
    description:
      'Per-process Recovery Time Objective (RTO) + Recovery Point Objective (RPO) register. Maps critical functions (escrow ops, IR, customer onboarding, project handover) to maximum tolerable downtime.',
  },
  {
    icon: <ListChecks size={16} />,
    title: 'Continuity Plans by Critical Function',
    description:
      'Documented plans for each subsidiary covering: site loss, key-staff loss, IT outage, supplier failure. Versioned + ARC-approved.',
  },
  {
    icon: <ClipboardCheck size={16} />,
    title: 'Crisis Management Team Roster',
    description:
      'Roles, deputies, contact tree, escalation criteria. Activation workflow with audit trail.',
  },
  {
    icon: <RefreshCw size={16} />,
    title: 'BC Exercise & Test Schedule',
    description:
      'Annual tabletop + biennial live simulation. Results captured with corrective actions tracked to closure on the audit trail.',
  },
  {
    icon: <LifeBuoy size={16} />,
    title: 'Recovery Strategy Library',
    description:
      'Pre-approved options (alternative site, dual-supplier activation, manual workarounds) with cost + activation lead time.',
  },
]

export default function BCMPage() {
  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ROADMAP banner */}
      <div
        role="note"
        aria-label="Roadmap notice"
        style={{
          padding: '12px 16px',
          background: 'rgba(45,158,255,0.10)',
          border: '1px solid rgba(45,158,255,0.40)',
          borderLeft: '3px solid #2D9EFF',
          borderRadius: 6,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <LifeBuoy size={16} style={{ color: '#2D9EFF', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#2D9EFF',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Phase 4 Scope — Roadmap
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-primary)',
              lineHeight: 1.55,
            }}
          >
            The Business Continuity Module is scoped for Phase 4 (post-MVP
            pilot). This page is intentionally a roadmap placeholder. No
            functional surfaces here yet — the demo intent is to show the
            module's commitment in the nav while making the deferral
            honest.
          </div>
        </div>
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <LifeBuoy size={20} style={{ color: '#2D9EFF' }} />
            Business Continuity Module
          </h1>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
              maxWidth: 760,
              lineHeight: 1.55,
            }}
          >
            BCM is a separate but linked module to the ERM platform. It
            converts the residual-risk inventory and the KRI breach feed
            into operational continuity plans — RTO/RPO, crisis-management
            workflows, and tested recovery strategies — so a Critical /
            High risk that materializes has a sanctioned path back to
            business-as-usual.
          </p>
        </div>
        <StatusBadge tier="ROADMAP" note="Phase 4 scope" />
      </div>

      {/* Phase 4 scope grid */}
      <section
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginBottom: 12,
          }}
        >
          Phase 4 Scope Outline
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 10,
          }}
        >
          {PHASE_4_SCOPE.map((item, i) => (
            <article
              key={i}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderLeft: '3px solid #2D9EFF',
                borderRadius: 6,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <header style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2D9EFF' }}>
                {item.icon}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {item.title}
                </span>
              </header>
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Linkage strip */}
      <section
        style={{
          padding: 14,
          background: 'var(--bg-secondary)',
          border: '1px dashed var(--border-color)',
          borderRadius: 8,
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginBottom: 6,
          }}
        >
          How BCM links to the rest of the platform
        </div>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          <li>
            <Link href="/risk-register" style={inlineLink}>/risk-register</Link>{' '}
            — Critical / High risks become trigger criteria for BCM activation
          </li>
          <li>
            <Link href="/kri" style={inlineLink}>/kri</Link> — Red KRI breaches
            on critical functions trigger BIA review
          </li>
          <li>
            <Link href="/three-lines-of-defense" style={inlineLink}>/three-lines-of-defense</Link>{' '}
            — Operational Line 1 owns BCP execution; Group ERM coordinates
          </li>
          <li>
            <Link href="/audit-trail" style={inlineLink}>/audit-trail</Link> —
            Activation, drill results, and post-incident reviews are audit-logged
          </li>
          <li>
            <Link href="/standards-reference" style={inlineLink}>/standards-reference</Link>{' '}
            — ISO 22301 (Business Continuity Management Systems) will be added
            alongside ISO 31000 + COSO in Phase 4
          </li>
        </ul>
      </section>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
        }}
      >
        Pilot wires real BIA workshop output + crisis-management roster from
        ABC HR + Group Operations.
        <Link href="/" style={{ ...inlineLink, marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Back to home <ArrowRight size={10} />
        </Link>
      </div>
    </div>
  )
}

const inlineLink: React.CSSProperties = {
  color: 'var(--accent-primary)',
  textDecoration: 'none',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 10,
}
