'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Activity,
  Shield,
  Layers,
  GitBranch,
  Palette,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  CornerDownLeft,
  Radio,
} from 'lucide-react'
import { ThemeSelector } from '@/components/layout/ThemeSelector'
import { aggregateKPIs, externalNews, kpiData } from '@/lib/simulated-data'
import { controlSummary } from '@/lib/controlData'

// ═══════════════════════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════════════════════

function useCountUp(target: number, duration = 1600) {
  const [value, setValue] = useState(0)
  useEffect(() => {
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
  }, [target, duration])
  return value
}

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

// Read an accent color from CSS vars (reactive to theme changes via MutationObserver)
function useThemeAccent() {
  const [accent, setAccent] = useState('#C9A84C')
  useEffect(() => {
    const read = () => {
      const val = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-primary')
        .trim()
      if (val) setAccent(val)
    }
    read()
    const obs = new MutationObserver(read)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => obs.disconnect()
  }, [])
  return accent
}

// ═══════════════════════════════════════════════════════════════════════════
// Background: animated constellation canvas
// ═══════════════════════════════════════════════════════════════════════════
function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const accent = useThemeAccent()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let dpr = 1
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const count = Math.min(80, Math.floor((w * h) / 18000))
    type P = { x: number; y: number; vx: number; vy: number; r: number }
    const pts: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.4 + 0.6,
    }))

    const mouse = { x: -9999, y: -9999 }
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    window.addEventListener('mousemove', onMove)

    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, w, h)

      // Update + draw points
      for (const p of pts) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1

        // Mouse attraction
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const d2 = dx * dx + dy * dy
        if (d2 < 14000) {
          const f = 0.0008
          p.vx += dx * f
          p.vy += dy * f
        }
        // Damp
        p.vx *= 0.985
        p.vy *= 0.985

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = accent
        ctx.globalAlpha = 0.55
        ctx.fill()
      }

      // Connect nearby
      ctx.globalAlpha = 1
      ctx.lineWidth = 0.6
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i]
          const b = pts[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 130) {
            ctx.strokeStyle = accent
            ctx.globalAlpha = (1 - d / 130) * 0.22
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [accent])

  return <canvas ref={canvasRef} className="landing-canvas" />
}

// ═══════════════════════════════════════════════════════════════════════════
// Cursor spotlight — radial gradient that follows cursor
// ═══════════════════════════════════════════════════════════════════════════
function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      el.style.setProperty('--x', `${e.clientX}px`)
      el.style.setProperty('--y', `${e.clientY}px`)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
  return <div ref={ref} className="landing-spotlight" aria-hidden />
}

