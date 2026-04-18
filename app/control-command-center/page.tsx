'use client'

// ─── Internal Control Command Center ──────────────────────────────────────────
// ICOFAR-aligned Internal Control Operating System — Command Center.
// Integration Pending — all data from controlData.ts / controlTestingEngine.ts.
// CRITICAL: No existing modules modified. Standalone page.

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Clock,
  ChevronRight,
  Brain,
  TrendingDown,
  Zap,
  User,
  FlaskConical,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { controls, controlSummary, type Control, type ControlStatus } from '@/lib/controlData'
import { evaluateControlStatus, testingSummary, TEST_RESULT_COLOR } from '@/lib/controlTestingEngine'
import { CONTROL_FAILURE_ACTIONS } from '@/lib/controlActionBridge'
import { AUDIT_TRAIL, TREND_COLOR, TREND_ICON } from '@/lib/controlAuditTrail'
import { PRIORITY_COLOR, PRIORITY_BG, TOP_ACTIONS, type Action } from '@/lib/actionEngine'
import { ControlDetailPanel } from '@/components/controls/ControlDetailPanel'
import { ActionDetailPanel } from '@/components/ActionDetailPanel'
import { getMergedActions } from '@/lib/controlActionBridge'
import { riskRegister } from '@/lib/simulated-data'

// ─── Pre-compute ──────────────────────────────────────────────────────────────

const ALL_TESTS      = evaluateControlStatus()
const TEST_SUMMARY   = testingSummary(ALL_TESTS)
const MERGED_ACTIONS = getMergedActions(TOP_ACTIONS)
const FAILED_CONTROLS = controls.filter(c => c.status === 'failed')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<ControlStatus, string> = {
  effective: '#22C55E',
  partial:   '#F5C518',
  failed:    '#FF3B3B',
}
const STATUS_BG: Record<ControlStatus, string> = {
  effective: 'rgba(34,197,94,0.1)',
  partial:   'rgba(245,197,24,0.1)',
  failed:    'rgba(255,59,59,0.1)',
}
const STATUS_LABEL: Record<ControlStatus, string> = {
  effective: 'Effective',
  partial:   'Partial',
  failed:    'Failed',
}

function getRisk(id: string) { return riskRegister.find(r => r.id === id) }

// ─── Metric card ──────────────────────────────────────────────────────────────

type MetricFilter = 'failed' | 'overdue' | 'partial' | 'all' | null

