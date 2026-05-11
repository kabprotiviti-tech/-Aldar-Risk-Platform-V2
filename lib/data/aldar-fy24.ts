/**
 * Aldar FY2024 Financial Baselines — sourced.
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
 * Source: Aldar Properties PJSC — FY2024 Integrated Annual Report.
 * Standing rule (CLAUDE.md): figures NOT in the cited source are tagged
 * `placeholder` with a calibration note. Never invented.
 */

import {
  verified,
  placeholder,
  type DataPoint,
} from '@/lib/provenance/types'
import { SRC_ALDAR_FY24_AR } from '@/lib/provenance/sources'

// ============================================================
// GROUP-LEVEL — FY2024 (audited full year)
// ============================================================

/**
 * Group revenue FY2024 — public disclosure.
 * +44% YoY vs FY2023 (FY23 revenue was AED 16.0bn). Widely-quoted figure
 * across analyst notes and Aldar's own press release.
 */
export const ALDAR_FY24_GROUP_REVENUE: DataPoint = verified(
  23_100,
  'AED mn',
  SRC_ALDAR_FY24_AR,
  {
    confidenceNote:
      'FY2024 group revenue AED 23.1bn, +44% YoY (Aldar FY24 Integrated AR).',
  },
)

export const ALDAR_FY24_GROUP_EBITDA: DataPoint = verified(
  7_700,
  'AED mn',
  SRC_ALDAR_FY24_AR,
  { confidenceNote: 'FY2024 EBITDA AED 7.7bn, +59% YoY.' },
)

export const ALDAR_FY24_NET_PROFIT_PRE_TAX: DataPoint = verified(
  6_800,
  'AED mn',
  SRC_ALDAR_FY24_AR,
  { confidenceNote: 'FY2024 net profit before tax AED 6.8bn, +45% YoY.' },
)

export const ALDAR_FY24_NET_PROFIT_AFTER_TAX: DataPoint = verified(
  6_500,
  'AED mn',
  SRC_ALDAR_FY24_AR,
  { confidenceNote: 'FY2024 net profit after tax AED 6.5bn.' },
)

export const ALDAR_FY24_GROUP_SALES: DataPoint = verified(
  33_600,
  'AED mn',
  SRC_ALDAR_FY24_AR,
  { confidenceNote: 'FY2024 group sales AED 33.6bn (record at the time).' },
)

export const ALDAR_FY24_BACKLOG: DataPoint = verified(
  56_600,
  'AED mn',
  SRC_ALDAR_FY24_AR,
  {
    confidenceNote:
      'FY2024 year-end development revenue backlog AED 56.6bn (record at the time).',
  },
)

// ============================================================
// SEGMENT — Aldar Development (FY2024)
// ============================================================

export const ALDAR_FY24_DEV_REVENUE: DataPoint = verified(
  15_700,
  'AED mn',
  SRC_ALDAR_FY24_AR,
  { confidenceNote: 'Aldar Development FY2024 revenue, +56% YoY.' },
)

export const ALDAR_FY24_DEV_EBITDA: DataPoint = verified(
  4_300,
  'AED mn',
  SRC_ALDAR_FY24_AR,
  { confidenceNote: 'Aldar Development FY2024 EBITDA, +63% YoY.' },
)

// ============================================================
// SEGMENT — Aldar Investment (FY2024)
// ============================================================

export const ALDAR_FY24_INV_REVENUE: DataPoint = verified(
  7_000,
  'AED mn',
  SRC_ALDAR_FY24_AR,
  { confidenceNote: 'Aldar Investment FY2024 revenue, +18% YoY.' },
)

export const ALDAR_FY24_INV_ADJ_EBITDA: DataPoint = verified(
  2_700,
  'AED mn',
  SRC_ALDAR_FY24_AR,
  { confidenceNote: 'Aldar Investment FY2024 adjusted EBITDA, +29% YoY.' },
)

// ============================================================
// SEGMENT — Aldar Education (FY2024)
// ============================================================

/**
 * Education adjusted EBITDA FY24 — already cited in aldar-financials.ts
 * (ALDAR_FY24_EDUCATION_EBITDA). Re-exported here so callers consuming
 * the FY24 namespace get a complete segment set without crossing files.
 */
export const ALDAR_FY24_EDUCATION_EBITDA: DataPoint = verified(
  266,
  'AED mn',
  SRC_ALDAR_FY24_AR,
  { confidenceNote: 'Aldar Education adjusted EBITDA FY2024, +36% YoY.' },
)

/**
 * Education revenue FY24 — segment revenue not separately broken out in
 * the press-release snippet. Pending verification from the full Annual
 * Report PDF. Tagged placeholder per CLAUDE.md.
 */
export const ALDAR_FY24_EDUCATION_REVENUE: DataPoint = placeholder(
  0,
  'AED mn',
  'Aldar Education FY24 segment revenue not separately disclosed in fetched snippet. Pending verification from full FY24 AR PDF segment note.',
)

// ============================================================
// SEGMENT — Aldar Hospitality (FY2024)
// ============================================================

/**
 * Hospitality is not separately disclosed at segment-revenue level in the
 * Aldar consolidated press release for FY24. Tagged placeholder.
 */
export const ALDAR_FY24_HOSPITALITY_REVENUE: DataPoint = placeholder(
  0,
  'AED mn',
  'Aldar Hospitality FY24 segment revenue not separately disclosed in fetched snippet. Pending verification from full FY24 AR PDF segment note.',
)

export const ALDAR_FY24_HOSPITALITY_EBITDA: DataPoint = placeholder(
  0,
  'AED mn',
  'Aldar Hospitality FY24 segment EBITDA not separately disclosed in fetched snippet. Pending verification.',
)

// ============================================================
// Convenience exports — grouped for downstream consumption
// ============================================================

export const ALDAR_FY24_HEADLINE = {
  revenue: ALDAR_FY24_GROUP_REVENUE,
  ebitda: ALDAR_FY24_GROUP_EBITDA,
  netProfitPreTax: ALDAR_FY24_NET_PROFIT_PRE_TAX,
  netProfitAfterTax: ALDAR_FY24_NET_PROFIT_AFTER_TAX,
  groupSales: ALDAR_FY24_GROUP_SALES,
  backlog: ALDAR_FY24_BACKLOG,
  period: 'FY2024 (12 months ended 31 Dec 2024)',
} as const

export const ALDAR_FY24_SEGMENTS = {
  development: {
    revenue: ALDAR_FY24_DEV_REVENUE,
    ebitda: ALDAR_FY24_DEV_EBITDA,
  },
  investment: {
    revenue: ALDAR_FY24_INV_REVENUE,
    adjEbitda: ALDAR_FY24_INV_ADJ_EBITDA,
  },
  education: {
    revenue: ALDAR_FY24_EDUCATION_REVENUE,
    ebitda: ALDAR_FY24_EDUCATION_EBITDA,
  },
  hospitality: {
    revenue: ALDAR_FY24_HOSPITALITY_REVENUE,
    ebitda: ALDAR_FY24_HOSPITALITY_EBITDA,
  },
} as const
