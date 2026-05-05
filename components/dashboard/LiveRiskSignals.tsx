'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  ExternalLink,
  RefreshCw,
  X,
  Wifi,
  WifiOff,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Cpu,
  Building2,
  ShoppingBag,
  Hotel,
  GraduationCap,
  Layers,
  MapPin,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import type { NewsItem } from '@/app/api/news/route'
import type { AIClassification } from '@/app/api/ai-classify/route'

// ─── Types ────────────────────────────────────────────────────────────────────
type Severity = 'critical' | 'high' | 'medium' | 'low'

// ─── Config maps ─────────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  critical: {
    label: 'CRITICAL',
    icon: AlertTriangle,
    color: 'var(--risk-critical)',
    bg: 'rgba(255,59,59,0.1)',
    border: 'rgba(255,59,59,0.3)',
  },
  high: {
    label: 'HIGH',
    icon: AlertCircle,
    color: 'var(--risk-high)',
    bg: 'rgba(255,140,0,0.1)',
    border: 'rgba(255,140,0,0.3)',
  },
  medium: {
    label: 'MEDIUM',
    icon: Info,
    color: 'var(--risk-medium)',
    bg: 'rgba(245,197,24,0.08)',
    border: 'rgba(245,197,24,0.25)',
  },
  low: {
    label: 'LOW',
    icon: CheckCircle,
    color: 'var(--risk-low)',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
  },
}

const BUSINESS_CONFIG: Record<
  AIClassification['impactedBusiness'],
  { label: string; icon: React.ElementType; color: string }
> = {
  'real estate': { label: 'Real Estate', icon: Building2, color: 'var(--chart-1)' },
  retail: { label: 'Retail', icon: ShoppingBag, color: 'var(--chart-2)' },
  hospitality: { label: 'Hospitality', icon: Hotel, color: 'var(--chart-3)' },
  education: { label: 'Education', icon: GraduationCap, color: 'var(--chart-4)' },
  'cross-portfolio': { label: 'Cross-Portfolio', icon: Layers, color: 'var(--accent-primary)' },
}

// ─── Keyword fallback severity ────────────────────────────────────────────────
function keywordSeverity(headline: string): Severity {
  const h = headline.toLowerCase()
  if (h.match(/crisis|crash|collapse|bankrupt|sanctions|fraud|penalty|major loss/)) return 'critical'
  if (h.match(/surge|spike|drop|decline|warning|shortage|tighten|restrict|delay|disruption/)) return 'high'
  if (h.match(/increase|growth|expand|launch|invest|record|rise/)) return 'medium'
  return 'low'
}

// ─── Time helper ──────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────
function ConfidenceBar({ score, compact = false }: { score: number; compact?: boolean }) {
  const color =
    score >= 75 ? 'var(--risk-low)' : score >= 50 ? 'var(--risk-medium)' : 'var(--risk-high)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {!compact && (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem', minWidth: '60px' }}>
          Confidence
        </span>
      )}
      <div
        style={{
          flex: 1,
          height: compact ? '3px' : '4px',
          backgroundColor: 'var(--bg-hover)',
          borderRadius: '2px',
          overflow: 'hidden',
          minWidth: compact ? '40px' : '80px',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '2px',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span style={{ color, fontSize: '0.62rem', fontWeight: 700, minWidth: '28px' }}>
        {score}%
      </span>
    </div>
  )
}

// ─── Severity Badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity]
  const Icon = cfg.icon
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontSize: '0.58rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        padding: '2px 6px',
        borderRadius: '4px',
        border: `1px solid ${cfg.border}`,
        flexShrink: 0,
      }}
    >
      <Icon size={9} />
      {cfg.label}
    </span>
  )
}

// ─── Business Badge ───────────────────────────────────────────────────────────
function BusinessBadge({ business }: { business: AIClassification['impactedBusiness'] }) {
  const cfg = BUSINESS_CONFIG[business]
  const Icon = cfg.icon
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        backgroundColor: `${cfg.color}12`,
        color: cfg.color,
        fontSize: '0.58rem',
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: '4px',
        border: `1px solid ${cfg.color}25`,
        flexShrink: 0,
      }}
    >
      <Icon size={9} />
      {cfg.label}
    </span>
  )
}

