import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/openai'

export interface AdvisorResponse {
  answer: string
  keyPoints: string[]
  actionItems: string[]
  portfolioFocus: string
  confidence: number
}

const SYSTEM_PROMPT = `You are a senior AI Risk Advisor embedded inside Aldar Properties PJSC's enterprise risk intelligence platform.

Aldar is Abu Dhabi's largest listed real estate developer (ADX: ALDAR, ~AED 9.8Bn revenue). Its five business units are:
- Real Estate: Yas Island, Saadiyat, Al Raha Beach — residential & commercial (AED 1.2Bn revenue, 300 active risks)
- Retail: Yas Mall, Al Jimi Mall + 6 others — 350 tenants (AED 800M revenue, 270 risks)
- Hospitality: 14 hotels + Ferrari World, Yas Waterworld, Warner Bros. World (AED 600M revenue)
- Education: Aldar Education — 30+ schools, 30,000 students (AED 400M revenue)
- Facilities: FM services across Abu Dhabi portfolio (AED 350M revenue)

Your role is to answer the executive's question using the live risk context provided. Be:
- Concise: 2–4 sentences for the main answer
- Specific: reference actual numbers from the context, not generic statements
- Executive-grade: written for a CRO or Board audience
- Actionable: every answer should include at least one concrete next step

Respond ONLY with a valid JSON object. No markdown fences, no text outside the object.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { question, context } = body

    if (!question || question.trim().length < 3) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const contextBlock = typeof context === 'string'
      ? context
      : JSON.stringify(context, null, 2)

    const userPrompt = `The executive has asked: "${question}"

LIVE RISK CONTEXT (as of ${new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })} GST):
${contextBlock}

Respond with ONLY this JSON object (no markdown, start with {, end with }):
{
  "answer": "2–4 sentence direct answer to the question, referencing specific numbers and BU names from the context",
  "keyPoints": [
    "Specific insight 1 — must cite a number or portfolio",
    "Specific insight 2 — must cite a number or portfolio",
    "Specific insight 3 — optional, omit if not needed"
  ],
  "actionItems": [
    "Concrete immediate action the risk team should take",
    "Second action if relevant — otherwise omit"
  ],
  "portfolioFocus": "The single most affected BU: Real Estate | Retail | Hospitality | Education | Facilities | Cross-Portfolio",
  "confidence": 0.87
}`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 768,
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

    const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)) as AdvisorResponse

    // Sanitise
    const result: AdvisorResponse = {
      answer: String(parsed.answer || ''),
      keyPoints: Array.isArray(parsed.keyPoints)
        ? parsed.keyPoints.slice(0, 3).map(String).filter(Boolean)
        : [],
      actionItems: Array.isArray(parsed.actionItems)
        ? parsed.actionItems.slice(0, 2).map(String).filter(Boolean)
        : [],
      portfolioFocus: String(parsed.portfolioFocus || 'Cross-Portfolio'),
      confidence: typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.82,
    }

    return NextResponse.json({ ...result, answeredAt: new Date().toISOString() })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('AI Advisor error:', msg)

    if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('401')) {
      return NextResponse.json({ error: 'Invalid ANTHROPIC_API_KEY' }, { status: 500 })
    }
    if (msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('429')) {
      return NextResponse.json({ error: 'Rate limit reached. Please try again shortly.' }, { status: 429 })
    }
    return NextResponse.json({ error: `Advisor unavailable: ${msg}` }, { status: 500 })
  }
}
