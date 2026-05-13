/**
 * Baseline Risk Posture — Batch 1 Credibility Fix
 * ------------------------------------------------
 * Single source of truth for executive dashboard headline metrics.
 *
 * Problem this solves: pre-pilot demo surfaces (/dashboard, /executive-brief,
 * /control-command-center, CRODashboard) were rendering "0" defaults for
 * Overall Risk Score, Critical/High count, Financial Exposure, AI Alerts,
 * etc. — destroying executive credibility. An ERM platform must NEVER show
 * 0 risks / 0 exposure / 0 alerts unless that is a verified true state.
 *
 * CLAUDE.md compliance: every figure here is tagged "illustrative" and
 * surfaces under the trust footer "Illustrative POC data — pending client
 * validation." Pilot wires these to the live engine (RISKS aggregate +
 * KRI feed + audit event stream).
 */

export type DataConfidence = 'verified' | 'illustrative' | 'placeholder' | 'pending'
export type SourceType = 'live-feed' | 'engine-derived' | 'illustrative-baseline' | 'manual'
export type DataStatus = 'ready' | 'loading' | 'pending-validation' | 'stale'

export interface BaselineRiskPosture {
  // Headline
  overallRiskScore: number          // 0-100, weighted residual
  riskScoreTrend: number            // delta vs prior period, +/-
  // Distribution
  criticalRiskCount: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
  totalCriticalAndHighRisks: number
  totalRisks: number
  // Financial
  totalFinancialExposure: number    // raw AED
  exposureCurrency: 'AED' | 'SAR' | 'USD'
  hedgedExposure: number
  netUnhedgedExposure: number
  // Signals + alerts
  aiAlertsToday: number
  activeExternalSignals: number
  activeControlWeaknesses: number
  overdueActions: number
  riskAppetiteBreaches: number
  // KRIs
  krisGreen: number
  krisAmber: number
  krisRed: number
  // Meta
  lastUpdated: string               // ISO
  dataConfidence: DataConfidence
  sourceType: SourceType
  dataStatus: DataStatus
  validationNote: string
}

/**
 * Illustrative baseline — defensible numbers a CRO / CFO / Audit Committee
 * member would expect to see on a UAE real-estate group dashboard.
 * Tuned to be internally consistent (counts sum, exposure ~2-3% of GAV).
 */
export const BASELINE_RISK_POSTURE: BaselineRiskPosture = {
  // Headline
  overallRiskScore: 72,
  riskScoreTrend: -3,            // improving by 3 pts

  // Distribution — 18 active risks
  criticalRiskCount: 2,
  highRiskCount: 7,
  mediumRiskCount: 6,
  lowRiskCount: 3,
  totalCriticalAndHighRisks: 9,
  totalRisks: 18,

  // Financial — AED 2.35Bn gross, AED 1.45Bn hedged, AED 900M net
  totalFinancialExposure: 2_350_000_000,
  exposureCurrency: 'AED',
  hedgedExposure: 1_450_000_000,
  netUnhedgedExposure: 900_000_000,

  // Signals + alerts
  aiAlertsToday: 6,
  activeExternalSignals: 4,
  activeControlWeaknesses: 5,
  overdueActions: 3,
  riskAppetiteBreaches: 2,

  // KRIs — 15 active
  krisGreen: 9,
  krisAmber: 4,
  krisRed: 2,

  // Meta
  lastUpdated: '2026-05-13T07:00:00Z',
  dataConfidence: 'illustrative',
  sourceType: 'illustrative-baseline',
  dataStatus: 'pending-validation',
  validationNote: 'Illustrative POC data — pending client validation',
}

/**
 * Returns the baseline. Hook-friendly wrapper so future versions can swap
 * in async/engine-derived data without changing call sites.
 */
export function getBaselineRiskPosture(): BaselineRiskPosture {
  return BASELINE_RISK_POSTURE
}

/**
 * Safe-default helper. If a caller's local value is 0/undefined/null but
 * the baseline has a credible figure, return the baseline instead. This
 * prevents dashboards from rendering "0" when the engine hasn't hydrated
 * yet.
 *
 *   const score = safeMetric(localScore, baseline.overallRiskScore)
 *
 * Pass `allowZero=true` only when 0 is a genuinely verified state.
 */
export function safeMetric<T extends number>(
  local: T | null | undefined,
  fallback: T,
  allowZero = false,
): T {
  if (local === null || local === undefined) return fallback
  if (!allowZero && local === 0) return fallback
  return local
}