// ─── AI Insight Pill ──────────────────────────────────────────────────────────
function AIBadge({ loading }: { loading: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        backgroundColor: loading ? 'var(--bg-hover)' : 'rgba(201,168,76,0.12)',
        color: loading ? 'var(--text-muted)' : 'var(--accent-primary)',
        fontSize: '0.58rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        padding: '2px 6px',
        borderRadius: '4px',
        border: `1px solid ${loading ? 'var(--border-color)' : 'rgba(201,168,76,0.3)'}`,
        flexShrink: 0,
      }}
    >
      <Cpu size={8} />
      {loading ? 'ANALYZING…' : 'AI INSIGHT'}
    </span>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function NewsModal({
  item,
  ai,
  aiLoading,
  onClose,
}: {
  item: NewsItem
  ai: AIClassification | null
  aiLoading: boolean
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const severity = (ai?.severity as Severity) || keywordSeverity(item.headline)
  const cfg = SEVERITY_CONFIG[severity]

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', click)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', click)
      document.removeEventListener('keydown', key)
    }
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        padding: '20px',
      }}
    >
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          backgroundColor: 'var(--bg-card)',
          border: `1px solid ${cfg.color}35`,
          borderRadius: '18px',
          padding: '28px',
          width: '580px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${cfg.color}15`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: cfg.bg,
                border: `1px solid ${cfg.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {React.createElement(cfg.icon, { size: 16, style: { color: cfg.color } })}
            </div>
            <div>
              <div style={{ color: cfg.color, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {ai?.riskType || 'Risk Signal'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>
                External Intelligence — Aldar Risk Platform
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Headline */}
        <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, lineHeight: 1.5, marginBottom: '16px' }}>
          {item.headline}
        </p>

        {/* Badge row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          <SeverityBadge severity={severity} />
          {ai && <BusinessBadge business={ai.impactedBusiness} />}
          <AIBadge loading={aiLoading && !ai} />
        </div>

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Globe size={11} style={{ color: 'var(--accent-primary)' }} />
            {item.url && item.url !== '#' ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}
              >
                {item.source}
                <ExternalLink size={9} style={{ marginLeft: '3px', display: 'inline' }} />
              </a>
            ) : (
              <span style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600 }}>{item.source}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={11} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{timeAgo(item.publishedAt)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              {new Date(item.publishedAt).toLocaleDateString('en-AE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          {ai && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{ai.regionsAffected}</span>
            </div>
          )}
        </div>

        {/* AI Insight block */}
        {aiLoading && !ai ? (
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Cpu size={13} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ color: 'var(--accent-primary)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                AI INSIGHT
              </span>
            </div>
            <div className="skeleton" style={{ height: '12px', width: '100%', marginBottom: '6px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '12px', width: '85%', marginBottom: '6px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '12px', width: '70%', borderRadius: '4px' }} />
          </div>
        ) : ai ? (
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: `1px solid rgba(201,168,76,0.2)`,
              backgroundColor: 'rgba(201,168,76,0.05)',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={13} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ color: 'var(--accent-primary)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                  AI INSIGHT
                </span>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 1.65, marginBottom: '12px' }}>
              {ai.explanation}
            </p>
            <ConfidenceBar score={ai.confidenceScore} />
          </div>
        ) : null}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {item.url && item.url !== '#' ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                color: 'var(--on-accent)',
                fontWeight: 700,
                fontSize: '0.8rem',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={13} />
              Read Full Article
            </a>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <ExternalLink size={13} />
              Simulated Source
            </span>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── News Row ─────────────────────────────────────────────────────────────────
function NewsRow({
  item,
  index,
  isNew,
  ai,
  aiLoading,
  onClick,
}: {
  item: NewsItem
  index: number
  isNew: boolean
  ai: AIClassification | null
  aiLoading: boolean
  onClick: () => void
}) {
  const severity = (ai?.severity as Severity) || keywordSeverity(item.headline)
  const cfg = SEVERITY_CONFIG[severity]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.22, delay: isNew ? 0 : index * 0.035 }}
      onClick={onClick}
      style={{ padding: '13px 20px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', position: 'relative', transition: 'background 0.15s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
    >
      {/* NEW pill */}
      {isNew && (
        <span
          style={{
            position: 'absolute',
            top: '13px',
            right: '20px',
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--on-accent)',
            fontSize: '0.52rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            padding: '1px 5px',
            borderRadius: '3px',
          }}
        >
          NEW
        </span>
      )}

      {/* Severity left bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '10px',
          bottom: '10px',
          width: '3px',
          borderRadius: '0 2px 2px 0',
          backgroundColor: cfg.color,
          opacity: 0.75,
        }}
      />

      {/* Row 1: badges + source + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', flexWrap: 'wrap' }}>
        <SeverityBadge severity={severity} />
        {ai ? (
          <BusinessBadge business={ai.impactedBusiness} />
        ) : aiLoading ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: 'var(--bg-hover)',
              color: 'var(--text-muted)',
              fontSize: '0.56rem',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
            }}
          >
            <Cpu size={8} />
            CLASSIFYING
          </span>
        ) : null}
        <span style={{ color: 'var(--accent-primary)', fontSize: '0.63rem', fontWeight: 600, marginLeft: '2px' }}>
          {item.source}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>{timeAgo(item.publishedAt)}</span>
      </div>

      {/* Headline */}
      <p
        style={{
          color: 'var(--text-primary)',
          fontSize: '0.82rem',
          fontWeight: 500,
          lineHeight: 1.45,
          marginBottom: ai ? '6px' : '0',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {item.headline}
      </p>

      {/* AI explanation preview */}
      {ai && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
          <TrendingUp size={10} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.72rem',
              lineHeight: 1.45,
              flex: 1,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {ai.explanation}
          </p>
          <ConfidenceBar score={ai.confidenceScore} compact />
        </div>
      )}
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function LiveRiskSignals() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [source, setSource] = useState<string>('loading')
  const [newsLoading, setNewsLoading] = useState(true)
  const [aiData, setAiData] = useState<Record<string, AIClassification>>({})
  const [aiLoading, setAiLoading] = useState(false)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const prevIds = useRef<Set<string>>(new Set())
  const classifiedIds = useRef<Set<string>>(new Set())

  // ── Classify unclassified items via Claude ──────────────────────────────────
  const classifyItems = useCallback(async (toClassify: NewsItem[]) => {
    if (toClassify.length === 0) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai-classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: toClassify.map((it) => ({ id: it.id, headline: it.headline, source: it.source })),
        }),
      })
      if (!res.ok) throw new Error('classify failed')
      const data = await res.json()

      const map: Record<string, AIClassification> = {}
      for (const r of data.results || []) {
        map[r.id] = r.classification
      }
      setAiData((prev) => ({ ...prev, ...map }))

      // Only mark as classified when the server actually returned AI results
      // (not keyword fallbacks). This allows retry after transient failures
      // like rate-limits or quota resets.
      if (data.source === 'ai') {
        toClassify.forEach((it) => classifiedIds.current.add(it.id))
      }
    } catch {
      // Silent fail — cards still show keyword-based severity; ids are NOT
      // added to classifiedIds so the next refresh interval will retry.
    } finally {
      setAiLoading(false)
    }
  }, [])

  // ── Fetch news ──────────────────────────────────────────────────────────────
  const fetchNews = useCallback(
    async (isInitial = false) => {
      try {
        const res = await fetch('/api/news', { cache: 'no-store' })
        if (!res.ok) throw new Error('news fetch failed')
        const data = await res.json()
        const incoming: NewsItem[] = data.items || []

        // Detect new items
        if (!isInitial) {
          const fresh = new Set<string>()
          incoming.forEach((it) => { if (!prevIds.current.has(it.id)) fresh.add(it.id) })
          if (fresh.size > 0) {
            setNewIds(fresh)
            setTimeout(() => setNewIds(new Set()), 8000)
          }
        }

        prevIds.current = new Set(incoming.map((it) => it.id))
        setItems(incoming)
        setSource(data.source || 'live')
        setLastRefresh(new Date())

        // Classify items not yet classified
        const unclassified = incoming.filter((it) => !classifiedIds.current.has(it.id))
        if (unclassified.length > 0) classifyItems(unclassified)
      } catch {
        if (isInitial) setSource('error')
      } finally {
        if (isInitial) setNewsLoading(false)
      }
    },
    [classifyItems]
  )

  useEffect(() => { fetchNews(true) }, [fetchNews])
  useEffect(() => {
    const id = setInterval(() => fetchNews(false), 10000)
    return () => clearInterval(id)
  }, [fetchNews])

  const isLive = source === 'live'

  return (
    <>
      <Card style={{ height: '100%' }}>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={14} style={{ color: 'var(--accent-primary)' }} />
            <CardTitle>Live Risk Signals</CardTitle>

            {/* Live/Simulated indicator */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 7px',
                borderRadius: '4px',
                backgroundColor: isLive ? 'rgba(34,197,94,0.1)' : 'rgba(201,168,76,0.1)',
                border: `1px solid ${isLive ? 'rgba(34,197,94,0.3)' : 'rgba(201,168,76,0.3)'}`,
              }}
            >
              {isLive
                ? <Wifi size={9} style={{ color: '#22C55E' }} />
                : <WifiOff size={9} style={{ color: 'var(--accent-primary)' }} />}
              <span
                style={{
                  color: isLive ? '#22C55E' : 'var(--accent-primary)',
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                }}
              >
                {source === 'loading' ? 'LOADING' : isLive ? 'LIVE' : 'SIMULATED'}
              </span>
            </span>

            {/* AI status */}
            {items.length > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  backgroundColor: aiLoading ? 'var(--bg-hover)' : 'rgba(201,168,76,0.1)',
                  border: `1px solid ${aiLoading ? 'var(--border-color)' : 'rgba(201,168,76,0.3)'}`,
                }}
              >
                <Cpu size={9} style={{ color: aiLoading ? 'var(--text-muted)' : 'var(--accent-primary)' }} />
                <span
                  style={{
                    color: aiLoading ? 'var(--text-muted)' : 'var(--accent-primary)',
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                  }}
                >
                  {aiLoading
                    ? 'AI ANALYZING…'
                    : `AI ${Object.keys(aiData).length}/${items.length}`}
                </span>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {lastRefresh && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>
                {timeAgo(lastRefresh.toISOString())}
              </span>
            )}
            <button
              onClick={() => fetchNews(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
              title="Refresh"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </CardHeader>

        <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
          {newsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ padding: '13px 20px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '7px' }}>
                  <div className="skeleton" style={{ height: '18px', width: '60px', borderRadius: '4px' }} />
                  <div className="skeleton" style={{ height: '18px', width: '80px', borderRadius: '4px' }} />
                </div>
                <div className="skeleton" style={{ height: '13px', width: '92%', marginBottom: '5px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ height: '13px', width: '70%', borderRadius: '4px' }} />
              </div>
            ))
          ) : (
            <AnimatePresence initial={false}>
              {items.map((item, i) => (
                <NewsRow
                  key={item.id}
                  item={item}
                  index={i}
                  isNew={newIds.has(item.id)}
                  ai={aiData[item.id] || null}
                  aiLoading={aiLoading}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </AnimatePresence>
          )}
          {!newsLoading && items.length === 0 && (
            <CardBody>
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No signals available
              </div>
            </CardBody>
          )}
        </div>
      </Card>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <NewsModal
            item={selectedItem}
            ai={aiData[selectedItem.id] || null}
            aiLoading={aiLoading && !aiData[selectedItem.id]}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
