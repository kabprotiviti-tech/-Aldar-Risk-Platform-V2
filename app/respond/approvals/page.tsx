'use client'

/**
 * /respond/approvals — Block 2 P8
 * --------------------------------
 * Central queue for items needing approval:
 *   (a) Risk Appetite proposals awaiting CRO/ARC approval
 *   (b) Risk drafts submitted by Champions
 *   (c) Escalations pending Group acknowledgement
 *
 * Persona-filtered:
 *   - Group CRO + ARC Chair: see EVERYTHING + approve buttons
 *   - Risk Champion: see only their own pending submissions (status)
 *   - Subsidiary CEO: see escalations TO their entity
 *   - Internal Audit: read-only view of all queues
 */

import React from 'react'
import Link from 'next/link'
import {
  ClipboardList,
  Check,
  X,
  Pencil,
  ArrowUp,
  ShieldQuestion,
  Clock,
} from 'lucide-react'
import {
  SimulationProvider,
} from '@/lib/context/SimulationContext'
import {
  RiskDraftProvider,
  useRiskDrafts,
} from '@/lib/context/RiskDraftContext'
import {
  EscalationsProvider,
  useEscalations,
} from '@/lib/context/EscalationsContext'
import {
  RiskAppetiteProvider,
  useRiskAppetite,
} from '@/lib/context/RiskAppetiteContext'
import { usePersona } from '@/lib/context/PersonaContext'
import { can } from '@/lib/rbac/policy'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'
import { WorkflowChain } from '@/components/workflow/WorkflowChain'
import { buildWorkflowsSeed } from '@/lib/data/workflows-seed'

export default function ApprovalsPage() {
  return (
    <SimulationProvider>
      <RiskDraftProvider>
        <EscalationsProvider>
          <RiskAppetiteProvider>
            <Content />
          </RiskAppetiteProvider>
        </EscalationsProvider>
      </RiskDraftProvider>
    </SimulationProvider>
  )
}

