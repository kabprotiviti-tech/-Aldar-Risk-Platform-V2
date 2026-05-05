'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Database,
  Globe,
  ArrowUpRight,
  Server,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { internalSignals, internalSnapshot } from '@/lib/internalData'
import type { InternalSignal } from '@/lib/internalData'
import type { FusionResult } from '@/app/api/fusion/route'
import type { NewsItem } from '@/app/api/news/route'

// ─── Config ───────────────────────────────────────────────────────────────────
type Severity = 'critical' | 'high' | 'medium' | 'low'

const SEVERITY_CFG: Record<Severity, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  critical: { color: 'var(--risk-critical)', bg: 'rgba(255,59,59,0.1)', border: 'rgba(255,59,59,0.25)', icon: AlertTriangle },
  high:     { color: 'var(--risk-high)',     bg: 'rgba(255,140,0,0.1)', border: 'rgba(255,140,0,0.25)', icon: AlertCircle },
  medium:   { color: 'var(--risk-medium)',   bg: 'rgba(245,197,24,0.08)', border: 'rgba(245,197,24,0.22)', icon: Info },
  low:      { color: 'var(--risk-low)',      bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.22)', icon: CheckCircle },
}

const IMPACT_CFG: Record<FusionResult['impactLevel'], { label: string; color: string; bg: string }> = {
  critical: { label: 'CRITICAL IMPACT', color: 'var(--risk-critical)', bg: 'rgba(255,59,59,0.12)' },
  high:     { label: 'HIGH IMPACT',     color: 'var(--risk-high)',     bg: 'rgba(255,140,0,0.12)' },
  medium:   { label: 'MEDIUM IMPACT',   color: 'var(--risk-medium)',   bg: 'rgba(245,197,24,0.1)'  },
  low:      { label: 'LOW IMPACT',      color: 'var(--risk-low)',      bg: 'rgba(34,197,94,0.1)'   },
}

const SYSTEM_COLORS: Record<InternalSignal['system'], string> = {
  ERP:             'var(--chart-2)',
  CRM:             'var(--chart-3)',
  Projects:        'var(--chart-1)',
  'Risk Register': 'var(--risk-high)',
  Finance:         'var(--accent-primary)',
}

// ─── Trend icon ───────────────────────────────────────────────────────────────
function TrendIcon({ trend }: { trend: InternalSignal['trend'] }) {
  if (trend === 'improving') return <TrendingUp size={10} style={{ color: 'var(--risk-low)' }} />
  if (trend === 'declining' || trend === 'alert') return <TrendingDown size={10} style={{ color: 'var(--risk-high)' }} />
  return <Minus size={10} style={{ color: 'var(--text-muted)' }} />
}

