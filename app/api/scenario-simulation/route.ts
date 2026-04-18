import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { scenarioId, scenarioName, parameters } = body

    if (!scenarioName) {
      return NextResponse.json({ error: 'Scenario name is required' }, { status: 400 })
    }

    const systemPrompt = `You are a strategic scenario modelling AI for Aldar Properties PJSC. You simulate the financial and operational impact of macro scenarios on Aldar's diversified portfolio.

Aldar's portfolio for scenario analysis:
- Real Estate Development: AED 8.2Bn active pipeline, premium residential communities (Saadiyat, Yas, Reem)
- Retail: Yas Mall (153,000 sqm GLA) + 15 community retail centres (~85,000 sqm GLA)
- Hospitality: 8 hotels (~2,400 keys) + entertainment venues on Yas Island
- Education: 30+ schools, ~28,000 students, premium international curriculum fees
- Facilities Management: 40+ assets, AED 320M annual FM revenue

Base case FY2026 financial assumptions:
- Total Revenue: AED 9.8Bn
- EBITDA: AED 3.2Bn
- Net Asset Value: AED 38Bn

Produce quantified, credible scenario impact analysis grounded in real estate and GCC market dynamics.

Always respond with a valid JSON object only — no markdown, no explanation outside the JSON.`

    const userPrompt = `Run a scenario simulation for Aldar Properties:

SCENARIO: ${scenarioName}
SCENARIO ID: ${scenarioId}
INTENSITY: ${parameters?.intensity || 'moderate'}
DURATION: ${parameters?.duration || '12 months'}
BASE PROBABILITY: ${parameters?.probability ? (parameters.probability * 100).toFixed(0) + '%' : '15%'}

Respond with ONLY a valid JSON object (no markdown fences):
{
  "overallImpact": {
    "severity": "critical|severe|moderate|mild",
    "revenueImpact": "string e.g. -AED X million (-X%)",
    "ebitdaImpact": "string",
    "navImpact": "string",
    "summary": "2 sentence executive summary of overall scenario impact"
  },
  "portfolioImpacts": [
    {
      "portfolio": "string",
      "impactAED": -100,
      "impactPercent": -10,
      "description": "string — specific impact mechanism",
      "recoveryTimeMonths": 12
    }
  ],
  "financialImpact": {
    "year1AED": -500000000,
    "year2AED": -200000000,
    "totalAED": -700000000,
    "peakCashflowImpact": "string"
  },
  "timeframe": {
    "onsetMonths": 3,
    "peakMonths": 9,
    "recoveryMonths": 18
  },
  "mitigationStrategies": [
    {
      "strategy": "string",
      "owner": "string (Aldar role)",
      "timeToImplement": "string",
      "costAED": "string",
      "expectedBenefit": "string"
    }
  ],
  "opportunities": [
    "string — silver lining opportunities this scenario creates for Aldar"
  ],
  "confidence": 0.0 to 1.0,
  "keyAssumptions": ["array of 3-4 key modelling assumptions"]
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!content) throw new Error('No response from AI')

    const parsed = JSON.parse(content)
    return NextResponse.json({
      ...parsed,
      scenarioId,
      scenarioName,
      simulatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('Scenario Simulation API error:', error)
    return NextResponse.json(
      { error: 'Failed to run scenario simulation. Please try again.' },
      { status: 500 }
    )
  }
}
