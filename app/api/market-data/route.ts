import { NextResponse } from 'next/server'

export const revalidate = 120 // 2-min server cache

interface MarketResult {
  price: number
  previousClose: number
  change: number
  changePercent: number
  source: string
}

// ─── Provider 1: ADX official page via Jina reader (free, no key) ─────────────
// r.jina.ai converts the ADX company profile page to markdown
async function fetchFromADX(): Promise<MarketResult> {
  const res = await fetch(
    'https://r.jina.ai/https://www.adx.ae/main-market/company-profile/overview?symbols=ALDAR',
    {
      headers: {
        Accept: 'text/plain',
        'X-Return-Format': 'text',
      },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 120 },
    }
  )
  if (!res.ok) throw new Error(`jina/adx: ${res.status}`)
  const text = await res.text()

  // Regex patterns to extract price from ADX markdown output
  const priceMatch =
    text.match(/Current Price[^0-9]*([0-9]+\.?[0-9]*)/i) ||
    text.match(/Last Trade[^0-9]*([0-9]+\.?[0-9]*)/i) ||
    text.match(/Last Price[^0-9]*([0-9]+\.?[0-9]*)/i) ||
    text.match(/\*\*([0-9]+\.[0-9]{2,3})\s*AED/i)

  const prevMatch =
    text.match(/Previous Close[^0-9]*([0-9]+\.?[0-9]*)/i) ||
    text.match(/Prev\.?\s*Close[^0-9]*([0-9]+\.?[0-9]*)/i)

  const pctMatch =
    text.match(/\(([+-]?[0-9]+\.?[0-9]*)%\)/) ||
    text.match(/([+-]?[0-9]+\.?[0-9]*)%/)

  const price = priceMatch ? parseFloat(priceMatch[1]) : 0
  if (!price || price <= 0) throw new Error('jina/adx: could not parse price from page')

  const previousClose = prevMatch ? parseFloat(prevMatch[1]) : price
  const changePercent = pctMatch ? parseFloat(pctMatch[1]) : 0
  const change = +(price - previousClose).toFixed(3)

  return { price, previousClose, change, changePercent, source: 'ADX · adx.ae (live)' }
}

// ─── Provider 2: Twelve Data (optional — set TWELVE_DATA_API_KEY in Vercel) ───
async function fetchFromTwelveData(): Promise<MarketResult> {
  const key = process.env.TWELVE_DATA_API_KEY
  if (!key) throw new Error('no key')
  const res = await fetch(
    `https://api.twelvedata.com/quote?symbol=ALDAR&exchange=ADX&apikey=${key}`,
    { signal: AbortSignal.timeout(8000), next: { revalidate: 120 } }
  )
  if (!res.ok) throw new Error(`twelvedata: ${res.status}`)
  const j = await res.json()
  if (j.status === 'error') throw new Error(`twelvedata: ${j.message}`)
  const price = parseFloat(j.close)
  const prev = parseFloat(j.previous_close)
  if (!price || price <= 0) throw new Error('twelvedata: bad price')
  const change = +(price - prev).toFixed(3)
  const changePercent = +((change / prev) * 100).toFixed(3)
  return { price, previousClose: prev, change, changePercent, source: 'Twelve Data · ADX' }
}

export async function GET() {
  for (const fn of [fetchFromADX, fetchFromTwelveData]) {
    try {
      const { price, previousClose, change, changePercent, source } = await fn()
      return NextResponse.json({
        symbol: 'ALDAR',
        exchange: 'ADX',
        price: +price.toFixed(2),
        previousClose: +previousClose.toFixed(2),
        change: +change.toFixed(3),
        changePercent: +changePercent.toFixed(3),
        currency: 'AED',
        timestamp: Date.now(),
        source,
        status: 'ok',
      })
    } catch {
      // try next
    }
  }

  // Last resort — show that price is unavailable rather than wrong number
  return NextResponse.json({ status: 'unavailable' })
}
