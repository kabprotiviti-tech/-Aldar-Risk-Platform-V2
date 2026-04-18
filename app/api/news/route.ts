import { NextResponse } from 'next/server'

export interface NewsItem {
  id: string
  headline: string
  source: string
  url: string
  publishedAt: string
  sourceType: 'google' | 'gdelt' | 'guardian' | 'newsapi' | 'ft' | 'reuters' | 'worldbank' | 'imf'
}

// ─── In-memory cache (5 min TTL) ────────────────────────────────────────────
let _cache: { items: NewsItem[]; source: string; ts: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

// ─── Google News RSS queries ─────────────────────────────────────────────────
const RSS_QUERIES = [
  'real+estate+UAE+Abu+Dhabi',
  'hospitality+UAE+hotel',
  'retail+UAE+commercial',
  'Aldar+Properties',
]

// ─── Fallback data ────────────────────────────────────────────────────────────
const MOCK_NEWS: NewsItem[] = [
  { id: 'mock-1', headline: 'Abu Dhabi real estate transactions surge 15% in Q1 2026 amid demand rebound', source: 'The National', url: '#', publishedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), sourceType: 'google' },
  { id: 'mock-2', headline: 'UAE hospitality revenue reaches record AED 12Bn as tourism hits 5-year high', source: 'Arabian Business', url: '#', publishedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), sourceType: 'google' },
  { id: 'mock-3', headline: 'Construction cost inflation at 18% pressures UAE developers on active pipelines', source: 'Construction Week', url: '#', publishedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), sourceType: 'reuters' },
  { id: 'mock-4', headline: 'CBUAE tightens real estate financing rules — LTV caps revised downward', source: 'Reuters', url: '#', publishedAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(), sourceType: 'reuters' },
  { id: 'mock-5', headline: 'Abu Dhabi retail vacancy falls to 4.8% — lowest since 2020 amid consumer boom', source: 'Khaleej Times', url: '#', publishedAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString(), sourceType: 'google' },
  { id: 'mock-6', headline: 'ADX mandates ESG disclosure for listed real estate firms from Q3 2026', source: 'ADX Bulletin', url: '#', publishedAt: new Date(Date.now() - 11 * 3600 * 1000).toISOString(), sourceType: 'google' },
  { id: 'mock-7', headline: 'Global supply chain disruptions delay building materials to Gulf contractors', source: 'Bloomberg', url: '#', publishedAt: new Date(Date.now() - 13 * 3600 * 1000).toISOString(), sourceType: 'gdelt' },
  { id: 'mock-8', headline: 'ADIB raises mortgage rates — analysts warn of 8% cooling in off-plan sales', source: 'Gulf News', url: '#', publishedAt: new Date(Date.now() - 16 * 3600 * 1000).toISOString(), sourceType: 'google' },
  { id: 'mock-9', headline: 'Aldar announces AED 2.5Bn expansion of Yas Mall anchored retail district', source: 'WAM', url: '#', publishedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(), sourceType: 'guardian' },
  { id: 'mock-10', headline: 'UAE geopolitical risk premium rises — institutional investors reassess GCC exposure', source: 'Financial Times', url: '#', publishedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), sourceType: 'ft' },
  { id: 'mock-11', headline: 'World Bank raises MENA growth forecast — UAE leads regional economic recovery', source: 'World Bank', url: '#', publishedAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(), sourceType: 'worldbank' },
  { id: 'mock-12', headline: 'IMF Article IV: UAE fiscal position strengthens as oil revenues outperform', source: 'IMF', url: '#', publishedAt: new Date(Date.now() - 32 * 3600 * 1000).toISOString(), sourceType: 'imf' },
]

// ─── XML helpers ─────────────────────────────────────────────────────────────
function extractTag(xml: string, tag: string): string {
  const pattern = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
    'i'
  )
  const m = xml.match(pattern)
  if (!m) return ''
  return m[1]
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim()
}

function parseRSS(xml: string, idPrefix: string, sourceName: string, sourceType: NewsItem['sourceType']): NewsItem[] {
  const items: NewsItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  let i = 0

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const rawTitle = extractTag(block, 'title')
    const rawLink =
      block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() ||
      extractTag(block, 'guid')
    const pubDate = extractTag(block, 'pubDate') || extractTag(block, 'dc:date')
    const src = extractTag(block, 'source')

    if (!rawTitle || rawTitle.length < 10) continue

    const parts = rawTitle.split(' - ')
    const headline = parts.length > 1 ? parts.slice(0, -1).join(' - ') : rawTitle
    const resolvedSource = sourceName || src || (parts.length > 1 ? parts[parts.length - 1] : 'News Feed')

    let publishedAt = new Date().toISOString()
    try { if (pubDate) publishedAt = new Date(pubDate).toISOString() } catch {}

    items.push({
      id: `${idPrefix}-${i++}`,
      headline: headline.substring(0, 200),
      source: resolvedSource.substring(0, 80),
      url: rawLink || '#',
      publishedAt,
      sourceType,
    })

    if (items.length >= 8) break
  }
  return items
}

