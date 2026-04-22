import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/openai'

/**
 * AI critique layer for control-assessment derived risks.
 * ------------------------------------------------------
 * Deterministic scoring lives client-side. This endpoint is invoked on
 * demand (button click) so we don't burn Claude quota on every upload.
 *
 * Input:
 *   {
 *     areas:    [{ name, total_score, max_score, effectivenessPct }, …],
 *     derived:  [{ id, name, category, controlScore, controlAreaName }, …],
 *   }
 *
 * Output:
 *   {
 *     weak_control_zones: [{ area, reason }],
 *     high_risk_zones:    [{ risk_id, reason }],
 *     missing_risks:      [{ name, category, why_missing }],
 *     recommendations:    [{ risk_id, recommendation, reason, expected_impact }],
 *     assessment:         { coverage, adaptability, verdict },
 *     source: 'ai' | 'fallback',
 *     error?: string
 *   }
 */

export interface ControlCriticResponse {
  weak_control_zones: Array<{ area: string; reason: string }>
  high_risk_zones: Array<{ risk_id: string; reason: string }>
  missing_risks: Array<{ name: string; category: string; why_missing: string }>
  recommendations: Array<{
    risk_id: string
    recommendation: string
    reason: string
    expected_impact: string
  }>
  assessment: { coverage: string; adaptability: string; verdict: string }
  source: 'ai' | 'fallback'
  error?: string
}

const FALLBACK: ControlCriticResponse = {
  weak_control_zones: [
    { area: 'Procurement & Vendor Management', reason: 'Typical weak spot in real-estate; concentration risk on top suppliers rarely tested.' },
    { area: 'IT Access Management', reason: 'Privileged access review cadence usually lags; segregation of duties drifts.' },
  ],
  high_risk_zones: [],
  missing_risks: [
    { name: 'Business Continuity / Disaster Recovery', category: 'Operational', why_missing: 'Control sheets often omit BCP/DR — but it is a board-level risk for a 23-asset portfolio.' },
    { name: 'Third-party Data Processor Risk', category: 'Operational', why_missing: 'Tenant/buyer data routinely processed by external CRM/facilities providers — control gap is common.' },
  ],
  recommendations: [],
  assessment: {
    coverage: 'AI critic unavailable — deterministic assessment only.',
    adaptability: 'Fallback mode.',
    verdict: 'Derived risks inspected locally; manual second-line review recommended.',
  },
  source: 'fallback',
}

const SYSTEM_PROMPT = `You are an expert Chief Risk Officer acting as second line of defense for Aldar Properties PJSC (Abu Dhabi's largest listed real-estate developer). A control-assessment spreadsheet has been translated into derived risks. Your job: challenge the coverage, flag weak zones, spot missing risks, propose actions.

Output rules:
- Return ONLY valid JSON. No markdown. No prose outside JSON.
- Be specific to Aldar and Abu Dhabi real-estate, not generic ERM.
- "Missing risks" = risks a real CRO would flag that are absent from the uploaded control sheet.
- "Recommendations" must be 2-sentence, actionable.
- Challenge, don't praise.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const areas: Array<{ name: string; total_score: number; max_score: number; effectivenessPct: number }> = body.areas || []
    const derived: Array<{ id: string; name: string; category: string; controlScore: number; controlAreaName: string }> = body.derived || []

    if (areas.length === 0 || derived.length === 0) {
      return NextResponse.json({ ...FALLBACK, error: 'No control areas provided' })
    }

    const areasBlock = areas
      .map((a) => `- ${a.name}: ${a.total_score}/${a.max_score} (${a.effectivenessPct.toFixed(0)}%)`)
      .join('\n')
    const derivedBlock = derived
      .map((d) => `- ${d.id} [${d.category}] ${d.name} | control=${(d.controlScore * 100).toFixed(0)}%`)
      .join('\n')

    const userPrompt = `Uploaded control assessment — ${areas.length} areas, translated into ${derived.length} derived risks.

CONTROL AREAS:
${areasBlock}

DERIVED RISKS:
${derivedBlock}

As second-line CRO, return this JSON:

{
  "weak_control_zones": [ { "area": "...", "reason": "2-sentence reason" } ],
  "high_risk_zones":    [ { "risk_id": "CA-XXX", "reason": "2-sentence reason" } ],
  "missing_risks":      [ { "name": "...", "category": "Strategic|Financial|Operational|Project/Construction|Market/Sales|External/Geopolitical", "why_missing": "..." } ],
  "recommendations":    [ { "risk_id": "CA-XXX", "recommendation": "specific action", "reason": "1 sentence", "expected_impact": "measurable outcome, 1 sentence" } ],
  "assessment":         { "coverage": "1-2 sentences", "adaptability": "1-2 sentences", "verdict": "1 sentence" }
}

Return 2-4 weak zones, 2-4 high-risk zones, 2-4 missing risks, 3-6 recommendations.`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!text) throw new Error('Empty response from Claude')

    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ ...parsed, source: 'ai' })
  } catch (error) {
    const errMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    console.error('[control-assessment-ai] fallback:', errMsg)
    return NextResponse.json({ ...FALLBACK, error: errMsg })
  }
}
