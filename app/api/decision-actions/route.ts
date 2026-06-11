import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/openai'

// Claude classification of 10-12 headlines takes ~30s, so give the function
// room (the default would cut it off and force the curated fallback).
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export type ActionPortfolio =
  | 'real-estate'
  | 'retail'
  | 'hospitality'
  | 'education'
  | 'facilities'
  | 'cross-portfolio'

export interface DecisionAction {
  title: string
  portfolio: ActionPortfolio
  priority: 'critical' | 'high' | 'medium'
  dueInDays: number
  impactAedM: number
  aiConfidence: number // 0-100
  rationale: string
  signalHeadline: string
  relevance: number // 0-100
}

const SYSTEM_PROMPT = `You are the Chief Risk Strategist for ABC Holdings — Abu Dhabi's largest listed real-estate group (ADX-listed). ABC's portfolio:
- Real Estate: residential communities, commercial towers, mixed-use (Yas Island, Saadiyat, Al Raha)
- Retail: Yas Mall + ~10 malls across Abu Dhabi
- Hospitality: 14 hotels, Ferrari World, Yas Waterworld, Warner Bros. World
- Education: 30+ schools, 30,000+ students
- Facilities Management across the UAE

From LIVE external news signals, produce the Board's PRIORITY RESPONSE ACTIONS — the concrete moves ABC leadership should make this quarter. Each action MUST be derived from a specific signal, decision-grade, and ABC-specific (name the portfolio/asset).

Rules for each action:
- title: a specific executive action (e.g. "Activate FX hedge top-up on overseas-buyer book"), NOT a generic phrase
- portfolio: exactly one of real-estate | retail | hospitality | education | facilities | cross-portfolio
- priority: critical | high | medium — based on how severely and directly the signal hits ABC
- dueInDays: 3 for critical, 14 for high, 30 for medium (adjust slightly if warranted)
- impactAedM: estimated AED millions at stake, realistic (typically 50-700)
- aiConfidence: 0-100
- rationale: ONE concise ABC-specific sentence linking the signal to the action
- signalHeadline: the driving news headline, VERBATIM from the input
- relevance: 0-100, how directly the driving signal affects ABC (>80 direct, 50-80 sector, <50 indirect)

Prefer signals with the highest ABC relevance. Return ONLY a JSON array of up to 5 actions, MOST URGENT FIRST. No markdown, no prose outside the array.`

function safeParseArray(text: string): unknown[] | null {
  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed
    if (parsed && typeof parsed === 'object') return [parsed]
  } catch {
    const m = text.match(/\[[\s\S]*\]/)
    if (m) {
      try {
        return JSON.parse(m[0])
      } catch {}
    }
  }
  return null
}

const PORTFOLIOS: ActionPortfolio[] = ['real-estate', 'retail', 'hospitality', 'education', 'facilities', 'cross-portfolio']

function sanitize(raw: Record<string, unknown>): DecisionAction {
  const clamp = (n: unknown, lo: number, hi: number, dflt: number) => {
    const v = Number(n)
    return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : dflt
  }
  const priority = ['critical', 'high', 'medium'].includes(String(raw.priority))
    ? (raw.priority as DecisionAction['priority'])
    : 'high'
  const portfolioRaw = String(raw.portfolio || '').toLowerCase().replace(/\s+/g, '-')
  const portfolio = PORTFOLIOS.includes(portfolioRaw as ActionPortfolio)
    ? (portfolioRaw as ActionPortfolio)
    : 'cross-portfolio'
  return {
    title: String(raw.title || 'Review emerging risk signal').slice(0, 140),
    portfolio,
    priority,
    dueInDays: Math.round(clamp(raw.dueInDays, 1, 120, priority === 'critical' ? 3 : priority === 'high' ? 14 : 30)),
    impactAedM: Math.round(clamp(raw.impactAedM, 5, 2000, 120)),
    aiConfidence: Math.round(clamp(raw.aiConfidence, 0, 100, 70)),
    rationale: String(raw.rationale || '').slice(0, 240),
    signalHeadline: String(raw.signalHeadline || '').slice(0, 200),
    relevance: Math.round(clamp(raw.relevance, 0, 100, 50)),
  }
}

const PRIORITY_RANK = { critical: 0, high: 1, medium: 2 }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const items: Array<{ headline: string; source: string }> = Array.isArray(body.items) ? body.items.slice(0, 10) : []
    if (items.length === 0) return NextResponse.json({ source: 'empty', actions: [] })

    const list = items.map((it, i) => `${i + 1}. SOURCE "${it.source}": ${it.headline}`).join('\n')
    const userPrompt = `Live external news signals for ABC Holdings:\n\n${list}\n\nReturn the JSON array of up to 5 ABC priority response actions, most urgent first.`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const parsed = safeParseArray(text)
    if (!parsed) throw new Error('parse failed')

    const actions = parsed
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map(sanitize)
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.relevance - a.relevance)
      .slice(0, 5)

    if (actions.length === 0) throw new Error('no actions')
    return NextResponse.json({ source: 'ai', actions })
  } catch {
    // Panel falls back to its curated action list when this returns no actions.
    return NextResponse.json({ source: 'fallback', actions: [] })
  }
}