function Content() {
  const { persona, session } = usePersona()
  const canApproveAppetite = can(persona?.id ?? null, 'appetite:approve')
  const canAcknowledgeEsc = can(persona?.id ?? null, 'escalation:acknowledge')
  const canCloseEsc = can(persona?.id ?? null, 'escalation:close')

  const { drafts } = useRiskDrafts()
  const { escalations, setStatus: setEscStatus } = useEscalations()
  const { pendingProposals, approveProposal, rejectProposal } = useRiskAppetite()

  // Champion sees only items they raised (by displayName) — heuristic.
  // Sub CEO sees escalations relevant to their entity.
  // CRO / ARC / IA see all.
  const isLine1 = persona?.id === 'risk-champion' || persona?.id === 'subsidiary-ceo'
  const my = (createdBy: string | null | undefined) =>
    !isLine1 ||
    (session.displayName && createdBy && createdBy.includes(session.displayName))

  const myDrafts = isLine1
    ? drafts.filter((d) => my(d.createdBy))
    : drafts.filter((d) => d.status !== 'closed')

  const pendingEsc = escalations.filter((e) => e.status === 'pending')
  const ackEsc = escalations.filter((e) => e.status === 'acknowledged')

  const proposals = pendingProposals()

  return (
    <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <IllustrativeDataBanner pilotFeeds="ABC approval-workflow engine + delegated-authority matrix" />

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
            className="ui-page-title"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
          >
            <ClipboardList size={20} style={{ color: 'var(--accent-primary)' }} />
            Approvals Queue
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', maxWidth: 780, lineHeight: 1.55 }}>
            Centralised queue of items awaiting decision: appetite proposals,
            risk drafts, escalations. Persona-filtered:{' '}
            {persona ? (
              <strong style={{ color: 'var(--text-primary)' }}>{persona.title}</strong>
            ) : (
              'all visitors'
            )}
            .
          </p>
        </div>
        <StatusBadge tier="MVP" note={`${proposals.length + pendingEsc.length + myDrafts.length} items`} />
      </div>

      {/* N-step workflow chains — Batch F.
          Illustrative instances showing the Champion → ERM → CRO → ARC
          → Board chain mid-flight. Persona-aware: viewer who can advance
          sees Action buttons. */}
      <Section
        title="Active workflow chains"
        subtitle="N-step approval routing — current state per artefact"
        accent="#2D9EFF"
        icon={<ShieldQuestion size={14} />}
        cta={<span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>4 illustrative · pilot wires live store</span>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {buildWorkflowsSeed().map((wf) => (
            <WorkflowChain key={wf.id} instance={wf} />
          ))}
        </div>
      </Section>

      <Section
        title="Risk Appetite Proposals"
        subtitle={`${proposals.length} pending · ${canApproveAppetite ? 'You can approve / reject' : 'Read-only for this persona'}`}
        accent="#A855F7"
        icon={<ShieldQuestion size={14} />}
        cta={<Link href="/risk-appetite" style={ctaSmall}>Open appetite →</Link>}
      >
        {proposals.length === 0 ? (
          <Empty>No appetite proposals pending. ERM Head proposes from /risk-appetite.</Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {proposals.map((p) => (
              <div key={p.id} style={rowStyle}>
                <span style={monoStyle}>{p.id}</span>
                <span style={{ flex: 1, color: 'var(--text-primary)' }}>
                  Proposed by {p.override.proposedBy ?? '—'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                  {p.override.proposedAt
                    ? new Date(p.override.proposedAt).toLocaleDateString('en-AE', { timeZone: 'Asia/Dubai' })
                    : '—'}
                </span>
                {canApproveAppetite ? (
                  <>
                    <button
                      onClick={() => approveProposal(p.id)}
                      style={{ ...btnApprove }}
                    >
                      <Check size={11} />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt(`Reject ${p.id}? Optional reason:`, '')
                        if (reason === null) return
                        rejectProposal(p.id, undefined, reason || undefined)
                      }}
                      style={{ ...btnReject }}
                    >
                      <X size={11} />
                      Reject
                    </button>
                  </>
                ) : (
                  <span style={readOnlyChip}>Awaiting CRO / ARC</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title={isLine1 ? 'My Risk Draft Submissions' : 'Risk Drafts in Flight'}
        subtitle={`${myDrafts.length} draft${myDrafts.length === 1 ? '' : 's'} ${isLine1 ? 'authored by you' : 'across the platform'}`}
        accent="#0B6E5B"
        icon={<Pencil size={14} />}
        cta={<Link href="/risk-register" style={ctaSmall}>Open register →</Link>}
      >
        {myDrafts.length === 0 ? (
          <Empty>
            {isLine1
              ? 'You haven\'t submitted any drafts yet. Use /risk-register → Add Risk.'
              : 'No draft risks awaiting review.'}
          </Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {myDrafts.slice(0, 10).map((d) => (
              <Link
                key={d.id}
                href={`/risk-register?focus=${d.id}`}
                style={{ ...rowStyle, textDecoration: 'none', color: 'inherit' }}
              >
                <span style={monoStyle}>{d.id}</span>
                <span style={{ flex: 1, color: 'var(--text-primary)' }}>{d.name}</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                  {d.createdBy}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: d.status === 'open' ? '#F5C518' : d.status === 'closed' ? '#22C55E' : '#2D9EFF',
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                    minWidth: 70,
                    textAlign: 'right',
                  }}
                >
                  {d.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Pending Escalations"
        subtitle={`${pendingEsc.length} pending · ${ackEsc.length} acknowledged · ${canAcknowledgeEsc ? 'You can acknowledge' : 'Read-only'}`}
        accent="#FF3B3B"
        icon={<ArrowUp size={14} />}
        cta={<Link href="/portfolio-tower" style={ctaSmall}>Portfolio Tower →</Link>}
      >
        {pendingEsc.length === 0 && ackEsc.length === 0 ? (
          <Empty>
            No escalations. Risk Champions raise these via the Escalate-to-Group
            button on /risk-register.
          </Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...pendingEsc, ...ackEsc].slice(0, 10).map((e) => (
              <div key={e.id} style={rowStyle}>
                <span style={monoStyle}>{e.riskId}</span>
                <span style={{ flex: 1, color: 'var(--text-primary)' }}>{e.riskName}</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                  by {e.escalatedBy}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: e.status === 'pending' ? '#F5C518' : e.status === 'acknowledged' ? '#2D9EFF' : '#22C55E',
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                    minWidth: 90,
                    textAlign: 'right',
                  }}
                >
                  {e.status}
                </span>
                {e.status === 'pending' && canAcknowledgeEsc && (
                  <button
                    onClick={() => setEscStatus(e.id, 'acknowledged')}
                    style={btnApprove}
                  >
                    <Check size={11} />
                    Ack
                  </button>
                )}
                {e.status === 'acknowledged' && canCloseEsc && (
                  <button
                    onClick={() => setEscStatus(e.id, 'closed')}
                    style={btnApprove}
                  >
                    <Check size={11} />
                    Close
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <div
        style={{
          padding: 12,
          background: 'var(--bg-secondary)',
          border: '1px dashed var(--border-color)',
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <Clock size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 2 }} />
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>Multi-step routing</strong>
          {' '}(level-1 → level-2 → escalate-after-N-days SLAs) is on the
          pilot roadmap. Pilot wires ABC's delegated-authority matrix
          and email/Slack notification stubs.
        </span>
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  accent,
  icon,
  cta,
  children,
}: {
  title: string
  subtitle: string
  accent: string
  icon: React.ReactNode
  cta?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderLeft: `4px solid ${accent}`, borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: accent, letterSpacing: 0.5, textTransform: 'uppercase' }}>{icon}{title}</div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{subtitle}</div>
        </div>
        {cta}
      </div>
      {children}
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: 11, background: 'var(--bg-primary)', border: '1px dashed var(--border-color)', borderRadius: 6 }}>{children}</div>
}

const monoStyle: React.CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.4, minWidth: 70 }
const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 4, fontSize: 11 }
const btnApprove: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, background: '#22C55E', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer' }
const btnReject: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent', color: 'var(--risk-critical)', border: '1px solid var(--risk-critical)', padding: '4px 10px', borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer' }
const readOnlyChip: React.CSSProperties = { fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.4, textTransform: 'uppercase', padding: '3px 8px', border: '1px solid var(--border-color)', borderRadius: 3 }
const ctaSmall: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent', color: 'var(--accent-primary)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none' }
