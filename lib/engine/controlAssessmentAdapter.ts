/**
 * Control Assessment Adapter
 * --------------------------
 * Detects, parses and translates a Control-Effectiveness / Risk-Assessment
 * spreadsheet into derived RiskDef objects that plug into the existing
 * simulation engine.
 *
 *   Control Area  → Derived Risk (source: 'control_assessment')
 *   Low score     → High derived risk
 *
 * Pure functions. No React, no I/O.
 * Non-destructive — does NOT modify seed RISKS.
 */

import type { RiskDef, DriverId, DriverImpact, Sensitivity } from './types'
import type { ExternalSignal } from './registerCritic'

// ─────────────────────────────────────────────────────────────────────────────
// 1. DETECTION
// ─────────────────────────────────────────────────────────────────────────────
// A file is treated as a control-assessment when:
//   - It has tabular rows with mostly integer cells in 1..5 range.
//   - The word "control" (or known area keywords) appears.
//   - It lacks cause/event/impact column headers.

const CONTROL_KEYWORDS = [
  'control',
  'procurement',
  'cybersecurity',
  'it security',
  'financial reporting',
  'hr',
  'payroll',
  'treasury',
  'compliance',
  'operations',
  'vendor',
  'data',
  'access',
  'segregation',
  'icofr',
  'sox',
]

const REGISTER_KEYWORDS = ['cause', 'event', 'impact', 'likelihood', 'residual']

