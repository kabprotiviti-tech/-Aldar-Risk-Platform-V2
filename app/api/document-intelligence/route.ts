import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { content, documentType } = body

    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { error: 'Document content must be at least 50 characters' },
        { status: 400 }
      )
    }

    // Check API key before calling Claude
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured. Add it to Vercel Environment Variables.' },
        { status: 500 }
      )
    }

    const systemPrompt = `You are an intelligent risk document analyst for Aldar Properties PJSC. You extract, classify, and enhance risk information from corporate documents.

Your expertise includes:
- UAE real estate regulatory and compliance landscape (ADEC, ADEK, ADX, CBUAE requirements)
- Aldar's risk register taxonomy (Market, Credit, Operational, Regulatory, ESG, Cyber, Geopolitical, Concentration risks)
- Best practice risk governance frameworks (ISO 31000, COSO ERM)
- Board and audit committee reporting standards

When analyzing documents:
- Extract all explicit and implied risks
- Classify them using Aldar's portfolio structure
- Flag compliance issues specific to UAE regulations
- Suggest register updates in a format ready for Risk Committee review

Always respond with a valid JSON object only — no markdown code fences, no backticks, no explanation outside the JSON.`

    // Truncate to 50000 chars to stay well within context limits
    const truncatedContent = content.substring(0, 50000)

    const userPrompt = `Analyze the following ${documentType || 'corporate document'} for Aldar Properties and extract risk intelligence.

DOCUMENT CONTENT:
${truncatedContent}

Respond with ONLY a valid JSON object. Do NOT wrap it in markdown fences or backticks. Start your response with { and end with }:
{
  "documentSummary": "2 sentence summary of what this document contains",
  "extractedRisks": [
    {
      "id": "EXTRACTED-001",
      "title": "string",
      "category": "string",
      "portfolio": "real-estate|retail|hospitality|education|facilities|cross-portfolio",
      "likelihood": 3,
      "impact": 4,
      "score": 12,
      "description": "string",
      "financialImpact": "string e.g. AED 45M",
      "source": "string describing where in the document this was found"
    }
  ],
  "suggestedUpdates": [
    {
      "type": "new|update|close",
      "riskId": "string",
      "suggestion": "string",
      "rationale": "string",
      "urgency": "immediate|standard|low"
    }
  ],
  "complianceFlags": [
    {
      "regulation": "string e.g. ADX ESG Mandate",
      "issue": "string",
      "severity": "critical|high|medium|low",
      "recommendation": "string",
      "deadline": "string if applicable, otherwise omit"
    }
  ],
  "insights": "3-4 sentences of overall risk intelligence insights from this document",
  "confidence": 0.85,
  "processingNotes": "string — any limitations or caveats in the analysis"
}`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!responseText) throw new Error('Empty response from Claude')

    // Strip markdown fences if Claude adds them despite instructions
    const cleaned = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()

    // Find the JSON object boundaries defensively
    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No valid JSON object found in Claude response')
    }
    const jsonString = cleaned.slice(jsonStart, jsonEnd + 1)

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonString)
    } catch (parseErr) {
      console.error('JSON parse error. Raw response:', responseText.substring(0, 500))
      throw new Error(`Claude response was not valid JSON: ${parseErr instanceof Error ? parseErr.message : 'parse error'}`)
    }

    return NextResponse.json({
      ...parsed,
      analyzedAt: new Date().toISOString(),
      documentType: documentType || 'General Document',
      characterCount: content.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Document Intelligence API error:', message)

    // Specific API key error
    if (message.toLowerCase().includes('api key') || message.toLowerCase().includes('authentication') || message.toLowerCase().includes('401')) {
      return NextResponse.json(
        { error: 'Invalid or missing ANTHROPIC_API_KEY. Check Vercel Environment Variables.' },
        { status: 500 }
      )
    }

    // Rate limit or quota error
    if (message.toLowerCase().includes('rate') || message.toLowerCase().includes('429') || message.toLowerCase().includes('quota')) {
      return NextResponse.json(
        { error: 'Claude API rate limit reached. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    )
  }
}
