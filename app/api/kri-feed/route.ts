import { NextResponse } from 'next/server'
import { KRI_FEEDS } from '@/lib/data/kri-feeds'

// Phase 4 (4.3) — mock external KRI feed. Returns current illustrative values
// per KRI with small variation around the base, plus source + timestamp, to
// prove the "KRI values auto-sourced from external systems" capability. Real
// connectors (P6 / Oracle / CRM / escrow) are a deferred integration build.
export const dynamic = 'force-dynamic'

export async function GET() {
  const now = new Date()
  // deterministic-ish variation from the minute so repeated syncs visibly move
  const t = now.getMinutes() + now.getSeconds() / 60
  const values = KRI_FEEDS.map((f, i) => {
    const wobble = Math.sin((t + i * 7) / 9) // -1..1
    const span = Math.abs(f.baseValue) * 0.04 + 0.02
    const value = Math.round((f.baseValue + wobble * span) * 100) / 100
    return {
      kriId: f.kriId,
      value,
      sourceSystem: f.sourceSystem,
      sourceField: f.sourceField,
      fetchedAt: now.toISOString(),
    }
  })
  return NextResponse.json({ source: 'feed', illustrative: true, values })
}
