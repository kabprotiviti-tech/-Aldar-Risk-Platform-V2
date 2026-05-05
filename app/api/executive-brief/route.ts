import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/openai'

export interface ExecutiveBriefResponse {
  // Original fields (preserved for backward compat)
  summary: string
  riskRating: 'critical' | 'elevated' | 'moderate' | 'low'
  topRisks: Array<{
    rank: number
    title: string
    portfolio: string
    financialImpact: string
    urgency: 'immediate' | '30-day' | '90-day'
    executiveNote: string
  }>
  strategicImplications: string[]
  recommendedActions: Array<{
    priority: number
    action: string
    owner: string
    deadline: string
    rationale: string
  }>
  marketContext: string
  confidence: number
  keyMetrics: {
    overallRiskScore: number
    financialExposureAED: number
    criticalRisks: number
    risksRequiringBoardAttention: number
  }
  // New fields
  executiveSummary: string
  businessImpact: string
  crossPortfolioImpact: string
  sourceReferences: Array<{
    source: string
    type: 'internal' | 'external' | 'ai'
    detail: string
  }>
  generatedAt?: string
  generatedFor?: string
}

const SYSTEM_PROMPT = `You are the Chief Risk Intelligence AI for Aldar Properties PJSC (ADX: ALDAR), Abu Dhabi's largest listed real estate conglomerate (AED 9.8Bn revenue).

Produce board-level executive risk briefs for Aldar's C-suite (CEO, CFO, CRO) and Board of Directors.

Your output must be:
- Strategic and forward-looking, not operational
- Written in precise, boardroom-quality English
- Quantified wherever possible (AED figures, percentages, timeframes)
- Decision-oriented — every insight should prompt a clear executive action
- Specific to Aldar's five BUs: Real Estate, Retail, Hospitality, Education, Facilities

Aldar context: ADX-listed, Abu Dhabi government shareholder background, active AED 8.2Bn development pipeline, Vision 2030 aligned.

Always respond with a valid JSON object only — no markdown, no text outside the JSON.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { risks, portfolioMetrics, timeframe, portfolioState, fusionInsight, scenario } = body

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const risksJson = risks ? JSON.stringify(risks.slice(0, 8)) : 'No risk register data provided'
    const metricsJson = portfolioMetrics ? JSON.stringify(portfolioMetrics) : 'No metrics provided'
    const stateJson = portfolioState ? JSON.stringify(portfolioState, null, 2) : null
    const scenarioBlock = scenario
      ? `\nACTIVE SCENARIO: "${scenario.name}" — ${scenario.tagline}\nEstimated impact: AED ${scenario.totalImpactAED}M (${scenario.impactPct}% of revenue)\n`
      : ''
    const fusionBlock = fusionInsight ? `\nAI FUSION INSIGHT:\n${fusionInsight}\n` : ''

    const userPrompt = `Generate a comprehensive board-level Executive Risk Brief for Aldar Properties.

TIMEFRAME: ${timeframe || 'Q2 2026 — April 2026'}
${scenarioBlock}${fusionBlock}
RISK REGISTER (top risks):
${risksJson}

PORTFOLIO METRICS:
${metricsJson}
${stateJson ? `\nLIVE INTERNAL SNAPSHOT (ERP/CRM):\n${stateJson}` : ''}

Respond with ONLY a valid JSON object (no markdown, start with {, end with }):
{
  "executiveSummary": "2–3 sentence board-ready executive summary — cite specific AED figures, affected BUs, and current risk posture",
  "summary": "Same as executiveSummary — kept for compatibility",
  "riskRating": "critical|elevated|moderate|low",
  "businessImpact": "2–3 sentences covering the combined financial and operational impact — cite revenue exposure, EBITDA risk, cash flow variance, and key operational stresses across portfolios",
  "crossPortfolioImpact": "2–3 sentences describing how risks are propagating across Aldar's BUs — e.g. hospitality weakness driving retail softness, real estate delays affecting cash flow and finance covenants",
  "topRisks": [
    {
      "rank": 1,
      "title": "Risk title",
      "portfolio": "BU name",
      "financialImpact": "AED X million",
      "urgency": "immediate|30-day|90-day",
      "executiveNote": "One sentence board-level note on this risk"
    }
  ],
  "strategicImplications": [
    "4–5 strategic implications for Aldar leadership — each must be specific and actionable"
  ],
  "recommendedActions": [
    {
      "priority": 1,
      "action": "Specific action the exec team should take",
      "owner": "C-suite role (e.g. CFO, CRO, CEO)",
      "deadline": "e.g. Within 2 weeks",
      "rationale": "Why this action is critical now"
    }
  ],
  "marketContext": "2–3 sentences on UAE/GCC macro context relevant to Aldar right now",
  "confidence": 0.88,
  "keyMetrics": {
    "overallRiskScore": 72,
    "financialExposureAED": 425,
    "criticalRisks": 1,
    "risksRequiringBoardAttention": 3
  },
  "sourceReferences": [
    { "source": "Aldar Risk Register", "type": "internal", "detail": "15 active risks across 5 BUs" },
    { "source": "Oracle Fusion ERP", "type": "internal", "detail": "Q2 2026 financial signals" },
    { "source": "AI Fusion Engine", "type": "ai", "detail": "Cross-signal risk correlation analysis" }
  ]
}`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!raw) throw new Error('Empty response from Claude')

    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()

    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON in response')

    const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1))

    // Ensure backward compat — copy executiveSummary → summary if only one present
    if (!parsed.summary && parsed.executiveSummary) parsed.summary = parsed.executiveSummary
    if (!parsed.executiveSummary && parsed.summary) parsed.executiveSummary = parsed.summary

    return NextResponse.json({
      ...parsed,
      generatedAt: new Date().toISOString(),
      generatedFor: 'Aldar Properties PJSC — Board Risk Committee',
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Executive Brief API error:', msg)

    if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('401')) {
      return NextResponse.json({ error: 'Invalid ANTHROPIC_API_KEY' }, { status: 500 })
    }
    if (msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('429')) {
      return NextResponse.json({ error: 'Rate limit reached. Please try again shortly.' }, { status: 429 })
    }
    return NextResponse.json({ error: `Failed to generate executive brief: ${msg}` }, { status: 500 })
  }
}
