/**
 * Provenance Types — the spine of "no number without a paper trail".
 * ------------------------------------------------------------------
 * Every numeric value in the platform should be wrapped in a `DataPoint`
 * that links back to a `Source`. UI components render the value AND a
 * provenance tooltip that exposes the source + retrieval details.
 *
 * Reliability tiers (audit-defensible):
 *   - verified         → from a citable, real source (annual report, ADX, central bank, ISO/COSO standard)
 *   - illustrative     → sample data shown for demo purposes; will be replaced post-integration
 *   - placeholder      → known-incomplete value awaiting calibration; visibly flagged
 *   - ai_hypothesis    → AI-generated; pending human approval
 *
 * Standing rule: a NumericValue that is none of the above does NOT ship.
 */

export type ReliabilityTier =
  | 'verified'
  | 'illustrative'
  | 'placeholder'
  | 'ai_hypothesis'

export type SourceKind =
  | 'annual_report'        // Aldar / subsidiary published annual report
  | 'adx_disclosure'       // Abu Dhabi Securities Exchange filing
  | 'central_bank'         // CBUAE rate / macro indicator
  | 'regulator'            // SCA, ADREC, RERA, etc.
  | 'standard'             // ISO 31000, COSO ERM, Basel
  | 'client_policy'        // Aldar internal policy doc (post-contract)
  | 'manual_entry'         // User-entered (Risk Champion / ERM Lead)
  | 'sample'               // Demo / illustrative — explicitly fabricated for UX
  | 'ai_generated'         // Claude / model output

export interface Source {
  /** Stable id, e.g. "src.aldar.fy24.ar" */
  id: string
  kind: SourceKind
  /** Human label shown in the provenance card. */
  title: string
  /** URL or path to the citation (e.g. annual report PDF). Optional for sample/manual. */
  url?: string
  /** Page reference within the source, e.g. "p. 142". */
  pageRef?: string
  /** When the value was retrieved / captured. ISO date. */
  fetchedAt?: string
  /** Who fetched it (analyst initials or "system"). */
  fetchedBy?: string
  /** One-line note (optional). */
  note?: string
}

export interface DataPoint<T extends number = number> {
  value: T
  /** SI / display unit, e.g. "AED mn", "%", "days", "score (0-25)". */
  unit: string
  /** Source reference. For tier='sample' this should be SAMPLE_SOURCE. */
  source: Source
  reliability: ReliabilityTier
  /** Human formula description if computed, e.g. "Inherent × (1 − ΣControlEffectiveness)". */
  formula?: string
  /** Upstream DataPoints used in the formula (for click-through chains). */
  upstream?: DataPoint[]
  /** Optional confidence note shown in the tooltip. */
  confidenceNote?: string
}

/**
 * Helper — wrap a verified value with full provenance.
 */
export function verified<T extends number>(
  value: T,
  unit: string,
  source: Source,
  opts?: { formula?: string; upstream?: DataPoint[]; confidenceNote?: string },
): DataPoint<T> {
  return { value, unit, source, reliability: 'verified', ...opts }
}

/**
 * Helper — wrap an illustrative / sample value. Surfaces clearly in the UI.
 */
export function illustrative<T extends number>(
  value: T,
  unit: string,
  note?: string,
): DataPoint<T> {
  return {
    value,
    unit,
    source: SAMPLE_SOURCE,
    reliability: 'illustrative',
    confidenceNote:
      note || 'Sample value for demo purposes. Will be replaced with sourced data post-integration.',
  }
}

/**
 * Helper — placeholder value awaiting calibration. Use sparingly.
 */
export function placeholder<T extends number>(
  value: T,
  unit: string,
  note: string,
): DataPoint<T> {
  return {
    value,
    unit,
    source: PLACEHOLDER_SOURCE,
    reliability: 'placeholder',
    confidenceNote: note,
  }
}

/**
 * Helper — AI-generated value pending human approval.
 */
export function aiHypothesis<T extends number>(
  value: T,
  unit: string,
  modelNote: string,
): DataPoint<T> {
  return {
    value,
    unit,
    source: AI_SOURCE,
    reliability: 'ai_hypothesis',
    confidenceNote: modelNote,
  }
}

// ---- Standing meta-sources (used by the helpers above) ----

export const SAMPLE_SOURCE: Source = {
  id: 'src.sample',
  kind: 'sample',
  title: 'Illustrative sample data (demo only)',
  note: 'Pre-contract POC — value will be replaced by client-provided data during pilot.',
}

export const PLACEHOLDER_SOURCE: Source = {
  id: 'src.placeholder',
  kind: 'sample',
  title: 'Placeholder — calibration pending',
  note: 'Value present so the workflow renders; final calibration to be agreed with client ERM team.',
}

export const AI_SOURCE: Source = {
  id: 'src.ai',
  kind: 'ai_generated',
  title: 'AI hypothesis (Claude)',
  note: 'Generated suggestion. Requires human review before being treated as fact.',
}
