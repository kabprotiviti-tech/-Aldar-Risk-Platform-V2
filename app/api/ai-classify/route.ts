import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/openai'

export interface AIClassification {
  riskType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  impactedBusiness: 'real estate' | 'retail' | 'hospitality' | 'education' | 'cross-portfolio'
  regionsAffected: string
  explanation: string
  confidenceScore: number
}

export interface ClassifyResult {
  id: string
  classification: AIClassification
}

const FALLBACK: AIClassification = {
  riskType: 'Market Risk',
  severity: 'medium',
  impactedBusiness: 'real estate',
  regionsAffected: 'UAE',
  explanation: 'Signal received. Manual review recommended for Aldar portfolio impact assessment.',
  confidenceScore: 35,
}

function keywordFallback(headline: string): AIClassification {
  const h = headline.toLowerCase()
  let severity: AIClassification['severity'] = 'low'
  let riskType = 'Market Risk'
  let impactedBusiness: AIClassification['impactedBusiness'] = 'real estate'

  if (h.match(/crisis|crash|collapse|bankrupt|sanctions|fraud|penalty|major loss/)) {
    severity = 'critical'
    riskType = 'Operational Risk'
  } else if (h.match(/surge|spike|drop|decline|warning|shortage|tighten|restrict|delay|disruption/)) {
    severity = 'high'
    riskType = 'Market Risk'
  } else if (h.match(/increase|growth|expand|launch|invest|record|rise/)) {
    severity = 'medium'
    riskType = 'Strategic Risk'
  }

  if (h.match(/hotel|hospitality|tourism|resort|yas/)) impactedBusiness = 'hospitality'
  else if (h.match(/retail|mall|consumer|shop/)) impactedBusiness = 'retail'
  else if (h.match(/school|education|student|curriculum/)) impactedBusiness = 'education'
  else if (h.match(/real estate|property|housing|developer|construction/)) impactedBusiness = 'real estate'
  else impactedBusiness = 'cross-portfolio'

  return {
    riskType,
    severity,
    impactedBusiness,
    regionsAffected: 'UAE',
    explanation: 'Keyword-based classification. AI analysis unavailable — review manually.',
    confidenceScore: 40,
  }
}

function safeParseJSON(text: string): AIClassification[] | null {
  try {
    // Strip markdown fences if present
    const cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed
    // Sometimes Claude returns a single object — wrap it
    if (typeof parsed === 'object' && parsed !== null) return [parsed]
    return null
  } catch {
    // Try to extract JSON array from the text
    const arrMatch = text.match(/\[[\s\S]*\]/)
    if (arrMatch) {
      try {
        return JSON.parse(arrMatch[0])
      } catch {}
    }
    return null
  }
}

const SYSTEM_PROMPT = `You are an expert AI risk analyst for Aldar Properties PJSC — Abu Dhabi's largest listed real estate developer (ADX: ALDAR).

Aldar's core portfolio:
- Real Estate: Residential communities, commercial towers, mixed-use developments (Yas Island, Saadiyat, Al Raha)
- Retail: Yas Mall, Al Jimi Mall, and 8 other malls across Abu Dhabi
- Hospitality: 14 hotels, Ferrari World, Yas Waterworld, Warner Bros. World
- Education: Aldar Education — 30+ schools, 30,000+ students across UAE
- Facilities Management: FM services across Abu Dhabi and wider UAE

Your role: Classify each news headline for its risk impact on Aldar specifically.

Output rules:
- severity must be exactly one of: low | medium | high | critical
- impactedBusiness must be exactly one of: real estate | retail | hospitality | education | cross-portfolio
- explanation is 2-3 concise sentences on Aldar-specific business impact (not generic)
- confidenceScore: 0-100 reflecting how directly this news affects Aldar (>80 = direct Aldar mention or UAE regulatory, 50-80 = sector-wide, <50 = global/indirect)
- Return ONLY a valid JSON array. No markdown. No explanation outside the array.`

export async function POST(req: NextRequest) {
  let items: { id: string; headline: string; source: string }[] = []

  try {
    const body = await req.json()
    items = Array.isArray(body.items) ? body.items : []

    if (items.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Cap batch at 15 items to keep prompt manageable
    const batch = items.slice(0, 15)

    const itemsText = batch
      .map((item, i) => `${i + 1}. SOURCE: "${item.source}" | HEADLINE: "${item.headline}"`)
      .join('\n')

    const userPrompt = `Classify each of the following ${batch.length} news items for Aldar risk intelligence.

${itemsText}

Respond with a JSON array of exactly ${batch.length} objects in the same order:
[
  {
    "riskType": "e.g. Market Risk | Regulatory Risk | Operational Risk | ESG Risk | Geopolitical Risk | Credit Risk | Cyber Risk | Concentration Risk",
    "severity": "low | medium | high | critical",
    "impactedBusiness": "real estate | retail | hospitality | education | cross-portfolio",
    "regionsAffected": "e.g. Abu Dhabi | UAE-wide | GCC | Global",
    "explanation": "2-3 sentences on Aldar-specific business impact",
    "confidenceScore": 0-100
  }
]`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!text) throw new Error('Empty response from Claude')

    const parsed = safeParseJSON(text)
    if (!parsed) throw new Error('JSON parse failed')

    // Map results back to item IDs, fill missing with keyword fallback
    const results: ClassifyResult[] = batch.map((item, i) => {
      const raw = parsed[i]
      if (!raw || typeof raw !== 'object') {
        return { id: item.id, classification: keywordFallback(item.headline) }
      }

      const classification: AIClassification = {
        riskType: String(raw.riskType || 'Market Risk'),
        severity: (['low', 'medium', 'high', 'critical'].includes(raw.severity)
          ? raw.severity
          : 'medium') as AIClassification['severity'],
        impactedBusiness: (
          ['real estate', 'retail', 'hospitality', 'education', 'cross-portfolio'].includes(
            raw.impactedBusiness
          )
            ? raw.impactedBusiness
            : 'real estate'
        ) as AIClassification['impactedBusiness'],
        regionsAffected: String(raw.regionsAffected || 'UAE'),
        explanation: String(raw.explanation || ''),
        confidenceScore: Math.min(100, Math.max(0, Number(raw.confidenceScore) || 50)),
      }

      return { id: item.id, classification }
    })

    // Any items beyond the batch get keyword fallback
    const extra: ClassifyResult[] = items.slice(15).map((item) => ({
      id: item.id,
      classification: keywordFallback(item.headline),
    }))

    return NextResponse.json({ results: [...results, ...extra], source: 'ai' })
  } catch (error) {
    const errMsg =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    const keyMissing = !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('your_anthropic_api_key_here')
    console.error('[ai-classify] fallback triggered:', errMsg, { keyMissing })
    // Return keyword-based fallbacks — never fail the frontend, but surface
    // the actual error so the UI can show why AI analysis is unavailable.
    const fallbacks: ClassifyResult[] = items.map((item) => ({
      id: item.id,
      classification: keywordFallback(item.headline),
    }))
    return NextResponse.json({
      results: fallbacks,
      source: 'fallback',
      error: keyMissing ? 'ANTHROPIC_API_KEY not configured on server' : errMsg,
    })
  }
}
