'use client'

/**
 * /policy-and-procedure — illustrative policy register
 * -----------------------------------------------------
 * Lists the policies and procedures that a UAE listed property /
 * leisure / hospitality group would carry. All entries are
 * illustrative until the pilot loads the live policy management
 * system (e.g. Diligent / Convene / SharePoint).
 *
 * Each row carries: title, category, owner, last reviewed, next
 * review due, status, related risk taxonomy.
 */

import React, { useMemo, useState } from 'react'
import {
  BookMarked,
  ShieldCheck,
  AlertTriangle,
  Search,
  ExternalLink,
} from 'lucide-react'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { TrustFooter } from '@/components/provenance/TrustFooter'

type PolicyStatus = 'In force' | 'Under review' | 'Overdue review' | 'Draft'
type PolicyCategory =
  | 'Code of conduct'
  | 'Financial'
  | 'Operational'
  | 'HSE'
  | 'IT & data'
  | 'Compliance'
  | 'HR & talent'
  | 'Governance'

interface PolicyRow {
  id: string
  title: string
  category: PolicyCategory
  owner: string
  lastReviewed: string
  nextReview: string
  status: PolicyStatus
  linkedRisks: string[]
  summary: string
}

const POLICIES: PolicyRow[] = [
  {
    id: 'POL-001',
    title: 'Code of Business Conduct & Ethics',
    category: 'Code of conduct',
    owner: 'Group General Counsel',
    lastReviewed: '2025-09-15',
    nextReview: '2026-09-15',
    status: 'In force',
    linkedRisks: ['R-009'],
    summary: 'Anti-bribery, conflict of interest, gifts & hospitality, fair dealing. Annual sign-off mandatory for all employees.',
  },
  {
    id: 'POL-002',
    title: 'Whistleblowing & Speak-Up',
    category: 'Compliance',
    owner: 'Chief Compliance Officer',
    lastReviewed: '2025-11-02',
    nextReview: '2026-11-02',
    status: 'In force',
    linkedRisks: ['R-009'],
    summary: 'Confidential channels for reporting suspected misconduct. SCA Code Art. 33 compliant. Quarterly ARC reporting.',
  },
  {
    id: 'POL-003',
    title: 'Anti-Money Laundering & Sanctions Screening',
    category: 'Compliance',
    owner: 'MLRO · Treasury',
    lastReviewed: '2025-12-10',
    nextReview: '2026-06-10',
    status: 'In force',
    linkedRisks: ['R-008', 'R-009'],
    summary: 'KYC / EDD / sanctions screening for buyers, contractors, JV partners. Aligned to CBUAE + UAE Cabinet decree.',
  },
  {
    id: 'POL-004',
    title: 'Information Security Policy',
    category: 'IT & data',
    owner: 'Group CISO',
    lastReviewed: '2025-08-20',
    nextReview: '2026-02-20',
    status: 'Overdue review',
    linkedRisks: ['R-009'],
    summary: 'ISO 27001 aligned. Access management, encryption at rest, incident response. Pilot wires to SOC.',
  },
  {
    id: 'POL-005',
    title: 'Data Privacy & UAE PDPL',
    category: 'IT & data',
    owner: 'Group DPO',
    lastReviewed: '2025-10-05',
    nextReview: '2026-10-05',
    status: 'In force',
    linkedRisks: ['R-009'],
    summary: 'UAE Personal Data Protection Law (Fed Decree-Law 45 of 2021). DPIA mandatory for new systems.',
  },
  {
    id: 'POL-006',
    title: 'Delegated Authority Matrix',
    category: 'Governance',
    owner: 'Group CFO',
    lastReviewed: '2025-07-12',
    nextReview: '2026-07-12',
    status: 'In force',
    linkedRisks: ['R-008'],
    summary: 'Approval thresholds by spend tier, project commitment, treasury limits. Reviewed by ARC quarterly.',
  },
  {
    id: 'POL-007',
    title: 'HSE & Heat-Stress Protocol',
    category: 'HSE',
    owner: 'Group Head of HSE',
    lastReviewed: '2025-05-30',
    nextReview: '2026-05-30',
    status: 'Under review',
    linkedRisks: ['R-010'],
    summary: 'UAE Cabinet Decision 44/2022 mid-day work ban. Heat-index monitoring, mandatory rest cycles Jun-Sep.',
  },
  {
    id: 'POL-008',
    title: 'Contractor Pre-Qualification & Performance',
    category: 'Operational',
    owner: 'Chief Procurement Officer',
    lastReviewed: '2025-11-20',
    nextReview: '2026-11-20',
    status: 'In force',
    linkedRisks: ['R-006'],
    summary: 'Financial-health screen, LTIFR thresholds, quarterly performance scorecards on top-10 contractors by spend.',
  },
  {
    id: 'POL-009',
    title: 'Treasury & Hedging Policy',
    category: 'Financial',
    owner: 'Group Treasurer',
    lastReviewed: '2025-09-01',
    nextReview: '2026-09-01',
    status: 'In force',
    linkedRisks: ['R-008'],
    summary: 'FX, interest-rate, commodity hedging mandates. RCF headroom floor AED 5Bn. 13-week rolling cash forecast.',
  },
  {
    id: 'POL-010',
    title: 'Risk Management Policy',
    category: 'Governance',
    owner: 'Risk Head',
    lastReviewed: '2025-12-15',
    nextReview: '2026-12-15',
    status: 'In force',
    linkedRisks: [],
    summary: 'Group ERM framework, IIA 3-Lines model, risk appetite governance, ARC reporting cadence.',
  },
  {
    id: 'POL-011',
    title: 'Business Continuity & Crisis Management',
    category: 'Operational',
    owner: 'Group COO',
    lastReviewed: '2024-12-01',
    nextReview: '2025-12-01',
    status: 'Overdue review',
    linkedRisks: ['R-007', 'R-009'],
    summary: 'BIA, RTO/RPO targets per critical process, crisis comms playbook. Annual tabletop exercise.',
  },
  {
    id: 'POL-012',
    title: 'Talent Acquisition & Emiratisation',
    category: 'HR & talent',
    owner: 'Group CHRO',
    lastReviewed: '2025-10-30',
    nextReview: '2026-10-30',
    status: 'In force',
    linkedRisks: [],
    summary: 'Nafis-aligned Emiratisation targets, succession planning, performance management framework.',
  },
]

