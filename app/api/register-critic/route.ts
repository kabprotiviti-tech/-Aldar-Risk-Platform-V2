import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/openai'
import { RISKS } from '@/lib/engine/seedData'

export interface AICriticResponse {
  missing_risks: Array<{
    name: string
    category: string
    cause: string
    event: string
    impact: string
    why_missing: string
  }>
  weak_controls: Array<{
    risk_id: string
    control_gap: string
    suggested_control: string
  }>
  deep_recommendations: Array<{
    risk_id: string
    recommendation: string
    reason: string
    expected_impact: string
    drivers_affected: string[]
  }>
  register_assessment: {
    coverage_comment: string
    adaptability_comment: string
    second_line_verdict: string
  }
  source: 'ai' | 'fallback'
  error?: string
}

const FALLBACK: AICriticResponse = {
  missing_risks: [
    {
      name: 'Climate Transition Risk — UAE Net Zero 2050',
      category: 'External/Geopolitical',
      cause: 'UAE Net Zero 2050 commitments + ESG investor mandates',
      event: 'Carbon-intensive assets face disclosure burden and refinancing premium',
      impact: 'Valuation haircut on high-embodied-carbon portfolio; green-premium gap widens',
      why_missing: 'Register has no forward-looking transition risk beyond generic regulatory',
    },
    {
      name: 'Cybersecurity Breach — Tenant/Buyer Data',
      category: 'Operational',
      cause: 'Increased digitisation + CRM/portal + smart building IoT',
      event: 'Data exfiltration or ransomware on tenant/buyer database',
      impact: 'Regulatory fine, class action, reputational damage across portfolio',
      why_missing: 'Register covers physical risks well but no cyber entry despite $55bn exposure',
    },
  ],
  weak_controls: [],
  deep_recommendations: [],
  register_assessment: {
    coverage_comment: 'AI critic unavailable — deterministic assessment only',
    adaptability_comment: 'Fallback mode',
    second_line_verdict: 'Register requires manual second-line review — AI service unreachable',
  },
  source: 'fallback',
}

const SYSTEM_PROMPT = `You are an expert Chief Risk Officer acting as a second line of defense for Aldar Properties PJSC (Abu Dhabi's largest listed real estate developer). Your role is to CHALLENGE the existing risk register using real-world context — not validate it.

Aldar's business: residential/commercial real estate (Yas, Saadiyat), 10 malls, 14 hotels + Ferrari World/Yas Waterworld/Warner Bros World, Aldar Education (30+ schools), facilities management.

Output rules:
- Return ONLY valid JSON. No markdown. No prose outside JSON.
- Be specific to Aldar, not generic ERM.
- "Missing risks" must be risks a real Abu Dhabi real-estate CRO would flag but aren't in the given register.
- "Weak controls" must identify a specific gap in the given risk, not generic advice.
- "Deep recommendations" must be 2-sentence, actionable, driver-linked.
- Challenge, don't praise.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const signals: Array<{ headline: string; source?: string }> = body.signals || []

    const registerSummary = RISKS.map(
      (r) =>
        `- ${r.id} [${r.category}] ${r.name} | Cause: ${r.cause} | Event: ${r.event} | Controls(${r.controls.length}): ${r.controls.map((c) => c.name + ' (' + c.effectiveness + ')').join('; ')}`,
    ).join('\n')

    const signalsBlock = signals.length
      ? `\n\nRecent external signals:\n${signals.slice(0, 8).map((s) => `- ${s.headline}`).join('\n')}`
      : ''

    const userPrompt = `Here is Aldar's current risk register (${RISKS.length} risks):

${registerSummary}${signalsBlock}

As a second-line CRO, return this JSON:

{
  "missing_risks": [
    { "name": "...", "category": "Strategic|Financial|Operational|Project/Construction|Market/Sales|External/Geopolitical", "cause": "...", "event": "...", "impact": "...", "why_missing": "2 sentences on why a real Abu Dhabi real-estate CRO would flag this" }
  ],
  "weak_controls": [
    { "risk_id": "R-XXX", "control_gap": "specific gap", "suggested_control": "specific new control" }
  ],
  "deep_recommendations": [
    { "risk_id": "R-XXX", "recommendation": "specific action", "reason": "why now, 1 sentence", "expected_impact": "measurable outcome, 1 sentence", "drivers_affected": ["Construction Cost", "Liquidity", ...] }
  ],
  "register_assessment": {
    "coverage_comment": "1-2 sentences on what's covered vs missed",
    "adaptability_comment": "1-2 sentences on how well register responds to current signals",
    "second_line_verdict": "1 sentence — would you sign off as second line?"
  }
}

Return 3-5 missing risks, 3-5 weak controls, 5-8 deep recommendations. Be specific.`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!text) throw new Error('Empty response from Claude')

    // Parse JSON (strip fences)
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ ...parsed, source: 'ai' })
  } catch (error) {
    const errMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    console.error('[register-critic] fallback:', errMsg)
    return NextResponse.json({ ...FALLBACK, error: errMsg })
  }
}
