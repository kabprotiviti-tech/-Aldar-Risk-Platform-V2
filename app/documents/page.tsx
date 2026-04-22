'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Scan,
  Check,
  X,
  AlertTriangle,
  Clock,
  Loader2,
  Plus,
  ShieldAlert,
  Database,
  Server,
  Users,
  HardDrive,
  UploadCloud,
  RefreshCw,
  CheckCircle2,
  WifiOff,
  Hourglass,
  Zap,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { RiskBadge, ConfidenceBadge } from '@/components/ui/Badge'
import { AIInsightBox } from '@/components/ui/AIInsightBox'
import { DocumentUpload } from '@/components/DocumentUpload'
import { DocumentControlExtractor } from '@/components/controls/DocumentControlExtractor'
import { ControlAssessmentPanel } from '@/components/simulation/ControlAssessmentPanel'

// ─── Document Intelligence (paste) ───────────────────────────────────────────

const DOCUMENT_TYPES = [
  { id: 'risk-register', label: 'Risk Register Update' },
  { id: 'governance', label: 'Governance Document' },
  { id: 'project-report', label: 'Project Report' },
  { id: 'board-paper', label: 'Board Paper' },
  { id: 'audit-report', label: 'Internal Audit Report' },
]

const SAMPLE_DOCS = [
  {
    label: 'Project Status Report — Saadiyat Lagoons',
    content: `PROJECT STATUS REPORT — SAADIYAT LAGOONS PHASE 2
Date: April 2026 | Prepared by: Development Division

EXECUTIVE SUMMARY
Saadiyat Lagoons Phase 2 construction is currently tracking at 68% completion against a planned 74% milestone. The project has incurred a cost overrun of approximately AED 48 million attributed primarily to escalating steel prices (+22% vs. original estimate) and MEP subcontractor claims related to material availability issues caused by Red Sea shipping disruptions.

SCHEDULE STATUS
- Current delay: 45 working days behind baseline programme
- Critical path impact: Unit handover date for Tower A now projected Q3 2027 vs. original Q1 2027
- Root cause: Tower crane availability (2 cranes delayed 8 weeks), exacerbated by labour shortfall in specialist MEP trades

FINANCIAL STATUS
- Approved contract value: AED 1.24 billion
- Revised forecast: AED 1.29 billion (4.1% overrun)
- Main contractor claims outstanding: AED 48M (under review by QS)
- Risk contingency remaining: AED 12M (vs. AED 35M at project inception)

COMPLIANCE & REGULATORY
- Building Permit: Valid until December 2026 — extension application required if delays persist
- Environmental Monitoring: Q1 2026 air quality report submitted to EAD, noise variance letter requested
- Worker welfare audit: Scheduled for May 2026 — accommodation standards under review following recent Ministry inspection

RISK FLAGS
1. MEP contractor Electra LLC showing signs of financial distress — payment delays to sub-suppliers reported
2. Structural steel for Tower B not yet procured — 6-month lead time required
3. Neighbouring Saadiyat Cultural District project creating traffic and access conflicts for material delivery

RECOMMENDED ACTIONS
- Issue formal 14-day notice to MEP contractor regarding performance milestones
- Accelerate Tower B steel procurement decision before June 2026
- Engage Abu Dhabi Municipality on building permit extension — proactive not reactive approach`,
  },
  {
    label: 'Risk Committee Agenda — Q2 2026',
    content: `ALDAR PROPERTIES RISK COMMITTEE — Q2 2026 MEETING PAPERS

AGENDA ITEM 3: EMERGING RISKS UPDATE

The following emerging risks have been identified by management for Risk Committee review:

1. CYBER RESILIENCE — SMART BUILDING INFRASTRUCTURE
Following the UAE NCA advisory issued March 2026 regarding nation-state targeting of smart building systems, internal IT security reviewed Aldar's BMS (Building Management System) integration across 23 commercial assets. Findings indicate that 8 assets are using legacy OT protocols (Modbus, BACnet) without adequate IT/OT network segmentation. A penetration testing exercise is recommended at cost of approximately AED 850,000. The CTO has escalated this as a Priority 1 matter requiring Committee endorsement.

2. TENANT COVENANT RISK — RETAIL PORTFOLIO
Legal has flagged that two retail tenants representing AED 28M annual income are subject to parent company restructuring processes. Covenant strength assessments are being updated. Rent deposits of 3-months remain in place. The Risk team recommends upgrading these tenants from 'Monitoring' to 'Active Management' in the risk register.

3. EDUCATION REGULATORY COMPLIANCE
ADEK has issued supplementary guidance requiring all IB schools operating in Abu Dhabi to integrate an expanded UAE Social Studies curriculum component from September 2026. Aldar Education's 8 IB schools will require curriculum redesign, teacher CPD programmes and new learning materials. Total estimated cost: AED 4.2M. Non-compliance would risk school rating downgrade which could affect parent retention.

4. ESG REPORTING READINESS
ADX has confirmed the mandatory IFRS S1/S2 sustainability reporting requirement for FY2026 annual reports. Aldar's ESG team has identified a gap in Scope 3 emissions data coverage — currently only 34% of construction supply chain by spend is covered by emissions data. External consultant engagement required to address gap before year-end. Estimated cost: AED 1.8M.`,
  },
]

