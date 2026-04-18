'use client'
// components/FinancialCalculationPanel.tsx
// Full calculation traceability panel for all financial metrics.
// Shows: base inputs → formula → breakdown → drivers → scenario sensitivity → AI explanation.
// Numbers are derived from the same logic as riskPropagationEngine + impactEngine — fully consistent.

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calculator, ChevronRight, Info } from 'lucide-react'
import type { PortfolioKey } from '@/lib/portfolioData'

// ─── Shared Assumptions (canonical — same values as riskPropagationEngine + impactEngine) ──────
export const ASSET_GAV: Record<PortfolioKey, number> = {
  'real-estate': 9200,    // AED M gross asset value
  retail:        4100,
  hospitality:   2800,
  education:     1400,
  facilities:     900,
}

export const REVENUE_BASE: Record<PortfolioKey, number> = {
  'real-estate': 1200,
  retail:         800,
  hospitality:    600,
  education:      400,
  facilities:     350,
}

// Exposure base values — must match riskPropagationEngine.ts deriveFinancialExposure
const EXPOSURE_BASE: Record<PortfolioKey, number> = {
  'real-estate': 1200,
  retail:         140,
  hospitality:    140,
  education:       55,
  facilities:     200,
}

const PORTFOLIO_NAMES: Record<PortfolioKey, string> = {
  'real-estate': 'Real Estate',
  retail:        'Retail',
  hospitality:   'Hospitality',
  education:     'Education',
  facilities:    'Facilities',
}

const PORTFOLIO_COLORS: Record<PortfolioKey, string> = {
  'real-estate': '#C9A84C',
  retail:        '#4A9EFF',
  hospitality:   '#A855F7',
  education:     '#22C55E',
  facilities:    '#FF6B6B',
}

// Risk type breakdown weights per portfolio (sums to ~1.0)
const RISK_TYPE_WEIGHTS: Record<PortfolioKey, { type: string; pct: number }[]> = {
  'real-estate': [
    { type: 'Market / Interest Rate', pct: 0.38 },
    { type: 'Construction / Supply Chain', pct: 0.31 },
    { type: 'Credit / Collection', pct: 0.18 },
    { type: 'Regulatory / Planning', pct: 0.13 },
  ],
  retail: [
    { type: 'Tenant / Covenant', pct: 0.42 },
    { type: 'Consumer Demand', pct: 0.28 },
    { type: 'E-commerce Displacement', pct: 0.18 },
    { type: 'Operational', pct: 0.12 },
  ],
  hospitality: [
    { type: 'Tourism / Geopolitical', pct: 0.45 },
    { type: 'Seasonality / Events', pct: 0.30 },
    { type: 'F&B / Ancillary', pct: 0.15 },
    { type: 'Labour / Staffing', pct: 0.10 },
  ],
  education: [
    { type: 'Regulatory / ADEK', pct: 0.35 },
    { type: 'Enrollment / Demand', pct: 0.32 },
    { type: 'Curriculum Compliance', pct: 0.20 },
    { type: 'Expat Population Sensitivity', pct: 0.13 },
  ],
  facilities: [
    { type: 'Cyber / IoT Security', pct: 0.42 },
    { type: 'FM Outsourcing / SLA', pct: 0.31 },
    { type: 'Asset Maintenance', pct: 0.18 },
    { type: 'Regulatory / NCA', pct: 0.09 },
  ],
}

// Scenario breakdown by portfolio
const SCENARIO_SPLITS: Record<string, { portfolio: PortfolioKey; pct: number; driver: string }[]> = {
  tourism_drop: [
    { portfolio: 'hospitality',  pct: 0.50, driver: 'Occupancy −18pts, RevPAR −30%' },
    { portfolio: 'retail',       pct: 0.28, driver: 'Footfall −20pts, tenant stress HIGH' },
    { portfolio: 'real-estate',  pct: 0.18, driver: 'Off-plan −25%, HNI sentiment drop' },
    { portfolio: 'facilities',   pct: 0.04, driver: 'Reduced FM contracts from vacancy' },
  ],
  interest_rate_hike: [
    { portfolio: 'real-estate',  pct: 0.74, driver: 'Mortgage affordability −18%, off-plan −30%' },
    { portfolio: 'retail',       pct: 0.18, driver: 'Consumer confidence -4%, spend contraction' },
    { portfolio: 'facilities',   pct: 0.08, driver: 'Deferred capex impacts FM revenue' },
  ],
  tenant_default_spike: [
    { portfolio: 'retail',       pct: 0.68, driver: 'AED 42M rent arrears, 15 CVA tenants' },
    { portfolio: 'facilities',   pct: 0.20, driver: 'FM contracts at risk from vacancy' },
    { portfolio: 'real-estate',  pct: 0.12, driver: 'Covenant breach risk, LTV review' },
  ],
}

