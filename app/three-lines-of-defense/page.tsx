'use client'

/**
 * Three Lines of Defense — Module 10 (H1)
 * ----------------------------------------
 * Visualises the IIA 2020 Three Lines Model adapted to Aldar's operating
 * structure. Roles are illustrative — pilot will replace with real Aldar
 * ERM operating model after stakeholder workshops.
 *
 * Honors CLAUDE.md: every name and responsibility is labelled illustrative
 * via IllustrativeDataBanner. No fabricated KPIs.
 */

import React from 'react'
import Link from 'next/link'
import { ShieldHalf } from 'lucide-react'
import { THREE_LINES, type DefenseLine, type DefenseRole } from '@/lib/data/three-lines-of-defense'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'

export default function ThreeLinesPage() {
  const totalRoles = THREE_LINES.reduce((s, l) => s + l.roles.length, 0)

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <IllustrativeDataBanner pilotFeeds="Aldar HR / ERM operating model after pilot stakeholder workshops" />

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
            <ShieldHalf size={20} style={{ color: 'var(--accent-primary)' }} />
            Three Lines of Defense
          </h1>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
              maxWidth: 820,
              lineHeight: 1.55,
            }}
          >
            The IIA 2020 Three Lines Model adapted to Aldar's structure.
            Operational management owns the risk; Group ERM, Compliance, and
            Treasury frame and monitor it; Internal Audit provides
            independent assurance to the ARC. Each role lists illustrative
            responsibilities and the platform surfaces it uses day-to-day.
          </p>
        </div>
        <StatusBadge tier="MVP" note={`${THREE_LINES.length} lines · ${totalRoles} roles`} />
      </div>

      {/* Diagram */}
      <DiagramOverview />

      {/* Swimlanes */}
      {THREE_LINES.map((line) => (
        <SwimLane key={line.id} line={line} />
      ))}

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          paddingTop: 8,
          borderTop: '1px dashed var(--border-color)',
        }}
      >
        Reference: IIA Three Lines Model (2020). Mapping to Aldar roles is
        illustrative pre-pilot. Independence of Internal Audit (Line 3) is
        preserved through dual reporting to the Audit & Risk Committee.
      </div>
    </div>
  )
}

function DiagramOverview() {
  return (
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
          marginBottom: 10,
        }}
      >
        Operating Model Overview
      </div>

      {/* Governing body strip */}
      <div
        style={{
          background: 'rgba(168,85,247,0.10)',
          border: '1px solid rgba(168,85,247,0.40)',
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 10,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 700,
          color: '#A855F7',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        Board of Directors · Audit & Risk Committee
      </div>

      <div style={{ fontSize: 9, textAlign: 'center', color: 'var(--text-tertiary)', marginBottom: 8 }}>
        ↑ Accountable to ↑
      </div>

      {/* Three lines side-by-side */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}
      >
        {THREE_LINES.filter((l) => l.id !== 'governing').map((line) => (
          <div
            key={line.id}
            style={{
              background: `${line.color}14`,
              border: `1px solid ${line.color}66`,
              borderTop: `3px solid ${line.color}`,
              borderRadius: 6,
              padding: '12px 12px 14px',
              minHeight: 110,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: line.color,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {line.label}
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {line.roles.map((r) => r.title).join(' · ')}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 9,
          textAlign: 'center',
          color: 'var(--text-tertiary)',
          marginTop: 8,
          fontStyle: 'italic',
        }}
      >
        Lines 1 & 2 own + frame risk respectively. Line 3 is independent and reports directly to the ARC.
      </div>
    </section>
  )
}

function SwimLane({ line }: { line: DefenseLine }) {
  return (
    <section
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `4px solid ${line.color}`,
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: line.color,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          {line.label}
        </div>
        <p
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            margin: 0,
            maxWidth: 880,
          }}
        >
          {line.purpose}
        </p>
      </div>

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {line.roles.map((role, i) => (
          <RoleCard key={i} role={role} accent={line.color} />
        ))}
      </div>
    </section>
  )
}

function RoleCard({ role, accent }: { role: DefenseRole; accent: string }) {
  return (
    <article
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <header>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 2,
          }}
        >
          {role.title}
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--text-tertiary)',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          Scope: {role.scope}
        </div>
      </header>

      <div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          Responsibilities
        </div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {role.responsibilities.map((r, i) => (
            <li key={i} style={{ marginBottom: 2 }}>
              {r}
            </li>
          ))}
        </ul>
      </div>

      {role.platformSurfaces.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Platform Surfaces
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {role.platformSurfaces.map((p) => (
              <Link
                key={p}
                href={p}
                style={{
                  background: `${accent}1f`,
                  color: accent,
                  border: `1px solid ${accent}55`,
                  padding: '2px 8px',
                  borderRadius: 3,
                  fontSize: 10,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  textDecoration: 'none',
                }}
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
