import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/openai'
import type { InternalDataSnapshot } from '@/lib/internalData'

export interface FusionResult {
  fusionInsight: string
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
  affectedBusiness: string
  reasoning: string
  amplified: boolean        // true = risk amplified, false = mitigated
  contributingFactors: string[]
}

const SYSTEM_PROMPT = `You are an enterprise AI risk intelligence system for Aldar Properties PJSC (ADX: ALDAR), Abu Dhabi's largest listed real estate developer.

Your role is to perform cross-signal risk fusion: combining external market intelligence with internal operational data to generate enterprise-level risk insights.

Aldar's business units:
- Real Estate: Yas Island, Saadiyat, Al Raha Beach residential & commercial
- Retail: Yas Mall, Al Jimi Mall (8 malls total, ~350 tenants)
- Hospitality: 14 hotels + Yas Island theme parks
- Education: Aldar Education (30+ schools, 30,000 students)
- Facilities: FM services across Abu Dhabi

Fusion principles:
- Risk is AMPLIFIED when external signal aligns with internal stress (e.g., rising rates + low sales)
- Risk is MITIGATED when internal resilience offsets external headwind (e.g., high occupancy vs sector slowdown)
- Always be specific to Aldar's actual portfolio context
- Return ONLY valid JSON — no markdown, no text outside the object`

export async function POST(req: NextRequest) {
  let body: {
    externalHeadline?: string
    externalSource?: string
    externalExplanation?: string
    internalData?: Partial<InternalDataSnapshot>
  } = {}

  try {
    body = await req.json()

    const { externalHeadline, externalSource, internalData } = body

    if (!externalHeadline) {
      return NextResponse.json({ error: 'externalHeadline required' }, { status: 400 })
    }

    // Summarise internal signals into a concise block for the prompt
    const internalSummary = buildInternalSummary(internalData)

    const userPrompt = `Perform risk fusion analysis for Aldar Properties.

EXTERNAL SIGNAL:
Source: "${externalSource || 'News Feed'}"
Headline: "${externalHeadline}"

INTERNAL OPERATIONAL DATA (live from ERP/CRM/Projects):
${internalSummary}

Respond with ONLY this JSON object:
{
  "fusionInsight": "2-3 sentence fused risk assessment combining the external signal with Aldar's current internal state",
  "impactLevel": "low | medium | high | critical",
  "affectedBusiness": "one of: Real Estate | Retail | Hospitality | Education | Cross-Portfolio",
  "reasoning": "3-4 sentences of detailed reasoning: how the external signal interacts with internal conditions, what amplifies or mitigates the risk, and what Aldar's management should monitor",
  "amplified": true if external signal worsens an existing internal stress / false if internal resilience offsets it,
  "contributingFactors": ["factor 1", "factor 2", "factor 3"] — exactly 3 short strings naming the key risk drivers
}`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!text) throw new Error('Empty response')

    // Parse — strip markdown fences if present
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned) as FusionResult

    // Validate and sanitise
    const validImpact = ['low', 'medium', 'high', 'critical']
    const result: FusionResult = {
      fusionInsight: String(parsed.fusionInsight || ''),
      impactLevel: (validImpact.includes(parsed.impactLevel) ? parsed.impactLevel : 'medium') as FusionResult['impactLevel'],
      affectedBusiness: String(parsed.affectedBusiness || 'Cross-Portfolio'),
      reasoning: String(parsed.reasoning || ''),
      amplified: Boolean(parsed.amplified),
      contributingFactors: Array.isArray(parsed.contributingFactors)
        ? parsed.contributingFactors.slice(0, 3).map(String)
        : ['Market conditions', 'Internal exposure', 'Portfolio sensitivity'],
    }

    return NextResponse.json({ result, generatedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Fusion API error:', error)
    // Return a structural fallback — never break the UI
    const fallback: FusionResult = {
      fusionInsight: 'External signal received. Cross-referencing with internal operational data. Manual review recommended for full impact assessment.',
      impactLevel: 'medium',
      affectedBusiness: 'Cross-Portfolio',
      reasoning: 'AI fusion analysis temporarily unavailable. Please review external signals against internal ERP data manually.',
      amplified: false,
      contributingFactors: ['External market signal', 'Internal data pending', 'Manual review required'],
    }
    return NextResponse.json({ result: fallback, generatedAt: new Date().toISOString(), fallback: true })
  }
}

function buildInternalSummary(data?: Partial<InternalDataSnapshot>): string {
  if (!data) {
    return `- Hospitality: Occupancy 68% (declining, below 70% threshold)
- Retail: Tenant stress MEDIUM, 7 tenants flagged, foot traffic -3.1% YoY
- Projects: 2 of 11 active projects delayed (avg 34 days), cost variance +6.2%
- Risk Register: 12 active risks (1 critical, 4 high, 3 overdue mitigations)
- Finance: Cash flow -4.2% vs budget, off-plan sales at 71% of target`
  }

  const lines: string[] = []

  if (data.hospitality) {
    lines.push(
      `- Hospitality: Occupancy ${data.hospitality.occupancyRate}% (${data.hospitality.occupancyTrend})${data.hospitality.riskFlag ? ' — RISK FLAG: ' + data.hospitality.flagReason : ''}`
    )
  }
  if (data.retail) {
    lines.push(
      `- Retail: Tenant stress ${data.retail.tenantStress}, foot traffic ${data.retail.footfallChange > 0 ? '+' : ''}${data.retail.footfallChange}% YoY, ${data.retail.stressedTenants} stressed tenants`
    )
  }
  if (data.projects) {
    lines.push(
      `- Projects: ${data.projects.delayedProjects}/${data.projects.totalActiveProjects} projects delayed (avg ${data.projects.averageDelayDays} days), cost variance +${data.projects.costVariancePercent}%`
    )
  }
  if (data.riskRegister) {
    lines.push(
      `- Risk Register: ${data.riskRegister.activeRisks} active risks (${data.riskRegister.criticalRisks} critical, ${data.riskRegister.highRisks} high), ${data.riskRegister.overdueMitigations} overdue mitigations`
    )
  }
  if (data.finance) {
    lines.push(
      `- Finance: Cash flow ${data.finance.cashFlowVariance > 0 ? '+' : ''}${data.finance.cashFlowVariance}% vs budget, gearing ${data.finance.gearingRatio}%`
    )
  }
  if (data.realEstate) {
    lines.push(
      `- Real Estate: Off-plan sales ${data.realEstate.offPlanSales}/${data.realEstate.offPlanTarget} units, collections ${data.realEstate.collectionRate}%`
    )
  }

  return lines.join('\n')
}