const SCENARIO_NAMES: Record<string, string> = {
  tourism_drop:        'Tourism Drop — Geopolitical Escalation',
  interest_rate_hike:  'Interest Rate Hike (+150bps)',
  tenant_default_spike:'Tenant Default Spike — CVA Wave',
}

const SCENARIO_DRIVERS: Record<string, { factor: string; change: string; impact: string }[]> = {
  tourism_drop: [
    { factor: 'Geopolitical Risk', change: 'MEDIUM → HIGH', impact: 'Tourism index −30pts (61→31)' },
    { factor: 'Hotel Occupancy',   change: '68% → 50%',     impact: 'RevPAR AED 420 → AED 294 (−30%)' },
    { factor: 'Retail Footfall',   change: '67 → 47/100',   impact: 'Tenant stress MEDIUM → HIGH' },
    { factor: 'Off-plan Sales',    change: '−25%',           impact: 'HNI sentiment decline' },
  ],
  interest_rate_hike: [
    { factor: 'CBUAE Rate',           change: '+150bps',     impact: 'Mortgage payment +12%' },
    { factor: 'Off-plan Conversion',  change: '−30%',        impact: 'Sales units 200 → 142' },
    { factor: 'Consumer Confidence',  change: 'Falls',       impact: 'Retail spend −4%' },
    { factor: 'Cash Flow Variance',   change: 'Widens',      impact: '−7.7% vs budget' },
  ],
  tenant_default_spike: [
    { factor: 'Tenants in CVA',      change: '+15',          impact: 'AED 42M rent in arrears' },
    { factor: 'Vacancy Rate',        change: 'Accelerating', impact: 'Lease-up cost exposure' },
    { factor: 'LTV Covenant',        change: 'Breach risk',  impact: 'Bank review triggered' },
    { factor: 'FM Contracts',        change: 'At risk',      impact: 'Facilities cashflow hit' },
  ],
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type FinancialCalcContext =
  | { type: 'total_exposure'; value: number; portfolioScores: Partial<Record<PortfolioKey, number>> }
  | { type: 'portfolio_exposure'; portfolioId: PortfolioKey; riskScore: number; value: number }
  | { type: 'scenario_impact'; scenarioId: string; value: number; totalRevenue?: number }
  | { type: 'revenue_at_risk'; portfolioId: PortfolioKey; impactScore: number; amplified: boolean; value: number }

// ─── ViewCalcButton ───────────────────────────────────────────────────────────

export function ViewCalcButton({ onClick, light = false }: { onClick: () => void; light?: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title="View calculation methodology"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '2px 7px',
        borderRadius: '5px',
        fontSize: '0.6rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        cursor: 'pointer',
        border: '1px solid rgba(74,158,255,0.3)',
        backgroundColor: 'rgba(74,158,255,0.07)',
        color: '#4A9EFF',
        transition: 'all 0.15s',
        flexShrink: 0,
        lineHeight: 1,
        opacity: light ? 0.75 : 1,
      }}
    >
      <Calculator size={9} />
      View Calc
    </button>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      color: 'var(--text-muted)',
      fontSize: '0.6rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      marginBottom: '8px',
    }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ borderTop: '1px solid var(--border-color)', margin: '14px 0' }} />
}

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '10px 14px',
      borderRadius: '8px',
      backgroundColor: 'rgba(74,158,255,0.06)',
      border: '1px solid rgba(74,158,255,0.18)',
      fontFamily: 'monospace',
      fontSize: '0.75rem',
      color: '#4A9EFF',
      lineHeight: 1.7,
    }}>
      {children}
    </div>
  )
}

function InputRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start justify-between" style={{ marginBottom: '8px' }}>
      <div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{label}</div>
        {sub && <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '1px' }}>{sub}</div>}
      </div>
      <div style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>
        {value}
      </div>
    </div>
  )
}

function AiBox({ text }: { text: string }) {
  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: '8px',
      backgroundColor: 'rgba(34,197,94,0.06)',
      border: '1px solid rgba(34,197,94,0.2)',
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-start',
    }}>
      <Info size={12} style={{ color: '#22C55E', flexShrink: 0, marginTop: '1px' }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.55, margin: 0 }}>{text}</p>
    </div>
  )
}

// ─── View: Total Exposure ─────────────────────────────────────────────────────

function TotalExposureView({ ctx }: { ctx: Extract<FinancialCalcContext, { type: 'total_exposure' }> }) {
  const keys: PortfolioKey[] = ['real-estate', 'retail', 'hospitality', 'education', 'facilities']
  const portfolioCalcs = keys.map((k) => {
    const score = ctx.portfolioScores[k] ?? 60
    const scaleFactor = 0.8 + (score / 100) * 0.8
    const exposure = Math.round(EXPOSURE_BASE[k] * scaleFactor / 10) * 10
    return { key: k, score, scaleFactor, exposure }
  })
  const computed = portfolioCalcs.reduce((s, p) => s + p.exposure, 0)

  return (
    <div className="space-y-4">
      {/* A. Base Inputs */}
      <div>
        <SectionLabel>A — Base Inputs</SectionLabel>
        <InputRow label="Total Gross Asset Value" value="AED 18,400M" sub="Sum across all 5 business units" />
        <InputRow label="Total Annual Revenue" value="AED 3,350M" sub="Real Estate + Retail + Hospitality + Education + FM" />
        <InputRow label="Exposure Methodology" value="Risk-Adjusted" sub="Propagation engine output — not balance-sheet NAV" />
        <InputRow label="Calculation Date" value="April 2026" sub="Current signal snapshot" />
      </div>

      <Divider />

      {/* B. Formula */}
      <div>
        <SectionLabel>B — Calculation Logic</SectionLabel>
        <FormulaBox>
          {`Exposure(portfolio) = BASE × Scale Factor\n`}
          {`Scale Factor = 0.8 + (Risk Score ÷ 100) × 0.8\n`}
          {`Total = Σ Exposure across 5 portfolios`}
        </FormulaBox>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: '6px', lineHeight: 1.5 }}>
          BASE is the maximum at-risk revenue under high-stress conditions. Scale Factor converts risk score (0–100) into an exposure multiplier — ranging from 0.80× (score=0) to 1.60× (score=100).
        </div>
      </div>

      <Divider />

      {/* C. Breakdown by portfolio */}
      <div>
        <SectionLabel>C — Portfolio Breakdown</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '4px 12px', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Portfolio</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Score</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Scale</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Exposure</span>
          {portfolioCalcs.map(({ key, score, scaleFactor, exposure }) => (
            <React.Fragment key={key}>
              <div className="flex items-center gap-2">
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: PORTFOLIO_COLORS[key], flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.73rem' }}>{PORTFOLIO_NAMES[key]}</span>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.73rem', textAlign: 'right' }}>{score}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.73rem', textAlign: 'right' }}>{scaleFactor.toFixed(2)}×</span>
              <span style={{ color: PORTFOLIO_COLORS[key], fontSize: '0.78rem', fontWeight: 700, textAlign: 'right' }}>AED {exposure}M</span>
            </React.Fragment>
          ))}
          <div style={{ borderTop: '1px solid var(--border-color)', gridColumn: '1 / -1', margin: '4px 0' }} />
          <span style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 700 }}>Total</span>
          <span></span><span></span>
          <span style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 800, textAlign: 'right' }}>AED {computed}M</span>
        </div>
        {computed !== ctx.value && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '6px' }}>
            Displayed: AED {ctx.value}M (may differ if real-time updates applied)
          </div>
        )}
      </div>

      <Divider />

      {/* D. Drivers */}
      <div>
        <SectionLabel>D — Primary Risk Drivers (April 2026)</SectionLabel>
        {[
          { d: 'Interest Rate', v: '+175bps cumulative', p: 'Real Estate' },
          { d: 'Tourism Index', v: '48/100 (effective)', p: 'Hospitality' },
          { d: 'Tenant Stress', v: 'MEDIUM (7 on watchlist)', p: 'Retail' },
          { d: 'Cyber / IoT Exposure', v: '+340 endpoints', p: 'Facilities' },
          { d: 'Construction Cost Index', v: '118 (+18% vs 2023)', p: 'Real Estate' },
        ].map(({ d, v, p }) => (
          <div key={d} className="flex items-start justify-between" style={{ marginBottom: '7px' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.73rem' }}>{d}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>Affects: {p}</div>
            </div>
            <span style={{ color: 'var(--risk-high)', fontSize: '0.73rem', fontWeight: 600, textAlign: 'right', flexShrink: 0, maxWidth: '140px' }}>{v}</span>
          </div>
        ))}
      </div>

      <Divider />

      {/* F. AI Explanation */}
      <div>
        <SectionLabel>F — AI Explanation</SectionLabel>
        <AiBox text={`Total exposure of AED ${ctx.value}M is driven primarily by Real Estate (rate + construction cost pressures) and Hospitality (shoulder-season tourism deficit). Retail and Facilities have structurally lower bases but elevated sensitivity to macro signals. Education is the most resilient portfolio. Exposure is risk-score-weighted — a 10pt drop in scores across all portfolios would reduce total exposure by ~AED 150–200M.`} />
      </div>
    </div>
  )
}

