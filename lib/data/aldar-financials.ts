/**
 * Aldar Financial Baselines — sourced from public disclosures.
 * ------------------------------------------------------------
 * Every value here is a `DataPoint` with explicit provenance. Do NOT
 * inline raw numbers anywhere downstream — import from this file so
 * the provenance chain stays intact.
 *
 * Sources used:
 *   - Aldar FY2025 Q4 Financial Results press release (Feb 2026)
 *   - Aldar Q1 FY2026 Financial Results press release (Apr 2026)
 *   - Aldar FY2024 Integrated Annual Report (segment baselines retained
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
  SRC_ALDAR_FY25_RESULTS,
  SRC_ALDAR_Q1_2026,
  SRC_ALDAR_FY24_AR,
} from '@/lib/provenance/sources'

// ============================================================
// GROUP-LEVEL — FY2025 (full year)
// ============================================================

export const ALDAR_FY25_GROUP_REVENUE: DataPoint = verified(
  33_800,
  'AED mn',
  SRC_ALDAR_FY25_RESULTS,
  { confidenceNote: 'FY2025 group revenue, +47% YoY (Aldar press release Feb 2026).' },
)

export const ALDAR_FY25_GROUP_EBITDA: DataPoint = verified(
  11_200,
  'AED mn',
  SRC_ALDAR_FY25_RESULTS,
  { confidenceNote: 'FY2025 EBITDA, +46% YoY.' },
)

export const ALDAR_FY25_NET_PROFIT_PRE_TAX: DataPoint = verified(
  10_000,
  'AED mn',
  SRC_ALDAR_FY25_RESULTS,
  { confidenceNote: 'FY2025 net profit before tax, +45% YoY.' },
)

export const ALDAR_FY25_NET_PROFIT_AFTER_TAX: DataPoint = verified(
  8_800,
  'AED mn',
  SRC_ALDAR_FY25_RESULTS,
  { confidenceNote: 'FY2025 net profit after tax, +36% YoY.' },
)

export const ALDAR_FY25_GROUP_SALES: DataPoint = verified(
  40_600,
  'AED mn',
  SRC_ALDAR_FY25_RESULTS,
  { confidenceNote: 'Highest-ever full-year group sales, +21% YoY.' },
)

export const ALDAR_FY25_UAE_SALES: DataPoint = verified(
  35_500,
  'AED mn',
  SRC_ALDAR_FY25_RESULTS,
  { confidenceNote: 'UAE share of total group sales for FY2025.' },
)

// ============================================================
// SEGMENT — Aldar Development (FY2025)
// ============================================================

export const ALDAR_FY25_DEV_REVENUE: DataPoint = verified(
  24_800,
  'AED mn',
  SRC_ALDAR_FY25_RESULTS,
  { confidenceNote: 'Aldar Development FY2025 revenue, +58% YoY.' },
)

export const ALDAR_FY25_DEV_EBITDA: DataPoint = verified(
  7_200,
  'AED mn',
  SRC_ALDAR_FY25_RESULTS,
  { confidenceNote: 'Aldar Development FY2025 EBITDA, +67% YoY.' },
)

export const ALDAR_FY25_DEV_BACKLOG: DataPoint = verified(
  71_700,
  'AED mn',
  SRC_ALDAR_FY25_RESULTS,
  { confidenceNote: 'Group development revenue backlog at end of Dec 2025, all-time high; AED 61.0 bn UAE-attributable.' },
)

// ============================================================
// SEGMENT — Aldar Investment (FY2025)
// ============================================================

export const ALDAR_FY25_INV_REVENUE: DataPoint = verified(
  8_100,
  'AED mn',
  SRC_ALDAR_FY25_RESULTS,
  { confidenceNote: 'Aldar Investment FY2025 revenue, +16% YoY.' },
)

export const ALDAR_FY25_INV_ADJ_EBITDA: DataPoint = verified(
  3_200,
  'AED mn',
  SRC_ALDAR_FY25_RESULTS,
  { confidenceNote: 'Aldar Investment FY2025 adjusted EBITDA, +20% YoY.' },
)

// ============================================================
// SEGMENT — International (FY2025)
// ============================================================

export const ALDAR_FY25_SODIC_REVENUE: DataPoint = verified(
  1_500,
  'AED mn',
  SRC_ALDAR_FY25_RESULTS,
  { confidenceNote: 'SODIC (Egypt subsidiary) FY2025 revenue.' },
)

export const ALDAR_FY25_LONDON_SQUARE_REVENUE: DataPoint = verified(
  1_700,
  'AED mn',
  SRC_ALDAR_FY25_RESULTS,
  { confidenceNote: 'London Square (UK subsidiary) FY2025 revenue.' },
)

// ============================================================
// SEGMENT — Education + Hospitality (FY2024 retained, FY25 not in snippet)
// ============================================================

export const ALDAR_FY24_EDUCATION_EBITDA: DataPoint = verified(
  266,
  'AED mn',
  SRC_ALDAR_FY24_AR,
  {
    confidenceNote:
      'Aldar Education adjusted EBITDA FY2024, +36% YoY. FY25 segment-level figure pending fetch.',
  },
)

/**
 * Aldar Hospitality — no segment-level FY25 number in the fetched press
 * release snippet. Marked PLACEHOLDER until a published figure is sourced.
 */
