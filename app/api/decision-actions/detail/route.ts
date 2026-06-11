import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/openai'

// Deep analysis for a SINGLE action — small, fast (~5-10s), generated on click.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export interface PortfolioImpact {
  portfolio: string
  level: 'high' | 'medium' | 'low'
  note: string
}

export interface ActionDetail {
  owner: string
  whyItMatters: string
  steps: string[]
  portfolioImpacts: PortfolioImpact[]
  ifActed: string
  ifIgnored: string
}

const SYSTEM_PROMPT = `You are the Chief Risk Strategist for ABC Holdings — Abu Dhabi's largest listed real-estate group (residential, retail/malls, hospitality incl. Ferrari World/Yas, education, facilities management). Given ONE recommended action and the external signal that triggered it, produce the board-grade analysis behind it. Be ABC-specific (name portfolios/assets), concise, executive.

Return ONLY a JSON object with these fields:
- owner: the ABC executive or team to assign / escalate to (e.g. "Group CFO", "FM Operations Head", "Group Risk Head / CRO", "CDO")
- whyItMatters: 2-3 sentences — the business mechanism and what's at stake for ABC specifically
- steps: array of 2-4 short concrete first steps (each a phrase)
- portfolioImpacts: array of 1-3 { portfolio: real-estate|retail|hospitality|education|facilities, level: high|medium|low, note: short phrase }
- ifActed: 1-2 sentences on the outcome if ABC takes this action now (rough residual/avoided figure if sensible)
- ifIgnored: 1-2 sentences on the outcome if ABC does nothing
No markdown, no prose outside the JSON object.`

function safeParseObject(text: string): Record<string, unknown> | null {
  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        return JSON.parse(m[0])
      } catch {}
    }
  }
  return null
}

const PORTFOLIOS = ['real-estate', 'retail', 'hospitality', 'education', 'facilities', 'cross-portfolio']

function sanitize(raw: Record<string, unknown>): ActionDetail {
  const steps = (Array.isArray(raw.steps) ? raw.steps : []).map((s) => String(s).slice(0, 100)).filter(Boolean).slice(0, 4)
  const portfolioImpacts: PortfolioImpact[] = (Array.isArray(raw.portfolioImpacts) ? raw.portfolioImpacts : [])
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
    .map((p) => ({
      portfolio: String(p.portfolio || '').toLowerCase().replace(/\s+/g, '-').slice(0, 24),
      level: (['high', 'medium', 'low'].includes(String(p.level)) ? p.level : 'medium') as PortfolioImpact['level'],
      note: String(p.note || '').slice(0, 120),
    }))
    .filter((p) => p.portfolio && PORTFOLIOS.includes(p.portfolio))
    .slice(0, 4)
  return {
    owner: String(raw.owner || '').slice(0, 60),
    whyItMatters: String(raw.whyItMatters || '').slice(0, 600),
    steps,
    portfolioImpacts,
    ifActed: String(raw.ifActed || '').slice(0, 400),
    ifIgnored: String(raw.ifIgnored || '').slice(0, 400),
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const a = body.action || {}
    const title = String(a.title || '').slice(0, 200)
    if (!title) return NextResponse.json({ source: 'empty', detail: null })

    const userPrompt = `ABC priority action: "${title}"
Portfolio: ${a.portfolio || 'cross-portfolio'} · est. impact AED ${a.impactAedM || '?'}M · act within ${a.dueInDays || '?'} days · priority ${a.priority || 'high'}
Triggered by external signal: "${a.signalHeadline || ''}"${a.signalSource ? ` (${a.signalSource})` : ''}

Produce the board-grade analysis JSON object for this action.`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const parsed = safeParseObject(text)
    if (!parsed) throw new Error('parse failed')
    return NextResponse.json({ source: 'ai', detail: sanitize(parsed) })
  } catch {
    return NextResponse.json({ source: 'fallback', detail: null })
  }
}