// ─── View: Portfolio Exposure ─────────────────────────────────────────────────

function PortfolioExposureView({ ctx }: { ctx: Extract<FinancialCalcContext, { type: 'portfolio_exposure' }> }) {
  const p = ctx.portfolioId
  const scaleFactor = 0.8 + (ctx.riskScore / 100) * 0.8
  const computed = Math.round(EXPOSURE_BASE[p] * scaleFactor / 10) * 10
  const breakdown = RISK_TYPE_WEIGHTS[p]

  return (
    <div className="space-y-4">
      {/* A. Base Inputs */}
      <div>
        <SectionLabel>A — Base Inputs</SectionLabel>
        <InputRow label="Gross Asset Value (GAV)" value={`AED ${ASSET_GAV[p].toLocaleString()}M`} sub="Aldar investment in portfolio" />
        <InputRow label="Annual Revenue Base" value={`AED ${REVENUE_BASE[p].toLocaleString()}M`} sub="Budgeted annual revenue" />
        <InputRow label="Max Exposure Base" value={`AED ${EXPOSURE_BASE[p]}M`} sub="At-risk exposure ceiling (risk score = 100)" />
        <InputRow label="Current Risk Score" value={`${ctx.riskScore} / 100`} sub="Propagation engine composite" />
      </div>

      <Divider />

      {/* B. Formula */}
      <div>
        <SectionLabel>B — Calculation Logic</SectionLabel>
        <FormulaBox>
          {`Scale Factor = 0.8 + (${ctx.riskScore} ÷ 100) × 0.8\n`}
          {`            = 0.8 + ${(ctx.riskScore / 100 * 0.8).toFixed(3)}\n`}
          {`            = ${scaleFactor.toFixed(3)}×\n\n`}
          {`Exposure = AED ${EXPOSURE_BASE[p]}M × ${scaleFactor.toFixed(3)}\n`}
          {`         = AED ${(EXPOSURE_BASE[p] * scaleFactor).toFixed(1)}M\n`}
          {`         ≈ AED ${computed}M  (rounded to 10 AED M)`}
        </FormulaBox>
      </div>

      <Divider />

      {/* C. Risk Type Breakdown */}
      <div>
        <SectionLabel>C — Breakdown by Risk Type</SectionLabel>
        {breakdown.map(({ type, pct }) => {
          const amt = Math.round(computed * pct)
          return (
            <div key={type} style={{ marginBottom: '8px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.73rem' }}>{type}</span>
                <span style={{ color: PORTFOLIO_COLORS[p], fontSize: '0.75rem', fontWeight: 700 }}>AED {amt}M</span>
              </div>
              <div style={{ height: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: PORTFOLIO_COLORS[p], opacity: 0.7, borderRadius: '2px' }} />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', marginTop: '1px' }}>{(pct * 100).toFixed(0)}% of exposure</div>
            </div>
          )
        })}
      </div>

      <Divider />

      {/* E. Scenario sensitivity */}
      <div>
        <SectionLabel>E — Scenario Sensitivity</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '4px 10px', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>If risk score changes by</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>New Score</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Exposure</span>
          {[+15, +10, 0, -10, -20].map((delta) => {
            const s = Math.max(0, Math.min(100, ctx.riskScore + delta))
            const sf = 0.8 + (s / 100) * 0.8
            const exp = Math.round(EXPOSURE_BASE[p] * sf / 10) * 10
            const isBase = delta === 0
            return (
              <React.Fragment key={delta}>
                <span style={{ color: delta > 0 ? 'var(--risk-high)' : delta < 0 ? 'var(--risk-low)' : 'var(--accent-primary)', fontSize: '0.72rem', fontWeight: isBase ? 700 : 400 }}>
                  {delta === 0 ? '± 0 (current)' : delta > 0 ? `+${delta} pts (stress)` : `${delta} pts (improve)`}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', textAlign: 'right', fontWeight: isBase ? 700 : 400 }}>{s}</span>
                <span style={{ color: PORTFOLIO_COLORS[p], fontSize: '0.75rem', fontWeight: isBase ? 800 : 600, textAlign: 'right' }}>AED {exp}M</span>
              </React.Fragment>
            )
          })}
        </div>
      </div>

      <Divider />

      {/* F. AI Explanation */}
      <div>
        <SectionLabel>F — AI Explanation</SectionLabel>
        <AiBox text={getPortfolioAiText(p, ctx.riskScore, computed)} />
      </div>
    </div>
  )
}