// ─── Internal Signal Card ─────────────────────────────────────────────────────
function SignalCard({
  signal,
  expanded,
  onToggle,
}: {
  signal: InternalSignal
  expanded: boolean
  onToggle: () => void
}) {
  const sev = SEVERITY_CFG[signal.severity]
  const SevIcon = sev.icon
  const sysColor = SYSTEM_COLORS[signal.system]

  return (
    <div
      onClick={onToggle}
      style={{
        padding: '9px 12px',
        marginBottom: '5px',
        borderRadius: '8px',
        backgroundColor: expanded ? sev.bg : 'var(--bg-secondary)',
        border: `1px solid ${expanded ? sev.border : 'var(--border-color)'}`,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '5px',
              backgroundColor: `${sysColor}18`,
              border: `1px solid ${sysColor}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Server size={10} style={{ color: sysColor }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                {signal.label}:
              </span>
              <span style={{ color: sev.color, fontSize: '0.75rem', fontWeight: 700 }}>
                {signal.value}{signal.unit || ''}
              </span>
              <TrendIcon trend={signal.trend} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
              <span
                style={{
                  color: sysColor,
                  fontSize: '0.58rem',
                  fontWeight: 600,
                  backgroundColor: `${sysColor}12`,
                  padding: '1px 4px',
                  borderRadius: '3px',
                  border: `1px solid ${sysColor}20`,
                }}
              >
                {signal.system}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>{signal.category}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <SevIcon size={11} style={{ color: sev.color }} />
          {expanded ? (
            <ChevronUp size={11} style={{ color: 'var(--text-muted)' }} />
          ) : (
            <ChevronDown size={11} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', lineHeight: 1.5, marginTop: '7px', paddingTop: '7px', borderTop: `1px solid ${sev.border}` }}>
              {signal.detail}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Fusion Insight Block ─────────────────────────────────────────────────────
function FusionInsightBlock({
  fusion,
  externalHeadline,
  externalSource,
  expanded,
  onToggle,
}: {
  fusion: FusionResult
  externalHeadline: string
  externalSource: string
  expanded: boolean
  onToggle: () => void
}) {
  const impact = IMPACT_CFG[fusion.impactLevel]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Impact level banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 12px',
          borderRadius: '8px 8px 0 0',
          backgroundColor: impact.bg,
          border: `1px solid ${impact.color}30`,
          borderBottom: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={12} style={{ color: impact.color }} />
          <span style={{ color: impact.color, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em' }}>
            AI FUSION INSIGHT
          </span>
          <span
            style={{
              backgroundColor: impact.bg,
              color: impact.color,
              fontSize: '0.58rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '3px',
              border: `1px solid ${impact.color}40`,
            }}
          >
            {impact.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {fusion.amplified ? (
            <ArrowUpRight size={11} style={{ color: 'var(--risk-high)' }} />
          ) : (
            <TrendingDown size={11} style={{ color: 'var(--risk-low)' }} />
          )}
          <span
            style={{
              color: fusion.amplified ? 'var(--risk-high)' : 'var(--risk-low)',
              fontSize: '0.6rem',
              fontWeight: 700,
            }}
          >
            {fusion.amplified ? 'AMPLIFIED' : 'MITIGATED'}
          </span>
        </div>
      </div>

      {/* Main insight */}
      <div
        style={{
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          border: `1px solid ${impact.color}20`,
          borderTop: 'none',
          borderRadius: expanded ? '0' : '0 0 8px 8px',
        }}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.65, marginBottom: '8px' }}>
          {fusion.fusionInsight}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>Affected:</span>
          <span
            style={{
              color: impact.color,
              fontSize: '0.62rem',
              fontWeight: 700,
              backgroundColor: impact.bg,
              padding: '1px 6px',
              borderRadius: '3px',
            }}
          >
            {fusion.affectedBusiness}
          </span>
          {fusion.contributingFactors.slice(0, 2).map((f, i) => (
            <span
              key={i}
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.6rem',
                backgroundColor: 'var(--bg-hover)',
                padding: '1px 6px',
                borderRadius: '3px',
                border: '1px solid var(--border-color)',
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '6px',
          backgroundColor: 'var(--bg-hover)',
          border: `1px solid ${impact.color}15`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          color: 'var(--text-muted)',
          fontSize: '0.65rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          transition: 'background 0.15s',
        }}
      >
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {expanded ? 'Hide reasoning' : 'View full reasoning + signals'}
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '14px',
                backgroundColor: 'var(--bg-card)',
                border: `1px solid ${impact.color}20`,
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
              }}
            >
              {/* Reasoning */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Reasoning
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.77rem', lineHeight: 1.65 }}>
                  {fusion.reasoning}
                </p>
              </div>

              {/* Contributing signals */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Contributing Signals
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* External */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '7px 9px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <Globe size={11} style={{ color: 'var(--chart-2)', flexShrink: 0, marginTop: '1px' }} />
                    <div>
                      <span style={{ color: 'var(--chart-2)', fontSize: '0.6rem', fontWeight: 700 }}>EXTERNAL · {externalSource}</span>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: '1px', lineHeight: 1.4 }}>{externalHeadline}</p>
                    </div>
                  </div>
                  {/* Internal */}
                  {internalSignals.slice(0, 3).map((sig) => (
                    <div
                      key={sig.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '7px 9px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <Database size={11} style={{ color: SYSTEM_COLORS[sig.system], flexShrink: 0, marginTop: '1px' }} />
                      <div>
                        <span style={{ color: SYSTEM_COLORS[sig.system], fontSize: '0.6rem', fontWeight: 700 }}>
                          INTERNAL · {sig.system}
                        </span>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: '1px', lineHeight: 1.4 }}>
                          {sig.label}: {sig.value}{sig.unit || ''} — {sig.trend}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All contributing factors */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {fusion.contributingFactors.map((f, i) => (
                  <span
                    key={i}
                    style={{
                      color: impact.color,
                      fontSize: '0.62rem',
                      fontWeight: 600,
                      backgroundColor: impact.bg,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${impact.color}25`,
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AIFusionPanel() {
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null)
  const [fusion, setFusion] = useState<FusionResult | null>(null)
  const [fusionLoading, setFusionLoading] = useState(false)
  const [fusionExpanded, setFusionExpanded] = useState(false)
  const [triggerSource, setTriggerSource] = useState({ headline: '', source: '' })
  const lastFusedAt = useRef<number>(0)
  const FUSION_COOLDOWN = 5 * 60 * 1000 // 5 minutes

  const runFusion = useCallback(async (headline: string, source: string, force = false) => {
    if (!force && Date.now() - lastFusedAt.current < FUSION_COOLDOWN) return
    if (!headline) return

    setFusionLoading(true)
    setTriggerSource({ headline, source })
    try {
      const res = await fetch('/api/fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalHeadline: headline,
          externalSource: source,
          internalData: internalSnapshot,
        }),
      })
      if (!res.ok) throw new Error('fusion failed')
      const data = await res.json()
      setFusion(data.result)
      lastFusedAt.current = Date.now()
    } catch {
      // Silent fail — panel stays with previous result or empty
    } finally {
      setFusionLoading(false)
    }
  }, [])

  // On mount: fetch latest news headline and trigger fusion
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/news', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const first: NewsItem = data.items?.[0]
        if (first) runFusion(first.headline, first.source)
      } catch {}
    }
    init()
  }, [runFusion])

  const handleRefresh = async () => {
    try {
      const res = await fetch('/api/news', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      const first: NewsItem = data.items?.[0]
      if (first) runFusion(first.headline, first.source, true)
    } catch {}
  }

  return (
    <Card style={{ height: '100%' }}>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Cpu size={14} style={{ color: 'var(--accent-primary)' }} />
          <CardTitle>AI Fusion Layer</CardTitle>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.3)',
              color: 'var(--accent-primary)',
              fontSize: '0.56rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            AI
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={fusionLoading}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: fusionLoading ? 'not-allowed' : 'pointer',
            color: 'var(--text-muted)',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            opacity: fusionLoading ? 0.5 : 1,
          }}
          title="Re-run fusion with latest signal"
        >
          <RefreshCw size={12} className={fusionLoading ? 'animate-spin' : ''} />
        </button>
      </CardHeader>

      <div style={{ overflowY: 'auto', maxHeight: '560px' }}>
        <CardBody className="space-y-0" style={{ padding: '14px 14px 8px' }}>

          {/* ── Internal Signals ── */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
              }}
            >
              <Database size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Internal Signals
              </span>
              <span
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  color: 'var(--text-muted)',
                  fontSize: '0.56rem',
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                {internalSignals.length} signals
              </span>
            </div>

            {internalSignals.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                expanded={expandedSignal === signal.id}
                onToggle={() =>
                  setExpandedSignal(expandedSignal === signal.id ? null : signal.id)
                }
              />
            ))}
          </div>

          {/* ── Divider ── */}
          <div className="divider" style={{ margin: '10px 0' }} />

          {/* ── AI Fusion Result ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Cpu size={11} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Unified Risk Intelligence
              </span>
            </div>

            {fusionLoading ? (
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Cpu size={12} style={{ color: 'var(--accent-primary)' }} className="animate-pulse" />
                  <span style={{ color: 'var(--accent-primary)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                    FUSING SIGNALS…
                  </span>
                </div>
                <div className="skeleton" style={{ height: '11px', width: '100%', marginBottom: '5px', borderRadius: '3px' }} />
                <div className="skeleton" style={{ height: '11px', width: '88%', marginBottom: '5px', borderRadius: '3px' }} />
                <div className="skeleton" style={{ height: '11px', width: '72%', borderRadius: '3px' }} />
              </div>
            ) : fusion ? (
              <FusionInsightBlock
                fusion={fusion}
                externalHeadline={triggerSource.headline}
                externalSource={triggerSource.source}
                expanded={fusionExpanded}
                onToggle={() => setFusionExpanded((v) => !v)}
              />
            ) : (
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Awaiting external signal to run fusion…
                </p>
              </div>
            )}
          </div>

          {/* ── Demo Disclaimer ── */}
          <div
            style={{
              marginTop: '14px',
              padding: '8px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <p style={{ color: 'var(--text-muted)', fontSize: '0.62rem', lineHeight: 1.55, textAlign: 'center' }}>
              Simulated internal signals for demo. In production, integrated with Oracle Fusion ERP, Salesforce CRM, Primavera P6, and Aldar risk register systems.
            </p>
          </div>

        </CardBody>
      </div>
    </Card>
  )
}