interface AuditEntry {
  id: string
  action: 'approved' | 'rejected'
  type: string
  suggestion: string
  timestamp: string
  userId: string
}

interface AnalysisResult {
  documentSummary: string
  extractedRisks: Array<{
    id: string
    title: string
    category: string
    portfolio: string
    likelihood: number
    impact: number
    score: number
    description: string
    financialImpact: string
    source: string
  }>
  suggestedUpdates: Array<{
    type: string
    riskId: string
    suggestion: string
    rationale: string
    urgency: string
    _status?: 'pending' | 'approved' | 'rejected'
  }>
  complianceFlags: Array<{
    regulation: string
    issue: string
    severity: string
    recommendation: string
    deadline?: string
  }>
  insights: string
  confidence: number
  processingNotes: string
  analyzedAt?: string
  documentType?: string
}

function getSev(s: string): 'critical' | 'high' | 'medium' | 'low' {
  if (s === 'critical') return 'critical'
  if (s === 'high') return 'high'
  if (s === 'medium') return 'medium'
  return 'low'
}


type IntegrationStatus = 'connected' | 'pending' | 'connecting' | 'disconnecting'

const INTEGRATION_CONFIGS: {
  id: string
  label: string
  icon: React.ElementType
  route: string
  description: string
  color: string
  kpiKeys: string[]
  protocol: string
  syncInterval: string
}[] = [
  {
    id: 'oracle',
    label: 'Oracle Fusion ERP',
    icon: Database,
    route: '/api/integrations/oracle',
    description: 'Financial data · Cost codes · Project budgets',
    color: '#F97316',
    kpiKeys: ['costVariance', 'scheduleAdherence', 'cashCycleDays'],
    protocol: 'REST API / mTLS',
    syncInterval: '15 min',
  },
  {
    id: 'crm',
    label: 'CRM — Tenant & Sales',
    icon: Users,
    route: '/api/integrations/crm',
    description: 'Lease data · Tenant health · Sales pipeline',
    color: '#4A9EFF',
    kpiKeys: ['occupancyRateRetail', 'rentCollectionRate', 'netPromoterScore'],
    protocol: 'OAuth 2.0 / Webhook',
    syncInterval: 'Real-time',
  },
  {
    id: 'projects',
    label: 'Project Management',
    icon: HardDrive,
    route: '/api/integrations/projects',
    description: 'Construction progress · Delays · Milestones',
    color: '#A855F7',
    kpiKeys: ['schedulePerformanceIndex', 'costPerformanceIndex', 'onTimeDeliveryRate'],
    protocol: 'EPPM REST API',
    syncInterval: '30 min',
  },
]

// ─── Richer data shown when integration is actively connected ─────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CONNECTED_EXTRA: Record<string, Record<string, any>> = {
  oracle: {
    alerts: [
      { msg: 'Budget approval required — Saadiyat Ph.2 overrun', urgency: 'high' },
      { msg: 'Payroll variance +AED 1.2M detected Q1', urgency: 'medium' },
    ],
    lastSync: 'Just now',
    recordsLoaded: '14,820',
  },
  crm: {
    alerts: [
      { msg: 'Anchor tenant T-0318 covenant breach risk elevated', urgency: 'high' },
      { msg: '3 leases expiring within 60 days — renewal not confirmed', urgency: 'medium' },
    ],
    lastSync: 'Just now',
    recordsLoaded: '3,241',
  },
  projects: {
    alerts: [
      { msg: 'Tower B steel procurement decision overdue by 12 days', urgency: 'high' },
      { msg: 'MEP contractor Electra LLC — payment delay flagged', urgency: 'high' },
    ],
    lastSync: 'Just now',
    recordsLoaded: '892',
  },
  'risk-register': {
    alerts: [
      { msg: '4 risks moved to HIGH severity this week', urgency: 'high' },
      { msg: '12 mitigation actions past SLA deadline', urgency: 'medium' },
    ],
    lastSync: 'Just now',
    recordsLoaded: '1,280',
  },
}