// ─── Google News RSS ──────────────────────────────────────────────────────────
async function fetchGoogleRSS(query: string, idx: number): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'application/rss+xml, text/xml, */*' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Google RSS ${res.status}`)
  return parseRSS(await res.text(), `google-${idx}`, '', 'google')
}

// ─── GDELT API ────────────────────────────────────────────────────────────────
async function fetchGDELT(): Promise<NewsItem[]> {
  const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=real%20estate%20OR%20hospitality%20OR%20UAE%20OR%20Abu%20Dhabi&mode=ArtList&maxrecords=10&format=json'
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`GDELT ${res.status}`)
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data.articles || []) as any[]).slice(0, 10).map((a: any, i: number) => ({
    id: `gdelt-${i}`,
    headline: (a.title || '').substring(0, 200),
    source: a.domain || a.sourcecountry || 'GDELT',
    url: a.url || '#',
    publishedAt: a.seendate ? new Date(
      a.seendate.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z')
    ).toISOString() : new Date().toISOString(),
    sourceType: 'gdelt' as const,
  })).filter((n: NewsItem) => n.headline.length > 10)
}

// ─── Guardian API ─────────────────────────────────────────────────────────────
async function fetchGuardian(): Promise<NewsItem[]> {
  const key = process.env.GUARDIAN_API_KEY
  if (!key) return []
  const url = `https://content.guardianapis.com/search?q=UAE+OR+real-estate+OR+hospitality+OR+property&api-key=${key}&show-fields=headline&order-by=newest&page-size=10`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return []
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data.response?.results || []) as any[]).slice(0, 10).map((a: any, i: number) => ({
    id: `guardian-${i}`,
    headline: (a.fields?.headline || a.webTitle || '').substring(0, 200),
    source: `The Guardian — ${a.sectionName || 'News'}`,
    url: a.webUrl || '#',
    publishedAt: a.webPublicationDate || new Date().toISOString(),
    sourceType: 'guardian' as const,
  })).filter((n: NewsItem) => n.headline.length > 10)
}

// ─── NewsAPI ──────────────────────────────────────────────────────────────────
async function fetchNewsAPI(): Promise<NewsItem[]> {
  const key = process.env.NEWS_API_KEY
  if (!key) return []
  const res = await fetch(
    `https://newsapi.org/v2/everything?q=UAE+real+estate+OR+Abu+Dhabi+property+OR+Aldar&language=en&sortBy=publishedAt&pageSize=10`,
    { headers: { 'X-Api-Key': key }, signal: AbortSignal.timeout(8000) }
  )
  if (!res.ok) return []
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data.articles || []) as any[]).slice(0, 10).map((a: any, i: number) => ({
    id: `newsapi-${i}`,
    headline: (a.title || '').replace(/\s+-\s+.+$/, '').substring(0, 200),
    source: a.source?.name || 'NewsAPI',
    url: a.url || '#',
    publishedAt: a.publishedAt || new Date().toISOString(),
    sourceType: 'newsapi' as const,
  })).filter((n: NewsItem) => n.headline.length > 10)
}

// ─── Additional RSS sources ───────────────────────────────────────────────────
const EXTRA_RSS: Array<{ url: string; name: string; type: NewsItem['sourceType']; id: string }> = [
  {
    url: 'https://feeds.reuters.com/reuters/businessNews',
    name: 'Reuters',
    type: 'reuters',
    id: 'reuters',
  },
  {
    url: 'https://www.worldbank.org/en/news/all.rss',
    name: 'World Bank',
    type: 'worldbank',
    id: 'worldbank',
  },
  {
    url: 'https://www.imf.org/en/News/RSS?language=ENG',
    name: 'IMF',
    type: 'imf',
    id: 'imf',
  },
  {
    // FT public RSS - limited but available without subscription
    url: 'https://www.ft.com/rss/home/uk',
    name: 'Financial Times',
    type: 'ft',
    id: 'ft',
  },
]

async function fetchExtraRSS(src: typeof EXTRA_RSS[0]): Promise<NewsItem[]> {
  const res = await fetch(src.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`${src.name} RSS ${res.status}`)
  return parseRSS(await res.text(), src.id, src.name, src.type)
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET() {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    return NextResponse.json({ items: _cache.items, source: _cache.source, cached: true })
  }

  try {
    const results = await Promise.allSettled([
      // Google News (4 queries)
      ...RSS_QUERIES.map((q, i) => fetchGoogleRSS(q, i)),
      // GDELT
      fetchGDELT(),
      // Guardian (optional key)
      fetchGuardian(),
      // NewsAPI (optional key)
      fetchNewsAPI(),
      // Extra RSS sources
      ...EXTRA_RSS.map((src) => fetchExtraRSS(src)),
    ])

    const allItems: NewsItem[] = []
    let hasLiveData = false

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.length > 0) {
        allItems.push(...r.value)
        hasLiveData = true
      }
    }

    if (!hasLiveData) {
      _cache = { items: MOCK_NEWS, source: 'fallback', ts: Date.now() }
      return NextResponse.json({ items: MOCK_NEWS, source: 'fallback', cached: false })
    }

    // Deduplicate by normalised headline prefix
    const seen = new Set<string>()
    const deduped: NewsItem[] = []
    for (const item of allItems) {
      const key = item.headline.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 60)
      if (!seen.has(key)) {
        seen.add(key)
        deduped.push(item)
      }
    }

    // Sort newest first, return top 20
    deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    const final = deduped.slice(0, 20)

    _cache = { items: final, source: 'live', ts: Date.now() }
    return NextResponse.json({ items: final, source: 'live', cached: false })
  } catch {
    _cache = { items: MOCK_NEWS, source: 'fallback', ts: Date.now() }
    return NextResponse.json({ items: MOCK_NEWS, source: 'fallback', cached: false })
  }
}
