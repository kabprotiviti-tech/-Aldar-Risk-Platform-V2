'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, AlertTriangle, DollarSign, Zap, TrendingUp, Cpu, Clock, Database, ExternalLink,
} from 'lucide-react'
import {
  riskRegister,
  externalNews,
  erpSignals,
  crmSignals,
  projectSignals,
  portfolioMetrics,
  portfolioNames,
  aggregateKPIs,
  kpiData,
  type Portfolio,
  type Severity,
} from '@/lib/simulated-data'

// ─── Types ────────────────────────────────────────────────────────────────────

export type KPIView = 'overallRisk' | 'criticalRisks' | 'financialExposure' | 'aiAlerts'

const PORTFOLIO_COLORS: Record<Portfolio, string> = {
  'real-estate': '#C9A84C',
  retail: '#4A9EFF',
  hospitality: '#A855F7',
  education: '#22C55E',
  facilities: '#FF6B6B',
}

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--risk-critical)',
  high: 'var(--risk-high)',
  medium: 'var(--risk-medium)',
  low: 'var(--risk-low)',
}

const SEV_BG: Record<string, string> = {
  critical: 'rgba(255,59,59,0.1)',
  high: 'rgba(255,140,0,0.1)',
  medium: 'rgba(245,197,24,0.1)',
  low: 'rgba(34,197,94,0.1)',
}

function getSeverity(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 16) return 'critical'
  if (score >= 10) return 'high'
  if (score >= 6) return 'medium'
  return 'low'
}

// ─── Shared section header ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      color: 'var(--text-muted)',
      fontSize: '0.6rem',
      fontWeight: 700,
      letterSpacing: '0.09em',
      textTransform: 'uppercase',
      marginBottom: '10px',
    }}>
      {children}
    </div>
  )
}

// ─── View A: Overall Risk Score ───────────────────────────────────────────────

