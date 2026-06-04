'use client'

/**
 * RiskMemoryChat — Patch K1
 * --------------------------
 * Conversational Q&A overlay. Floating bottom-LEFT button (offset from
 * AIRiskAdvisor which sits bottom-right). Opens a chat panel that
 * answers questions about specific risks, KRIs, and audit events.
 *
 * No LLM calls — pure-template lookups keyed off entity references the
 * user mentions. Patterns recognised:
 *   - R-001 .. R-010                       → Risk Register lookup
 *   - DRAFT-NNN                            → Draft Risk lookup
 *   - KRI-09 .. KRI-16                     → KRI status + latest entry
 *   - GA-FIN-01 (and other GA-* ids)       → Risk Appetite statement
 *   - "audit trail" / "audit log"          → recent audit events
 *   - "top risks" / "consolidated"         → top-5 residual risks
 *   - "escalations"                        → pending escalations
 *
 * Honors CLAUDE.md: every figure surfaced traces back to seed/engine
 * data the user can verify. No fabricated narratives — if the entity
 * isn't found, the bot says so explicitly.
 */

import React, { useMemo, useRef, useState, useEffect } from 'react'
import { Search, X, Send, Sparkles, MessageSquareText } from 'lucide-react'
import { RISKS } from '@/lib/engine/seedData'
import { KRI_DEFINITIONS } from '@/lib/data/kri-definitions'
import { GROUP_APPETITE_STATEMENTS } from '@/lib/data/group-appetite-statements'
import { useAuditTrail } from '@/lib/context/AuditTrailContext'
import { entityForRisk } from '@/lib/data/risk-entity-mapping'
import { getEntity, ENTITIES, SUBSIDIARIES } from '@/lib/entities/hierarchy'
import {
  getRiskBaselineProvenance,
  type RiskId,
  ALL_RISK_IDS,
} from '@/lib/data/risk-baseline-provenance'
import { FINANCIAL_ANCHORS } from '@/lib/engine/seedData'

interface Msg {
  id: string
  who: 'you' | 'memory'
  text: string
  detail?: string
}

const SUGGESTIONS = [
  'Show me R-008',
  'Risks for ABC Investment',
  'Where does R-008 exposure come from',
  'KRI-12 latest status',
  'GA-FIN-01 appetite',
  'Top 5 risks',
]

const HISTORY_KEY = 'aldar-risk-memory-history-v1'
const HISTORY_LIMIT = 60

const WELCOME_MSG: Msg = {
  id: 'welcome',
  who: 'memory',
  text:
    "Hi — I'm Risk Memory. Ask me about any R-NNN / DRAFT-NNN / KRI-NN / GA-* appetite, or filter risks by subsidiary (\"ABC Investment\"). I look it up — I don't generate.",
}

