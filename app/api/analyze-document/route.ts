import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/openai'

export interface NewRisk {
  id: string
  title: string
  category: string
  portfolio: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  likelihood: number
  impact: number
  score: number
  financialImpact: string
  description: string
  source: string
}

export interface UpdatedRisk {
  riskId: string
  title: string
  changeType: 'escalate' | 'de-escalate' | 'close' | 'update'
  previousStatus: string
  newStatus: string
  rationale: string
  urgency: 'immediate' | 'standard' | 'low'
}

export interface ProjectImpact {
  project: string
  type: 'delay' | 'cost-overrun' | 'scope-change' | 'regulatory'
  description: string
  financialImpact: string
  timeline: string
  portfolio: string
}

export interface AnalyzeDocumentResult {
  newRisks: NewRisk[]
  updatedRisks: UpdatedRisk[]
  projectImpacts: ProjectImpact[]
  summary: string
  analyzedAt: string
  fileName: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { content, fileName } = body

    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { error: 'Document content must be at least 50 characters' },
        { status: 400 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured. Add it to Vercel Environment Variables.' },
        { status: 500 }
      )
    }

    const truncated = content.substring(0, 50000)

    const userPrompt = `You are an AI risk analyst for Aldar Properties PJSC, UAE's largest real estate developer. You identify and classify risks from corporate documents and recommend register updates.

Analyze the following document and extract all risk intelligence.

Document name: ${fileName || 'Unknown Document'}

DOCUMENT CONTENT:
${truncated}

Respond with ONLY a valid JSON object. Do NOT use markdown fences. Start with { and end with }:
{
  "newRisks": [
    {
      "id": "NR-001",
      "title": "string — concise risk title",
      "category": "demand|market|operational|financial|regulatory|cyber|esg",
      "portfolio": "real-estate|retail|hospitality|education|facilities|cross-portfolio",
      "severity": "critical|high|medium|low",
      "likelihood": 3,
      "impact": 4,
      "score": 12,
      "financialImpact": "AED 45M",
      "description": "2-3 sentence description of the risk and its potential consequences",
      "source": "Reference to where in the document this risk was identified"
    }
  ],
  "updatedRisks": [
    {
      "riskId": "e.g. RE-OP-023",
      "title": "string — existing risk title",
      "changeType": "escalate|de-escalate|close|update",
      "previousStatus": "string — previous rating or status",
      "newStatus": "string — recommended new rating or status",
      "rationale": "string — why this change is recommended",
      "urgency": "immediate|standard|low"
    }
  ],
  "projectImpacts": [
    {
      "project": "string — project or asset name",
      "type": "delay|cost-overrun|scope-change|regulatory",
      "description": "string — description of the impact",
      "financialImpact": "AED 48M",
      "timeline": "string e.g. Q3 2027 revised vs Q1 2027 plan",
      "portfolio": "real-estate|retail|hospitality|education|facilities"
    }
  ],
  "summary": "2-3 sentence executive summary of the most material risk findings, written for a CRO audience"
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!responseText) throw new Error('Empty response from Claude')

    const cleaned = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()

    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No valid JSON object in Claude response')
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1))
    } catch (e) {
      throw new Error(`JSON parse error: ${e instanceof Error ? e.message : 'parse failed'}`)
    }

    return NextResponse.json({
      ...parsed,
      analyzedAt: new Date().toISOString(),
      fileName: fileName || 'Unknown Document',
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Analyze document error:', msg)

    if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('401')) {
      return NextResponse.json({ error: 'Invalid or missing ANTHROPIC_API_KEY' }, { status: 500 })
    }
    if (msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('429')) {
      return NextResponse.json({ error: 'Rate limit reached. Please wait and try again.' }, { status: 429 })
    }
    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 })
  }
}
