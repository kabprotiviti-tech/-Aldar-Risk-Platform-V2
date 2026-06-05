'use client'

import React, { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, WifiOff } from 'lucide-react'

interface MarketData {
  symbol?: string
  price?: number
  change?: number
  changePercent?: number
  currency?: string
  source?: string
  status: 'ok' | 'unavailable'
}

const pill: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 10px',
  borderRadius: '7px',
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-accent)',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

export function MarketWidget() {
  const [data, setData] = useState<MarketData | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        // 5s timeout so a slow/dropped network never leaves the widget
        // (or the header) waiting indefinitely.
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 5000)
        const res = await fetch('/api/market-data', { signal: ctrl.signal })
        clearTimeout(t)
        setData(await res.json())
      } catch { /* silent — falls back to "Unavailable" */ }
    }
    load()
    const id = setInterval(load, 120_000) // refresh every 2 min
    return () => clearInterval(id)
  }, [])

  // Loading skeleton
  if (!data) {
    return (
      <div style={pill}>
        <Minus size={11} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ABC</span>
      </div>
    )
  }

  // No live quote — show a calm dash, never a red "unavailable" error.
  if (data.status === 'unavailable' || !data.price) {
    return (
      <div title="ABC · ADX — market quote not available right now" style={pill}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, lineHeight: 1.2 }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>ABC · ADX</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>—</span>
        </div>
      </div>
    )
  }

  const { price, changePercent = 0, source } = data
  const positive = changePercent >= 0
  const flat = Math.abs(changePercent) < 0.001
  const color = flat ? 'var(--text-muted)' : positive ? 'var(--risk-low)' : 'var(--risk-critical)'
  const Icon = flat ? Minus : positive ? TrendingUp : TrendingDown
  const sign = positive && !flat ? '+' : ''

  return (
    <div title={source} style={pill}>
      <Icon size={12} style={{ color, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          ABC · ADX
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>
          AED {price.toFixed(2)}{' '}
          <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>
            {sign}{changePercent.toFixed(2)}%
          </span>
        </span>
      </div>
    </div>
  )
}