function OverallRiskView() {
  const PORTFOLIOS: Portfolio[] = ['real-estate', 'retail', 'hospitality', 'education', 'facilities']

  const rows = PORTFOLIOS.map(p => ({
    portfolio: p,
    name: portfolioNames[p],
    score: portfolioMetrics[p].riskScore,
    trend: portfolioMetrics[p].trend,
    exposure: portfolioMetrics[p].financialExposure,
    counts: portfolioMetrics[p].riskCount,
    color: PORTFOLIO_COLORS[p],
  })).sort((a, b) => b.score - a.score)

  const trendArrow = (t: string) =>
    t === 'increasing' ? '↑' : t === 'decreasing' ? '↓' : '→'
  const trendColor = (t: string) =>
    t === 'increasing' ? 'var(--risk-high)' : t === 'decreasing' ? 'var(--risk-low)' : 'var(--text-muted)'

  return (
    <div>
      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Composite Score', value: `${aggregateKPIs.totalRiskScore}/100`, color: 'var(--risk-high)' },
          { label: 'Critical Risks', value: String(aggregateKPIs.criticalRisks), color: 'var(--risk-critical)' },
          { label: 'Risks Increasing', value: String(aggregateKPIs.risksIncreasing), color: 'var(--risk-high)' },
          { label: 'Risks Decreasing', value: String(aggregateKPIs.risksDecreasing), color: 'var(--risk-low)' },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {m.label}
            </div>
            <div style={{ color: m.color, fontSize: '1.5rem', fontWeight: 800 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Portfolio risk bars */}
      <SectionLabel>Portfolio Risk Score Breakdown</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {rows.map((p, idx) => (
          <div key={p.portfolio}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: p.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>{p.name}</span>
                <span style={{ color: trendColor(p.trend), fontSize: '0.72rem', fontWeight: 700 }}>{trendArrow(p.trend)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>AED {p.exposure.toLocaleString()}M</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 800, minWidth: '28px', textAlign: 'right' }}>{p.score}</span>
              </div>
            </div>
            <div style={{ height: '7px', borderRadius: '4px', backgroundColor: 'var(--bg-card)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${p.score}%` }}
                transition={{ duration: 0.65, ease: 'easeOut', delay: idx * 0.07 }}
                style={{ height: '100%', borderRadius: '4px', backgroundColor: p.color }}
              />
            </div>
            <div style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
              {p.counts.critical > 0 && (
                <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,59,59,0.12)', color: 'var(--risk-critical)' }}>
                  {p.counts.critical} Critical
                </span>
              )}
              {p.counts.high > 0 && (
                <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,140,0,0.12)', color: 'var(--risk-high)' }}>
                  {p.counts.high} High
                </span>
              )}
              {p.counts.medium > 0 && (
                <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(245,197,24,0.12)', color: 'var(--risk-medium)' }}>
                  {p.counts.medium} Med
                </span>
              )}
              {p.counts.low > 0 && (
                <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(34,197,94,0.12)', color: 'var(--risk-low)' }}>
                  {p.counts.low} Low
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 6-month trend mini table */}
      <SectionLabel>Risk Score Trend — Last 6 Months</SectionLabel>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', minWidth: '400px' }}>
          <thead>
            <tr>
              <th style={{ color: 'var(--text-muted)', fontWeight: 600, textAlign: 'left', padding: '5px 8px', borderBottom: '1px solid var(--border-color)' }}>
                Portfolio
              </th>
              {kpiData.months.slice(-6).map((m) => (
                <th key={m} style={{ color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center', padding: '5px 8px', borderBottom: '1px solid var(--border-color)', minWidth: '38px' }}>
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(Object.entries(kpiData.portfolioRiskScores) as [Portfolio, number[]][]).map(([p, scores]) => (
              <tr key={p}>
                <td style={{ color: PORTFOLIO_COLORS[p], fontSize: '0.7rem', fontWeight: 600, padding: '5px 8px', borderBottom: '1px solid var(--border-color)' }}>
                  {portfolioNames[p]}
                </td>
                {scores.slice(-6).map((s, i) => (
                  <td
                    key={i}
                    style={{
                      textAlign: 'center',
                      padding: '5px 8px',
                      borderBottom: '1px solid var(--border-color)',
                      color: s >= 70 ? 'var(--risk-high)' : s >= 55 ? 'var(--risk-medium)' : 'var(--text-secondary)',
                      fontWeight: s >= 70 ? 700 : 400,
                    }}
                  >
                    {s}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', marginTop: '8px' }}>
        Source: Aldar Risk Register · AI Fusion Engine · Confidence: 0.87
      </div>
    </div>
  )
}

// ─── View B: Critical & High Risks ───────────────────────────────────────────

// Single source of truth: filter from riskRegister — count drives both card and list
const criticalHighRisks = riskRegister.filter(r => {
  const sev = getSeverity(r.score)
  return sev === 'critical' || sev === 'high'
})

// Source traceability per risk
const RISK_SOURCES: Record<string, string> = {
  'R-001': 'Bloomberg · Fed Reserve signals',
  'R-002': 'CRM tenant tracking system',
  'R-003': 'AI detected anomaly · tourism index',
  'R-004': 'ERP cost variance signal (Oracle Fusion)',
  'R-005': 'ADEK regulatory notice',
  'R-006': 'CISA cyber advisory',
  'R-007': 'Reuters · geopolitical feed',
  'R-008': 'ADX ESG mandate notice',
  'R-009': 'AI detected anomaly · CRM footfall cascade',
  'R-010': 'Internal FM performance report',
  'R-011': 'CBRE MENA market data report',
  'R-012': 'CRM enrollment tracking system',
  'R-013': 'WAM regulatory update feed',
  'R-014': 'AI detected anomaly · event calendar void',
  'R-015': 'AI technology disruption monitor',
}

const RISK_DRIVERS: Record<string, string> = {
  'R-001': 'USD-AED peg transmits Fed rate hikes directly to UAE mortgage rates, compressing off-plan absorption by 8–12% per 50bps hike',
  'R-002': 'E-commerce penetration at 18% GCC; two anchor tenants (18,000 sqm) approaching lease expiry with no confirmed renewals',
  'R-003': 'Effective tourism index at 48/100 — shoulder season + geopolitical compression; hotel occupancy 68% below 70% threshold',
  'R-004': 'Red Sea shipping disruptions driving steel/cement costs up 18% YTD; active AED 8.2Bn pipeline fully exposed',
  'R-005': 'ADEK mandatory Arabic + UAE Studies curriculum integration across 30+ schools — September 2026 deadline',
  'R-006': 'IoT-connected portfolio (40+ assets, BMS integrated) — 340% larger attack surface vs. traditional assets',
  'R-007': 'Medium geopolitical risk signal: HNI buyer sentiment (22% of premium sales) showing increased caution; tourism index -8pts',
  'R-008': 'ADX IFRS S1/S2 mandate confirmed FY2026; Scope 3 supply chain emissions data incomplete — material disclosure risk',
  'R-009': 'Propagation: tourism index (48) → occupancy (68%) → retail footfall (67/100) → vacancy 8.5% vs 5.2% benchmark',
  'R-010': 'CSAT declined 87% → 79% Q1 2026; two partners covering 60% of managed portfolio area approaching renewal Q3 2026',
  'R-011': 'Abu Dhabi pipeline: 38,000 units 2026–2028 vs annual demand 22,000 units; oversupply could compress capital values 8–15%',
  'R-012': 'Three new campuses opening 2026 require 850+ enrollment for breakeven; pre-registration at 62% of target',
  'R-013': 'Any Golden Visa threshold reversal would reduce HNI investment demand — currently low probability tail risk',
  'R-014': 'Event density: LOW — 7-month demand valley until F1 GP November 2026; ~AED 2.8M RevPAR shortfall per week below 70% occupancy',
  'R-015': 'Competitors achieving 22% cost reductions via AI-powered predictive maintenance; Aldar FM digital maturity lags leaders',
}

export const CRITICAL_HIGH_RISK_COUNT = criticalHighRisks.length

function CriticalRisksView() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div>
      <SectionLabel>
        {criticalHighRisks.length} Risks · Critical &amp; High Severity Only · Click to Expand
      </SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {criticalHighRisks.map((r, i) => {
          const sev = getSeverity(r.score)
          const isOpen = expanded === r.id
          const statusColor = r.status === 'open' ? 'var(--risk-high)' : r.status === 'mitigating' ? 'var(--risk-medium)' : 'var(--text-muted)'
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-secondary)',
                border: `1px solid ${SEV_COLOR[sev]}20`,
                borderLeft: `3px solid ${SEV_COLOR[sev]}`,
                cursor: 'pointer',
              }}
              onClick={() => setExpanded(isOpen ? null : r.id)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Badges row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em',
                      padding: '2px 7px', borderRadius: '4px', backgroundColor: SEV_BG[sev], color: SEV_COLOR[sev],
                    }}>
                      {sev}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.64rem', fontWeight: 600 }}>{r.id}</span>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: PORTFOLIO_COLORS[r.portfolio] }} />
                    <span style={{ color: PORTFOLIO_COLORS[r.portfolio], fontSize: '0.64rem', fontWeight: 600 }}>
                      {portfolioNames[r.portfolio]}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.63rem' }}>{r.category}</span>
                  </div>
                  {/* Title */}
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.35, marginBottom: '6px' }}>
                    {r.title}
                  </div>
                  {/* Meta */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.63rem' }}>
                      Owner: <span style={{ color: 'var(--text-secondary)' }}>{r.owner}</span>
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.63rem' }}>
                      Status: <span style={{ color: statusColor, fontWeight: 600 }}>{r.status}</span>
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.63rem' }}>
                      Source: <span style={{ color: 'var(--accent-primary)' }}>{RISK_SOURCES[r.id]}</span>
                    </span>
                  </div>
                </div>
                {/* Score + expand hint */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: SEV_COLOR[sev], fontSize: '1.15rem', fontWeight: 800 }}>{r.score}/25</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>L{r.likelihood}×I{r.impact}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', marginTop: '2px' }}>AED {r.financialImpact}M</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', marginTop: '5px', opacity: 0.65 }}>
                    {isOpen ? '▲ collapse' : '▼ details'}
                  </div>
                </div>
              </div>

              {/* Expandable: explanation + driver */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '10px', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* AI Explanation */}
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                          AI Explanation
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.71rem', lineHeight: 1.6 }}>
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>AI: </span>
                          {r.aiInsight}
                        </div>
                      </div>
                      {/* Risk Driver */}
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: '7px',
                        backgroundColor: `${SEV_COLOR[sev]}08`,
                        border: `1px solid ${SEV_COLOR[sev]}22`,
                      }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                          Risk Driver
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.71rem', lineHeight: 1.5 }}>
                          {RISK_DRIVERS[r.id]}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', marginTop: '10px' }}>
        Showing {criticalHighRisks.length} of {riskRegister.length} risks · Critical + High severity · Source: Aldar Risk Register · AI Fusion Engine
      </div>
    </div>
  )
}

// ─── View C: Financial Exposure ───────────────────────────────────────────────

function FinancialExposureView() {
  const PORTFOLIOS: Portfolio[] = ['real-estate', 'retail', 'hospitality', 'education', 'facilities']
  const total = PORTFOLIOS.reduce((s, p) => s + portfolioMetrics[p].financialExposure, 0)

  const items = PORTFOLIOS.map((p) => ({
    portfolio: p,
    name: portfolioNames[p],
    exposure: portfolioMetrics[p].financialExposure,
    pct: Math.round((portfolioMetrics[p].financialExposure / total) * 100),
    color: PORTFOLIO_COLORS[p],
    riskScore: portfolioMetrics[p].riskScore,
    counts: portfolioMetrics[p].riskCount,
  })).sort((a, b) => b.exposure - a.exposure)

  const topRisksByPortfolio = (p: Portfolio) =>
    riskRegister
      .filter((r) => r.portfolio === p)
      .sort((a, b) => b.financialImpact - a.financialImpact)
      .slice(0, 2)

  return (
    <div>
      {/* Enterprise total */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-accent)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Total Enterprise Exposure
          </div>
          <div style={{ color: 'var(--accent-primary)', fontSize: '1.9rem', fontWeight: 800 }}>
            AED {total.toLocaleString()}M
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>5 Business Units</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: '2px' }}>Q2 2026 Risk-Adjusted</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: '2px' }}>Source: Oracle Fusion ERP · AI Engine</div>
        </div>
      </div>

      {/* Stacked bar */}
      <div style={{ height: '18px', borderRadius: '9px', overflow: 'hidden', display: 'flex', marginBottom: '10px' }}>
        {items.map((item, idx) => (
          <motion.div
            key={item.portfolio}
            initial={{ width: 0 }}
            animate={{ width: `${item.pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.05 }}
            style={{ backgroundColor: item.color, height: '100%', flexShrink: 0 }}
            title={`${item.name}: AED ${item.exposure}M (${item.pct}%)`}
          />
        ))}
      </div>
      {/* Bar legend */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {items.map((item) => (
          <div key={item.portfolio} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: item.color }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>{item.name} {item.pct}%</span>
          </div>
        ))}
      </div>

      {/* Per-portfolio breakdown */}
      <SectionLabel>Breakdown by Business Unit</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {items.map((item, idx) => {
          const drivers = topRisksByPortfolio(item.portfolio)
          return (
            <motion.div
              key={item.portfolio}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: idx * 0.06 }}
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-secondary)',
                border: `1px solid ${item.color}18`,
                borderLeft: `3px solid ${item.color}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: item.color }} />
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700 }}>{item.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Risk Score {item.riskScore}/100</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: item.color, fontSize: '1.05rem', fontWeight: 800 }}>AED {item.exposure.toLocaleString()}M</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.63rem' }}>{item.pct}% of total</div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height: '4px', borderRadius: '2px', backgroundColor: 'var(--bg-card)', marginBottom: '10px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.06 + 0.15 }}
                  style={{ height: '100%', borderRadius: '2px', backgroundColor: item.color }}
                />
              </div>
              {/* Top financial drivers */}
              {drivers.length > 0 && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
                    Top Risk Drivers
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {drivers.map((r) => {
                      const sev = getSeverity(r.score)
                      return (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: SEV_COLOR[sev], flexShrink: 0 }} />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.title}
                            </span>
                          </div>
                          <span style={{ color: SEV_COLOR[sev], fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                            AED {r.financialImpact}M
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── View D: AI Alerts ────────────────────────────────────────────────────────

type AlertTag = 'External' | 'Internal' | 'AI Generated'

interface UnifiedAlert {
  id: string
  title: string
  source: string
  timestamp: string
  severity: Severity
  tag: AlertTag
  portfolios: Portfolio[]
  detail: string
  confidence?: number
  link?: string
}

// ── Single source of truth for all AI alerts ──────────────────────────────────
// Count must match aggregateKPIs.aiAlertsToday (26)
const AI_ALERTS: UnifiedAlert[] = [
  // External news (10) — tag: External
  ...externalNews.map((n): UnifiedAlert => ({
    id: n.id,
    title: n.headline,
    source: n.source,
    timestamp: n.publishedAt,
    severity: n.aiClassification.severity,
    tag: 'External',
    portfolios: n.aiClassification.portfoliosAffected,
    detail: n.aiExplanation,
    confidence: n.aiClassification.confidence,
  })),
  // ERP signals (4) — tag: Internal
  ...erpSignals.map((s): UnifiedAlert => ({
    id: s.id,
    title: s.description,
    source: 'Oracle Fusion ERP',
    timestamp: s.timestamp,
    severity: s.severity,
    tag: 'Internal',
    portfolios: [s.portfolio],
    detail: `${s.type}: value ${s.value} ${s.unit} vs. threshold ${s.threshold} ${s.unit}. Detected via automated ERP monitoring. Requires immediate review by finance team.`,
    confidence: 0.96,
  })),
  // CRM signals (4) — tag: Internal
  ...crmSignals.map((s): UnifiedAlert => ({
    id: s.id,
    title: s.description,
    source: 'Salesforce CRM',
    timestamp: s.timestamp,
    severity: s.severity,
    tag: 'Internal',
    portfolios: [s.portfolio],
    detail: `${s.type}: ${s.metric} at ${s.value} vs. benchmark ${s.benchmark}. CRM system flagged deviation during routine threshold monitoring cycle.`,
    confidence: 0.93,
  })),
  // Project signals (3) — tag: Internal
  ...projectSignals.map((s): UnifiedAlert => ({
    id: s.id,
    title: `${s.projectName} — ${s.type}`,
    source: 'Primavera P6 Project System',
    timestamp: s.timestamp,
    severity: s.severity,
    tag: 'Internal',
    portfolios: [s.portfolio],
    detail: s.description + (s.delayDays ? ` Schedule impact: ${s.delayDays} days.` : '') + (s.costVariance ? ` Cost variance: ${s.costVariance}% over budget.` : ''),
    confidence: 0.91,
  })),
  // AI Generated signals (5) — tag: AI Generated
  {
    id: 'AI-001',
    title: 'Tourism Index Breach — Below 50/100 Threshold Detected',
    source: 'AI Risk Propagation Engine',
    timestamp: '2026-04-15T08:00:00Z',
    severity: 'high',
    tag: 'AI Generated',
    portfolios: ['hospitality', 'retail'],
    detail: 'Propagation engine detects effective tourism index at 48/100 — below the 50/100 alert threshold for the first time in 8 months. Shoulder season + geopolitical compression are compound drivers. Downstream cascade: occupancy → retail footfall → revenue at risk.',
    confidence: 0.89,
  },
  {
    id: 'AI-002',
    title: 'Off-Plan Absorption Velocity Declining — Sales Momentum Risk',
    source: 'AI Risk Propagation Engine',
    timestamp: '2026-04-15T06:30:00Z',
    severity: 'high',
    tag: 'AI Generated',
    portfolios: ['real-estate'],
    detail: 'AI model detects 14% week-over-week decline in off-plan absorption velocity across Yas Island and Saadiyat projects. Correlated drivers: interest rate environment (+175bps), HNI buyer sentiment (medium geopolitical risk), and seasonal demand trough.',
    confidence: 0.84,
  },
  {
    id: 'AI-003',
    title: 'Interest Rate Propagation — Mortgage Affordability Compression Detected',
    source: 'AI Risk Propagation Engine',
    timestamp: '2026-04-14T14:00:00Z',
    severity: 'high',
    tag: 'AI Generated',
    portfolios: ['real-estate', 'retail'],
    detail: 'AI financial model tracks cumulative +175bps Fed rate transmission into AED-pegged mortgage market. Model projects additional 8–12% off-plan absorption suppression if one more 50bps hike occurs. Bloomberg signals two further hikes in 2026.',
    confidence: 0.87,
  },
  {
    id: 'AI-004',
    title: 'Retail Footfall Cascade — Hospitality-to-Retail Correlation Confirmed',
    source: 'AI Risk Propagation Engine',
    timestamp: '2026-04-14T10:00:00Z',
    severity: 'medium',
    tag: 'AI Generated',
    portfolios: ['retail', 'hospitality'],
    detail: 'AI correlation engine confirms statistically significant relationship between Yas Island hotel occupancy (68%) and community retail footfall index (67/100). Each 1% occupancy decline corresponds to 0.8pt footfall index reduction. Current trajectory projects vacancy reaching 10% by June if unaddressed.',
    confidence: 0.81,
  },
  {
    id: 'AI-005',
    title: 'RevPAR Baseline Deteriorating — Event Void Period Entering Critical Zone',
    source: 'AI Risk Propagation Engine',
    timestamp: '2026-04-15T09:00:00Z',
    severity: 'high',
    tag: 'AI Generated',
    portfolios: ['hospitality'],
    detail: 'AI event calendar model flags 7-month demand valley (April–October) with no major event anchor. Current RevPAR at AED 285 vs AED 340 baseline — 16% below. Model projects cumulative AED 58M RevPAR shortfall by October if no bridging event is secured. F1 advance-booking activation recommended immediately.',
    confidence: 0.92,
  },
]

export const AI_ALERT_COUNT = AI_ALERTS.length

function AIAlertsView() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<AlertTag | 'All'>('All')

  const visible = filter === 'All' ? AI_ALERTS : AI_ALERTS.filter(a => a.tag === filter)

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso)
      const now = new Date('2026-04-16T10:00:00Z')
      const diffH = Math.round((now.getTime() - d.getTime()) / 3_600_000)
      if (diffH < 1) return 'just now'
      if (diffH < 24) return `${diffH}h ago`
      return `${Math.floor(diffH / 24)}d ago`
    } catch {
      return iso
    }
  }

  const TAG_COLOR: Record<AlertTag, string> = {
    'External': '#4A9EFF',
    'Internal': '#22C55E',
    'AI Generated': '#A855F7',
  }

  const counts = {
    External: AI_ALERTS.filter(a => a.tag === 'External').length,
    Internal: AI_ALERTS.filter(a => a.tag === 'Internal').length,
    'AI Generated': AI_ALERTS.filter(a => a.tag === 'AI Generated').length,
  }

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {(['All', 'External', 'Internal', 'AI Generated'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: filter === f ? (f === 'All' ? 'var(--accent-primary)' : TAG_COLOR[f as AlertTag]) : 'var(--border-color)',
              backgroundColor: filter === f ? (f === 'All' ? 'rgba(201,168,76,0.12)' : `${TAG_COLOR[f as AlertTag]}14`) : 'transparent',
              color: filter === f ? (f === 'All' ? 'var(--accent-primary)' : TAG_COLOR[f as AlertTag]) : 'var(--text-muted)',
              fontSize: '0.62rem',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            {f}{f !== 'All' && ` (${counts[f as AlertTag]})`}
            {f === 'All' && ` (${AI_ALERTS.length})`}
          </button>
        ))}
      </div>

      <SectionLabel>{visible.length} Alerts · {filter} · Click to Expand Detail</SectionLabel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {visible.map((alert, i) => {
          const sev = alert.severity
          const isOpen = expanded === alert.id
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: i * 0.03 }}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-secondary)',
                border: `1px solid ${SEV_COLOR[sev]}22`,
                borderLeft: `3px solid ${SEV_COLOR[sev]}`,
                cursor: 'pointer',
              }}
              onClick={() => setExpanded(isOpen ? null : alert.id)}
            >
              {/* Badges row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.57rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em',
                  padding: '2px 6px', borderRadius: '4px', backgroundColor: SEV_BG[sev], color: SEV_COLOR[sev],
                }}>
                  {sev}
                </span>
                <span style={{
                  fontSize: '0.57rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                  backgroundColor: `${TAG_COLOR[alert.tag]}14`, color: TAG_COLOR[alert.tag],
                  border: `1px solid ${TAG_COLOR[alert.tag]}30`,
                }}>
                  {alert.tag}
                </span>
                <span style={{ color: 'var(--accent-primary)', fontSize: '0.63rem', fontWeight: 600 }}>{alert.source}</span>
              </div>

              {/* Title */}
              <div style={{ color: 'var(--text-primary)', fontSize: '0.81rem', fontWeight: 600, lineHeight: 1.35, marginBottom: '6px' }}>
                {alert.title}
              </div>

              {/* Footer row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>{formatTime(alert.timestamp)}</span>
                  </div>
                  {alert.confidence !== undefined && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>
                      Conf: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{Math.round(alert.confidence * 100)}%</span>
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                    {alert.portfolios.map((p) => (
                      <span key={p} style={{
                        fontSize: '0.57rem', fontWeight: 600, padding: '1px 5px', borderRadius: '4px',
                        backgroundColor: `${PORTFOLIO_COLORS[p]}14`, color: PORTFOLIO_COLORS[p],
                      }}>
                        {portfolioNames[p]}
                      </span>
                    ))}
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', opacity: 0.65 }}>
                  {isOpen ? '▲' : '▼'} {isOpen ? 'collapse' : 'detail'}
                </span>
              </div>

              {/* Expandable detail */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.16 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '10px', paddingTop: '10px' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.71rem', lineHeight: 1.6, marginBottom: alert.link ? '8px' : 0 }}>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Detail: </span>
                        {alert.detail}
                      </div>
                      {alert.link && (
                        <a
                          href={alert.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            color: 'var(--accent-primary)', fontSize: '0.65rem', fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={10} />
                          View Source
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Traceability footer */}
      <div style={{
        marginTop: '14px', padding: '10px 14px', borderRadius: '8px',
        backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <Cpu size={11} style={{ color: 'var(--accent-primary)' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.67rem' }}>
          {counts.External} External (Bloomberg · Reuters · Arabian Business · CBRE · WAM · CISA) ·{' '}
          {counts.Internal} Internal (Oracle ERP · Salesforce CRM · Primavera P6) ·{' '}
          {counts['AI Generated']} AI Engine Detections — Total {AI_ALERTS.length} alerts
        </span>
      </div>
    </div>
  )
}

// ─── View config ──────────────────────────────────────────────────────────────

interface ViewConfig {
  title: string
  icon: React.ElementType
  accentColor: string
  description: string
}

const VIEW_CONFIG: Record<KPIView, ViewConfig> = {
  overallRisk: {
    title: 'Overall Risk Score — Portfolio Deep Dive',
    icon: AlertTriangle,
    accentColor: 'var(--risk-high)',
    description: 'Portfolio risk breakdown, trend analysis, and distribution',
  },
  criticalRisks: {
    title: 'Critical & High Risks — Management Action Register',
    icon: Zap,
    accentColor: 'var(--risk-critical)',
    description: `${criticalHighRisks.length} risks requiring immediate executive attention — click any risk to expand`,
  },
  financialExposure: {
    title: 'Financial Exposure — Business Unit Breakdown',
    icon: DollarSign,
    accentColor: 'var(--accent-primary)',
    description: 'Risk-adjusted financial exposure by business unit — Q2 2026',
  },
  aiAlerts: {
    title: 'AI Alerts — Live Intelligence Feed',
    icon: TrendingUp,
    accentColor: 'var(--chart-2)',
    description: `${AI_ALERT_COUNT} alerts — ${AI_ALERTS.filter(a => a.tag === 'External').length} external · ${AI_ALERTS.filter(a => a.tag === 'Internal').length} internal · ${AI_ALERTS.filter(a => a.tag === 'AI Generated').length} AI generated`,
  },
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface KPIDrillDownPanelProps {
  view: KPIView
  onClose: () => void
}

export function KPIDrillDownPanel({ view, onClose }: KPIDrillDownPanelProps) {
  const cfg = VIEW_CONFIG[view]
  const Icon = cfg.icon

  const now = (() => {
    try {
      return new Date().toLocaleString('en-AE', {
        timeZone: 'Asia/Dubai',
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return new Date().toLocaleString()
    }
  })()

  return (
    // Backdrop
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        backgroundColor: 'rgba(0,0,0,0.58)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="kpi-drilldown-panel"
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '88vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-card)',
          border: `1px solid ${cfg.accentColor}28`,
          borderTop: `3px solid ${cfg.accentColor}`,
          borderRadius: '16px',
          boxShadow: `0 28px 72px rgba(0,0,0,0.55), 0 0 0 1px ${cfg.accentColor}12`,
        }}
      >
        {/* Sticky header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--bg-card)',
            zIndex: 2,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '4px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                backgroundColor: `${cfg.accentColor}18`, border: `1px solid ${cfg.accentColor}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={14} style={{ color: cfg.accentColor }} />
              </div>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>
                {cfg.title}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={10} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ color: 'var(--accent-primary)', fontSize: '0.62rem', fontWeight: 600 }}>AI-Powered Insight</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>{cfg.description}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>·</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>{now}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0,
              transition: 'background-color 0.15s',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px' }}>
          {view === 'overallRisk' && <OverallRiskView />}
          {view === 'criticalRisks' && <CriticalRisksView />}
          {view === 'financialExposure' && <FinancialExposureView />}
          {view === 'aiAlerts' && <AIAlertsView />}
        </div>

        {/* Footer */}
        <div style={{
          padding: '11px 22px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={10} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>
              Aldar Risk Register · Oracle Fusion ERP · AI Fusion Engine · External News Classification
            </span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>
            Confidence: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>0.87</span>
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
