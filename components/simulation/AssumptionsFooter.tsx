'use client'

/**
 * AssumptionsFooter
 * -----------------
 * Transparent data-basis disclosure shown beneath the workbench.
 * Lists every source, formula and calibration constant so a CRO /
 * auditor can trace any number back to its origin.
 *
 * Read-only. No state. Purely additive.
 */

import React, { useState } from 'react'
import { FINANCIAL_ANCHORS, SCALE_CONSTANT, SENSITIVITY_FACTOR } from '@/lib/engine/seedData'

export function AssumptionsFooter() {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px dashed var(--border-primary)',
        borderRadius: 8,
        padding: '12px 16px',
        marginTop: 8,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--text-secondary)',
          fontSize: 11,
          fontWeight: 600,
          padding: 0,
        }}
      >
        <span>📋 Assumptions, Data Basis & Calibration {open ? '(hide)' : '(show)'}</span>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
          Traceability for every number on this page
        </span>
      </button>

      {open && (
        <div
          style={{
            marginTop: 12,
            fontSize: 10,
            color: 'var(--text-tertiary)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 14,
            lineHeight: 1.5,
          }}
        >
          <Block title="Financial Anchors (AED Mn)">
            <Row k="Portfolio Revenue" v={FINANCIAL_ANCHORS.portfolioRevenueAedMn.toLocaleString()} />
            <Row k="Active Project GDV" v={FINANCIAL_ANCHORS.activeProjectGdvAedMn.toLocaleString()} />
            <Row k="Recurring Rental NOI" v={FINANCIAL_ANCHORS.recurringRentalNoiAedMn.toLocaleString()} />
            <Row k="Hospitality Revenue" v={FINANCIAL_ANCHORS.hospitalityRevenueAedMn.toLocaleString()} />
            <Row k="Annual Capex" v={FINANCIAL_ANCHORS.annualCapexAedMn.toLocaleString()} />
            <Row k="Annual Off-Plan Sales" v={FINANCIAL_ANCHORS.annualOffPlanSalesAedMn.toLocaleString()} />
            <Src>FY2024 investor report + H1 FY2025 trading update</Src>
          </Block>

          <Block title="Calibration Constants">
            <Row k="Scale Constant" v={String(SCALE_CONSTANT)} />
            <Row k="Sensitivity Low" v={String(SENSITIVITY_FACTOR.low)} />
            <Row k="Sensitivity Medium" v={String(SENSITIVITY_FACTOR.medium)} />
            <Row k="Sensitivity High" v={String(SENSITIVITY_FACTOR.high)} />
            <Row k="Concurrency Amp" v="1.25× when ≥3 risks High/Critical" />
            <Src>Calibrated to Aldar ERM policy v3 signed Oct-2024</Src>
          </Block>

          <Block title="Core Formulas">
            <Formula label="Driver Δ %" expr="(current − base) / base × 100" />
            <Formula label="New Inherent" expr="clamp(base + Σ(ΔPct·weight·sens·10), 1, 25)" />
            <Formula label="Composite Eff." expr="1 − Π(1 − effᵢ)" />
            <Formula label="Residual" expr="inherent × (1 − composite_eff)" />
            <Formula label="Exposure AED" expr="fin_base × sens × (residual / 25)" />
            <Src>simulationEngine.ts — pure deterministic</Src>
          </Block>

          <Block title="AI Layer Transparency">
            <Row k="Model" v="Claude (anthropic-sdk)" />
            <Row k="Register Critic" v="On-demand; deterministic scores render instantly" />
            <Row k="Fallback" v="Hard-coded second-line findings when API unreachable" />
            <Row k="Signal classifier" v="Deterministic keyword rules (registerCritic.ts)" />
            <Src>AI outputs are recommendations — not decisions.</Src>
          </Block>

          <Block title="Governance & Limits">
            <Row k="Register scope" v="10 enterprise risks (R-001 … R-010)" />
            <Row k="Drivers" v="8 (DRV-01 … DRV-08)" />
            <Row k="Actions" v="15 (ACT-001 … ACT-015)" />
            <Row k="Horizons tested" v="7 / 14 / 30 / 60 / 90 days" />
            <Src>ERM Policy v3, Board Risk Committee charter</Src>
          </Block>

          <Block title="Known Limitations">
            <div>• Deterministic engine, not a probabilistic Monte Carlo.</div>
            <div>• Financial anchors are FY2024 — will drift without refresh.</div>
            <div>• External signals use keyword classifier, not NLP.</div>
            <div>• Cross-risk correlations simplified to concurrency amplifier.</div>
            <div>• Not a substitute for second-line review or audit.</div>
          </Block>
        </div>
      )}
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        borderRadius: 6,
        padding: 10,
        border: '1px solid var(--border-primary)',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: 0.4 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span>{k}</span>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{v}</span>
    </div>
  )
}

function Formula({ label, expr }: { label: string; expr: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
      <code
        style={{
          fontSize: 9,
          background: 'var(--bg-secondary)',
          padding: '2px 4px',
          borderRadius: 3,
          color: 'var(--accent-primary)',
        }}
      >
        {expr}
      </code>
    </div>
  )
}

function Src({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 6,
        paddingTop: 6,
        borderTop: '1px dotted var(--border-primary)',
        fontSize: 9,
        fontStyle: 'italic',
        color: 'var(--text-tertiary)',
      }}
    >
      Source: {children}
    </div>
  )
}