function StatusDot({ status }: { status: 'connected' | 'pending' | 'error' }) {
  const col = status === 'connected' ? '#22C55E' : status === 'pending' ? '#F5C518' : '#FF3B3B'
  const Icon = status === 'connected' ? CheckCircle2 : status === 'pending' ? Hourglass : WifiOff
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={12} style={{ color: col }} />
      <span style={{ color: col, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {status === 'connected' ? 'Connected' : status === 'pending' ? 'Pending' : 'Error'}
      </span>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = Record<string, any>

// ─── Static defaults — cards always show data regardless of API / network ─────
const STATIC_DEFAULTS: Record<string, AnyData> = {
  oracle: {
    kpis: { costVariance: '+4.8%', scheduleAdherence: '73%', cashCycleDays: 42 },
    data: {
      costOverruns: [
        { project: 'Saadiyat Lagoons Ph.2', overrun: 'AED 48M', pct: '+4.1%' },
        { project: 'Yas Residences Block C', overrun: 'AED 21M', pct: '+2.8%' },
        { project: 'Al Raha Creek Ph.3', overrun: 'AED 15M', pct: '+2.9%' },
      ],
    },
  },
  crm: {
    kpis: { occupancyRateRetail: '94.2%', rentCollectionRate: '97.8%', netPromoterScore: 68 },
    data: {
      atRiskTenants: [
        { id: 'T-0142', asset: 'Yas Mall', status: 'Active Management' },
        { id: 'T-0318', asset: 'Abu Dhabi Mall', status: 'At Risk' },
        { id: 'T-0445', asset: 'Al Jimi Mall', status: 'Monitoring' },
      ],
    },
  },
  projects: {
    kpis: { schedulePerformanceIndex: 0.87, costPerformanceIndex: 0.96, onTimeDeliveryRate: '73.9%' },
    data: {
      delayed: 6,
      delayedProjects: [
        { name: 'Saadiyat Lagoons Ph.2', delayDays: 45, criticalPath: true },
        { name: 'Yas Residences Block C', delayDays: 28, criticalPath: false },
        { name: 'Nurai Island Villas Ph.3', delayDays: 19, criticalPath: false },
      ],
    },
  },
}

function PendingBanner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '7px',
      padding: '8px 10px', borderRadius: '7px',
      backgroundColor: 'rgba(245,197,24,0.06)',
      border: '1px solid rgba(245,197,24,0.22)',
    }}>
      <Hourglass size={11} style={{ color: '#F5C518', flexShrink: 0, marginTop: '2px' }} />
      <div>
        <div style={{ color: '#F5C518', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em' }}>
          INTEGRATION PENDING
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.63rem', marginTop: '2px', lineHeight: 1.4 }}>
          Awaiting IT/API configuration. Contact your system administrator.
        </div>
      </div>
    </div>
  )
}

function SampleDataLabel() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '4px 8px', borderRadius: '5px',
      backgroundColor: 'rgba(245,197,24,0.04)',
      border: '1px dashed rgba(245,197,24,0.2)',
    }}>
      <span style={{ color: 'rgba(245,197,24,0.7)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.05em' }}>
        SAMPLE / LAST AVAILABLE DATA (DEMO)
      </span>
    </div>
  )
}