export function RiskMemoryChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME_MSG])
  const [hydrated, setHydrated] = useState(false)
  const { events } = useAuditTrail()
  const endRef = useRef<HTMLDivElement | null>(null)

  // Hydrate session history once on mount (browser only)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Msg[]
        if (Array.isArray(parsed) && parsed.length > 0) setMsgs(parsed)
      }
    } catch {
      // private mode / quota — non-fatal
    }
    setHydrated(true)
  }, [])

  // Persist on change after hydration
  useEffect(() => {
    if (!hydrated) return
    try {
      // Cap stored history to prevent quota issues
      const slice = msgs.slice(-HISTORY_LIMIT)
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(slice))
    } catch {
      // quota / private mode — non-fatal
    }
  }, [msgs, hydrated])

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [open, msgs])

  function uid(): string {
    return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  }

  function answer(q: string): Msg {
    const text = q.trim()
    if (!text) {
      return { id: uid(), who: 'memory', text: 'Type a question — try one of the suggestions below.' }
    }

    const upper = text.toUpperCase()
    const lower = text.toLowerCase()

    // 1. Risk lookup R-NNN
    const rMatch = upper.match(/R-0?(\d{1,3})/)
    if (rMatch) {
      const id = `R-${rMatch[1].padStart(3, '0')}` as RiskId
      const r = RISKS.find((x) => x.id === id)
      if (!r) {
        return {
          id: uid(),
          who: 'memory',
          text: `${id} not found in the engine register. Try R-001 through R-010 — those are the seeded risks.`,
        }
      }
      const entity = getEntity(entityForRisk(r.id))
      const prov = getRiskBaselineProvenance(id)
      const controls = r.controls.map((c) => `${c.name} (${c.type}, ${(c.effectiveness * 100).toFixed(0)}% effective)`).join('; ')
      const lastTouched = events
        .filter((e) => e.targetId === r.id)
        .sort((a, b) => (a.at < b.at ? 1 : -1))[0]
      return {
        id: uid(),
        who: 'memory',
        text: `${r.id} — ${r.name}`,
        detail: [
          `Category: ${r.category}`,
          `Owner: ${r.owner}`,
          `Entity: ${entity?.shortName ?? '—'}`,
          `Cause / Event / Impact:`,
          `  • ${r.cause}`,
          `  • ${r.event}`,
          `  • ${r.impact}`,
          `Base Likelihood × Impact: ${r.baseLikelihood} × ${r.baseImpact} = ${r.baseLikelihood * r.baseImpact}/25`,
          `Controls: ${controls || 'none'}`,
          `Financial baseline anchor: ${r.financialBaseAedMn.toLocaleString()} AED mn (illustrative — see /risk-register)`,
          `Provenance: ${prov.engineDataPoint.reliability} — ${prov.calibrationPlan}`,
          lastTouched
            ? `Last touched: ${new Date(lastTouched.at).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })} by ${lastTouched.actor} (${lastTouched.action})`
            : `Last touched: no audit events for ${r.id} yet.`,
        ].join('\n'),
      }
    }

    // 2. Draft DRAFT-NNN
    const dMatch = upper.match(/DRAFT-0?(\d{1,3})/)
    if (dMatch) {
      const id = `DRAFT-${dMatch[1].padStart(3, '0')}`
      const draftEvent = events.find(
        (e) => e.targetId === id && e.category === 'risk',
      )
      if (!draftEvent) {
        return {
          id: uid(),
          who: 'memory',
          text: `${id} not found in audit trail. Drafts are created on /risk-register — once added you can query them here.`,
        }
      }
      const all = events
        .filter((e) => e.targetId === id)
        .sort((a, b) => (a.at < b.at ? -1 : 1))
      return {
        id: uid(),
        who: 'memory',
        text: `${id} — draft risk history`,
        detail: all
          .map(
            (e) =>
              `${new Date(e.at).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })} · ${e.actor} · ${e.action} — ${e.summary}`,
          )
          .join('\n'),
      }
    }

    // 3. KRI-NN
    const kMatch = upper.match(/KRI-?(\d{1,3})/)
    if (kMatch) {
      const id = `KRI-${kMatch[1].padStart(2, '0')}`
      const k = KRI_DEFINITIONS.find((x) => x.id === id)
      if (!k) {
        return {
          id: uid(),
          who: 'memory',
          text: `${id} not found. Active KRIs are KRI-09 through KRI-16.`,
        }
      }
      const recentEvents = events
        .filter((e) => e.targetId === k.id)
        .sort((a, b) => (a.at < b.at ? 1 : -1))
        .slice(0, 3)
      return {
        id: uid(),
        who: 'memory',
        text: `${k.id} — ${k.name}`,
        detail: [
          `Owner: ${k.owner}`,
          `Frequency: ${k.frequency}`,
          `Direction: ${k.direction} (default amber boundary ${k.defaultThresholds.amberBoundary}, red ${k.defaultThresholds.redBoundary} ${k.defaultThresholds.unit})`,
          `Description: ${k.description}`,
          `Linked risks: ${k.linkedRiskIds.join(', ') || 'none'}`,
          `Appetite anchor (${k.riskAppetite.approvedBy}, reviewed ${k.riskAppetite.lastReviewed}):`,
          `  "${k.riskAppetite.statement}"`,
          recentEvents.length > 0
            ? `Recent events:\n${recentEvents
                .map(
                  (e) =>
                    `  • ${new Date(e.at).toLocaleString('en-AE', { timeZone: 'Asia/Dubai', dateStyle: 'short', timeStyle: 'short' })} · ${e.actor} · ${e.summary}`,
                )
                .join('\n')}`
            : 'Recent events: none — go to /kri to add an entry or edit thresholds.',
        ].join('\n'),
      }
    }

    // 4. Appetite statement GA-*
    const gaMatch = upper.match(/GA-[A-Z]+-?\d{1,3}/)
    if (gaMatch) {
      const id = gaMatch[0]
      const a = GROUP_APPETITE_STATEMENTS.find((x) => x.id === id)
      if (!a) {
        return {
          id: uid(),
          who: 'memory',
          text: `${id} not found. Active appetite ids are GA-FIN-01/02, GA-STR-01, GA-OP-01/02, GA-CMP-01, GA-REP-01, GA-ESG-01.`,
        }
      }
      return {
        id: uid(),
        who: 'memory',
        text: `${a.id} — ${a.title}`,
        detail: [
          `Category: ${a.category}`,
          `Level: ${a.level}`,
          `Approved by: ${a.approvedBy}`,
          `Last reviewed: ${a.lastReviewed}`,
          `Statement:\n  "${a.statement}"`,
          a.linkedKRIs.length > 0 ? `Linked KRIs: ${a.linkedKRIs.join(', ')}` : 'Linked KRIs: none',
        ].join('\n'),
      }
    }

    // 5. Top risks
    if (/top\s*(\d+)?\s*risk/.test(lower) || lower.includes('biggest risk')) {
      const n = parseInt((lower.match(/top\s*(\d+)/) || [])[1] || '5', 10)
      const top = [...RISKS]
        .sort((a, b) => b.baseLikelihood * b.baseImpact - a.baseLikelihood * a.baseImpact)
        .slice(0, n)
      return {
        id: uid(),
        who: 'memory',
        text: `Top ${top.length} risks by inherent score`,
        detail: top
          .map(
            (r, i) =>
              `${i + 1}. ${r.id} ${r.name} — inherent ${r.baseLikelihood * r.baseImpact}/25, owner ${r.owner}`,
          )
          .join('\n'),
      }
    }

    // 6. Audit trail
    if (lower.includes('audit') || lower.includes('history') || lower.includes('recent')) {
      if (events.length === 0) {
        return {
          id: uid(),
          who: 'memory',
          text:
            'No audit events recorded yet. Add a draft on /risk-register, edit a KRI threshold, or escalate a risk — every action is logged.',
        }
      }
      const recent = events
        .slice()
        .sort((a, b) => (a.at < b.at ? 1 : -1))
        .slice(0, 8)
      return {
        id: uid(),
        who: 'memory',
        text: `Most recent ${recent.length} audit events`,
        detail: recent
          .map(
            (e) =>
              `${new Date(e.at).toLocaleString('en-AE', { timeZone: 'Asia/Dubai', dateStyle: 'short', timeStyle: 'short' })} · [${e.category}/${e.action}] ${e.actor} → ${e.summary}`,
          )
          .join('\n'),
      }
    }

    // 7. Escalations
    if (lower.includes('escalation') || lower.includes('escalat')) {
      const escEvents = events
        .filter((e) => e.category === 'escalation')
        .sort((a, b) => (a.at < b.at ? 1 : -1))
        .slice(0, 5)
      if (escEvents.length === 0) {
        return {
          id: uid(),
          who: 'memory',
          text:
            'No escalations recorded yet. Open any risk on /risk-register and use the Escalate to Group button.',
        }
      }
      return {
        id: uid(),
        who: 'memory',
        text: `Recent escalations (${escEvents.length})`,
        detail: escEvents
          .map(
            (e) =>
              `${new Date(e.at).toLocaleString('en-AE', { timeZone: 'Asia/Dubai', dateStyle: 'short' })} · ${e.targetId} · ${e.summary}`,
          )
          .join('\n'),
      }
    }

    // 8. Provenance traceback — "where does R-008 exposure come from"
    if (
      /(where|how|source|provenance|anchor|baseline|come from|derived|traceback)/.test(lower) &&
      /(r-?\d|exposure|aed|anchor|figure|number)/.test(lower)
    ) {
      // If a specific R-NNN was mentioned the rMatch branch above caught it.
      // This branch handles generic provenance asks — return the anchor chain
      // for the most recently-referenced risk or, lacking that, R-008 (highest
      // signal exposure risk in the demo).
      const lastUserRef =
        msgs
          .slice()
          .reverse()
          .map((m) => m.text.toUpperCase().match(/R-0?(\d{1,3})/))
          .find((m) => m) || null
      const id = lastUserRef
        ? (`R-${lastUserRef[1].padStart(3, '0')}` as RiskId)
        : ('R-008' as RiskId)
      if (!ALL_RISK_IDS.includes(id)) {
        return {
          id: uid(),
          who: 'memory',
          text: `${id} not in the provenance map. Active risks: ${ALL_RISK_IDS.join(', ')}.`,
        }
      }
      const r = RISKS.find((x) => x.id === id)!
      const prov = getRiskBaselineProvenance(id)
      const anchorVal = FINANCIAL_ANCHORS[prov.anchorKey]
      const computed = Math.round(
        r.financialBaseAedMn *
          r.sensitivityCoefficient *
          r.financialWeight *
          10,
      )
      const refLine = prov.anchorReference
        ? `  Audited reference: ${prov.anchorReference.aldarReference.value.toLocaleString()} AED mn (${prov.anchorReference.aldarReference.reliability})`
        : '  Audited reference: not mapped — pilot calibration pending.'
      return {
        id: uid(),
        who: 'memory',
        text: `${id} exposure — provenance chain`,
        detail: [
          `Engine anchor key: ${prov.anchorKey}`,
          `Anchor value: ${anchorVal.toLocaleString()} AED mn (illustrative MVP baseline)`,
          `Risk sensitivity coefficient: ${r.sensitivityCoefficient}`,
          `Risk financial weight: ${r.financialWeight}`,
          `Computed baseline (anchor × coefficient × weight × 10):`,
          `  ${anchorVal.toLocaleString()} × ${r.sensitivityCoefficient} × ${r.financialWeight} × 10 = ${computed.toLocaleString()} AED mn`,
          refLine,
          `Tier: ${prov.engineDataPoint.reliability}`,
          `Calibration plan: ${prov.calibrationPlan}`,
        ].join('\n'),
      }
    }

    // 9. Cross-entity reference — "show me risks for ABC Investment"
    const entityMatch = SUBSIDIARIES.find((e) => {
      const tokens = [
        e.shortName.toLowerCase(),
        e.shortName.toLowerCase().replace(/\s+/g, ''),
        e.id.toLowerCase(),
      ]
      return tokens.some((t) => lower.includes(t))
    })
    if (entityMatch || lower.includes('aldar group') || lower.includes('group risks')) {
      const target = entityMatch ?? ENTITIES.find((e) => e.kind === 'holding')!
      const scoped = RISKS.filter((r) => entityForRisk(r.id) === target.id)
      if (scoped.length === 0) {
        return {
          id: uid(),
          who: 'memory',
          text: `${target.shortName} — no engine risks mapped`,
          detail: `Risk → entity mapping is illustrative for MVP (see /portfolio-tower). No R-001..R-010 records are tagged to ${target.shortName} in the current seed.`,
        }
      }
      const sorted = scoped.sort(
        (a, b) =>
          b.baseLikelihood * b.baseImpact - a.baseLikelihood * a.baseImpact,
      )
      return {
        id: uid(),
        who: 'memory',
        text: `${target.shortName} — ${scoped.length} risk${scoped.length === 1 ? '' : 's'} (engine register)`,
        detail: sorted
          .map(
            (r) =>
              `${r.id} ${r.name} — inherent ${r.baseLikelihood * r.baseImpact}/25, owner ${r.owner}`,
          )
          .join('\n'),
      }
    }

    // Fallback
    return {
      id: uid(),
      who: 'memory',
      text:
        "I don't have a template for that. Try: R-001..R-010, KRI-09..KRI-16, GA-FIN-01 (etc.), \"risks for ABC Investment\", \"where does R-008 exposure come from\", or \"top risks\" / \"recent audit\" / \"escalations\".",
    }
  }

  function send(q?: string) {
    const text = (q ?? input).trim()
    if (!text) return
    const userMsg: Msg = { id: uid(), who: 'you', text }
    const memMsg = answer(text)
    setMsgs((m) => [...m, userMsg, memMsg])
    setInput('')
  }

  const fabZ = 9050
  const panelZ = 9051

  return (
    <>
      {/* FAB — bottom-right, restrained outlined ring (Linear/Vercel pattern,
         no consumer-y pulsing). */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Ask ABC Risk Assistant (Cmd+K) — R-NNN, KRI-NN, GA-*, audit trail"
          aria-label="Risk Assistant"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: fabZ,
            background:
              'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary, var(--accent-primary)) 100%)',
            color: 'var(--on-accent)',
            border: '1px solid var(--accent-primary)',
            borderRadius: '50%',
            width: 52,
            height: 52,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md, 0 8px 24px rgba(0,0,0,0.4))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.transform = 'scale(1.05)'
            el.style.boxShadow = 'var(--shadow-lg, 0 16px 36px rgba(0,0,0,0.5))'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.transform = 'scale(1)'
            el.style.boxShadow = 'var(--shadow-md, 0 8px 24px rgba(0,0,0,0.4))'
          }}
        >
          <Sparkles size={20} />
        </button>
      )}

      {/* Panel — bottom-right anchored, taller, cleaner header */}
      {open && (
        <div
          role="dialog"
          aria-label="Risk Assistant"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 'min(440px, 94vw)',
            maxHeight: 'min(680px, 84vh)',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-lg, 0 24px 60px rgba(0,0,0,0.55))',
            zIndex: panelZ,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-color)',
              background:
                'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background:
                  'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary, var(--accent-primary)) 100%)',
                color: 'var(--on-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={15} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                ABC Risk Assistant
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: 0.3 }}>
                Deterministic lookup · every answer traces to its source
              </div>
            </div>
            <button
              onClick={() => {
                if (
                  msgs.length > 1 &&
                  confirm('Clear chat history for this session?')
                ) {
                  setMsgs([WELCOME_MSG])
                }
              }}
              title="Clear chat history"
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: 3,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}
            >
              Clear
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: 4,
                display: 'inline-flex',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {msgs.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.who === 'you' ? 'flex-end' : 'flex-start',
                  background:
                    m.who === 'you' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color:
                    m.who === 'you' ? 'var(--on-accent)' : 'var(--text-primary)',
                  border:
                    m.who === 'you'
                      ? 'none'
                      : '1px solid var(--border-color)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  maxWidth: '90%',
                  fontSize: 12,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                <div style={{ fontWeight: m.who === 'memory' ? 700 : 500 }}>{m.text}</div>
                {m.detail && (
                  <div
                    style={{
                      marginTop: 6,
                      paddingTop: 6,
                      borderTop:
                        m.who === 'you'
                          ? '1px solid rgba(255,255,255,0.25)'
                          : '1px dashed var(--border-color)',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontSize: 10.5,
                      color: m.who === 'you' ? 'var(--on-accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {m.detail}
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Suggestions */}
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
            style={{
              display: 'flex',
              gap: 6,
              padding: 10,
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
            }}
          >
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <Search
                size={13}
                style={{
                  position: 'absolute',
                  left: 10,
                  color: 'var(--text-tertiary)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about R-NNN, KRI-NN, GA-* …"
                style={{
                  flex: 1,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  padding: '7px 12px 7px 28px',
                  fontSize: 12,
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                background: 'var(--accent-primary)',
                color: 'var(--on-accent)',
                border: 'none',
                borderRadius: 6,
                padding: '0 12px',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                opacity: input.trim() ? 1 : 0.5,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
