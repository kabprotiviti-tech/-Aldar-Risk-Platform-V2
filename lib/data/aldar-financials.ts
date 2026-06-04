/**
 * ABC Financial Baselines — sourced from public disclosures.
 * ------------------------------------------------------------
 * Every value here is a `DataPoint` with explicit provenance. Do NOT
 * inline raw numbers anywhere downstream — import from this file so
 * the provenance chain stays intact.
 *
 * Sources used:
 *   - ABC FY2025 Q4 Financial Results press release (Feb 2026)
 *   - ABC Q1 FY2026 Financial Results press release (Apr 2026)
 *   - ABC FY2024 Integrated Annual Report (segment baselines retained
 *     for items where FY25 segment-level disclosure was not in the
 *     fetched snippet)
 *
 * Standing rule (CLAUDE.md): if a figure is not in the cited source it
 * MUST be tagged `placeholder` with a calibration note — never invented.
 */

import {
  verified,
  placeholder,
  type DataPoint,
} from '@/lib/provenance/types'
import {
  SRC_ABC_FY25_RESULTS,
  SRC_ABC_Q1_2026,
  SRC_ABC_FY24_AR,
} from '@/lib/provenance/sources'

// ============================================================
// GROUP-LEVEL — FY2025 (full year)
// ============================================================

export const ABC_FY25_GROUP_REVENUE: DataPoint = verified(
  33_800,
  'AED mn',
  SRC_ABC_FY25_RESULTS,
  { confidenceNote: 'FY2025 group revenue, +47% YoY (ABC press release Feb 2026).' },
)

export const ABC_FY25_GROUP_EBITDA: DataPoint = verified(
  11_200,
  'AED mn',
  SRC_ABC_FY25_RESULTS,
  { confidenceNote: 'FY2025 EBITDA, +46% YoY.' },
)

export const ABC_FY25_NET_PROFIT_PRE_TAX: DataPoint = verified(
  10_000,
  'AED mn',
  SRC_ABC_FY25_RESULTS,
  { confidenceNote: 'FY2025 net profit before tax, +45% YoY.' },
)

export const ABC_FY25_NET_PROFIT_AFTER_TAX: DataPoint = verified(
  8_800,
  'AED mn',
  SRC_ABC_FY25_RESULTS,
  { confidenceNote: 'FY2025 net profit after tax, +36% YoY.' },
)

export const ABC_FY25_GROUP_SALES: DataPoint = verified(
  40_600,
  'AED mn',
  SRC_ABC_FY25_RESULTS,
  { confidenceNote: 'Highest-ever full-year group sales, +21% YoY.' },
)

export const ABC_FY25_UAE_SALES: DataPoint = verified(
  35_500,
  'AED mn',
  SRC_ABC_FY25_RESULTS,
  { confidenceNote: 'UAE share of total group sales for FY2025.' },
)

// ============================================================
// SEGMENT — ABC Development (FY2025)
// ============================================================

export const ABC_FY25_DEV_REVENUE: DataPoint = verified(
  24_800,
  'AED mn',
  SRC_ABC_FY25_RESULTS,
  { confidenceNote: 'ABC Development FY2025 revenue, +58% YoY.' },
)

export const ABC_FY25_DEV_EBITDA: DataPoint = verified(
  7_200,
  'AED mn',
  SRC_ABC_FY25_RESULTS,
  { confidenceNote: 'ABC Development FY2025 EBITDA, +67% YoY.' },
)

export const ABC_FY25_DEV_BACKLOG: DataPoint = verified(
  71_700,
  'AED mn',
  SRC_ABC_FY25_RESULTS,
  { confidenceNote: 'Group development revenue backlog at end of Dec 2025, all-time high; AED 61.0 bn UAE-attributable.' },
)

// ============================================================
// SEGMENT — ABC Investment (FY2025)
// ============================================================

export const ABC_FY25_INV_REVENUE: DataPoint = verified(
  8_100,
  'AED mn',
  SRC_ABC_FY25_RESULTS,
  { confidenceNote: 'ABC Investment FY2025 revenue, +16% YoY.' },
)

export const ABC_FY25_INV_ADJ_EBITDA: DataPoint = verified(
  3_200,
  'AED mn',
  SRC_ABC_FY25_RESULTS,
  { confidenceNote: 'ABC Investment FY2025 adjusted EBITDA, +20% YoY.' },
)

// ============================================================
// SEGMENT — International (FY2025)
// ============================================================

export const ABC_FY25_SODIC_REVENUE: DataPoint = verified(
  1_500,
  'AED mn',
  SRC_ABC_FY25_RESULTS,
  { confidenceNote: 'SODIC (Egypt subsidiary) FY2025 revenue.' },
)

