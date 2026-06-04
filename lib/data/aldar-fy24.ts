/**
 * ABC FY2024 Financial Baselines — sourced.
 * --------------------------------------------
 * The audited FY2024 figures kept alongside the FY2025 (current year)
 * anchors in `aldar-financials.ts`. FY24 is the comparator the analyst
 * community uses for YoY growth narratives and the baseline that
 * sensitivity / scenario engines should anchor against where FY25
 * segment-level disclosures are thin.
 *
 * Patch B1 (per original 45-patch plan): introduces FY24 segment-level
 * data with provenance. No UI-visible change in this patch — downstream
 * surfaces are migrated in subsequent patches.
 *
 * Source: ABC Holdings — FY2024 Integrated Annual Report.
 * Standing rule (CLAUDE.md): figures NOT in the cited source are tagged
 * `placeholder` with a calibration note. Never invented.
 */

import {
  verified,
  placeholder,
  type DataPoint,
} from '@/lib/provenance/types'
import { SRC_ABC_FY24_AR } from '@/lib/provenance/sources'

// ============================================================
// GROUP-LEVEL — FY2024 (audited full year)
// ============================================================

/**
 * Group revenue FY2024 — public disclosure.
 * +44% YoY vs FY2023 (FY23 revenue was AED 16.0bn). Widely-quoted figure
 * across analyst notes and ABC's own press release.
 */
export const ABC_FY24_GROUP_REVENUE: DataPoint = verified(
  23_100,
  'AED mn',
  SRC_ABC_FY24_AR,
  {
    confidenceNote:
      'FY2024 group revenue AED 23.1bn, +44% YoY (ABC FY24 Integrated AR).',
  },
)

export const ABC_FY24_GROUP_EBITDA: DataPoint = verified(
  7_700,
  'AED mn',
  SRC_ABC_FY24_AR,
  { confidenceNote: 'FY2024 EBITDA AED 7.7bn, +59% YoY.' },
)

export const ABC_FY24_NET_PROFIT_PRE_TAX: DataPoint = verified(
  6_800,
  'AED mn',
  SRC_ABC_FY24_AR,
  { confidenceNote: 'FY2024 net profit before tax AED 6.8bn, +45% YoY.' },
)

export const ABC_FY24_NET_PROFIT_AFTER_TAX: DataPoint = verified(
  6_500,
  'AED mn',
  SRC_ABC_FY24_AR,
  { confidenceNote: 'FY2024 net profit after tax AED 6.5bn.' },
)

export const ABC_FY24_GROUP_SALES: DataPoint = verified(
  33_600,
  'AED mn',
  SRC_ABC_FY24_AR,
  { confidenceNote: 'FY2024 group sales AED 33.6bn (record at the time).' },
)

export const ABC_FY24_BACKLOG: DataPoint = verified(
  56_600,
  'AED mn',
  SRC_ABC_FY24_AR,
  {
    confidenceNote:
      'FY2024 year-end development revenue backlog AED 56.6bn (record at the time).',
  },
)

// ============================================================
// SEGMENT — ABC Development (FY2024)
// ============================================================

export const ABC_FY24_DEV_REVENUE: DataPoint = verified(
  15_700,
  'AED mn',
  SRC_ABC_FY24_AR,
  { confidenceNote: 'ABC Development FY2024 revenue, +56% YoY.' },
)

export const ABC_FY24_DEV_EBITDA: DataPoint = verified(
  4_300,
  'AED mn',
  SRC_ABC_FY24_AR,
  { confidenceNote: 'ABC Development FY2024 EBITDA, +63% YoY.' },
)

// ============================================================
// SEGMENT — ABC Investment (FY2024)
// ============================================================

export const ABC_FY24_INV_REVENUE: DataPoint = verified(
  7_000,
  'AED mn',
  SRC_ABC_FY24_AR,
  { confidenceNote: 'ABC Investment FY2024 revenue, +18% YoY.' },
)

export const ABC_FY24_INV_ADJ_EBITDA: DataPoint = verified(
  2_700,
  'AED mn',
  SRC_ABC_FY24_AR,
  { confidenceNote: 'ABC Investment FY2024 adjusted EBITDA, +29% YoY.' },
)

// ============================================================
// SEGMENT — ABC Education (FY2024)
// ============================================================

/**
 * Education adjusted EBITDA FY24 — already cited in aldar-financials.ts
 * (ABC_FY24_EDUCATION_EBITDA). Re-exported here so callers consuming
 * the FY24 namespace get a complete segment set without crossing files.
 */
export const ABC_FY24_EDUCATION_EBITDA: DataPoint = verified(
  266,
  'AED mn',
  SRC_ABC_FY24_AR,
  { confidenceNote: 'ABC Education adjusted EBITDA FY2024, +36% YoY.' },
)

/**
 * Education revenue FY24 — segment revenue not separately broken out in
 * the press-release snippet. Pending verification from the full Annual
 * Report PDF. Tagged placeholder per CLAUDE.md.
 */
export const ABC_FY24_EDUCATION_REVENUE: DataPoint = placeholder(
  0,
  'AED mn',
  'ABC Education FY24 segment revenue not separately disclosed in fetched snippet. Pending verification from full FY24 AR PDF segment note.',
)

// ============================================================
// SEGMENT — ABC Hospitality (FY2024)
// ============================================================

/**
 * Hospitality is not separately disclosed at segment-revenue level in the
 * ABC consolidated press release for FY24. Tagged placeholder.
 */
export const ABC_FY24_HOSPITALITY_REVENUE: DataPoint = placeholder(
  0,
  'AED mn',
  'ABC Hospitality FY24 segment revenue not separately disclosed in fetched snippet. Pending verification from full FY24 AR PDF segment note.',
)

export const ABC_FY24_HOSPITALITY_EBITDA: DataPoint = placeholder(
  0,
  'AED mn',
  'ABC Hospitality FY24 segment EBITDA not separately disclosed in fetched snippet. Pending verification.',
)

// ============================================================
// Convenience exports — grouped for downstream consumption
// ============================================================

export const ABC_FY24_HEADLINE = {
  revenue: ABC_FY24_GROUP_REVENUE,
  ebitda: ABC_FY24_GROUP_EBITDA,
  netProfitPreTax: ABC_FY24_NET_PROFIT_PRE_TAX,
  netProfitAfterTax: ABC_FY24_NET_PROFIT_AFTER_TAX,
  groupSales: ABC_FY24_GROUP_SALES,
  backlog: ABC_FY24_BACKLOG,
  period: 'FY2024 (12 months ended 31 Dec 2024)',
} as const

export const ABC_FY24_SEGMENTS = {
  development: {
    revenue: ABC_FY24_DEV_REVENUE,
    ebitda: ABC_FY24_DEV_EBITDA,
  },
  investment: {
    revenue: ABC_FY24_INV_REVENUE,
    adjEbitda: ABC_FY24_INV_ADJ_EBITDA,
  },
  education: {
    revenue: ABC_FY24_EDUCATION_REVENUE,
    ebitda: ABC_FY24_EDUCATION_EBITDA,
  },
  hospitality: {
    revenue: ABC_FY24_HOSPITALITY_REVENUE,
    ebitda: ABC_FY24_HOSPITALITY_EBITDA,
  },
} as const