export function detectControlAssessment(text: string): {
  isControlSheet: boolean
  confidence: number
  reason: string
} {
  if (!text || text.length < 40) {
    return { isControlSheet: false, confidence: 0, reason: 'text too short' }
  }
  const lower = text.toLowerCase()

  const controlHits = CONTROL_KEYWORDS.reduce(
    (n, k) => (lower.includes(k) ? n + 1 : n),
    0,
  )
  const registerHits = REGISTER_KEYWORDS.reduce(
    (n, k) => (lower.includes(k) ? n + 1 : n),
    0,
  )

  // Count lines that look like "label | 3 | 4 | 2 | 5" or tsv/csv with 1-5 scores
  const lines = text.split(/\r?\n/).slice(0, 200)
  let numericRows = 0
  for (const line of lines) {
    const cells = line.split(/[,\t|;]+/).map((s) => s.trim())
    if (cells.length < 3) continue
    const numeric = cells.filter((c) => /^[1-5]$/.test(c)).length
    if (numeric >= 2) numericRows++
  }

  let score = 0
  if (controlHits >= 2) score += 0.4
  if (numericRows >= 2) score += 0.4
  if (registerHits < 2) score += 0.2 // absence of register structure is a positive signal

  const isControlSheet = score >= 0.6 && numericRows >= 2 && controlHits >= 1
  const reason = `controlKW:${controlHits} · numRows:${numericRows} · regKW:${registerHits} · score:${score.toFixed(
    2,
  )}`
  return { isControlSheet, confidence: score, reason }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PARSE
// ─────────────────────────────────────────────────────────────────────────────
export interface ControlArea {
  name: string
  scores: number[]
  total_score: number
  max_score: number
  effectivenessPct: number // total/max × 100
}

export function parseControlAreas(text: string): ControlArea[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const areas: ControlArea[] = []

  for (const line of lines) {
    const cells = line.split(/[,\t|;]+/).map((s) => s.trim()).filter(Boolean)
    if (cells.length < 3) continue

    // First non-numeric cell = area name
    const nameCell = cells.find((c) => !/^[0-9]+(\.[0-9]+)?$/.test(c))
    if (!nameCell) continue
    const name = nameCell
    if (/control area|area|criteria|category/i.test(name) && cells.length < 5) continue // header row

    // Collect 1–5 scores
    const scores = cells
      .map((c) => {
        const n = parseFloat(c)
        return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null
      })
      .filter((n): n is number => n !== null)

    if (scores.length < 2) continue

    // If row contains an explicit total/max (e.g. "12/25" or "total: 18 max: 25"),
    // prefer those values.
    let total = scores.reduce((s, n) => s + n, 0)
    let max = scores.length * 5
    const fracMatch = line.match(/(\d+)\s*\/\s*(\d+)/)
    if (fracMatch) {
      total = parseInt(fracMatch[1], 10)
      max = parseInt(fracMatch[2], 10)
    }

    areas.push({
      name,
      scores,
      total_score: total,
      max_score: max,
      effectivenessPct: max > 0 ? (total / max) * 100 : 0,
    })
  }

  return areas
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CATEGORY INFERENCE & DRIVER MAPPING
// ─────────────────────────────────────────────────────────────────────────────
type DerivedCategory = RiskDef['category']

const AREA_CATEGORY_RULES: Array<{
  test: RegExp
  category: DerivedCategory
  drivers: Array<{ id: DriverId; weight: number; sensitivity: Sensitivity }>
}> = [
  {
    test: /procurement|vendor|supply|logistic/i,
    category: 'Operational',
    drivers: [
      { id: 'DRV-01', weight: 0.6, sensitivity: 'medium' },
      { id: 'DRV-08', weight: 0.8, sensitivity: 'high' },
    ],
  },
  {
    test: /cyber|it sec|information sec|data|access|iam|privileged/i,
    category: 'Operational',
    drivers: [
      { id: 'DRV-07', weight: 0.4, sensitivity: 'medium' },
      { id: 'DRV-04', weight: 0.3, sensitivity: 'low' },
    ],
  },
  {
    test: /finan|treasur|cash|liquid|payroll|reporting|icofr|sox/i,
    category: 'Financial',
    drivers: [
      { id: 'DRV-07', weight: 0.9, sensitivity: 'high' },
      { id: 'DRV-02', weight: 0.3, sensitivity: 'medium' },
    ],
  },
  {
    test: /project|construction|engineer|contractor|site/i,
    category: 'Project/Construction',
    drivers: [
      { id: 'DRV-01', weight: 0.7, sensitivity: 'high' },
      { id: 'DRV-05', weight: 0.8, sensitivity: 'high' },
      { id: 'DRV-06', weight: 0.6, sensitivity: 'medium' },
    ],
  },
  {
    test: /sales|lease|occup|tenant|marketing|crm/i,
    category: 'Market/Sales',
    drivers: [
      { id: 'DRV-02', weight: 0.8, sensitivity: 'high' },
      { id: 'DRV-03', weight: 0.5, sensitivity: 'medium' },
      { id: 'DRV-04', weight: 0.6, sensitivity: 'medium' },
    ],
  },
  {
    test: /compliance|regulat|rera|esg|adx|legal/i,
    category: 'External/Geopolitical',
    drivers: [
      { id: 'DRV-05', weight: 0.5, sensitivity: 'medium' },
      { id: 'DRV-07', weight: 0.3, sensitivity: 'low' },
    ],
  },
  {
    test: /strateg|governance|board|policy/i,
    category: 'Strategic',
    drivers: [
      { id: 'DRV-02', weight: 0.4, sensitivity: 'medium' },
      { id: 'DRV-07', weight: 0.3, sensitivity: 'medium' },
    ],
  },
]

const DEFAULT_MAPPING = {
  category: 'Operational' as DerivedCategory,
  drivers: [
    { id: 'DRV-07' as DriverId, weight: 0.4, sensitivity: 'medium' as Sensitivity },
    { id: 'DRV-04' as DriverId, weight: 0.3, sensitivity: 'low' as Sensitivity },
  ],
}

function mapAreaToCategory(areaName: string) {
  for (const rule of AREA_CATEGORY_RULES) {
    if (rule.test.test(areaName)) {
      return { category: rule.category, drivers: rule.drivers }
    }
  }
  return DEFAULT_MAPPING
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DERIVED-RISK CONSTRUCTION
// ─────────────────────────────────────────────────────────────────────────────
//   risk_score = (1 - total/max) × weight, weight = 1 (normalised later)
//   baseLikelihood, baseImpact are mapped from effectiveness:
//     effectiveness 100% → L=1, I=1
//     effectiveness   0% → L=5, I=5
//
// financialBaseAedMn is a conservative default (AED 200M) scaled by area
// keyword. We never exceed 1 000M for any derived risk to avoid overwhelming
// the portfolio total.

function scoreToLikelihoodImpact(effectivenessPct: number): [number, number] {
  const gap = 1 - effectivenessPct / 100 // 0 = perfect, 1 = absent
  const raw = 1 + gap * 4
  const clamp = (x: number) => Math.max(1, Math.min(5, Math.round(x)))
  return [clamp(raw), clamp(raw)]
}

function estimateFinancialBase(category: DerivedCategory): number {
  switch (category) {
    case 'Financial':
      return 800
    case 'Project/Construction':
      return 1000
    case 'Market/Sales':
      return 700
    case 'Operational':
      return 400
    case 'Strategic':
      return 500
    case 'External/Geopolitical':
      return 300
    default:
      return 400
  }
}

export interface DerivedRiskMeta {
  control_score: number // 0..1 (higher = better)
  derived_risk_score: number // 0..1 (higher = worse)
  reasoning: string
}

export function buildDerivedRisks(
  areas: ControlArea[],
  opts: { idPrefix?: string } = {},
): { risks: RiskDef[]; meta: Record<string, DerivedRiskMeta> } {
  const prefix = opts.idPrefix ?? 'CA'
  const risks: RiskDef[] = []
  const meta: Record<string, DerivedRiskMeta> = {}

  // Normalise weights across areas: equal weight, sums to 1.
  const n = Math.max(1, areas.length)
  const perWeight = 1 / n

  areas.forEach((area, idx) => {
    const { category, drivers } = mapAreaToCategory(area.name)
    const [L, I] = scoreToLikelihoodImpact(area.effectivenessPct)
    const controlScore = area.max_score > 0 ? area.total_score / area.max_score : 0
    const derivedRiskScore = (1 - controlScore) * 1 // weight=1 before normalisation
    const id = `${prefix}-${String(idx + 1).padStart(3, '0')}`

    // Give every derived risk one synthetic control reflecting the effectiveness score.
    // This keeps residual = inherent × (1 − effectiveness) consistent with seed risks.
    const driverImpacts: DriverImpact[] = drivers.map((d) => ({
      driverId: d.id,
      weight: d.weight,
      sensitivity: d.sensitivity,
    }))

    risks.push({
      id,
      name: `Weak control — ${area.name}`,
      category,
      cause: `Control assessment scored ${area.total_score}/${area.max_score} (${area.effectivenessPct.toFixed(
        0,
      )}%)`,
      event: `Control gap in "${area.name}" could allow the underlying risk to materialise`,
      impact: `Financial / regulatory exposure proportional to the ${category.toLowerCase()} footprint`,
      baseLikelihood: L,
      baseImpact: I,
      driverImpacts,
      controls: [
        {
          name: `${area.name} — existing control stack`,
          type: 'Preventive',
          effectiveness: controlScore, // direct pass-through
        },
      ],
      owner: 'Control Owner (TBD)',
      financialBaseAedMn: estimateFinancialBase(category),
      sensitivityCoefficient: 0.6,
      financialWeight: perWeight,
      source: 'control_assessment',
      linkedControlArea: area.name,
      controlScore,
    })

    meta[id] = {
      control_score: controlScore,
      derived_risk_score: derivedRiskScore,
      reasoning:
        controlScore >= 0.8
          ? `Control effectiveness ${(controlScore * 100).toFixed(0)}% is strong — residual risk is low.`
          : controlScore >= 0.6
          ? `Control effectiveness ${(controlScore * 100).toFixed(0)}% is adequate but leaves a material gap.`
          : controlScore >= 0.4
          ? `Control effectiveness ${(controlScore * 100).toFixed(0)}% is weak — a preventive layer must be added.`
          : `Control effectiveness ${(controlScore * 100).toFixed(0)}% is insufficient — this area is a high-risk zone.`,
    }
  })

  return { risks, meta }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. EXTERNAL-SIGNAL MODULATION
// ─────────────────────────────────────────────────────────────────────────────
// Adjust derived risks in-light of existing external signals (same classifier
// used elsewhere). E.g. a commodity-spike signal weakens procurement controls;
// a cyber-alert signal weakens IT-security controls.
export function applyExternalContext(
  derived: { risks: RiskDef[]; meta: Record<string, DerivedRiskMeta> },
  signals: ExternalSignal[],
): { risks: RiskDef[]; meta: Record<string, DerivedRiskMeta> } {
  if (signals.length === 0) return derived

  const procPenalty = signals.some((s) => s.category === 'commodity' || s.category === 'supply')
    ? 0.85
    : 1.0
  const cyberPenalty = signals.some((s) => /cyber|breach|ransom/i.test(s.headline))
    ? 0.8
    : 1.0
  const regPenalty = signals.some((s) => s.category === 'regulatory') ? 0.9 : 1.0
  const liqPenalty = signals.some((s) => s.category === 'liquidity') ? 0.9 : 1.0

  const risks = derived.risks.map((r) => {
    let penalty = 1.0
    if (/procurement|vendor|supply/i.test(r.linkedControlArea ?? '')) penalty *= procPenalty
    if (/cyber|it sec|data|access/i.test(r.linkedControlArea ?? '')) penalty *= cyberPenalty
    if (/complian|regulat/i.test(r.linkedControlArea ?? '')) penalty *= regPenalty
    if (/finan|treasur|cash/i.test(r.linkedControlArea ?? '')) penalty *= liqPenalty
    if (penalty === 1.0) return r
    return {
      ...r,
      controls: r.controls.map((c) => ({
        ...c,
        effectiveness: Math.max(0, c.effectiveness * penalty),
      })),
      controlScore: r.controlScore != null ? Math.max(0, r.controlScore * penalty) : r.controlScore,
    }
  })

  const meta = { ...derived.meta }
  risks.forEach((r) => {
    if (meta[r.id] && r.controlScore != null) {
      meta[r.id] = {
        ...meta[r.id],
        control_score: r.controlScore,
        reasoning:
          meta[r.id].reasoning +
          ' External signals further weaken this control (procurement/cyber/regulatory/liquidity context applied).',
      }
    }
  })

  return { risks, meta }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ONE-SHOT PIPELINE
// ─────────────────────────────────────────────────────────────────────────────
export function runControlAssessmentPipeline(
  text: string,
  signals: ExternalSignal[] = [],
): {
  detected: boolean
  detection: ReturnType<typeof detectControlAssessment>
  areas: ControlArea[]
  derived: { risks: RiskDef[]; meta: Record<string, DerivedRiskMeta> }
} {
  const detection = detectControlAssessment(text)
  if (!detection.isControlSheet) {
    return {
      detected: false,
      detection,
      areas: [],
      derived: { risks: [], meta: {} },
    }
  }
  const areas = parseControlAreas(text)
  const derived = applyExternalContext(buildDerivedRisks(areas), signals)
  return { detected: true, detection, areas, derived }
}