export const ALDAR_HOSPITALITY_REVENUE_PLACEHOLDER: DataPoint = placeholder(
  0,
  'AED mn',
  'FY25 hospitality segment revenue not separately disclosed in fetched snippet. Pending verification from full FY25 results PDF or analyst pack.',
)

// ============================================================
// Q1 2026 — most recent quarter
// ============================================================

export const ALDAR_Q1_26_REVENUE: DataPoint = verified(
  8_700,
  'AED mn',
  SRC_ALDAR_Q1_2026,
  { confidenceNote: 'Q1 2026 revenue, +12% YoY (Aldar press release Apr 28, 2026).' },
)

export const ALDAR_Q1_26_EBITDA: DataPoint = verified(
  3_000,
  'AED mn',
  SRC_ALDAR_Q1_2026,
  { confidenceNote: 'Q1 2026 EBITDA, +22% YoY.' },
)

export const ALDAR_Q1_26_NET_PROFIT: DataPoint = verified(
  2_300,
  'AED mn',
  SRC_ALDAR_Q1_2026,
  { confidenceNote: 'Q1 2026 net profit after tax, +20% YoY.' },
)

export const ALDAR_Q1_26_EPS: DataPoint = verified(
  0.25,
  'AED',
  SRC_ALDAR_Q1_2026,
  { confidenceNote: 'Earnings per share Q1 2026, +25% YoY.' },
)

export const ALDAR_Q1_26_GROUP_SALES: DataPoint = verified(
  6_700,
  'AED mn',
  SRC_ALDAR_Q1_2026,
  { confidenceNote: 'Group sales Q1 2026.' },
)

export const ALDAR_Q1_26_UAE_SALES: DataPoint = verified(
  5_900,
  'AED mn',
  SRC_ALDAR_Q1_2026,
  { confidenceNote: 'UAE sales Q1 2026; 88% to overseas / expat resident customers.' },
)

export const ALDAR_Q1_26_BACKLOG: DataPoint = verified(
  72_100,
  'AED mn',
  SRC_ALDAR_Q1_2026,
  { confidenceNote: 'Group development revenue backlog at end of March 2026, record level.' },
)

export const ALDAR_Q1_26_INV_REVENUE: DataPoint = verified(
  2_100,
  'AED mn',
  SRC_ALDAR_Q1_2026,
  { confidenceNote: 'Aldar Investment Q1 2026 revenue, +14% YoY.' },
)

export const ALDAR_Q1_26_INV_ADJ_EBITDA: DataPoint = verified(
  905,
  'AED mn',
  SRC_ALDAR_Q1_2026,
  { confidenceNote: 'Aldar Investment Q1 2026 adjusted EBITDA, +18% YoY.' },
)

// ============================================================
// Convenience exports — grouped for dashboard consumption
// ============================================================

export const ALDAR_LATEST_HEADLINE = {
  revenue: ALDAR_Q1_26_REVENUE,
  ebitda: ALDAR_Q1_26_EBITDA,
  netProfit: ALDAR_Q1_26_NET_PROFIT,
  groupSales: ALDAR_Q1_26_GROUP_SALES,
  backlog: ALDAR_Q1_26_BACKLOG,
  period: 'Q1 FY2026 (3 months ended 31 Mar 2026)',
} as const

export const ALDAR_FY25_SEGMENTS = {
  development: {
    revenue: ALDAR_FY25_DEV_REVENUE,
    ebitda: ALDAR_FY25_DEV_EBITDA,
    backlog: ALDAR_FY25_DEV_BACKLOG,
  },
  investment: {
    revenue: ALDAR_FY25_INV_REVENUE,
    adjEbitda: ALDAR_FY25_INV_ADJ_EBITDA,
  },
  education: {
    ebitda: ALDAR_FY24_EDUCATION_EBITDA, // FY25 segment figure pending
  },
  hospitality: {
    revenue: ALDAR_HOSPITALITY_REVENUE_PLACEHOLDER,
  },
  international: {
    sodicRevenue: ALDAR_FY25_SODIC_REVENUE,
    londonSquareRevenue: ALDAR_FY25_LONDON_SQUARE_REVENUE,
  },
} as const