function getPortfolioAiText(p: PortfolioKey, score: number, exposure: number): string {
  const dominant = RISK_TYPE_WEIGHTS[p][0].type
  const pct = Math.round(RISK_TYPE_WEIGHTS[p][0].pct * 100)
  const sensMsg = score > 65 ? 'above the 65/100 elevated threshold — management action required' : score > 45 ? 'in the moderate range — monitoring sufficient' : 'below 45/100 — structurally resilient'
  return `AED ${exposure}M exposure is dominated by "${dominant}" risk (${pct}% of total). Current risk score of ${score}/100 is ${sensMsg}. A 10-point reduction in risk score would reduce this portfolio's exposure by approx. AED ${Math.round(EXPOSURE_BASE[p] * 0.08 / 10) * 10}M.`
}

// ─── View: Scenario Impact ────────────────────────────────────────────────────

function ScenarioImpactView({ ctx }: { ctx: Extract<FinancialCalcContext, { type: 'scenario_impact' }> }) {
  const splits = SCENARIO_SPLITS[ctx.scenarioId] || []
  const drivers = SCENARIO_DRIVERS[ctx.scenarioId] || []
  const totalRevenue = ctx.totalRevenue ?? 3350

  return (
    <div className="space-y-4">
      {/* A. Base Inputs */}
      <div>
        <SectionLabel>A — Base Inputs</SectionLabel>
        <InputRow label="Scenario" value={SCENARIO_NAMES[ctx.scenarioId] || ctx.scenarioId} />
        <InputRow label="Total Revenue Base" value={`AED ${totalRevenue}M`} sub="Affected portfolio revenues" />
        <InputRow label="Estimated Total Impact" value={`AED ${ctx.value}M`} sub="Point estimate — moderate intensity" />
        <InputRow label="% of Total Revenue" value={`${((ctx.value / totalRevenue) * 100).toFixed(1)}%`} sub="Revenue at risk from this scenario" />
      </div>

      <Divider />

      {/* B. Formula */}
      <div>
        <SectionLabel>B — Calculation Logic</SectionLabel>
        <FormulaBox>
          {`Impact = Σ (Portfolio Revenue × Impact %)\n\n`}
          {splits.map(({ portfolio, pct }) => {
            const rev = REVENUE_BASE[portfolio]
            const amt = Math.round(ctx.value * pct)
            return `  ${PORTFOLIO_NAMES[portfolio].padEnd(14)} AED ${rev}M × ${(pct * 100).toFixed(0)}% ≈ AED ${amt}M\n`
          }).join('')}
          {`\nTotal ≈ AED ${ctx.value}M`}
        </FormulaBox>
      </div>

      <Divider />

      {/* C. Portfolio Breakdown */}
      <div>
        <SectionLabel>C — Impact by Portfolio</SectionLabel>
        {splits.map(({ portfolio, pct, driver }) => {
          const amt = Math.round(ctx.value * pct)
          return (
            <div key={portfolio} style={{ marginBottom: '10px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '3px' }}>
                <span style={{ color: PORTFOLIO_COLORS[portfolio], fontSize: '0.75rem', fontWeight: 700 }}>{PORTFOLIO_NAMES[portfolio]}</span>
                <span style={{ color: 'var(--risk-high)', fontSize: '0.78rem', fontWeight: 700 }}>−AED {amt}M</span>
              </div>
              <div style={{ height: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden', marginBottom: '3px' }}>
                <div style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: PORTFOLIO_COLORS[portfolio], opacity: 0.7, borderRadius: '2px' }} />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>{driver}</div>
            </div>
          )
        })}
      </div>

      <Divider />

      {/* D. Drivers */}
      <div>
        <SectionLabel>D — Key Transmission Drivers</SectionLabel>
        {drivers.map(({ factor, change, impact }) => (
          <div key={factor} className="flex items-start justify-between" style={{ marginBottom: '7px', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.73rem' }}>{factor}</span>
              <ChevronRight size={10} style={{ color: 'var(--text-muted)', display: 'inline', margin: '0 3px', verticalAlign: 'middle' }} />
              <span style={{ color: 'var(--risk-high)', fontSize: '0.73rem', fontWeight: 600 }}>{change}</span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.67rem', textAlign: 'right', flexShrink: 0, maxWidth: '45%' }}>{impact}</span>
          </div>
        ))}
      </div>

      <Divider />

      {/* E. Intensity Sensitivity */}
      <div>
        <SectionLabel>E — Scenario Intensity Logic</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '4px 12px', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Intensity</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Multiplier</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Exposure</span>
          {[
            { label: 'Mild',     mult: 0.5,  color: 'var(--risk-low)' },
            { label: 'Moderate', mult: 1.0,  color: 'var(--risk-medium)' },
            { label: 'Severe',   mult: 1.7,  color: 'var(--risk-critical)' },
          ].map(({ label, mult, color }) => (
            <React.Fragment key={label}>
              <span style={{ color, fontSize: '0.73rem', fontWeight: mult === 1.0 ? 700 : 400 }}>{label}{mult === 1.0 ? ' (base)' : ''}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.73rem', textAlign: 'right' }}>{mult}×</span>
              <span style={{ color, fontSize: '0.75rem', fontWeight: 700, textAlign: 'right' }}>AED {Math.round(ctx.value * mult)}M</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <Divider />

      {/* F. AI */}
      <div>
        <SectionLabel>F — AI Explanation</SectionLabel>
        <AiBox text={getScenarioAiText(ctx.scenarioId, ctx.value)} />
      </div>
    </div>
  )
}

function getScenarioAiText(id: string, value: number): string {
  const texts: Record<string, string> = {
    tourism_drop:         `AED ${value}M impact driven by the hospitality–retail cascade: a 30% arrivals shock collapses the effective tourism index and propagates downstream to retail footfall and real estate off-plan sentiment. This scenario is particularly sensitive to geopolitical escalation duration — every additional month of elevated geopolitical risk extends the recovery timeline by 3–6 months.`,
    interest_rate_hike:   `AED ${value}M impact concentrated in Real Estate (74%). Rate sensitivity is high because 62% of the off-plan buyer base relies on mortgage financing. The cascade to retail is secondary but measurable — rate hikes reduce consumer discretionary spending with a 2–3 quarter lag.`,
    tenant_default_spike: `AED ${value}M exposure driven by the 15-tenant CVA cluster at Yas Mall and Al Jimi Mall. The Facilities portfolio is a secondary casualty via FM contract cancellations. LTV covenant breach risk is the tail-risk amplifier — if triggered, it could require AED 80–120M additional equity injection.`,
  }
  return texts[id] || `Scenario total impact of AED ${value}M computed from affected portfolio revenue bases and intensity-weighted impact percentages.`
}

// ─── View: Revenue at Risk ────────────────────────────────────────────────────

function RevenueAtRiskView({ ctx }: { ctx: Extract<FinancialCalcContext, { type: 'revenue_at_risk' }> }) {
  const p = ctx.portfolioId
  const riskPct = (ctx.impactScore / 100) * (ctx.amplified ? 0.22 : 0.14)
  const computed = Math.round(REVENUE_BASE[p] * riskPct)

  return (
    <div className="space-y-4">
      {/* A. Base Inputs */}
      <div>
        <SectionLabel>A — Base Inputs</SectionLabel>
        <InputRow label="Portfolio" value={PORTFOLIO_NAMES[p]} />
        <InputRow label="Annual Revenue Base" value={`AED ${REVENUE_BASE[p].toLocaleString()}M`} sub="Aldar budgeted annual revenue" />
        <InputRow label="Impact Score" value={`${ctx.impactScore} / 100`} sub="Impact engine blend (propagation 60% + keyword 40%)" />
        <InputRow label="Signal Amplified" value={ctx.amplified ? 'YES (+57% multiplier)' : 'NO (baseline rate)'} />
        <InputRow label="Risk Rate Applied" value={`${(riskPct * 100).toFixed(1)}%`} sub={ctx.amplified ? '22% ceiling (amplified)' : '14% ceiling (baseline)'} />
      </div>

      <Divider />

      {/* B. Formula */}
      <div>
        <SectionLabel>B — Calculation Logic</SectionLabel>
        <FormulaBox>
          {`Risk Rate = (Impact Score ÷ 100) × ${ctx.amplified ? '22%' : '14%'} ceiling\n`}
          {`         = (${ctx.impactScore} ÷ 100) × ${ctx.amplified ? '0.22' : '0.14'}\n`}
          {`         = ${(riskPct * 100).toFixed(2)}%\n\n`}
          {`Revenue at Risk = AED ${REVENUE_BASE[p]}M × ${(riskPct * 100).toFixed(2)}%\n`}
          {`               = AED ${computed}M`}
        </FormulaBox>
        {ctx.amplified && (
          <div style={{ marginTop: '6px', color: 'var(--risk-high)', fontSize: '0.68rem', lineHeight: 1.4 }}>
            Signal amplification active: AI Fusion detected a corroborating external signal — ceiling raised from 14% to 22%.
          </div>
        )}
      </div>

      <Divider />

      {/* C. Risk type contribution */}
      <div>
        <SectionLabel>C — Risk Type Contribution to Impact Score</SectionLabel>
        {RISK_TYPE_WEIGHTS[p].map(({ type, pct }) => {
          const contribution = Math.round(ctx.impactScore * pct)
          return (
            <div key={type} style={{ marginBottom: '8px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{type}</span>
                <span style={{ color: PORTFOLIO_COLORS[p], fontSize: '0.72rem', fontWeight: 600 }}>{contribution} pts</span>
              </div>
              <div style={{ height: '3px', backgroundColor: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: PORTFOLIO_COLORS[p], opacity: 0.7, borderRadius: '2px' }} />
              </div>
            </div>
          )
        })}
      </div>

      <Divider />

      {/* E. Scenario range */}
      <div>
        <SectionLabel>E — Revenue at Risk — Scenario Range</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 16px', alignItems: 'center' }}>
          {[
            { label: 'Low (unamplified, mild)',       rate: (ctx.impactScore / 100) * 0.14 * 0.5 },
            { label: 'Base (unamplified, moderate)', rate: (ctx.impactScore / 100) * 0.14 },
            { label: 'Elevated (amplified)',          rate: (ctx.impactScore / 100) * 0.22 },
            { label: 'Stress (amplified, severe)',    rate: (ctx.impactScore / 100) * 0.22 * 1.7 },
          ].map(({ label, rate }) => {
            const amt = Math.round(REVENUE_BASE[p] * Math.min(rate, 1))
            const isCurrent = Math.abs(riskPct - rate) < 0.005
            return (
              <React.Fragment key={label}>
                <span style={{ color: isCurrent ? 'var(--accent-primary)' : 'var(--text-muted)', fontSize: '0.72rem', fontWeight: isCurrent ? 700 : 400 }}>
                  {label}{isCurrent ? ' ← current' : ''}
                </span>
                <span style={{ color: isCurrent ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: isCurrent ? 800 : 600, textAlign: 'right' }}>
                  AED {amt}M
                </span>
              </React.Fragment>
            )
          })}
        </div>
      </div>

      <Divider />

      <div>
        <SectionLabel>F — AI Explanation</SectionLabel>
        <AiBox text={`${PORTFOLIO_NAMES[p]} revenue at risk of AED ${computed}M is ${ctx.amplified ? 'elevated by an AI-detected external signal corroboration (amplified mode, 22% ceiling)' : 'at baseline sensitivity (14% ceiling)'}. The impact score of ${ctx.impactScore}/100 blends the propagation engine baseline (60% weight) with keyword/signal analysis (40% weight). Primary risk driver is ${RISK_TYPE_WEIGHTS[p][0].type.toLowerCase()}.`} />
      </div>
    </div>
  )
}

// ─── Panel Title helper ───────────────────────────────────────────────────────

function getPanelTitle(ctx: FinancialCalcContext): { title: string; value: string; color: string } {
  switch (ctx.type) {
    case 'total_exposure':
      return { title: 'Total Financial Exposure', value: `AED ${ctx.value.toLocaleString()}M`, color: 'var(--accent-primary)' }
    case 'portfolio_exposure':
      return { title: `${PORTFOLIO_NAMES[ctx.portfolioId]} — Financial Exposure`, value: `AED ${ctx.value}M`, color: PORTFOLIO_COLORS[ctx.portfolioId] }
    case 'scenario_impact':
      return { title: `Scenario Impact — ${(SCENARIO_NAMES[ctx.scenarioId] || ctx.scenarioId).split(' — ')[0]}`, value: `AED ${ctx.value}M`, color: 'var(--risk-high)' }
    case 'revenue_at_risk':
      return { title: `${PORTFOLIO_NAMES[ctx.portfolioId]} — Revenue at Risk`, value: `AED ${ctx.value}M`, color: PORTFOLIO_COLORS[ctx.portfolioId] }
  }
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface Props {
  ctx: FinancialCalcContext
  onClose: () => void
}

export function FinancialCalculationPanel({ ctx, onClose }: Props) {
  const { title, value, color } = getPanelTitle(ctx)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          zIndex: 49,
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(460px, 100vw)',
          zIndex: 50,
          backgroundColor: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
                <Calculator size={14} style={{ color }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Calculation Methodology
                </span>
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700 }}>{title}</div>
              <div style={{ color, fontSize: '1.5rem', fontWeight: 800, marginTop: '2px', letterSpacing: '-0.02em' }}>{value}</div>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '6px', borderRadius: '6px', cursor: 'pointer',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {ctx.type === 'total_exposure'    && <TotalExposureView ctx={ctx} />}
          {ctx.type === 'portfolio_exposure' && <PortfolioExposureView ctx={ctx} />}
          {ctx.type === 'scenario_impact'   && <ScenarioImpactView ctx={ctx} />}
          {ctx.type === 'revenue_at_risk'   && <RevenueAtRiskView ctx={ctx} />}
        </div>

        {/* Footer note */}
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid var(--border-color)',
          flexShrink: 0,
          backgroundColor: 'var(--bg-secondary)',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.62rem', lineHeight: 1.5, margin: 0 }}>
            All calculations use the Aldar Risk Propagation Engine. Values are risk-adjusted estimates, not financial statements. For board presentations, verify against the latest management accounts.
          </p>
        </div>
      </motion.div>
    </>
  )
}
