import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/openai'

export interface ScenarioImpactResponse {
  explanation: string
  affectedBUs: string[]
  propagationChain: Array<{ step: number; trigger: string; effect: string; severity: 'critical' | 'high' | 'medium' }>
  urgency: 'critical' | 'high' | 'medium'
  confidence: number
}

const SYSTEM_PROMPT = `You are a senior risk analyst at Aldar Properties PJSC (Abu Dhabi's largest listed real estate developer, AED 9.8Bn revenue).
You are given a scenario that has just been activated in the live risk platform, along with the current portfolio state.

Your job: produce a concise, executive-grade impact assessment that shows how this scenario propagates across Aldar's five BUs.

Business units:
- Real Estate: Yas Island, Saadiyat, Al Raha Beach (AED 1.2Bn revenue)
- Retail: Yas Mall, Al Jimi Mall + 6 others, 350 tenants (AED 800M revenue)
- Hospitality: 14 hotels + Ferrari World, Yas Waterworld, Warner Bros. World (AED 600M revenue)
- Education: Aldar Education, 30+ schools, 30,000 students (AED 400M revenue)
- Facilities: FM services across Abu Dhabi portfolio (AED 350M revenue)

Respond ONLY with a valid JSON object — no markdown, no text outside the object.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { scenario, portfolioState } = body

    if (!scenario?.id) {
      return NextResponse.json({ error: 'scenario is required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const stateBlock = portfolioState
      ? JSON.stringify(portfolioState, null, 2)
      : 'No live portfolio state provided'

    const userPrompt = `SCENARIO ACTIVATED: "${scenario.name}"
Tagline: ${scenario.tagline}
Description: ${scenario.description}
Affected portfolios: ${scenario.affectedPortfolios?.join(', ')}
Estimated total impact: AED ${scenario.totalImpactAED}M (${scenario.impactPct}% of revenue)

CURRENT LIVE PORTFOLIO STATE:
${stateBlock}

SCENARIO DELTAS (changes from base):
${JSON.stringify(scenario.deltas, null, 2)}

Respond with ONLY this JSON (start with {, end with }):
{
  "explanation": "2–3 sentence executive summary of how this scenario hits Aldar — cite specific BUs, numbers from the deltas, and current portfolio state. Make it feel real and urgent.",
  "affectedBUs": ["BU name 1", "BU name 2"],
  "propagationChain": [
    { "step": 1, "trigger": "root cause", "effect": "first-order impact on BU", "severity": "critical" },
    { "step": 2, "trigger": "first-order effect", "effect": "second-order propagation", "severity": "high" },
    { "step": 3, "trigger": "second-order effect", "effect": "financial / balance-sheet impact", "severity": "high" }
  ],
  "urgency": "critical",
  "confidence": 0.88
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!text) throw new Error('Empty response from Claude')

    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()

    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON in response')

    const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)) as ScenarioImpactResponse

    const result: ScenarioImpactResponse = {
      explanation: String(parsed.explanation || ''),
      affectedBUs: Array.isArray(parsed.affectedBUs)
        ? parsed.affectedBUs.slice(0, 5).map(String)
        : [],
      propagationChain: Array.isArray(parsed.propagationChain)
        ? parsed.propagationChain.slice(0, 4).map((s, i) => ({
            step: typeof s.step === 'number' ? s.step : i + 1,
            trigger: String(s.trigger || ''),
            effect: String(s.effect || ''),
            severity: (['critical', 'high', 'medium'].includes(s.severity) ? s.severity : 'high') as 'critical' | 'high' | 'medium',
          }))
        : [],
      urgency: (['critical', 'high', 'medium'].includes(parsed.urgency) ? parsed.urgency : 'high') as 'critical' | 'high' | 'medium',
      confidence: typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.85,
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Scenario impact error:', msg)

    if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('401')) {
      return NextResponse.json({ error: 'Invalid ANTHROPIC_API_KEY' }, { status: 500 })
    }
    if (msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('429')) {
      return NextResponse.json({ error: 'Rate limit reached. Please try again shortly.' }, { status: 429 })
    }
    return NextResponse.json({ error: `Scenario analysis unavailable: ${msg}` }, { status: 500 })
  }
}
