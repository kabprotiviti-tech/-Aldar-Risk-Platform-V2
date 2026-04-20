import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { signal, context, portfolios } = body

    if (!signal) {
      return NextResponse.json({ error: 'Signal is required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert Enterprise Risk Management AI for Aldar Properties PJSC, Abu Dhabi's leading listed real estate developer and asset owner.

Aldar's business spans:
- Real Estate Development (Saadiyat Island, Yas Island, Reem Island, Al Raha Beach masterplanned communities)
- Retail (Yas Mall, community retail across Abu Dhabi)
- Hospitality & Leisure (Yas Island hotels, beach clubs, entertainment venues)
- Education (Aldar Education network of 30+ premium international schools in UAE)
- Asset & Facilities Management (40+ commercial and residential assets under management)

Your role is to classify and analyze risk signals in the context of Aldar's specific business, UAE real estate market dynamics, Abu Dhabi Economic Vision 2030, and current GCC macro environment.

Always respond with a valid JSON object only — no markdown, no explanation outside the JSON. Be precise, business-focused and use Aldar-specific context.`

    const userPrompt = `Analyze the following risk signal for Aldar Properties and classify it:

SIGNAL: ${signal}

${context ? `ADDITIONAL CONTEXT: ${context}` : ''}
${portfolios && portfolios.length > 0 ? `AFFECTED PORTFOLIOS FLAGGED: ${portfolios.join(', ')}` : ''}

Respond with ONLY a valid JSON object (no markdown fences):
{
  "riskType": "string (specific risk category)",
  "severity": "critical|high|medium|low",
  "confidence": 0.0 to 1.0,
  "explanation": "2-3 sentence explanation specific to Aldar",
  "affectedPortfolios": ["array of affected Aldar portfolio segments"],
  "recommendations": ["array of 3-4 specific actionable recommendations for Aldar management"],
  "financialImpact": "string describing estimated financial impact in AED",
  "timeHorizon": "immediate|short-term|medium-term|long-term",
  "relatedRisks": ["array of 2-3 related risk areas to monitor"]
}`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!content) throw new Error('No response from AI')

    const parsed = JSON.parse(content)
    return NextResponse.json(parsed)
  } catch (error: unknown) {
    console.error('AI Risk API error:', error)
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to .env.local' },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to analyze risk signal. Please try again.' },
      { status: 500 }
    )
  }
}
