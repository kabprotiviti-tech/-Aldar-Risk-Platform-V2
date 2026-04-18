import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/openai'
import { portfolioProfiles } from '@/lib/portfolioData'
import type { PortfolioKey } from '@/lib/portfolioData'

export interface BusinessImpactResult {
  portfolioId: PortfolioKey
  aiInsight: string           // 2–3 sentences
  revenueAtRisk: { low: number; high: number }  // AED M
  keyActions: string[]        // 3 recommended management actions
  watchIndicators: string[]   // 2–3 KPIs to monitor
  confidence: number          // 0–1
}

const SYSTEM_PROMPT = `You are Aldar Properties PJSC's enterprise AI risk advisor.
Provide concise, specific business impact analysis for each business unit based on current risk profile.
Always be specific to Aldar's actual assets: Real Estate (Saadiyat, Yas, Al Raha Beach), Retail (Yas Mall, Al Jimi Mall, 8 malls, 350 tenants), Hospitality (14 hotels, Yas theme parks), Education (30+ schools, 30k students), Facilities (FM services Abu Dhabi).
Return ONLY valid JSON — no markdown, no text outside the object.`

export async function POST(req: NextRequest) {
  let body: { portfolioId?: PortfolioKey; headline?: string } = {}

  try {
    body = await req.json()
    const { portfolioId, headline } = body

    if (!portfolioId || !portfolioProfiles[portfolioId]) {
      return NextResponse.json({ error: 'Valid portfolioId required' }, { status: 400 })
    }

    const profile = portfolioProfiles[portfolioId]

    const prompt = `Generate a business impact analysis for Aldar Properties' ${profile.name} portfolio.

PORTFOLIO DATA:
- Assets: ${profile.assets} assets
- Annual Revenue: AED ${(profile.revenue / 1_000_000).toFixed(0)}M
- Total Active Risks: ${profile.totalRisks}
- Risk Breakdown: ${profile.breakdown.high} High / ${profile.breakdown.medium} Medium / ${profile.breakdown.low} Low
- Risk Trend: ${profile.trend}
- Overall Risk Level: ${profile.overallLevel}
- Revenue at Risk Range: AED ${profile.revenueAtRisk.low}M – AED ${profile.revenueAtRisk.high}M
- Top Risk Categories: ${
  Object.entries(profile.categoryBreakdown)
    .sort(([, a], [, b]) => b.high - a.high)
    .slice(0, 3)
    .map(([cat, bd]) => `${cat} (${bd.high} high-severity)`)
    .join(', ')
}
${headline ? `\nLATEST EXTERNAL SIGNAL: "${headline}"` : ''}

TOP 3 RISKS:
${profile.topRisks.slice(0, 3).map((r, i) => `${i + 1}. ${r.title} (Score: ${r.score}, Financial Exposure: AED ${r.financialImpact}M)`).join('\n')}

Respond with ONLY this JSON:
{
  "aiInsight": "2-3 sentence specific business impact assessment referencing Aldar's actual assets and the current risk profile — be direct about what is most critical",
  "revenueAtRisk": { "low": <number AED M>, "high": <number AED M> },
  "keyActions": ["action 1", "action 2", "action 3"],
  "watchIndicators": ["KPI 1", "KPI 2", "KPI 3"],
  "confidence": <0.7 to 0.95>
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!text) throw new Error('Empty response')

    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned) as BusinessImpactResult

    const result: BusinessImpactResult = {
      portfolioId,
      aiInsight: String(parsed.aiInsight || ''),
      revenueAtRisk: {
        low: Number(parsed.revenueAtRisk?.low ?? profile.revenueAtRisk.low),
        high: Number(parsed.revenueAtRisk?.high ?? profile.revenueAtRisk.high),
      },
      keyActions: Array.isArray(parsed.keyActions)
        ? parsed.keyActions.slice(0, 3).map(String)
        : ['Review risk mitigation plans', 'Update financial forecasts', 'Escalate to Risk Committee'],
      watchIndicators: Array.isArray(parsed.watchIndicators)
        ? parsed.watchIndicators.slice(0, 3).map(String)
        : ['Monthly risk score trend', 'Revenue variance vs. budget', 'High-risk count movement'],
      confidence: Math.min(0.98, Math.max(0.5, Number(parsed.confidence ?? 0.82))),
    }

    return NextResponse.json({ result, generatedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Business Impact API error:', error)

    const portfolioId = body.portfolioId
    const profile = portfolioId ? portfolioProfiles[portfolioId] : null

    const fallback: BusinessImpactResult = {
      portfolioId: portfolioId ?? 'real-estate',
      aiInsight: `${profile?.name ?? 'Portfolio'} risk profile shows ${profile?.breakdown.high ?? 0} high-severity risks across ${profile?.totalRisks ?? 0} active items. Revenue at risk ranges AED ${profile?.revenueAtRisk.low ?? 0}M–${profile?.revenueAtRisk.high ?? 0}M. Management review of top-scoring risks recommended this quarter.`,
      revenueAtRisk: profile?.revenueAtRisk ?? { low: 0, high: 0 },
      keyActions: [
        'Review and validate top 10 risk mitigations',
        'Update financial exposure estimates with current data',
        'Escalate high-severity risks to portfolio risk committee',
      ],
      watchIndicators: [
        'Monthly risk score trajectory',
        'Revenue vs. budget variance',
        'High-risk item count movement',
      ],
      confidence: 0.72,
    }

    return NextResponse.json({
      result: fallback,
      generatedAt: new Date().toISOString(),
      fallback: true,
    })
  }
}
