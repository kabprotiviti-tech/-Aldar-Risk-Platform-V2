'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Activity,
  Shield,
  Layers,
  GitBranch,
  Sparkles,
  Palette,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { ThemeSelector } from '@/components/layout/ThemeSelector'
import { aggregateKPIs } from '@/lib/simulated-data'
import { controlSummary } from '@/lib/controlData'

// ─── Count-up hook ─────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1400, start = true) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, start])
  return value
}

// ─── Clock ─────────────────────────────────────────────────────────────────
function useGSTClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString('en-AE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Dubai',
        hour12: false,
      }) + ' GST'
    setTime(fmt())
    const id = setInterval(() => setTime(fmt()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

// ─── Live stat tile ────────────────────────────────────────────────────────
interface StatProps {
  label: string
  value: number
  suffix?: string
  prefix?: string
  icon: React.ReactNode
  accent?: 'primary' | 'risk' | 'ok' | 'warn'
  hint?: string
}

function Stat({ label, value, suffix, prefix, icon, accent = 'primary', hint }: StatProps) {
  const n = useCountUp(value)
  const accentVar =
    accent === 'risk'
      ? 'var(--risk-high)'
      : accent === 'ok'
      ? 'var(--risk-low)'
      : accent === 'warn'
      ? 'var(--risk-medium, #F59E0B)'
      : 'var(--accent-primary)'
  return (
    <div className="landing-stat">
      <div className="landing-stat-head">
        <div
          className="landing-stat-icon"
          style={{ color: accentVar, borderColor: accentVar }}
        >
          {icon}
        </div>
        <span className="landing-stat-label">{label}</span>
      </div>
      <div className="landing-stat-value" style={{ color: accentVar }}>
        {prefix}
        {n.toLocaleString()}
        {suffix}
      </div>
      {hint && <div className="landing-stat-hint">{hint}</div>}
    </div>
  )
}

// ─── Entry card ─────────────────────────────────────────────────────────────
interface CardProps {
  href: string
  eyebrow: string
  title: string
  description: string
  metric: string
  metricLabel: string
  icon: React.ReactNode
}

function EntryCard({ href, eyebrow, title, description, metric, metricLabel, icon }: CardProps) {
  return (
    <Link href={href} className="landing-card">
      <div className="landing-card-icon">{icon}</div>
      <div className="landing-card-eyebrow">{eyebrow}</div>
      <h3 className="landing-card-title">{title}</h3>
      <p className="landing-card-desc">{description}</p>
      <div className="landing-card-footer">
        <div>
          <div className="landing-card-metric">{metric}</div>
          <div className="landing-card-metric-label">{metricLabel}</div>
        </div>
        <div className="landing-card-cta">
          Open <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const time = useGSTClock()
  const [showThemes, setShowThemes] = useState(false)

  const totalRisks =
    aggregateKPIs.criticalRisks +
    aggregateKPIs.highRisks +
    aggregateKPIs.mediumRisks +
    aggregateKPIs.lowRisks
  const exposureAED = Math.round(aggregateKPIs.totalFinancialExposure)

  return (
    <main className="landing-root">
      {/* Ambient background: animated mesh + grid */}
      <div aria-hidden className="landing-bg">
        <div className="landing-mesh" />
        <div className="landing-grid" />
      </div>

      {/* Top bar */}
      <nav className="landing-nav">
        <div className="landing-brand">
          <span className="landing-brand-bar" aria-hidden />
          <div className="landing-brand-text">
            <span className="landing-brand-eyebrow">Aldar Properties · ADX: ALDAR</span>
            <span className="landing-brand-name">Risk &amp; Control Operating System</span>
          </div>
        </div>

        <div className="landing-nav-right">
          <div className="landing-live">
            <span className="landing-live-dot" />
            LIVE
          </div>
          <div className="landing-clock">{time}</div>
          <button
            onClick={() => setShowThemes(true)}
            className="landing-theme-btn"
            aria-label="Change theme"
          >
            <Palette size={14} />
            <span>Theme</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-eyebrow">
          <Sparkles size={12} />
          <span>Enterprise AI · ICOFAR · Board-Grade</span>
        </div>
        <h1 className="landing-hero-title">
          Unified command for
          <br />
          <span className="landing-hero-gradient">
            enterprise risk &amp; internal control.
          </span>
        </h1>
        <p className="landing-hero-sub">
          An executive operating system that fuses risk registers, ICOFAR controls, portfolio
          signals and AI fusion into a single decision surface — purpose-built for Aldar
          Properties&apos; board and risk committee.
        </p>
        <div className="landing-hero-cta">
          <Link href="/dashboard" className="landing-cta-primary">
            Enter Operating System <ArrowRight size={16} />
          </Link>
          <Link href="/scenarios" className="landing-cta-ghost">
            View Scenarios
          </Link>
        </div>

        {/* Live stats ribbon */}
        <div className="landing-stats">
          <Stat
            label="Total Exposure"
            value={exposureAED}
            prefix="AED "
            suffix="M"
            icon={<TrendingUp size={14} />}
            accent="primary"
            hint="Across 5 portfolios"
          />
          <Stat
            label="Active Risks"
            value={totalRisks}
            icon={<AlertTriangle size={14} />}
            accent="warn"
            hint={`${aggregateKPIs.criticalRisks} critical · ${aggregateKPIs.highRisks} high`}
          />
          <Stat
            label="ICOFAR Controls"
            value={controlSummary.total}
            icon={<Shield size={14} />}
            accent="ok"
            hint={`${controlSummary.coveragePercent}% effective coverage`}
          />
          <Stat
            label="AI Signals Today"
            value={aggregateKPIs.aiAlertsToday}
            icon={<Activity size={14} />}
            accent="primary"
            hint="Fused from 4 sources"
          />
        </div>
      </section>

      {/* Entry cards */}
      <section className="landing-cards-wrap">
        <div className="landing-section-head">
          <span className="landing-section-eyebrow">MODULES</span>
          <h2 className="landing-section-title">Enter the operating system</h2>
        </div>
        <div className="landing-cards">
          <EntryCard
            href="/dashboard"
            eyebrow="01 · EXECUTIVE"
            title="Executive Dashboard"
            description="Portfolio-level risk posture, AI fusion insights, and board-ready metrics updated in real time."
            metric={`${aggregateKPIs.totalRiskScore}`}
            metricLabel="Enterprise Risk Score"
            icon={<Layers size={18} />}
          />
          <EntryCard
            href="/control-command-center"
            eyebrow="02 · ICOFAR"
            title="Control Command Center"
            description="Design, test, and monitor the full control library across 6 ICOFAR steps with AI-flagged weaknesses."
            metric={`${controlSummary.effective}/${controlSummary.total}`}
            metricLabel="Effective Controls"
            icon={<Shield size={18} />}
          />
          <EntryCard
            href="/portfolio"
            eyebrow="03 · PORTFOLIO"
            title="Portfolio Risk"
            description="Real estate, retail, hospitality, education and facilities — drill through exposures and leading indicators."
            metric="5"
            metricLabel="Portfolios Monitored"
            icon={<TrendingUp size={18} />}
          />
          <EntryCard
            href="/scenarios"
            eyebrow="04 · SCENARIOS"
            title="Scenario Lab"
            description="Stress-test board scenarios with AI-simulated cascade effects across risk, control and financial lines."
            metric="12"
            metricLabel="Playbooks Ready"
            icon={<GitBranch size={18} />}
          />
        </div>
      </section>

      {/* Trust strip */}
      <section className="landing-trust">
        <div className="landing-trust-item">
          <CheckCircle2 size={14} /> ICOFAR-aligned
        </div>
        <div className="landing-trust-item">
          <CheckCircle2 size={14} /> COSO 2013 mapped
        </div>
        <div className="landing-trust-item">
          <CheckCircle2 size={14} /> SCA disclosure-ready
        </div>
        <div className="landing-trust-item">
          <CheckCircle2 size={14} /> IFRS-compliant exposure model
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div>
          © {new Date().getFullYear()} Aldar Properties PJSC · Abu Dhabi ·
          Prepared by Protiviti
        </div>
        <div className="landing-footer-right">
          <span>v2.1 · {new Date().toISOString().slice(0, 10)}</span>
        </div>
      </footer>

      {showThemes && <ThemeSelector onClose={() => setShowThemes(false)} />}
    </main>
  )
}
