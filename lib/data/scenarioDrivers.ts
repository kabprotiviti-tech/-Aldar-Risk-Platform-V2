/**
 * Scenario drivers — factor-based stress testing.
 * ------------------------------------------------
 * Leadership composes a scenario from real Aldar business drivers, sets each
 * driver's move, and the engine computes the impact WITH the calculation shown
 * line-by-line (driver → input → sensitivity → AED contribution → total).
 *
 * A named scenario is just a preset bundle of driver values.
 *
 * ── Provenance (CLAUDE.md) ─────────────────────────────────────────────
 * `aedPerUnit` is an ILLUSTRATIVE sensitivity (AED-million Group exposure
 * impact per one unit of the driver). These are directional, pending
 * calibration against Aldar's actual books in pilot — surfaced as such in
 * the UI. No fabricated "verified" figures.
 */
import type { Portfolio } from '@/lib/simulated-data'

export type DriverUnit = 'bps' | '%'

export interface ScenarioDriver {
  key: string
  label: string
  unit: DriverUnit
  min: number
  max: number
  step: number
  /** Illustrative AED-million Group impact per 1 unit of the driver. */
  aedPerUnit: number
  /** How the impact splits across portfolios (weights sum ≈ 1). */
  portfolios: Partial<Record<Portfolio, number>>
  /** Shown by default (the CEO's headline levers). */
  headline: boolean
  /** One-line plain-English basis for the sensitivity (shown on ⓘ). */
  basis: string
}

export const SCENARIO_DRIVERS: ScenarioDriver[] = [
  {
    key: 'rate', label: 'Interest-rate shock', unit: 'bps', min: 0, max: 300, step: 25,
    aedPerUnit: 1.4, headline: true,
    portfolios: { 'real-estate': 0.5, retail: 0.2, hospitality: 0.15, facilities: 0.1, education: 0.05 },
    basis: 'Sensitivity of financing cost + cap-rate-driven valuation to policy-rate moves.',
  },
  {
    key: 'demand', label: 'Off-plan sales demand drop', unit: '%', min: 0, max: 40, step: 5,
    aedPerUnit: 11, headline: true,
    portfolios: { 'real-estate': 0.8, retail: 0.1, facilities: 0.1 },
    basis: 'Development revenue / cash-collection exposure to a fall in off-plan sales velocity.',
  },
  {
    key: 'cost', label: 'Construction cost inflation', unit: '%', min: 0, max: 25, step: 5,
    aedPerUnit: 14, headline: true,
    portfolios: { 'real-estate': 0.7, hospitality: 0.2, facilities: 0.1 },
    basis: 'Margin erosion on the active development pipeline from materials / labour inflation.',
  },
  {
    key: 'occupancy', label: 'Occupancy & rental decline', unit: '%', min: 0, max: 30, step: 5,
    aedPerUnit: 9, headline: true,
    portfolios: { retail: 0.4, hospitality: 0.3, 'real-estate': 0.2, facilities: 0.1 },
    basis: 'Recurring NOI exposure across investment properties to lower occupancy / rents.',
  },
  {
    key: 'fx', label: 'Overseas-buyer / FX shock', unit: '%', min: 0, max: 30, step: 5,
    aedPerUnit: 6, headline: false,
    portfolios: { 'real-estate': 0.9, retail: 0.1 },
    basis: 'Overseas-buyer book exposure to currency-driven demand softening.',
  },
  {
    key: 'govspend', label: 'Government & infra spend cut', unit: '%', min: 0, max: 25, step: 5,
    aedPerUnit: 7, headline: false,
    portfolios: { 'real-estate': 0.5, facilities: 0.3, education: 0.2 },
    basis: 'Demand exposure to slower public infrastructure / population-growth programmes.',
  },
  {
    key: 'supply', label: 'Supply-chain lead-time stretch', unit: '%', min: 0, max: 40, step: 5,
    aedPerUnit: 4, headline: false,
    portfolios: { 'real-estate': 0.5, facilities: 0.3, hospitality: 0.2 },
    basis: 'Schedule / carrying-cost exposure to extended materials lead times.',
  },
  {
    key: 'refi', label: 'Refinancing / liquidity spread', unit: 'bps', min: 0, max: 250, step: 25,
    aedPerUnit: 1.1, headline: false,
    portfolios: { 'real-estate': 0.6, hospitality: 0.2, retail: 0.2 },
    basis: 'Cost of refinancing maturing facilities at wider credit spreads.',
  },
  {
    key: 'esg', label: 'ESG / regulatory cost', unit: '%', min: 0, max: 20, step: 5,
    aedPerUnit: 5, headline: false,
    portfolios: { 'real-estate': 0.4, facilities: 0.3, education: 0.3 },
    basis: 'Compliance / retrofit cost exposure to tighter ESG disclosure & building rules.',
  },
  {
    key: 'tourism', label: 'Tourism & hospitality demand drop', unit: '%', min: 0, max: 40, step: 5,
    aedPerUnit: 8, headline: false,
    portfolios: { hospitality: 0.7, retail: 0.3 },
    basis: 'Hospitality RevPAR / retail footfall exposure to a tourism downturn.',
  },
]

export interface ScenarioPreset {
  id: string
  name: string
  values: Record<string, number>
}

/** Named scenarios = preset driver bundles (one-click starting points). */
export const SCENARIO_PRESETS: ScenarioPreset[] = [
  { id: 'rate-surge', name: 'Rate Surge (+200bps)', values: { rate: 200, refi: 150, demand: 10 } },
  { id: 'offplan', name: 'Off-plan Slowdown', values: { demand: 30, fx: 15, occupancy: 5 } },
  { id: 'cost-shock', name: 'Construction Cost Shock', values: { cost: 20, supply: 25 } },
  { id: 'tourism', name: 'Tourism Downturn', values: { tourism: 30, occupancy: 15 } },
  { id: 'severe', name: 'Severe Combined Shock', values: { rate: 200, demand: 25, cost: 18, occupancy: 15, fx: 15, refi: 100 } },
]
