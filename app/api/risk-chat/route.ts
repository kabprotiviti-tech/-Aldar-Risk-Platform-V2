import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/openai'
import { BASELINE_RISK_POSTURE as B } from '@/lib/data/baselineRiskPosture'
import { RISKS } from '@/lib/engine/seedData'
import { KRI_DEFINITIONS } from '@/lib/data/kri-definitions'
import { GROUP_APPETITE_STATEMENTS } from '@/lib/data/group-appetite-statements'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

function aed(n: number): string {
  const v = Math.abs(n)
  if (v >= 1e9) return `AED ${(n / 1e9).toFixed(2)}Bn`
  return `AED ${Math.round(n / 1e6)}M`
}

/** Compact, factual context the assistant must ground ABC-specific answers in. */
function buildContext(): string {
  const risks = RISKS.slice(0, 24)
    .map((r) => `${(r as { id: string }).id}: ${(r as { name: string }).name}${(r as { category?: string }).category ? ` [${(r as { category?: string }).category}]` : ''}`)
    .join('\n')
  const kris = KRI_DEFINITIONS.map((k) => `${k.id}: ${k.name}`).join('\n')
  const appetite = GROUP_APPETITE_STATEMENTS.slice(0, 12)
    .map((a) => `${a.id} [${a.category}]: ${a.statement}`)
    .join('\n')

  return `ABC HOLDINGS — RISK CONTEXT (illustrative POC data; figures are illustrative).

HEADLINE POSTURE
- Net unhedged exposure: ${aed(B.netUnhedgedExposure)} vs board appetite ceiling ${aed(B.netUnhedgedAppetiteCeiling)} (over appetite).
- Gross exposure ${aed(B.totalFinancialExposure)}; hedged ${aed(B.hedgedExposure)}.
- Group risk score: ${B.overallRiskScore}/100 (prior period ${B.overallRiskScorePrior}; appetite ceiling ${B.overallRiskScoreAppetiteCeiling}; lower is better).
- ${B.criticalRiskCount} critical and ${B.highRiskCount} high risks; ${B.activeControlWeaknesses} control weaknesses; ${B.overdueActions} overdue actions.

RISK REGISTER (id: name)
${risks}

KEY RISK INDICATORS (id: name)
${kris}

GROUP RISK APPETITE STATEMENTS (id [category]: statement)
${appetite}`
}

async function fetchSignals(req: NextRequest): Promise<string> {
  try {
    const origin = req.nextUrl.origin
    const r = await fetch(`${origin}/api/news`, { cache: 'no-store' })
    if (!r.ok) return ''
    const d = await r.json()
    const items: Array<{ headline: string; source: string }> = (d.items || []).slice(0, 8)
    return items.map((it) => `- "${it.headline}" (${it.source})`).join('\n')
  } catch {
    return ''
  }
}

const SYSTEM_PROMPT = `You are the AI Risk Assistant for ABC Holdings — Abu Dhabi's largest listed real-estate group (residential, retail/malls, hospitality incl. Ferrari World/Yas, education, facilities management). You help executives (Group Risk Head, ARC Chair, subsidiary CEOs, risk champions) understand their risk position and how the outside world affects it.

RULES:
- Ground every ABC-specific fact — risk IDs, KRIs, exposure figures, appetite — STRICTLY in the CONTEXT block. NEVER invent a risk ID, KRI, number, or appetite statement that is not in the context. If something is not in the context, say you don't have it and suggest where to look.
- You MAY reason about the LIVE EXTERNAL SIGNALS and connect them to ABC's specific risks/portfolio — but make clear when something is your assessment versus a stated figure from the register.
- All figures are illustrative POC data; note this only if asked about precision or provenance.
- Voice: concise, executive, plain English (Executive Directors / CXOs read this). Reference risk IDs (e.g. R-007) where relevant. Usually 2–5 sentences; expand only if asked for detail. No "as an AI" preamble.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = String(body.message || '').trim().slice(0, 1000)
    if (!message) {
      return NextResponse.json({ reply: 'Ask me about your risk position, a specific risk (e.g. R-007), a KRI, your appetite — or what is happening externally and how it affects ABC.' })
    }
    const history: Array<{ who: string; text: string }> = Array.isArray(body.history) ? body.history.slice(-6) : []
    const context = buildContext()
    const signals = await fetchSignals(req)

    const convo = history.map((h) => `${h.who === 'you' ? 'User' : 'Assistant'}: ${h.text}`).join('\n')
    const userContent = `CONTEXT:\n${context}\n\nLIVE EXTERNAL SIGNALS:\n${signals || '(none available right now)'}\n\n${convo ? `CONVERSATION SO FAR:\n${convo}\n\n` : ''}User: ${message}\n\nAnswer as ABC's AI Risk Assistant, grounded in the context above.`

    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const reply = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
    return NextResponse.json({ reply: reply || 'I could not find that. Try a risk ID (R-007), a KRI, or ask about an external development.' })
  } catch {
    return NextResponse.json({ reply: 'The assistant is briefly unavailable — please try again, or look up an exact ID (e.g. R-008).' })
  }
}
