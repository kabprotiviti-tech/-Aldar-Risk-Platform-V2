'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  X, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Building2, Tag, DollarSign, User, Cpu, ChevronRight,
} from 'lucide-react'
import type { Risk } from '@/lib/simulated-data'
import { portfolioNames } from '@/lib/simulated-data'
import { AIInsightBox } from '@/components/ui/AIInsightBox'

// ─── Types / helpers ──────────────────────────────────────────────────────────

type RiskCategory = string

function getSeverity(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 16) return 'critical'
  if (score >= 10) return 'high'
  if (score >= 6) return 'medium'
  return 'low'
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

const PORTFOLIO_COLORS: Record<string, string> = {
  'real-estate': '#C9A84C',
  retail: '#4A9EFF',
  hospitality: '#A855F7',
  education: '#22C55E',
  facilities: '#FF6B6B',
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'increasing') return <TrendingUp size={13} style={{ color: 'var(--risk-high)' }} />
  if (trend === 'decreasing') return <TrendingDown size={13} style={{ color: 'var(--risk-low)' }} />
  return <Minus size={13} style={{ color: 'var(--text-muted)' }} />
}

// ─── Zone Peers ───────────────────────────────────────────────────────────────

function getZonePeers(selected: Risk, allRisks: Risk[]): Risk[] {
  return allRisks
    .filter(
      (r) =>
        r.id !== selected.id &&
        Math.abs(r.likelihood - selected.likelihood) <= 1 &&
        Math.abs(r.impact - selected.impact) <= 1
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
}

function groupByCategory(risks: Risk[]): Record<string, Risk[]> {
  return risks.reduce<Record<string, Risk[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category].push(r)
    return acc
  }, {})
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  risk: Risk
  allRisks: Risk[]
  onClose: () => void
}

export function RiskDrillDownPanel({ risk, allRisks, onClose }: Props) {
  const severity = getSeverity(risk.score)
  const sevColor = SEV_COLOR[severity]
  const sevBg = SEV_BG[severity]
  const portColor = PORTFOLIO_COLORS[risk.portfolio] || 'var(--accent-primary)'

  const peers = useMemo(() => getZonePeers(risk, allRisks), [risk, allRisks])
  const grouped = useMemo(() => groupByCategory(peers), [peers])

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: `1px solid ${sevColor}40`,
        borderTop: `3px solid ${sevColor}`,
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: sevBg,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            {/* Severity badge */}
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: '5px',
                backgroundColor: sevBg,
                border: `1px solid ${sevColor}40`,
                color: sevColor,
              }}
            >
              {severity}
            </span>
            {/* Score */}
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: sevColor,
                padding: '2px 8px',
                borderRadius: '5px',
                backgroundColor: `${sevColor}12`,
                border: `1px solid ${sevColor}25`,
              }}
            >
              Score {risk.score}/25
            </span>
            {/* Trend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <TrendIcon trend={risk.trend} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                {risk.trend.charAt(0).toUpperCase() + risk.trend.slice(1)}
              </span>
            </div>
          </div>

          <div style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, lineHeight: 1.35 }}>
            {risk.title}
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            color: 'var(--text-muted)',
            transition: 'background-color 0.15s',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Left column: details */}
        <div>
          {/* Meta chips */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '16px',
            }}
          >
            {[
              { Icon: Building2, label: portfolioNames[risk.portfolio] || risk.portfolio, color: portColor },
              { Icon: Tag, label: risk.category, color: 'var(--accent-primary)' },
              { Icon: DollarSign, label: `AED ${risk.financialImpact}M`, color: sevColor },
              { Icon: User, label: risk.owner, color: 'var(--text-muted)' },
            ].map(({ Icon, label, color }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <Icon size={11} style={{ color, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 500 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* L × I grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            {[
              { label: 'Likelihood', value: `${risk.likelihood}/5` },
              { label: 'Impact', value: `${risk.impact}/5` },
              { label: 'Status', value: risk.status.charAt(0).toUpperCase() + risk.status.slice(1) },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {m.label}
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 800 }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Description
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.65 }}>
              {risk.description}
            </p>
          </div>

          {/* Last updated */}
          <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
            Last updated: {risk.lastUpdated}
          </div>
        </div>

        {/* Right column: AI + zone peers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* AI Explanation */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Cpu size={12} style={{ color: 'var(--accent-primary)' }} />
              <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
                AI Explanation
              </div>
            </div>
            <AIInsightBox
              insight={risk.aiInsight}
              confidence={0.84}
              compact
              source={`Risk Intelligence Engine — ${risk.id}`}
            />
          </div>

          {/* Top risks in this zone */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <AlertTriangle size={12} style={{ color: sevColor }} />
              <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
                Top Risks in This Zone
                <span style={{ color: sevColor, marginLeft: '6px' }}>
                  L{Math.max(1, risk.likelihood - 1)}–{Math.min(5, risk.likelihood + 1)} × I{Math.max(1, risk.impact - 1)}–{Math.min(5, risk.impact + 1)}
                </span>
              </div>
            </div>

            {peers.length === 0 ? (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                }}
              >
                No other risks in this zone.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Group by category */}
                {Object.entries(grouped).map(([cat, catRisks]) => (
                  <div key={cat}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px', marginTop: '6px' }}>
                      {cat}
                    </div>
                    {catRisks.map((peer) => {
                      const pSev = getSeverity(peer.score)
                      return (
                        <div
                          key={peer.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '7px 10px',
                            borderRadius: '7px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: `1px solid ${SEV_COLOR[pSev]}20`,
                            marginBottom: '3px',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                            <ChevronRight size={10} style={{ color: SEV_COLOR[pSev], flexShrink: 0 }} />
                            <span
                              style={{
                                color: 'var(--text-secondary)',
                                fontSize: '0.72rem',
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {peer.title}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span
                              style={{
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: `${SEV_COLOR[pSev]}12`,
                                color: SEV_COLOR[pSev],
                                textTransform: 'uppercase',
                              }}
                            >
                              {pSev}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                              {peer.score}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