const STATUS_META: Record<PolicyStatus, { color: string; label: string }> = {
  'In force': { color: '#22C55E', label: 'In force' },
  'Under review': { color: '#F5C518', label: 'Under review' },
  'Overdue review': { color: '#FF3B3B', label: 'Overdue review' },
  Draft: { color: '#A855F7', label: 'Draft' },
}

const CATEGORY_COLOR: Record<PolicyCategory, string> = {
  'Code of conduct': '#A855F7',
  Financial: '#0B6E5B',
  Operational: '#2D9EFF',
  HSE: '#FF3B3B',
  'IT & data': '#22C55E',
  Compliance: '#F5C518',
  'HR & talent': '#A855F7',
  Governance: '#0B6E5B',
}

export default function PolicyAndProcedurePage() {
  const [filter, setFilter] = useState<'all' | PolicyStatus>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return POLICIES.filter((p) => {
      if (filter !== 'all' && p.status !== filter) return false
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.owner.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q)
      )
    })
  }, [filter, query])

  const counts = useMemo(() => {
    const c = { 'In force': 0, 'Under review': 0, 'Overdue review': 0, Draft: 0 } as Record<PolicyStatus, number>
    for (const p of POLICIES) c[p.status]++
    return c
  }, [])

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <IllustrativeDataBanner pilotFeeds="Live policy management system (e.g. Diligent / Convene / SharePoint policy library)" />

      <PageHeader
        icon={<BookMarked size={18} />}
        eyebrow="Governance"
        title="Policy & Procedure register"
        subtitle={`${POLICIES.length} group policies tracked with status, owner, review cycle, and linked risks. Pilot wires this to the live policy management system; pre-pilot the entries are illustrative based on what a UAE listed PJSC would maintain.`}
        actions={<StatusBadge tier="MVP" note={`${POLICIES.length} illustrative · ${counts['Overdue review']} overdue`} />}
      />

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        <SummaryTile label="In force" value={counts['In force']} color="#22C55E" filter="In force" current={filter} onClick={setFilter} />
        <SummaryTile label="Under review" value={counts['Under review']} color="#F5C518" filter="Under review" current={filter} onClick={setFilter} />
        <SummaryTile label="Overdue review" value={counts['Overdue review']} color="#FF3B3B" filter="Overdue review" current={filter} onClick={setFilter} />
        <SummaryTile label="Draft" value={counts.Draft} color="#A855F7" filter="Draft" current={filter} onClick={setFilter} />
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 6, flex: 1, minWidth: 220 }}>
          <Search size={12} style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title, category, owner, summary…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 12 }}
          />
        </div>
        {filter !== 'all' && (
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 10px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Policy list */}
      <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.005em' }}>
            Policy register
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 500, marginLeft: 6 }}>
              {filtered.length} shown
            </span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#F5C518', background: 'rgba(245,197,24,0.10)', border: '1px solid rgba(245,197,24,0.40)', padding: '2px 8px', borderRadius: 3, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Illustrative · pre-pilot
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((p) => {
            const meta = STATUS_META[p.status]
            const catColor = CATEGORY_COLOR[p.category]
            const overdue = p.status === 'Overdue review'
            return (
              <div
                key={p.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  padding: '12px 14px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.4 }}>
                      {p.id}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: catColor, background: `${catColor}1a`, border: `1px solid ${catColor}55`, padding: '1px 6px', borderRadius: 3, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                      {p.category}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: meta.color, background: `${meta.color}1a`, border: `1px solid ${meta.color}55`, padding: '1px 6px', borderRadius: 3, letterSpacing: 0.4, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {overdue && <AlertTriangle size={9} />}
                      {meta.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.005em' }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                    {p.summary}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <span><strong style={{ color: 'var(--text-secondary)' }}>Owner</strong> · {p.owner}</span>
                    <span><strong style={{ color: 'var(--text-secondary)' }}>Last reviewed</strong> · {p.lastReviewed}</span>
                    <span style={{ color: overdue ? '#FF3B3B' : 'var(--text-tertiary)' }}>
                      <strong style={{ color: overdue ? '#FF3B3B' : 'var(--text-secondary)' }}>Next review</strong> · {p.nextReview}
                    </span>
                    {p.linkedRisks.length > 0 && (
                      <span><strong style={{ color: 'var(--text-secondary)' }}>Linked risks</strong> · {p.linkedRisks.join(', ')}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <button
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--text-tertiary)',
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                    title="Pilot will deep-link to the document"
                  >
                    <ExternalLink size={9} /> View
                  </button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12, fontStyle: 'italic' }}>
              No policies match the current filter.
            </div>
          )}
        </div>
      </section>

      <div
        style={{
          padding: 12,
          background: 'var(--bg-secondary)',
          border: '1px dashed var(--border-color)',
          borderLeft: '3px solid var(--accent-primary)',
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>How this gets wired:</strong>{' '}
        Pilot phase loads policies from the live policy management system (Diligent / Convene / SharePoint) via document API. Each policy auto-links to the risks it controls so a CRO can ask "show me every policy that backs R-008" and an external auditor can trace evidence both ways. The Overdue review tile escalates into the Approvals queue.
      </div>

      <TrustFooter />
    </div>
  )
}

function SummaryTile({
  label,
  value,
  color,
  filter,
  current,
  onClick,
}: {
  label: string
  value: number
  color: string
  filter: PolicyStatus
  current: 'all' | PolicyStatus
  onClick: (next: 'all' | PolicyStatus) => void
}) {
  const active = current === filter
  return (
    <button
      onClick={() => onClick(active ? 'all' : filter)}
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${active ? color : 'var(--border-color)'}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 8,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: active ? `0 0 0 1px ${color}55` : 'none',
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        <ShieldCheck size={11} /> {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </button>
  )
}
