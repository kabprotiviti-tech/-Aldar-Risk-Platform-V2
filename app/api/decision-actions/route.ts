import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/openai'

// Lightweight LIST generation (titles + headline metrics). The deep per-action
// analysis is generated on demand by /api/decision-actions/detail.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Small in-memory cache so repeat dashboard loads are instant (the generated
// list only changes as the news does). 5-minute TTL.
let _cache: { ts: number; actions: DecisionAction[] } | null = null
const CACHE_MS = 5 * 60 * 1000

export type ActionPortfolio =
  | 'real-estate'
  | 'retail'
  | 'hospitality'
  | 'education'
  | 'facilities'
  | 'cross-portfolio'

export interface PortfolioImpact {
  portfolio: string
  level: 'high' | 'medium' | 'low'
  note: string
}

export interface DecisionAction {
  title: string
  portfolio: ActionPortfolio
  priority: 'critical' | 'high' | 'medium'
  dueInDays: number
  impactAedM: number
  aiConfidence: number // 0-100
  owner: string
  rationale: string
  whyItMatters: string
  steps: string[]
  portfolioImpacts: PortfolioImpact[]
  ifActed: string
  ifIgnored: string
  signalHeadline: string
  signalSource: string
  signalUrl: string
  relevance: number // 0-100
}

const SYSTEM_PROMPT = `You are the Chief Risk Strategist for ABC Holdings — Abu Dhabi's largest listed real-estate group (ADX-listed). ABC's portfolio:
- Real Estate: residential communities, commercial towers, mixed-use (Yas Island, Saadiyat, Al Raha)
- Retail: Yas Mall + ~10 malls across Abu Dhabi
- Hospitality: 14 hotels, Ferrari World, Yas Waterworld, Warner Bros. World
- Education: 30+ schools, 30,000+ students
- Facilities Management across the UAE

From LIVE external news signals, produce the Board's PRIORITY RESPONSE ACTIONS — the concrete moves ABC leadership should make this quarter. Each action MUST be derived from a specific signal, decision-grade, and ABC-specific (name the portfolio/asset).

RELEVANCE FILTER — credibility depends on this:
- AIM FOR 5 actions. Use signals with a clear or even INDIRECT but genuine link to ABC's UAE real-estate / retail / hospitality / education / facilities business, or UAE/GCC macro, rates, regulation, tourism, construction or capital flows. Lower-impact, sector-wide or indirect actions are fine — label them medium priority with a smaller impact.
- But HARD-REJECT celebrity, sports, foreign-domestic-politics, unrelated-sector, novelty, or wholly-unrelated news. NEVER manufacture a connection (e.g. do NOT turn a SpaceX or US-university headline into an ABC action). One irrelevant action destroys board trust.
- Every action you return MUST have relevance >= 45. Prefer 5 genuine actions; only return fewer if you truly cannot find 5 with a real link.

Keep this FAST — return only these fields per action (the deeper analysis is generated separately on demand):
- title: a specific executive action (e.g. "Activate FX hedge top-up on overseas-buyer book"), NOT a generic phrase
- portfolio: exactly one of real-estate | retail | hospitality | education | facilities | cross-portfolio
- priority: critical | high | medium — based on how severely and directly the signal hits ABC
- dueInDays: 3 for critical, 14 for high, 30 for medium (adjust slightly if warranted)
- impactAedM: estimated AED millions at stake, realistic (typically 50-700)
- aiConfidence: 0-100
- rationale: ONE concise ABC-specific sentence linking the signal to the action
- signalHeadline: the driving news headline, VERBATIM from the input
- signalSource: the source name of that headline, VERBATIM from the input
- relevance: 0-100, how directly the driving signal affects ABC (>80 direct, 55-80 sector)

Return ONLY a JSON array of up to 5 actions, MOST URGENT FIRST. No markdown, no prose outside the array.`

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
  const stepsRaw = Array.isArray(raw.steps) ? raw.steps : []
  const steps = stepsRaw.map((s) => String(s).slice(0, 100)).filter(Boolean).slice(0, 4)
  const piRaw = Array.isArray(raw.portfolioImpacts) ? raw.portfolioImpacts : []
  const portfolioImpacts: PortfolioImpact[] = piRaw
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
    .map((p) => ({
      portfolio: String(p.portfolio || '').toLowerCase().replace(/\s+/g, '-').slice(0, 24),
      level: (['high', 'medium', 'low'].includes(String(p.level)) ? p.level : 'medium') as PortfolioImpact['level'],
      note: String(p.note || '').slice(0, 120),
    }))
    .filter((p) => p.portfolio)
    .slice(0, 4)
  return {
    title: String(raw.title || 'Review emerging risk signal').slice(0, 140),
    portfolio,
    priority,
    dueInDays: Math.round(clamp(raw.dueInDays, 1, 120, priority === 'critical' ? 3 : priority === 'high' ? 14 : 30)),
    impactAedM: Math.round(clamp(raw.impactAedM, 5, 2000, 120)),
    aiConfidence: Math.round(clamp(raw.aiConfidence, 0, 100, 70)),
    owner: String(raw.owner || '').slice(0, 60),
    rationale: String(raw.rationale || '').slice(0, 240),
    whyItMatters: String(raw.whyItMatters || '').slice(0, 600),
    steps,
    portfolioImpacts,
    ifActed: String(raw.ifActed || '').slice(0, 400),
    ifIgnored: String(raw.ifIgnored || '').slice(0, 400),
    signalHeadline: String(raw.signalHeadline || '').slice(0, 200),
    signalSource: String(raw.signalSource || '').slice(0, 80),
    signalUrl: '',
    relevance: Math.round(clamp(raw.relevance, 0, 100, 50)),
  }
}

