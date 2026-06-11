import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/openai'

// P3.2 — AI control benchmarking. Given a control, suggest alignment to the
// major risk/control frameworks (ISO 31000, COSO ERM, NIST). Advisory only —
// the user attaches the tag. Small + fast.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export interface FrameworkTag {
  iso31000: string
  coso: string
  nist: string
  rationale: string
}

const SYSTEM = `You are a controls assurance specialist. Given one internal control, map it to the major frameworks using your trained knowledge. Be specific and concise — cite the component/clause, not a paragraph.
Return ONLY a JSON object:
- iso31000: the relevant ISO 31000:2018 clause/principle (e.g. "Clause 6.5 — Risk treatment")
- coso: the relevant COSO ERM 2017 component/principle (e.g. "Performance — Principle 13: Implements risk responses")
- nist: the relevant NIST CSF 2.0 function/category (e.g. "PR.AC-1 — Identity management"), or "n/a" if not a cyber/IT control
- rationale: one sentence on why this control maps there
No markdown, no text outside the JSON object.`

function parseObj(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text.replace(/```json\s*/gi, '').replace(/```/g, '').trim())
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) { try { return JSON.parse(m[0]) } catch {} }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { control } = await req.json()
    const name = String(control?.name || '').slice(0, 160)
    const description = String(control?.description || '').slice(0, 400)
    if (!name) return NextResponse.json({ source: 'empty', tag: null })

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Control: "${name}"\nDescription: ${description}\nType: ${control?.controlType || ''} · Process: ${control?.process || ''}\n\nMap it to ISO 31000, COSO ERM and NIST.`,
      }],
    })
    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const parsed = parseObj(text)
    if (!parsed) throw new Error('parse failed')
    const tag: FrameworkTag = {
      iso31000: String(parsed.iso31000 || '').slice(0, 120),
      coso: String(parsed.coso || '').slice(0, 120),
      nist: String(parsed.nist || '').slice(0, 120),
      rationale: String(parsed.rationale || '').slice(0, 300),
    }
    return NextResponse.json({ source: 'ai', tag })
  } catch {
    return NextResponse.json({ source: 'fallback', tag: null })
  }
}
