'use client'

/**
 * Standards Reference — Patch F8
 * -------------------------------
 * ISO 31000:2018 and COSO ERM 2017 reference + Aldar platform-mapping.
 * Shows every principle / clause / component with the surfaces that
 * implement it on this platform, plus a status chip (live / partial /
 * roadmap).
 *
 * Honors CLAUDE.md: mapping is illustrative pre-pilot until external
 * audit walks the framework.
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { BookOpen, ExternalLink } from 'lucide-react'
import {
  ISO_31000_PRINCIPLES,
  ISO_31000_FRAMEWORK,
  ISO_31000_PROCESS,
  COSO_ERM_COMPONENTS,
  type StandardClause,
} from '@/lib/data/standards-reference'
import { SRC_ISO_31000, SRC_COSO_ERM } from '@/lib/provenance/sources'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'

type Tab = 'iso' | 'coso'

const STATUS_META: Record<
  StandardClause['status'],
  { label: string; color: string }
> = {
  live: { label: 'Live', color: '#22C55E' },
  partial: { label: 'Partial', color: '#F5C518' },
  roadmap: { label: 'Roadmap', color: '#888888' },
}

export default function StandardsReferencePage() {
  const [tab, setTab] = useState<Tab>('iso')

  const totals = {
    iso:
      ISO_31000_PRINCIPLES.length +
      ISO_31000_FRAMEWORK.length +
      ISO_31000_PROCESS.length,
    coso: COSO_ERM_COMPONENTS.reduce((s, c) => s + c.principles.length, 0),
  }

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <IllustrativeDataBanner pilotFeeds="Audit & Risk Committee + external auditor walkthrough to lock the framework mapping" />

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
            <BookOpen size={20} style={{ color: 'var(--accent-primary)' }} />
            Standards Reference — ISO 31000 + COSO ERM
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
            Every principle, framework clause and process step mapped to
            the platform surface that implements it. Each row links
            directly to the surface so external auditors can walk the
            framework end-to-end.
          </p>
        </div>
        <StatusBadge
          tier="MVP"
          note={`ISO: ${totals.iso} clauses · COSO: ${totals.coso} principles`}
        />
      </div>

      {/* Source strip */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          padding: 10,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          fontSize: 11,
        }}
      >
        <SourceLink source={SRC_ISO_31000} />
        <SourceLink source={SRC_COSO_ERM} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border-color)' }}>
        <TabBtn active={tab === 'iso'} onClick={() => setTab('iso')}>
          ISO 31000:2018
        </TabBtn>
        <TabBtn active={tab === 'coso'} onClick={() => setTab('coso')}>
          COSO ERM 2017
        </TabBtn>
      </div>

      {tab === 'iso' ? <ISOView /> : <COSOView />}
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        border: 'none',
        borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
        padding: '10px 14px',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        cursor: 'pointer',
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  )
}

function SourceLink({ source }: { source: typeof SRC_ISO_31000 }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: 'var(--accent-primary)',
        textDecoration: 'none',
      }}
    >
      <ExternalLink size={12} />
      {source.title}
    </a>
  )
}

function ISOView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Section title="Principles (Clause 5)" clauses={ISO_31000_PRINCIPLES} accent="#A855F7" />
      <Section title="Framework (Clause 6)" clauses={ISO_31000_FRAMEWORK} accent="#2D9EFF" />
      <Section title="Process (Clause 7)" clauses={ISO_31000_PROCESS} accent="#22C55E" />
    </div>
  )
}

function COSOView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {COSO_ERM_COMPONENTS.map((c, i) => (
        <section
          key={c.id}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderLeft: '4px solid var(--accent-primary)',
            borderRadius: 8,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              marginBottom: 2,
            }}
          >
            Component {i + 1} · {c.title}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.55 }}>
            {c.description}
          </p>
          <ClauseTable clauses={c.principles} />
        </section>
      ))}
    </div>
  )
}

function Section({
  title,
  clauses,
  accent,
}: {
  title: string
  clauses: StandardClause[]
  accent: string
}) {
  return (
    <section
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `4px solid ${accent}`,
        borderRadius: 8,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: accent,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <ClauseTable clauses={clauses} />
    </section>
  )
}

function ClauseTable({ clauses }: { clauses: StandardClause[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 12,
          minWidth: 720,
        }}
      >
        <thead>
          <tr style={{ background: 'var(--bg-primary)' }}>
            <Th>Clause</Th>
            <Th>Description</Th>
            <Th>Implemented by</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {clauses.map((c) => {
            const meta = STATUS_META[c.status]
            return (
              <tr key={c.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <Td>
                  <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, color: 'var(--text-tertiary)' }}>
                    {c.id}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.title}</div>
                </Td>
                <Td muted>{c.description}</Td>
                <Td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {c.implementedBy.map((href) => (
                      <Link
                        key={href}
                        href={href}
                        style={{
                          background: 'rgba(255,102,0,0.14)',
                          color: 'var(--accent-primary)',
                          border: '1px solid rgba(255,102,0,0.4)',
                          padding: '1px 6px',
                          borderRadius: 3,
                          fontSize: 9,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          textDecoration: 'none',
                          fontWeight: 700,
                          letterSpacing: 0.4,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {href}
                      </Link>
                    ))}
                  </div>
                </Td>
                <Td>
                  <span
                    style={{
                      background: `${meta.color}1f`,
                      color: meta.color,
                      border: `1px solid ${meta.color}66`,
                      padding: '1px 6px',
                      borderRadius: 3,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {meta.label}
                  </span>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: 'left',
        fontSize: 9,
        fontWeight: 700,
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        padding: '6px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  muted,
}: {
  children: React.ReactNode
  muted?: boolean
}) {
  return (
    <td
      style={{
        padding: '8px 10px',
        color: muted ? 'var(--text-secondary)' : 'var(--text-primary)',
        verticalAlign: 'top',
        lineHeight: 1.5,
      }}
    >
      {children}
    </td>
  )
}