function MetricCard({
  label,
  value,
  sub,
  color,
  filterKey,
  activeFilter,
  onFilterClick,
}: {
  label: string
  value: string | number
  sub?: string
  color: string
  filterKey?: MetricFilter
  activeFilter: MetricFilter
  onFilterClick: (k: MetricFilter) => void
}) {
  const isActive = filterKey !== null && activeFilter === filterKey
  return (
    <motion.div
      whileHover={{ scale: filterKey ? 1.02 : 1 }}
      onClick={() => filterKey && onFilterClick(isActive ? null : filterKey)}
      style={{
        padding: '14px 16px',
        borderRadius: '10px',
        backgroundColor: isActive ? `${color}12` : 'var(--bg-card)',
        border: `1px solid ${isActive ? color + '50' : 'var(--border-color)'}`,
        cursor: filterKey ? 'pointer' : 'default',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ color, fontSize: '1.6rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, marginTop: '2px' }}>
        {label}
      </div>
      {sub && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '2px' }}>{sub}</div>
      )}
      {filterKey && (
        <div style={{ color, fontSize: '0.6rem', fontWeight: 600, marginTop: '5px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {isActive ? '✕ Clear filter' : 'Click to filter →'}
        </div>
      )}
    </motion.div>
  )
}

// ─── Health bar row ───────────────────────────────────────────────────────────

function HealthBar({
  label,
  count,
  total,
  color,
  filterKey,
  activeFilter,
  onFilter,
}: {
  label: string
  count: number
  total: number
  color: string
  filterKey?: MetricFilter
  activeFilter: MetricFilter
  onFilter: (k: MetricFilter) => void
}) {
  const pct = Math.round((count / total) * 100)
  const isActive = filterKey !== null && activeFilter === filterKey
  return (
    <div
      onClick={() => filterKey && onFilter(isActive ? null : filterKey)}
      style={{
        marginBottom: '8px',
        cursor: filterKey ? 'pointer' : 'default',
        padding: filterKey ? '4px 6px' : '0',
        borderRadius: '5px',
        backgroundColor: isActive ? `${color}08` : 'transparent',
        border: isActive ? `1px solid ${color}25` : '1px solid transparent',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ color: isActive ? color : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: isActive ? 700 : 400 }}>
          {label} {filterKey && !isActive && <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>↗ filter</span>}
          {isActive && <span style={{ color, fontSize: '0.6rem' }}> ✕ clear</span>}
        </span>
        <span style={{ color, fontWeight: 700, fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>
          {count} ({pct}%)
        </span>
      </div>
      <div style={{ height: '5px', borderRadius: '3px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.1 }}
          style={{ height: '100%', borderRadius: '3px', backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ─── Failed control row ───────────────────────────────────────────────────────

function FailedControlRow({
  control,
  index,
  onClick,
}: {
  control: Control
  index: number
  onClick: (c: Control) => void
}) {
  const risk = getRisk(control.linkedRiskId)
  const audit = AUDIT_TRAIL.find(a => a.controlId === control.id)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07 }}
      onClick={() => onClick(control)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '11px 14px',
        borderRadius: '8px',
        border: '1px solid rgba(255,59,59,0.2)',
        cursor: 'pointer',
        backgroundColor: 'rgba(255,59,59,0.03)',
        position: 'relative',
        overflow: 'hidden',
      }}
      whileHover={{ backgroundColor: 'rgba(255,59,59,0.06)', x: 2 }}
    >
      {/* Left accent */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: '#FF3B3B', borderRadius: '8px 0 0 8px' }} />

      <XCircle size={14} style={{ color: '#FF3B3B', flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {control.id}
          </span>
          <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {control.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '1px 6px', borderRadius: '3px', fontSize: '0.62rem', fontWeight: 600,
              color: '#F97316', backgroundColor: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
            }}
          >
            {control.process}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <User size={9} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.67rem' }}>{control.owner}</span>
          </div>
          {risk && (
            <span style={{ color: 'var(--accent-primary)', fontSize: '0.67rem', fontWeight: 600 }}>
              AED {risk.financialImpact}M at risk
            </span>
          )}
          {audit && (
            <span style={{ color: TREND_COLOR[audit.trendDirection], fontSize: '0.65rem', fontWeight: 700 }}>
              {TREND_ICON[audit.trendDirection]} {audit.trendDirection}
            </span>
          )}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '3px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {control.linkedRiskTitle}
        </div>
      </div>

      <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </motion.div>
  )
}

// ─── Control row (filterable list) ────────────────────────────────────────────

function ControlRow({ control, index, onClick }: { control: Control; index: number; onClick: (c: Control) => void }) {
  const risk = getRisk(control.linkedRiskId)
  const color = STATUS_COLOR[control.status]
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      onClick={() => onClick(control)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 12px',
        borderRadius: '7px',
        border: `1px solid ${control.status === 'failed' ? 'rgba(255,59,59,0.2)' : 'var(--border-color)'}`,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      whileHover={{ backgroundColor: 'var(--bg-hover)' }}
    >
      {/* Status dot */}
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />

      <span style={{ color: 'var(--text-muted)', fontSize: '0.63rem', fontWeight: 700, flexShrink: 0, minWidth: '36px' }}>
        {control.id}
      </span>

      <span style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {control.name}
      </span>

      <span
        style={{
          padding: '2px 7px',
          borderRadius: '4px',
          fontSize: '0.6rem',
          fontWeight: 700,
          color,
          backgroundColor: STATUS_BG[control.status],
          border: `1px solid ${color}30`,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          flexShrink: 0,
        }}
      >
        {STATUS_LABEL[control.status]}
      </span>

      {risk && (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          AED {risk.financialImpact}M
        </span>
      )}

      <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </motion.div>
  )
}

// ─── Control → Risk chain row ─────────────────────────────────────────────────

function ControlChainRow({ control, onClick }: { control: Control; onClick: (c: Control) => void }) {
  const risk = getRisk(control.linkedRiskId)
  const color = STATUS_COLOR[control.status]
  if (!risk) return null
  return (
    <motion.div
      onClick={() => onClick(control)}
      whileHover={{ backgroundColor: 'var(--bg-hover)', x: 2 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        borderRadius: '7px',
        border: `1px solid ${control.status === 'failed' ? 'rgba(255,59,59,0.15)' : 'var(--border-color)'}`,
        backgroundColor: 'var(--bg-secondary)',
        flexWrap: 'wrap',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      <span style={{ color, fontSize: '0.65rem', fontWeight: 700 }}>{control.id}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>→</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {control.linkedRiskTitle}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>→</span>
      <span style={{ color: 'var(--accent-primary)', fontSize: '0.72rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
        AED {risk.financialImpact}M
      </span>
      <ChevronRight size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </motion.div>
  )
}

// ─── AI Governance Insight ────────────────────────────────────────────────────

function AIInsight() {
  const failedProcesses = [...new Set(FAILED_CONTROLS.map(c => c.process))]
  const totalExposure = FAILED_CONTROLS.reduce((sum, c) => {
    const r = getRisk(c.linkedRiskId)
    return sum + (r?.financialImpact ?? 0)
  }, 0)

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: '9px',
        backgroundColor: 'rgba(201,168,76,0.06)',
        border: '1px solid rgba(201,168,76,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <Brain size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <span style={{ color: 'var(--accent-primary)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          AI Governance Insight — Integration Pending
        </span>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.65, margin: 0 }}>
        <strong style={{ color: 'var(--text-primary)' }}>Critical finding: </strong>
        {controlSummary.failed} of {controlSummary.total} controls are in FAILED status, representing a <strong style={{ color: 'var(--risk-critical)' }}>AED {totalExposure.toLocaleString()}M unmitigated exposure</strong> across{' '}
        {failedProcesses.join(', ')} processes. Control effectiveness stands at{' '}
        <strong style={{ color: TEST_RESULT_COLOR.pass }}>{TEST_SUMMARY.passRate}%</strong>, below the recommended 80% threshold.
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.65, margin: 0 }}>
        <strong style={{ color: 'var(--text-primary)' }}>ICOFAR impact: </strong>
        Failed controls violate <strong>Accuracy &amp; Valuation</strong> and <strong>Rights &amp; Obligations</strong> assertions. The procurement control failures (C-009, C-010) leave AED 8.2Bn project pipeline unhedged against commodity price movements. Immediate remediation actions have been auto-generated in the Decision Intelligence layer for all {FAILED_CONTROLS.length} failures.
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.65, margin: 0 }}>
        <strong style={{ color: 'var(--text-primary)' }}>Recommended priority: </strong>
        1) C-013 (Cyber BMS pen test — CISA advisory overdue 12 days) · 2) C-002 (IFRS 9 provision AED 142M gap) · 3) C-006 (Board approval bypass AED 48M) · 4) C-017 (Retail vacancy SLA breach 10 weeks).
      </p>
    </div>
  )
}