/** Match a returned action's signalHeadline back to the input item's real URL. */
function attachUrl(action: DecisionAction, items: Array<{ headline: string; url?: string }>): DecisionAction {
  const hit = items.find((it) => it.headline && action.signalHeadline && (it.headline === action.signalHeadline || it.headline.slice(0, 40) === action.signalHeadline.slice(0, 40)))
  return { ...action, signalUrl: hit?.url && hit.url !== '#' ? hit.url : '' }
}

const PRIORITY_RANK = { critical: 0, high: 1, medium: 2 }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const items: Array<{ headline: string; source: string; url?: string }> = Array.isArray(body.items) ? body.items.slice(0, 18) : []
    if (items.length === 0) return NextResponse.json({ source: 'empty', actions: [] })

    // Serve from the in-memory cache when fresh — repeat loads are instant.
    if (_cache && Date.now() - _cache.ts < CACHE_MS && _cache.actions.length > 0) {
      return NextResponse.json({ source: 'ai', actions: _cache.actions, cached: true })
    }

    const list = items.map((it, i) => `${i + 1}. SOURCE "${it.source}": ${it.headline}`).join('\n')
    const userPrompt = `Live external news signals for ABC Holdings:\n\n${list}\n\nReturn the JSON array of up to 5 ABC priority response actions, most urgent first.`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const parsed = safeParseArray(text)
    if (!parsed) throw new Error('parse failed')

    const actions = parsed
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map(sanitize)
      .map((a) => attachUrl(a, items))
      // Relevance floor — keep the SpaceX-pension class of noise out, but low
      // enough to surface 4-5 genuine (incl. indirect/lower-impact) actions.
      .filter((a) => a.relevance >= 45)
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.relevance - a.relevance)
      .slice(0, 5)

    if (actions.length === 0) throw new Error('no actions')
    _cache = { ts: Date.now(), actions }
    return NextResponse.json({ source: 'ai', actions })
  } catch {
    // Panel falls back to its curated action list when this returns no actions.
    return NextResponse.json({ source: 'fallback', actions: [] })
  }
}
