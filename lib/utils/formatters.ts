/**
 * Formatters — Batch 1
 * ---------------------
 * Single source for executive-grade number formatting. Used by all
 * dashboard cards to keep currency / score / percentage / date renders
 * consistent across surfaces.
 */

export type Currency = 'AED' | 'SAR' | 'USD'

/**
 * Compact currency formatter. AED 2,350,000,000 → "AED 2.35Bn".
 * Returns "Pending data" for null / undefined to avoid showing a bare "0".
 */
export function formatCurrencyShort(
  value: number | null | undefined,
  currency: Currency = 'AED',
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Pending data'
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${currency} ${(value / 1_000_000_000).toFixed(2)}Bn`
  if (abs >= 1_000_000) return `${currency} ${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${currency} ${(value / 1_000).toFixed(1)}K`
  return `${currency} ${value.toLocaleString()}`
}

/**
 * Exposure formatter — always in billions with the full word, e.g.
 * 2_350_000_000 → "2.35 billion AED", 323_500_000 → "0.32 billion AED".
 * `rawAed` is the raw AED amount (NOT millions).
 */
export function formatExposureBn(
  rawAed: number | null | undefined,
  currency: Currency = 'AED',
): string {
  if (rawAed === null || rawAed === undefined || Number.isNaN(rawAed)) return 'Pending data'
  return `${(rawAed / 1_000_000_000).toFixed(2)} billion ${currency}`
}

/**
 * Risk score formatter. Renders 0-100 as a 2-digit integer string.
 * Returns "—" for null / undefined to avoid the "0" credibility trap.
 */
export function formatRiskScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return Math.round(value).toString()
}

/**
 * Percentage formatter. 0.125 → "12.5%" by default; pass `alreadyPct=true`
 * if your value is already on a 0-100 scale.
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals = 1,
  alreadyPct = false,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Pending data'
  const pct = alreadyPct ? value : value * 100
  return `${pct.toFixed(decimals)}%`
}

/**
 * Date formatter — short "13 May 2026" format with safe fallback.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return 'Pending data'
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return 'Pending data'
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Integer count formatter — returns "Pending data" for null/undefined,
 * "0" only when explicitly verified zero is passed via allowZero=true.
 */
export function formatCount(
  value: number | null | undefined,
  allowZero = false,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Pending data'
  if (value === 0 && !allowZero) return 'Pending data'
  return value.toLocaleString()
}