export const ABC_FY25_LONDON_SQUARE_REVENUE: DataPoint = verified(
  1_700,
  'AED mn',
  SRC_ABC_FY25_RESULTS,
  { confidenceNote: 'London Square (UK subsidiary) FY2025 revenue.' },
)

// ============================================================
// SEGMENT — Education + Hospitality (FY2024 retained, FY25 not in snippet)
// ============================================================

export const ABC_FY24_EDUCATION_EBITDA: DataPoint = verified(
  266,
  'AED mn',
  SRC_ABC_FY24_AR,
  {
    confidenceNote:
      'ABC Education adjusted EBITDA FY2024, +36% YoY. FY25 segment-level figure pending fetch.',
  },
)

/**
 * ABC Hospitality — no segment-level FY25 number in the fetched press
 * release snippet. Marked PLACEHOLDER until a published figure is sourced.
 */
export const ABC_HOSPITALITY_REVENUE_PLACEHOLDER: DataPoint = placeholder(
  0,
  'AED mn',
  'FY25 hospitality segment revenue not separately disclosed in fetched snippet. Pending verification from full FY25 results PDF or analyst pack.',
)

// ============================================================
// Q1 2026 — most recent quarter
// ============================================================

export const ABC_Q1_26_REVENUE: DataPoint = verified(
  8_700,
  'AED mn',
  SRC_ABC_Q1_2026,
  { confidenceNote: 'Q1 2026 revenue, +12% YoY (ABC press release Apr 28, 2026).' },
)

export const ABC_Q1_26_EBITDA: DataPoint = verified(
  3_000,
  'AED mn',
  SRC_ABC_Q1_2026,
  { confidenceNote: 'Q1 2026 EBITDA, +22% YoY.' },
)

export const ABC_Q1_26_NET_PROFIT: DataPoint = verified(
  2_300,
  'AED mn',
  SRC_ABC_Q1_2026,
  { confidenceNote: 'Q1 2026 net profit after tax, +20% YoY.' },
)

export const ABC_Q1_26_EPS: DataPoint = verified(
  0.25,
  'AED',
  SRC_ABC_Q1_2026,
  { confidenceNote: 'Earnings per share Q1 2026, +25% YoY.' },
)

export const ABC_Q1_26_GROUP_SALES: DataPoint = verified(
  6_700,
  'AED mn',
  SRC_ABC_Q1_2026,
  { confidenceNote: 'Group sales Q1 2026.' },
)

export const ABC_Q1_26_UAE_SALES: DataPoint = verified(
  5_900,
  'AED mn',
  SRC_ABC_Q1_2026,
  { confidenceNote: 'UAE sales Q1 2026; 88% to overseas / expat resident customers.' },
)

export const ABC_Q1_26_BACKLOG: DataPoint = verified(
  72_100,
  'AED mn',
  SRC_ABC_Q1_2026,
  { confidenceNote: 'Group development revenue backlog at end of March 2026, record level.' },
)

export const ABC_Q1_26_INV_REVENUE: DataPoint = verified(
  2_100,
  'AED mn',
  SRC_ABC_Q1_2026,
  { confidenceNote: 'ABC Investment Q1 2026 revenue, +14% YoY.' },
)

export const ABC_Q1_26_INV_ADJ_EBITDA: DataPoint = verified(
  905,
  'AED mn',
  SRC_ABC_Q1_2026,
  { confidenceNote: 'ABC Investment Q1 2026 adjusted EBITDA, +18% YoY.' },
)

// ============================================================
// Convenience exports — grouped for dashboard consumption
// ============================================================

export const ABC_LATEST_HEADLINE = {
  revenue: ABC_Q1_26_REVENUE,
  ebitda: ABC_Q1_26_EBITDA,
  netProfit: ABC_Q1_26_NET_PROFIT,
  groupSales: ABC_Q1_26_GROUP_SALES,
  backlog: ABC_Q1_26_BACKLOG,
  period: 'Q1 FY2026 (3 months ended 31 Mar 2026)',
} as const

export const ABC_FY25_SEGMENTS = {
  development: {
    revenue: ABC_FY25_DEV_REVENUE,
    ebitda: ABC_FY25_DEV_EBITDA,
    backlog: ABC_FY25_DEV_BACKLOG,
  },
  investment: {
    revenue: ABC_FY25_INV_REVENUE,
    adjEbitda: ABC_FY25_INV_ADJ_EBITDA,
  },
  education: {
    ebitda: ABC_FY24_EDUCATION_EBITDA, // FY25 segment figure pending
  },
  hospitality: {
    revenue: ABC_HOSPITALITY_REVENUE_PLACEHOLDER,
  },
  international: {
    sodicRevenue: ABC_FY25_SODIC_REVENUE,
    londonSquareRevenue: ABC_FY25_LONDON_SQUARE_REVENUE,
  },
} as const