// ─── ICOFAR Financial Controls ────────────────────────────────────────────────

const FINANCIAL_CONTROLS = controls.filter(c => c.process === 'Finance' || c.icafarAssertion === 'Accuracy & Valuation' || c.icafarAssertion === 'Cut-off')

// ─── Main page ────────────────────────────────────────────────────────────────

type ActiveSection = MetricFilter

export default function ControlCommandCenterPage() {
  const [activeFilter, setActiveFilter] = useState<ActiveSection>(null)
  const [selectedControl, setSelectedControl] = useState<Control | null>(null)
  const [selectedAction, setSelectedAction] = useState<Action | null>(null)

  const handleFilterClick = (key: MetricFilter) => {
    setActiveFilter(key)
  }

  const filteredControls = (() => {
    if (activeFilter === 'failed')    return controls.filter(c => c.status === 'failed')
    if (activeFilter === 'partial')   return controls.filter(c => c.status === 'partial')
    if (activeFilter === 'effective') return controls.filter(c => c.status === 'effective')
    if (activeFilter === 'overdue') {
      const overdueTests = ALL_TESTS.filter(t => t.testStatus === 'overdue')
      const overdueIds = new Set(overdueTests.map(t => t.controlId))
      return controls.filter(c => overdueIds.has(c.id))
    }
    return controls  // 'all' or null → show everything
  })()

  const handleActionClick = (actionId: string) => {
    const action = MERGED_ACTIONS.find(a => a.id === actionId)
    if (action) {
      setSelectedControl(null)
      setSelectedAction(action)
    }
  }

  const totalExposure = FAILED_CONTROLS.reduce((sum, c) => {
    const r = getRisk(c.linkedRiskId)
    return sum + (r?.financialImpact ?? 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* ── SECTION 1: Top Metrics ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
            Internal Control Command Center
          </h2>
          <span
            style={{
              padding: '2px 9px',
              borderRadius: '20px',
              fontSize: '0.62rem',
              fontWeight: 700,
              color: '#F5C518',
              backgroundColor: 'rgba(245,197,24,0.08)',
              border: '1px solid rgba(245,197,24,0.2)',
            }}
          >
            ICOFAR · Integration Pending
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
          Click any metric to filter · Click any control row to open drill-down
        </p>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <MetricCard
          label="Control Effectiveness"
          value={`${controlSummary.coveragePercent}%`}
          sub={`${controlSummary.effective} of ${controlSummary.total} effective`}
          color={controlSummary.coveragePercent >= 80 ? '#22C55E' : '#F5C518'}
          filterKey="effective"
          activeFilter={activeFilter}
          onFilterClick={handleFilterClick}
        />
        <MetricCard
          label="Failed Controls"
          value={controlSummary.failed}
          sub={`AED ${totalExposure}M exposure`}
          color="#FF3B3B"
          filterKey="failed"
          activeFilter={activeFilter}
          onFilterClick={handleFilterClick}
        />
        <MetricCard
          label="Overdue Tests"
          value={TEST_SUMMARY.overdue}
          sub="Tests past due date"
          color="#F5C518"
          filterKey="overdue"
          activeFilter={activeFilter}
          onFilterClick={handleFilterClick}
        />
        <MetricCard
          label="Partial Controls"
          value={controlSummary.partial}
          sub="SLA or evidence gaps"
          color="#F97316"
          filterKey="partial"
          activeFilter={activeFilter}
          onFilterClick={handleFilterClick}
        />
      </div>

      {/* ── Two-column row: Health + AI Insight ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* SECTION 2: Control Health */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={14} style={{ color: '#22C55E' }} />
              <CardTitle>Control Health Overview</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <HealthBar label="Effective"  count={controlSummary.effective} total={controlSummary.total} color="#22C55E" filterKey="effective" activeFilter={activeFilter} onFilter={handleFilterClick} />
            <HealthBar label="Partial"    count={controlSummary.partial}   total={controlSummary.total} color="#F5C518" filterKey="partial"   activeFilter={activeFilter} onFilter={handleFilterClick} />
            <HealthBar label="Failed"     count={controlSummary.failed}    total={controlSummary.total} color="#FF3B3B" filterKey="failed"    activeFilter={activeFilter} onFilter={handleFilterClick} />

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                By Control Type
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { label: 'Preventive', count: controlSummary.preventive, color: '#4A9EFF' },
                  { label: 'Detective',  count: controlSummary.detective,  color: '#A855F7' },
                ].map(({ label, count, color }) => (
                  <div
                    key={label}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '7px',
                      backgroundColor: `${color}10`,
                      border: `1px solid ${color}25`,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ color, fontSize: '1.1rem', fontWeight: 700 }}>{count}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', marginTop: '1px' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test summary */}
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                Testing Engine
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {([
                  { label: 'Pass',    count: TEST_SUMMARY.pass,    color: TEST_RESULT_COLOR.pass,    filterKey: 'effective' as MetricFilter },
                  { label: 'Fail',    count: TEST_SUMMARY.fail,    color: TEST_RESULT_COLOR.fail,    filterKey: 'failed'    as MetricFilter },
                  { label: 'Partial', count: TEST_SUMMARY.partial, color: TEST_RESULT_COLOR.partial, filterKey: 'partial'   as MetricFilter },
                  { label: 'Overdue', count: TEST_SUMMARY.overdue, color: '#F5C518',                 filterKey: 'overdue'   as MetricFilter },
                ] as const).map(({ label, count, color, filterKey }) => {
                  const isActive = activeFilter === filterKey
                  return (
                    <div
                      key={label}
                      onClick={() => handleFilterClick(isActive ? null : filterKey)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: isActive ? `${color}18` : `${color}10`,
                        border: `1px solid ${isActive ? color + '50' : color + '25'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ color, fontSize: '0.8rem', fontWeight: 700 }}>{count}</span>
                      <span style={{ color: isActive ? color : 'var(--text-muted)', fontSize: '0.62rem', fontWeight: isActive ? 600 : 400 }}>{label}</span>
                    </div>
                  )
                })}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginLeft: 'auto' }}>
                  Pass rate: <strong style={{ color: TEST_SUMMARY.passRate >= 80 ? '#22C55E' : '#F5C518' }}>{TEST_SUMMARY.passRate}%</strong>
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* SECTION 6: AI Insight */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={14} style={{ color: 'var(--accent-primary)' }} />
              <CardTitle>AI Governance Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <AIInsight />
          </CardBody>
        </Card>
      </div>

      {/* ── SECTION 3: Failed Controls ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={14} style={{ color: '#FF3B3B' }} />
            <CardTitle>Failed Controls — Immediate Action Required</CardTitle>
          </div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '20px',
              fontSize: '0.65rem',
              fontWeight: 600,
              color: '#FF3B3B',
              backgroundColor: 'rgba(255,59,59,0.08)',
              border: '1px solid rgba(255,59,59,0.2)',
            }}
          >
            {FAILED_CONTROLS.length} failed · AED {totalExposure}M exposure
          </span>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {FAILED_CONTROLS.map((control, i) => (
              <FailedControlRow
                key={control.id}
                control={control}
                index={i}
                onClick={setSelectedControl}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* ── SECTION 4: Action Tracker ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={14} style={{ color: 'var(--risk-high)' }} />
            <CardTitle>Decision Layer — Control-Triggered Actions</CardTitle>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            Click any action to open full analysis
          </span>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {CONTROL_FAILURE_ACTIONS.map((action, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.06 }}
                onClick={() => setSelectedAction(action)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${PRIORITY_COLOR[action.priority]}25`,
                  cursor: 'pointer',
                  backgroundColor: `${PRIORITY_BG[action.priority]}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                whileHover={{ x: 3 }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: PRIORITY_COLOR[action.priority], borderRadius: '8px 0 0 8px' }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                      {action.title}
                    </span>
                    <span
                      style={{
                        padding: '1px 7px',
                        borderRadius: '4px',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        color: PRIORITY_COLOR[action.priority],
                        backgroundColor: `${PRIORITY_COLOR[action.priority]}15`,
                        border: `1px solid ${PRIORITY_COLOR[action.priority]}30`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        flexShrink: 0,
                      }}
                    >
                      {action.priority}
                    </span>
                    {action.daysOverdue > 0 && (
                      <span style={{ color: 'var(--risk-critical)', fontSize: '0.65rem', fontWeight: 700 }}>
                        {action.escalated ? '🔴' : '🟡'} {action.daysOverdue}d overdue
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 700 }}>{action.impactLabel}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <User size={9} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{action.owner}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={9} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Act in {action.deadline}</span>
                    </div>
                  </div>
                </div>

                <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </motion.div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* ── Filterable Control List + Chain ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* SECTION 3B: All Controls (filterable) */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FlaskConical size={14} style={{ color: '#4A9EFF' }} />
              <CardTitle>
                All Controls
                {activeFilter && (
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem', marginLeft: '6px' }}>
                    — {activeFilter} filter active
                  </span>
                )}
              </CardTitle>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              {filteredControls.length} showing
            </span>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '420px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
              <AnimatePresence mode="popLayout">
                {filteredControls.map((control, i) => (
                  <ControlRow
                    key={control.id}
                    control={control}
                    index={i}
                    onClick={setSelectedControl}
                  />
                ))}
              </AnimatePresence>
            </div>
          </CardBody>
        </Card>

        {/* SECTION 5: Control → Risk Impact Chain */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingDown size={14} style={{ color: '#FF3B3B' }} />
              <CardTitle>Control → Risk → Financial Exposure</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {FAILED_CONTROLS.map(control => (
                <ControlChainRow key={control.id} control={control} onClick={setSelectedControl} />
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── SECTION 7: ICOFAR Financial Controls ────────────────────────────── */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={14} style={{ color: 'var(--accent-primary)' }} />
            <CardTitle>Financial Controls — ICOFAR Compliance View</CardTitle>
          </div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '20px',
              fontSize: '0.62rem',
              fontWeight: 600,
              color: '#F5C518',
              backgroundColor: 'rgba(245,197,24,0.06)',
              border: '1px solid rgba(245,197,24,0.18)',
            }}
          >
            Simulated · ICOFAR Compliance View
          </span>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {FINANCIAL_CONTROLS.map((control, i) => (
              <ControlRow key={control.id} control={control} index={i} onClick={setSelectedControl} />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* ── Detail panels ─────────────────────────────────────────────────────── */}
      <ControlDetailPanel
        control={selectedControl}
        onClose={() => setSelectedControl(null)}
        onActionClick={handleActionClick}
      />

      <ActionDetailPanel
        action={selectedAction}
        onClose={() => setSelectedAction(null)}
      />
    </div>
  )
}