// ═══════════════════════════════════════════════════════════════════════════
// Sparkline — themed mini trend
// ═══════════════════════════════════════════════════════════════════════════
function Sparkline({ data, color, height = 28 }: { data: number[]; color: string; height?: number }) {
  const path = useMemo(() => {
    if (!data.length) return ''
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const w = 100
    const step = w / (data.length - 1)
    return data
      .map((v, i) => {
        const x = i * step
        const y = height - ((v - min) / range) * height
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }, [data, height])

  const lastY = useMemo(() => {
    if (!data.length) return 0
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    return height - ((data[data.length - 1] - min) / range) * height
  }, [data, height])

  return (
    <svg viewBox={`0 0 100 ${height}`} className="landing-spark" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L 100 ${height} L 0 ${height} Z`} fill={`url(#sg-${color.replace('#', '')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      <circle cx="100" cy={lastY} r="1.8" fill={color} />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Stat tile
// ═══════════════════════════════════════════════════════════════════════════
interface StatProps {
  label: string
  value: number
  suffix?: string
  prefix?: string
  icon: React.ReactNode
  accent?: 'primary' | 'risk' | 'ok' | 'warn'
  hint?: string
  spark: number[]
  delay?: number
}
function Stat({ label, value, suffix, prefix, icon, accent = 'primary', hint, spark, delay = 0 }: StatProps) {
  const n = useCountUp(value)
  const accentColor = useThemeAccent()
  const accentVar =
    accent === 'risk'
      ? 'var(--risk-high)'
      : accent === 'ok'
      ? 'var(--risk-low)'
      : accent === 'warn'
      ? 'var(--risk-medium, #F59E0B)'
      : 'var(--accent-primary)'
  const sparkColor =
    accent === 'ok'
      ? '#10B981'
      : accent === 'warn'
      ? '#F59E0B'
      : accent === 'risk'
      ? '#EF4444'
      : accentColor
  return (
    <div className="landing-stat" style={{ animationDelay: `${delay}ms` }}>
      <div className="landing-stat-head">
        <div className="landing-stat-icon" style={{ color: accentVar, borderColor: accentVar }}>
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
      <div className="landing-stat-spark">
        <Sparkline data={spark} color={sparkColor} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Entry card with 3D tilt
// ═══════════════════════════════════════════════════════════════════════════
interface CardProps {
  href: string
  eyebrow: string
  title: string
  description: string
  metric: string
  metricLabel: string
  icon: React.ReactNode
  delay?: number
}
function EntryCard({ href, eyebrow, title, description, metric, metricLabel, icon, delay = 0 }: CardProps) {
  const ref = useRef<HTMLAnchorElement>(null)

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const rx = (py - 0.5) * -6
    const ry = (px - 0.5) * 8
    el.style.setProperty('--rx', `${rx}deg`)
    el.style.setProperty('--ry', `${ry}deg`)
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <Link
      href={href}
      ref={ref}
      className="landing-card"
      style={{ animationDelay: `${delay}ms` }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="landing-card-sheen" aria-hidden />
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

// ═══════════════════════════════════════════════════════════════════════════
// Live signal ticker
// ═══════════════════════════════════════════════════════════════════════════
function SignalTicker() {
  const items = useMemo(
    () =>
      externalNews.slice(0, 8).map((n) => ({
        id: n.id,
        sev: n.aiClassification.severity,
        text: n.headline,
        source: n.source,
      })),
    []
  )
  const repeated = [...items, ...items]
  return (
    <div className="landing-ticker" aria-label="Live risk signals">
      <div className="landing-ticker-label">
        <Radio size={12} />
        <span>LIVE SIGNAL FEED</span>
      </div>
      <div className="landing-ticker-track">
        <div className="landing-ticker-marquee">
          {repeated.map((it, i) => (
            <span key={`${it.id}-${i}`} className="landing-ticker-item">
              <span className={`landing-ticker-sev sev-${it.sev}`}>{it.sev.toUpperCase()}</span>
              {it.text}
              <span className="landing-ticker-source">· {it.source}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Magnetic primary CTA
// ═══════════════════════════════════════════════════════════════════════════
function MagneticCTA({ href, children }: { href: string; children: React.ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2)
    const y = e.clientY - (r.top + r.height / 2)
    el.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'translate(0, 0)'
  }
  return (
    <span className="landing-magnet-wrap" onMouseMove={onMove} onMouseLeave={onLeave}>
      <Link href={href} ref={ref} className="landing-cta-primary">
        {children}
      </Link>
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const time = useGSTClock()
  const [showThemes, setShowThemes] = useState(false)
  const [revealed, setRevealed] = useState(false)

  // Trigger subtle entrance cascade once on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setRevealed(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Keyboard shortcut: Enter → dashboard (not while theme modal open)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !showThemes) {
        window.location.href = '/dashboard'
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showThemes])

  const totalRisks =
    aggregateKPIs.criticalRisks +
    aggregateKPIs.highRisks +
    aggregateKPIs.mediumRisks +
    aggregateKPIs.lowRisks
  const exposureAED = Math.round(aggregateKPIs.totalFinancialExposure)
  const riskSeries = kpiData.overallRiskScore
  const exposureSeries = kpiData.financialExposure
  const alertSeries = kpiData.aiAlertsPerMonth

  return (
    <main className={`landing-root ${revealed ? 'revealed' : 'pre-reveal'}`}>
      {/* Ambient layers */}
      <div aria-hidden className="landing-bg">
        <div className="landing-mesh" />
        <div className="landing-grid" />
        <ConstellationCanvas />
      </div>
      <CursorSpotlight />

      {/* Live ticker */}
      <SignalTicker />

      {/* Nav */}
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
        <h1 className="landing-hero-title">
          Unified command centre for
          <br />
          enterprise{' '}
          <span className="landing-hero-gradient">resilience</span>.
        </h1>
        <p className="landing-hero-sub">
          An executive operating system that fuses risk registers, ICOFR controls, portfolio
          signals and AI fusion into a single decision surface — purpose-built for Aldar
          Properties.
        </p>
        <div className="landing-hero-cta">
          <MagneticCTA href="/dashboard">
            Enter Operating System <ArrowRight size={16} />
          </MagneticCTA>
          <Link href="/scenarios" className="landing-cta-ghost">
            View Scenarios
          </Link>
        </div>
        <div className="landing-kbd-hint">
          Press <kbd>Enter</kbd> <CornerDownLeft size={11} /> to continue
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
            spark={exposureSeries}
            delay={0}
          />
          <Stat
            label="Active Risks"
            value={totalRisks}
            icon={<AlertTriangle size={14} />}
            accent="warn"
            hint={`${aggregateKPIs.criticalRisks} critical · ${aggregateKPIs.highRisks} high`}
            spark={riskSeries}
            delay={100}
          />
          <Stat
            label="ICOFR Controls"
            value={controlSummary.total}
            icon={<Shield size={14} />}
            accent="ok"
            hint={`${controlSummary.coveragePercent}% effective coverage`}
            spark={[14, 16, 17, 17, 18, 18, 19, 19, 20, 20, 20, 20]}
            delay={200}
          />
          <Stat
            label="AI Signals Today"
            value={aggregateKPIs.aiAlertsToday}
            icon={<Activity size={14} />}
            accent="primary"
            hint="Fused from 4 sources"
            spark={alertSeries}
            delay={300}
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
            delay={0}
          />
          <EntryCard
            href="/control-command-center"
            eyebrow="02 · ICOFR"
            title="Control Command Center"
            description="Design, test, and monitor the full control library across 6 ICOFR steps with AI-flagged weaknesses."
            metric={`${controlSummary.effective}/${controlSummary.total}`}
            metricLabel="Effective Controls"
            icon={<Shield size={18} />}
            delay={90}
          />
          <EntryCard
            href="/portfolio"
            eyebrow="03 · PORTFOLIO"
            title="Portfolio Risk"
            description="Real estate, retail, hospitality, education and facilities — drill through exposures and leading indicators."
            metric="5"
            metricLabel="Portfolios Monitored"
            icon={<TrendingUp size={18} />}
            delay={180}
          />
          <EntryCard
            href="/scenarios"
            eyebrow="04 · SCENARIOS"
            title="Scenario Lab"
            description="Stress-test board scenarios with AI-simulated cascade effects across risk, control and financial lines."
            metric="12"
            metricLabel="Playbooks Ready"
            icon={<GitBranch size={18} />}
            delay={270}
          />
        </div>
      </section>

      {/* Trust strip */}
      <section className="landing-trust">
        <div className="landing-trust-item"><CheckCircle2 size={14} /> ICOFR-aligned</div>
        <div className="landing-trust-item"><CheckCircle2 size={14} /> COSO 2013 mapped</div>
        <div className="landing-trust-item"><CheckCircle2 size={14} /> SCA disclosure-ready</div>
        <div className="landing-trust-item"><CheckCircle2 size={14} /> IFRS-compliant exposure</div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div>
          © {new Date().getFullYear()} Aldar Properties PJSC · Abu Dhabi ·
          Prepared by Protiviti
        </div>
        <div className="landing-footer-right">
          <span>v2.2 · {new Date().toISOString().slice(0, 10)}</span>
        </div>
      </footer>

      {showThemes && <ThemeSelector onClose={() => setShowThemes(false)} />}
    </main>
  )
}