function IntegrationCard({
  config,
  status,
  onToggle,
}: {
  config: (typeof INTEGRATION_CONFIGS)[0]
  status: IntegrationStatus
  onToggle: () => void
}) {
  const [data, setData] = useState<AnyData>(STATIC_DEFAULTS[config.id])
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const Icon = config.icon
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'
  const isDisconnecting = status === 'disconnecting'
  const isBusy = isConnecting || isDisconnecting

  const load = async () => {
    try {
      const res = await fetch(config.route)
      const json = await res.json()
      if (json?.kpis) setData(json)
    } catch { /* keep static defaults */ }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sync = async () => {
    setSyncing(true)
    setSynced(false)
    await new Promise(r => setTimeout(r, 1200))
    await load()
    setSyncing(false)
    setSynced(true)
    setTimeout(() => setSynced(false), 3000)
  }

  const extra = CONNECTED_EXTRA[config.id]

  return (
    <Card style={{ borderColor: isConnected ? `${config.color}40` : undefined, transition: 'border-color 0.3s' }}>
      {/* Header */}
      <CardHeader>
        <div className="flex items-center gap-2">
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px',
            backgroundColor: isConnected ? `${config.color}22` : `${config.color}18`,
            border: `1px solid ${isConnected ? config.color + '55' : config.color + '35'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s',
          }}>
            <Icon size={14} style={{ color: config.color }} />
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}>{config.label}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{config.description}</div>
          </div>
        </div>
        <StatusDot status={isConnecting ? 'pending' : isDisconnecting ? 'pending' : status === 'connected' ? 'connected' : 'pending'} />
      </CardHeader>

      <CardBody>
        <div className="space-y-3">

          {/* ── PENDING state: banners ── */}
          {!isConnected && !isBusy && (
            <>
              <PendingBanner />
              <SampleDataLabel />
            </>
          )}

          {/* ── CONNECTING animation ── */}
          {isConnecting && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', borderRadius: '7px',
              backgroundColor: `${config.color}0A`,
              border: `1px solid ${config.color}30`,
            }}>
              <Loader2 size={11} className="animate-spin" style={{ color: config.color, flexShrink: 0 }} />
              <div>
                <div style={{ color: config.color, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                  ESTABLISHING CONNECTION
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', marginTop: '1px' }}>
                  Authenticating via {config.protocol}…
                </div>
              </div>
            </div>
          )}

          {/* ── DISCONNECTING animation ── */}
          {isDisconnecting && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', borderRadius: '7px',
              backgroundColor: 'rgba(148,163,184,0.06)',
              border: '1px solid var(--border-color)',
            }}>
              <Loader2 size={11} className="animate-spin" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                DISCONNECTING…
              </div>
            </div>
          )}

          {/* ── CONNECTED: live banner ── */}
          {isConnected && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '7px',
              padding: '8px 10px', borderRadius: '7px',
              backgroundColor: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.22)',
            }}>
              <CheckCircle2 size={11} style={{ color: '#22C55E', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ color: '#22C55E', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                  LIVE CONNECTION ACTIVE
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', marginTop: '1px', lineHeight: 1.4 }}>
                  {config.protocol} · Sync every {config.syncInterval} · {extra?.recordsLoaded} records loaded
                </div>
              </div>
            </div>
          )}

          {/* KPI tiles — always rendered */}
          {data.kpis && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '7px' }}>
              {config.kpiKeys.map((k) => (
                <div key={k} style={{
                  padding: '8px', borderRadius: '7px', textAlign: 'center',
                  backgroundColor: isConnected ? `${config.color}08` : 'var(--bg-secondary)',
                  border: `1px solid ${isConnected ? config.color + '30' : 'var(--border-color)'}`,
                  transition: 'all 0.3s',
                }}>
                  <div style={{ color: config.color, fontSize: '0.85rem', fontWeight: 700 }}>
                    {String(data.kpis[k])}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', marginTop: '2px', lineHeight: 1.3 }}>
                    {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Oracle — cost overruns */}
          {data.data?.costOverruns && (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>
                Cost Overruns Flagged
              </div>
              {data.data.costOverruns.slice(0, 3).map((c: AnyData, i: number) => (
                <div key={i} className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.73rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                    {c.project}
                  </span>
                  <span style={{ color: 'var(--risk-high)', fontSize: '0.73rem', fontWeight: 600, flexShrink: 0 }}>
                    {c.overrun} ({c.pct})
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* CRM — at-risk tenants */}
          {data.data?.atRiskTenants && (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>
                At-Risk Tenants
              </div>
              {data.data.atRiskTenants.slice(0, 3).map((t: AnyData, i: number) => (
                <div key={i} className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.73rem' }}>{t.id} · {t.asset}</span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, flexShrink: 0,
                    color: t.status === 'At Risk' ? 'var(--risk-critical)' : t.status === 'Active Management' ? 'var(--risk-high)' : 'var(--risk-medium)',
                  }}>{t.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Projects — delayed */}
          {data.data?.delayedProjects && (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>
                Delayed Projects ({data.data.delayed})
              </div>
              {data.data.delayedProjects.slice(0, 3).map((p: AnyData, i: number) => (
                <div key={i} className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.73rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '155px' }}>
                    {p.name}
                  </span>
                  <span style={{ color: p.criticalPath ? 'var(--risk-critical)' : 'var(--risk-high)', fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}>
                    +{p.delayDays}d{p.criticalPath ? ' ●' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Connected: live alerts */}
          {isConnected && extra?.alerts && (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>
                Live Alerts
              </div>
              {extra.alerts.map((a: { msg: string; urgency: string }, i: number) => (
                <div key={i} className="flex items-start gap-2" style={{ marginBottom: '4px' }}>
                  <div style={{
                    width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0, marginTop: '5px',
                    backgroundColor: a.urgency === 'high' ? 'var(--risk-high)' : 'var(--risk-medium)',
                  }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', lineHeight: 1.4 }}>{a.msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bottom action row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
            {/* Primary: Connect / Disconnect */}
            <button
              onClick={onToggle}
              disabled={isBusy}
              style={{
                width: '100%', padding: '7px', borderRadius: '7px',
                fontSize: '0.75rem', fontWeight: 600,
                cursor: isBusy ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s',
                opacity: isBusy ? 0.7 : 1,
                border: isConnected
                  ? '1px solid rgba(255,59,59,0.3)'
                  : `1px solid ${config.color}50`,
                backgroundColor: isConnected
                  ? 'rgba(255,59,59,0.07)'
                  : isConnecting
                  ? `${config.color}12`
                  : `${config.color}15`,
                color: isConnected ? 'var(--risk-critical)' : config.color,
              }}
            >
              {isConnecting ? (
                <><Loader2 size={12} className="animate-spin" />Connecting…</>
              ) : isDisconnecting ? (
                <><Loader2 size={12} className="animate-spin" />Disconnecting…</>
              ) : isConnected ? (
                <><WifiOff size={12} />Disconnect</>
              ) : (
                <><Zap size={12} />Connect</>
              )}
            </button>

            {/* Secondary: Sync Now (only when connected) */}
            {isConnected && (
              <button
                onClick={sync}
                disabled={syncing}
                style={{
                  width: '100%', padding: '6px', borderRadius: '7px',
                  fontSize: '0.72rem', fontWeight: 500,
                  cursor: syncing ? 'wait' : 'pointer',
                  border: `1px solid ${config.color}30`,
                  backgroundColor: synced ? `${config.color}12` : `${config.color}08`,
                  color: config.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  opacity: syncing ? 0.7 : 1, transition: 'all 0.15s',
                }}
              >
                {syncing
                  ? <><Loader2 size={11} className="animate-spin" />Syncing…</>
                  : synced
                  ? <><CheckCircle2 size={11} />Synced</>
                  : <><RefreshCw size={11} />Force Sync</>
                }
              </button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

// ─── Risk Register baseline integration card ──────────────────────────────────

const RISK_REGISTER_DATA = {
  kpis: [
    { label: 'Total Risks', value: '1,280', sub: 'Active in register' },
    { label: 'Open Actions', value: '94', sub: 'Mitigation tasks' },
    { label: 'Overdue', value: '12', sub: 'Past SLA date' },
  ],
  portfolios: [
    { name: 'Real Estate Dev', count: 300, color: '#F5C518' },
    { name: 'Retail & Hospitality', count: 270, color: '#F5C518' },
    { name: 'Facilities Mgmt', count: 240, color: '#F5C518' },
    { name: 'Corporate', count: 180, color: '#F5C518' },
  ],
}

function RiskRegisterCard({
  status,
  onToggle,
}: {
  status: IntegrationStatus
  onToggle: () => void
}) {
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'
  const isDisconnecting = status === 'disconnecting'
  const isBusy = isConnecting || isDisconnecting
  const extra = CONNECTED_EXTRA['risk-register']

  const handleSync = async () => {
    setSyncing(true)
    setSynced(false)
    await new Promise((r) => setTimeout(r, 900))
    setSyncing(false)
    setSynced(true)
    setTimeout(() => setSynced(false), 3000)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: 'rgba(245,197,24,0.1)',
              border: '1px solid rgba(245,197,24,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Server size={14} style={{ color: '#F5C518' }} />
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}>Risk Register Baseline</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Existing risk inventory · Open actions</div>
          </div>
        </div>
        <StatusDot status={isConnecting || isDisconnecting ? 'pending' : status === 'connected' ? 'connected' : 'pending'} />
      </CardHeader>
      <CardBody className="space-y-3">
        {!isConnected && !isBusy && <><PendingBanner /><SampleDataLabel /></>}
        {isConnecting && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', backgroundColor: 'rgba(245,197,24,0.06)', border: '1px solid rgba(245,197,24,0.25)' }}>
            <Loader2 size={11} className="animate-spin" style={{ color: '#F5C518', flexShrink: 0 }} />
            <div>
              <div style={{ color: '#F5C518', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em' }}>ESTABLISHING CONNECTION</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', marginTop: '1px' }}>Connecting to internal PostgreSQL via CDC…</div>
            </div>
          </div>
        )}
        {isDisconnecting && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', backgroundColor: 'rgba(148,163,184,0.06)', border: '1px solid var(--border-color)' }}>
            <Loader2 size={11} className="animate-spin" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em' }}>DISCONNECTING…</div>
          </div>
        )}
        {isConnected && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', padding: '8px 10px', borderRadius: '7px', backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.22)' }}>
            <CheckCircle2 size={11} style={{ color: '#22C55E', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ color: '#22C55E', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em' }}>LIVE CONNECTION ACTIVE</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', marginTop: '1px', lineHeight: 1.4 }}>
                PostgreSQL / CDC · Real-time · {extra?.recordsLoaded} risks loaded
              </div>
            </div>
          </div>
        )}

        {/* KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {RISK_REGISTER_DATA.kpis.map((k) => (
            <div
              key={k.label}
              style={{
                padding: '7px 8px',
                borderRadius: '7px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#F5C518', fontSize: '0.85rem', fontWeight: 700 }}>{k.value}</div>
              <div style={{ color: 'var(--text-primary)', fontSize: '0.6rem', fontWeight: 600, marginTop: '1px' }}>{k.label}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.58rem' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* By portfolio */}
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            By Portfolio
          </div>
          {RISK_REGISTER_DATA.portfolios.map((p) => {
            const pct = Math.round((p.count / 1280) * 100)
            return (
              <div key={p.name} style={{ marginBottom: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.68rem' }}>{p.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{p.count}</span>
                </div>
                <div style={{ height: '3px', borderRadius: '2px', backgroundColor: 'var(--border-color)' }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: '2px', backgroundColor: p.color, opacity: 0.7 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Live alerts when connected */}
        {isConnected && extra?.alerts && (
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Live Alerts</div>
            {extra.alerts.map((a: { msg: string; urgency: string }, i: number) => (
              <div key={i} className="flex items-start gap-2" style={{ marginBottom: '4px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0, marginTop: '5px', backgroundColor: a.urgency === 'high' ? 'var(--risk-high)' : 'var(--risk-medium)' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', lineHeight: 1.4 }}>{a.msg}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          {/* Connect / Disconnect */}
          <button
            onClick={onToggle}
            disabled={isBusy}
            style={{
              width: '100%', padding: '7px', borderRadius: '7px',
              fontSize: '0.75rem', fontWeight: 600,
              cursor: isBusy ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s', opacity: isBusy ? 0.7 : 1,
              border: isConnected ? '1px solid rgba(255,59,59,0.3)' : '1px solid rgba(245,197,24,0.4)',
              backgroundColor: isConnected ? 'rgba(255,59,59,0.07)' : 'rgba(245,197,24,0.08)',
              color: isConnected ? 'var(--risk-critical)' : '#F5C518',
            }}
          >
            {isConnecting ? <><Loader2 size={12} className="animate-spin" />Connecting…</>
              : isDisconnecting ? <><Loader2 size={12} className="animate-spin" />Disconnecting…</>
              : isConnected ? <><WifiOff size={12} />Disconnect</>
              : <><Zap size={12} />Connect</>
            }
          </button>

          {/* Sync — only when connected */}
          {isConnected && (
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                width: '100%', padding: '6px', borderRadius: '7px',
                fontSize: '0.72rem', fontWeight: 500,
                cursor: syncing ? 'wait' : 'pointer',
                border: 'rgba(245,197,24,0.25) 1px solid',
                backgroundColor: synced ? 'rgba(245,197,24,0.1)' : 'rgba(245,197,24,0.05)',
                color: '#F5C518',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                transition: 'background-color 0.2s',
              }}
            >
              {syncing ? <><Loader2 size={11} className="animate-spin" />Syncing…</>
                : synced ? <><CheckCircle2 size={11} />Synced</>
                : <><RefreshCw size={11} />Force Sync</>
              }
            </button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload')

  // ─── Integration simulation state (lifted from cards) ───────────────────────
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, IntegrationStatus>>({
    oracle:          'pending',
    crm:             'pending',
    projects:        'pending',
    'risk-register': 'pending',
  })

  const toggleIntegration = async (id: string) => {
    const current = integrationStatuses[id]
    if (current === 'connected') {
      setIntegrationStatuses(prev => ({ ...prev, [id]: 'disconnecting' }))
      await new Promise(r => setTimeout(r, 800))
      setIntegrationStatuses(prev => ({ ...prev, [id]: 'pending' }))
    } else if (current === 'pending') {
      setIntegrationStatuses(prev => ({ ...prev, [id]: 'connecting' }))
      await new Promise(r => setTimeout(r, 1600))
      setIntegrationStatuses(prev => ({ ...prev, [id]: 'connected' }))
    }
  }

  // Dynamic badge values
  const connectedCount = Object.values(integrationStatuses).filter(s => s === 'connected').length
  const totalCount = INTEGRATION_CONFIGS.length + 1  // +1 for Risk Register

  // Manual input state
  const [content, setContent] = useState('')
  const [docType, setDocType] = useState('project-report')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [updates, setUpdates] = useState<AnalysisResult['suggestedUpdates']>([])

  const analyze = async () => {
    if (!content.trim() || content.trim().length < 50) {
      setError('Please enter at least 50 characters of document content')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/document-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, documentType: docType }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      setUpdates(
        data.suggestedUpdates?.map((u: AnalysisResult['suggestedUpdates'][0]) => ({ ...u, _status: 'pending' })) || []
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = (index: number, action: 'approved' | 'rejected') => {
    const update = updates[index]
    setUpdates((prev) => prev.map((u, i) => (i === index ? { ...u, _status: action } : u)))
    setAuditLog((prev) => [
      {
        id: `AUDIT-${Date.now()}`,
        action,
        type: update.type,
        suggestion: update.suggestion,
        timestamp: new Date().toISOString(),
        userId: 'CRO — Executive Review',
      },
      ...prev,
    ])
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
        {[
          { id: 'upload', label: 'File Upload', icon: UploadCloud },
          { id: 'manual', label: 'Manual Input', icon: FileText },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'upload' | 'manual')}
            style={{
              padding: '10px 18px',
              fontSize: '0.825rem',
              fontWeight: activeTab === id ? 600 : 500,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === id ? 'var(--accent-primary)' : 'transparent'}`,
              color: activeTab === id ? 'var(--accent-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.15s',
              marginBottom: '-1px',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'upload' ? (
          <motion.div key="upload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <DocumentUpload />
            <ControlAssessmentPanel />
          </motion.div>
        ) : (
          <motion.div key="manual" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Input Area */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText size={14} style={{ color: 'var(--accent-primary)' }} />
                  <CardTitle>Document Intelligence — Manual Input</CardTitle>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  Paste document content for AI risk extraction
                </span>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Doc Type Selector */}
                <div className="flex gap-2 flex-wrap">
                  {DOCUMENT_TYPES.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDocType(d.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '7px',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: docType === d.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        backgroundColor: docType === d.id ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                        color: docType === d.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {/* Sample docs */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Load sample:</span>
                  {SAMPLE_DOCS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => {
                        setContent(s.content)
                        setDocType(s.label.includes('Status') ? 'project-report' : 'governance')
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        border: '1px solid var(--border-accent)',
                        backgroundColor: 'var(--accent-glow)',
                        color: 'var(--accent-primary)',
                        fontWeight: 500,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Text Area */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your document content here — project reports, board papers, risk registers, audit reports, governance documents..."
                  className="input-theme"
                  style={{
                    height: '200px',
                    resize: 'vertical',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.8rem',
                    lineHeight: '1.6',
                  }}
                />

                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    {content.length} characters · Min 50 required
                  </span>
                  <button
                    onClick={analyze}
                    disabled={loading || content.length < 50}
                    className="btn-primary flex items-center gap-2"
                  >
                    {loading ? (
                      <><Loader2 size={16} className="animate-spin" />Analyzing...</>
                    ) : (
                      <><Scan size={16} />Analyze with AI</>
                    )}
                  </button>
                </div>

                {error && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,59,59,0.1)',
                      border: '1px solid rgba(255,59,59,0.3)',
                      color: 'var(--risk-critical)',
                      fontSize: '0.825rem',
                    }}
                  >
                    {error}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: 'var(--accent-primary)' }} />
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  AI is extracting risks, compliance flags, and register updates...
                </div>
              </div>
            )}

            {/* Results */}
            <AnimatePresence>
              {result && !loading && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                  {/* Summary + AI Insight */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Document Summary</CardTitle>
                        <ConfidenceBadge confidence={result.confidence} />
                      </CardHeader>
                      <CardBody>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '12px' }}>
                          {result.documentSummary}
                        </p>
                        <div className="flex gap-3 text-sm">
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            Type: <span style={{ color: 'var(--text-primary)' }}>{result.documentType}</span>
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            Analyzed:{' '}
                            {result.analyzedAt
                              ? new Date(result.analyzedAt).toLocaleTimeString('en-AE', { timeZone: 'Asia/Dubai' })
                              : ''}
                          </span>
                        </div>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>AI Intelligence Insights</CardTitle></CardHeader>
                      <CardBody>
                        <AIInsightBox insight={result.insights} confidence={result.confidence} compact />
                      </CardBody>
                    </Card>
                  </div>

                  {/* Extracted Risks */}
                  {result.extractedRisks?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} style={{ color: 'var(--risk-high)' }} />
                          <CardTitle>Extracted Risks ({result.extractedRisks.length})</CardTitle>
                        </div>
                      </CardHeader>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>ID</th><th>Risk Title</th><th>Category</th><th>Portfolio</th>
                              <th>Severity</th><th>L</th><th>I</th><th>Score</th>
                              <th>Financial Impact</th><th>Source</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.extractedRisks.map((risk) => {
                              const sev = getSev(
                                risk.score >= 16 ? 'critical' : risk.score >= 10 ? 'high' : risk.score >= 6 ? 'medium' : 'low'
                              )
                              return (
                                <tr key={risk.id}>
                                  <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{risk.id}</td>
                                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{risk.title}</td>
                                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{risk.category}</td>
                                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{risk.portfolio}</td>
                                  <td><RiskBadge severity={sev} /></td>
                                  <td className="text-center">{risk.likelihood}</td>
                                  <td className="text-center">{risk.impact}</td>
                                  <td className="text-center" style={{ fontWeight: 700, color: 'var(--risk-high)' }}>{risk.score}</td>
                                  <td style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>{risk.financialImpact}</td>
                                  <td style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{risk.source}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}

                  {/* Suggested Updates */}
                  {updates.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Plus size={14} style={{ color: 'var(--accent-primary)' }} />
                          <CardTitle>Suggested Register Updates — Human Review</CardTitle>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Approve or reject each AI suggestion</span>
                      </CardHeader>
                      <CardBody className="space-y-3">
                        {updates.map((update, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '14px',
                              borderRadius: '10px',
                              border: '1px solid var(--border-color)',
                              backgroundColor:
                                update._status === 'approved' ? 'rgba(34,197,94,0.07)'
                                : update._status === 'rejected' ? 'rgba(255,59,59,0.07)'
                                : 'var(--bg-secondary)',
                              borderColor:
                                update._status === 'approved' ? 'rgba(34,197,94,0.3)'
                                : update._status === 'rejected' ? 'rgba(255,59,59,0.3)'
                                : 'var(--border-color)',
                              opacity: update._status !== 'pending' ? 0.8 : 1,
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span
                                    style={{
                                      fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                                      padding: '2px 7px', borderRadius: '5px',
                                      backgroundColor: update.type === 'new' ? 'rgba(45,158,255,0.15)' : update.type === 'update' ? 'rgba(245,197,24,0.15)' : 'rgba(34,197,94,0.15)',
                                      color: update.type === 'new' ? '#2D9EFF' : update.type === 'update' ? 'var(--risk-medium)' : 'var(--risk-low)',
                                    }}
                                  >
                                    {update.type}
                                  </span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Risk: {update.riskId}</span>
                                  <span
                                    style={{
                                      fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px', borderRadius: '5px',
                                      backgroundColor: update.urgency === 'immediate' ? 'rgba(255,59,59,0.12)' : 'var(--bg-card)',
                                      color: update.urgency === 'immediate' ? 'var(--risk-critical)' : 'var(--text-muted)',
                                    }}
                                  >
                                    {update.urgency}
                                  </span>
                                </div>
                                <p style={{ color: 'var(--text-primary)', fontSize: '0.825rem', fontWeight: 500, marginBottom: '4px' }}>{update.suggestion}</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{update.rationale}</p>
                              </div>
                              {update._status === 'pending' ? (
                                <div className="flex gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => handleDecision(i, 'approved')}
                                    style={{ padding: '6px 14px', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(34,197,94,0.4)', backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--risk-low)', display: 'flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <Check size={12} />Approve
                                  </button>
                                  <button
                                    onClick={() => handleDecision(i, 'rejected')}
                                    style={{ padding: '6px 14px', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(255,59,59,0.4)', backgroundColor: 'rgba(255,59,59,0.1)', color: 'var(--risk-critical)', display: 'flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <X size={12} />Reject
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 600, color: update._status === 'approved' ? 'var(--risk-low)' : 'var(--risk-critical)' }}>
                                  {update._status === 'approved' ? <><Check size={14} />Approved</> : <><X size={14} />Rejected</>}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardBody>
                    </Card>
                  )}

                  {/* Compliance Flags */}
                  {result.complianceFlags?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <ShieldAlert size={14} style={{ color: 'var(--risk-critical)' }} />
                          <CardTitle>Compliance Flags ({result.complianceFlags.length})</CardTitle>
                        </div>
                      </CardHeader>
                      <CardBody className="space-y-3">
                        {result.complianceFlags.map((flag, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '12px 14px', borderRadius: '9px',
                              backgroundColor: 'rgba(255,140,0,0.07)',
                              border: '1px solid rgba(255,140,0,0.25)',
                              borderLeft: `3px solid var(--risk-${getSev(flag.severity)})`,
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <RiskBadge severity={getSev(flag.severity)} />
                              <span style={{ color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 600 }}>{flag.regulation}</span>
                              {flag.deadline && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Deadline: {flag.deadline}</span>}
                            </div>
                            <p style={{ color: 'var(--text-primary)', fontSize: '0.825rem', marginBottom: '6px' }}>{flag.issue}</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Recommendation: {flag.recommendation}</p>
                          </div>
                        ))}
                      </CardBody>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ICOFR Control Extraction */}
            {content.trim().length >= 50 && (
              <DocumentControlExtractor documentText={content} />
            )}

            {/* Audit Log */}
            {auditLog.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                    <CardTitle>Human-in-the-Loop Audit Log</CardTitle>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-2">
                    {auditLog.map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 12px', borderRadius: '7px',
                          backgroundColor: 'var(--bg-secondary)', fontSize: '0.78rem',
                        }}
                      >
                        <div
                          style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            backgroundColor: entry.action === 'approved' ? 'rgba(34,197,94,0.2)' : 'rgba(255,59,59,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {entry.action === 'approved' ? <Check size={10} style={{ color: 'var(--risk-low)' }} /> : <X size={10} style={{ color: 'var(--risk-critical)' }} />}
                        </div>
                        <span style={{ color: entry.action === 'approved' ? 'var(--risk-low)' : 'var(--risk-critical)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>{entry.action}</span>
                        <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{entry.suggestion.substring(0, 80)}...</span>
                        <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{entry.userId}</span>
                        <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(entry.timestamp).toLocaleTimeString('en-AE', { timeZone: 'Asia/Dubai' })}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Enterprise Integration Layer ─────────────────────────────────────── */}
      <div>
        {/* Section header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center gap-2">
            <Server size={14} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', fontWeight: 600 }}>
              Enterprise Integration Layer
            </span>
            {(() => {
              const badgeStyle =
                connectedCount === totalCount
                  ? { bg: 'rgba(34,197,94,0.1)', color: '#22C55E', border: 'rgba(34,197,94,0.2)' }
                  : connectedCount > 0
                  ? { bg: 'rgba(245,197,24,0.1)', color: '#F5C518', border: 'rgba(245,197,24,0.25)' }
                  : { bg: 'rgba(148,163,184,0.08)', color: 'var(--text-muted)', border: 'var(--border-color)' }
              return (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    backgroundColor: badgeStyle.bg,
                    color: badgeStyle.color,
                    border: `1px solid ${badgeStyle.border}`,
                    transition: 'all 0.3s',
                  }}
                >
                  {connectedCount} of {totalCount} Connected
                </span>
              )
            })()}
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            APIs connect to existing Aldar systems in production
          </span>
        </div>

        {/* Integration cards grid */}
        <div className="grid grid-cols-4 gap-4">
          {INTEGRATION_CONFIGS.map((cfg) => (
            <IntegrationCard
              key={cfg.id}
              config={cfg}
              status={integrationStatuses[cfg.id]}
              onToggle={() => toggleIntegration(cfg.id)}
            />
          ))}
          <RiskRegisterCard
            status={integrationStatuses['risk-register']}
            onToggle={() => toggleIntegration('risk-register')}
          />
        </div>

        {/* Production note */}
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '9px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <Database size={14} style={{ color: 'var(--accent-primary)', marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 500, marginBottom: '4px' }}>
              Production Integration Architecture
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Oracle Fusion ERP</strong> — REST API with mTLS authentication, 15-min sync cadence · &nbsp;
              <strong style={{ color: 'var(--text-secondary)' }}>CRM (Salesforce)</strong> — Connected App OAuth 2.0, webhook-driven tenant alerts · &nbsp;
              <strong style={{ color: 'var(--text-secondary)' }}>Primavera P6</strong> — EPPM REST API, scheduled Q3 2026 · &nbsp;
              <strong style={{ color: 'var(--text-secondary)' }}>Risk Register</strong> — Internal PostgreSQL, real-time sync via Change Data Capture
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
