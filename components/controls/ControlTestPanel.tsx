'use client'

// ─── Control Testing Engine — Test Panel ──────────────────────────────────────
// Displays test results for all 20 ICOFAR controls.
// Shows pass/fail/partial distribution, overdue tests, and per-control detail.
// Integration Pending — data from controlTestingEngine.ts simulation.

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Clock,
  Hourglass,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import {
  evaluateControlStatus,
  testingSummary,
  TEST_RESULT_COLOR,
  TEST_RESULT_BG,
  TEST_RESULT_LABEL,
  TEST_STATUS_COLOR,
  TEST_STATUS_LABEL,
  type ControlTestRecord,
  type TestResult,
  type TestStatus,
} from '@/lib/controlTestingEngine'

// ─── Pre-compute data ─────────────────────────────────────────────────────────

const ALL_RECORDS = evaluateControlStatus()
const SUMMARY = testingSummary(ALL_RECORDS)

// ─── Result badge ──────────────────────────────────────────────────────────────

function ResultBadge({ result }: { result: TestResult }) {
  const color = TEST_RESULT_COLOR[result]
  const bg    = TEST_RESULT_BG[result]
  const label = TEST_RESULT_LABEL[result]
  const Icon = result === 'pass' ? CheckCircle2 : result === 'fail' ? XCircle : AlertCircle
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: bg,
        border: `1px solid ${color}40`,
        color,
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <Icon size={9} />
      {label}
    </span>
  )
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function TestStatusBadge({ status, daysUntilDue }: { status: TestStatus; daysUntilDue: number }) {
  const color = TEST_STATUS_COLOR[status]
  const label = TEST_STATUS_LABEL[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 7px',
        borderRadius: '4px',
        backgroundColor: `${color}12`,
        border: `1px solid ${color}35`,
        color,
        fontSize: '0.6rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {status === 'overdue' && <Clock size={9} />}
      {label}
      {status === 'overdue' && ` ${Math.abs(daysUntilDue)}d`}
      {status === 'due-soon' && ` (${daysUntilDue}d)`}
    </span>
  )
}

// ─── Summary metric chip ──────────────────────────────────────────────────────

function MetricChip({
  value,
  label,
  color,
}: {
  value: number | string
  label: string
  color: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        padding: '7px 14px',
        borderRadius: '7px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <span style={{ color, fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  )
}

// ─── Filter tab ───────────────────────────────────────────────────────────────

type Filter = 'all' | TestResult | 'overdue'

function FilterTab({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  color: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        border: active ? `1px solid ${color}50` : '1px solid var(--border-color)',
        backgroundColor: active ? `${color}12` : 'transparent',
        color: active ? color : 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {label}
      <span
        style={{
          padding: '1px 5px',
          borderRadius: '3px',
          fontSize: '0.58rem',
          fontWeight: 700,
          backgroundColor: active ? `${color}20` : 'var(--bg-secondary)',
          color: active ? color : 'var(--text-muted)',
        }}
      >
        {count}
      </span>
    </button>
  )
}

// ─── Single test record row ───────────────────────────────────────────────────

function TestRecordRow({
  record,
  index,
}: {
  record: ControlTestRecord
  index: number
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      style={{
        borderRadius: '8px',
        border: `1px solid ${record.testResult === 'fail' ? 'rgba(255,59,59,0.2)' : 'var(--border-color)'}`,
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          cursor: 'pointer',
          backgroundColor: record.testResult === 'fail'
            ? 'rgba(255,59,59,0.03)'
            : 'var(--bg-secondary)',
        }}
      >
        {/* ID badge */}
        <span
          style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            fontVariantNumeric: 'tabular-nums',
            minWidth: '36px',
            flexShrink: 0,
          }}
        >
          {record.controlId}
        </span>

        {/* Name */}
        <span
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {record.controlName}
        </span>

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <ResultBadge result={record.testResult} />
          <TestStatusBadge status={record.testStatus} daysUntilDue={record.daysUntilDue} />
          {record.integrationPending && (
            <span
              style={{
                fontSize: '0.58rem',
                fontWeight: 600,
                color: '#F5C518',
                opacity: 0.7,
                whiteSpace: 'nowrap',
              }}
            >
              ⌛ Integration Pending
            </span>
          )}
        </div>

        {/* Chevron */}
        {expanded
          ? <ChevronUp size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          : <ChevronDown size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        }
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
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
                padding: '10px 12px 14px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {/* Meta grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Last Tested
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={10} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.73rem' }}>
                      {record.lastTestDate}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Next Due
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Hourglass size={10} style={{ color: TEST_STATUS_COLOR[record.testStatus] }} />
                    <span
                      style={{
                        color: TEST_STATUS_COLOR[record.testStatus],
                        fontSize: '0.73rem',
                        fontWeight: 600,
                      }}
                    >
                      {record.nextTestDue}
                      {record.testStatus === 'overdue' && ` (${Math.abs(record.daysUntilDue)}d overdue)`}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Tester
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={10} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                      {record.testerName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Evidence */}
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
                  Evidence Required
                </div>
                <div
                  style={{
                    padding: '6px 9px',
                    borderRadius: '5px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '0.7rem',
                    lineHeight: 1.5,
                  }}
                >
                  {record.testEvidence}
                </div>
              </div>

              {/* Test notes */}
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
                  Test Findings
                </div>
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: record.testResult === 'fail'
                      ? 'rgba(255,59,59,0.05)'
                      : record.testResult === 'partial'
                      ? 'rgba(245,197,24,0.05)'
                      : 'rgba(34,197,94,0.05)',
                    border: `1px solid ${TEST_RESULT_COLOR[record.testResult]}25`,
                    color: 'var(--text-secondary)',
                    fontSize: '0.72rem',
                    lineHeight: 1.6,
                  }}
                >
                  {record.testNotes}
                </div>
              </div>

              {/* ICOFAR assertion + frequency row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    backgroundColor: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.2)',
                  }}
                >
                  <Shield size={10} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ color: 'var(--accent-primary)', fontSize: '0.63rem', fontWeight: 600 }}>
                    {record.icafarAssertion}
                  </span>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '5px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '0.63rem',
                    fontWeight: 600,
                  }}
                >
                  {record.testFrequency}
                </span>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '5px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '0.63rem',
                  }}
                >
                  {record.controlType}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ControlTestPanel() {
  const [activeFilter, setActiveFilter] = useState<Filter>('all')

  const filtered = activeFilter === 'all'
    ? ALL_RECORDS
    : activeFilter === 'overdue'
    ? ALL_RECORDS.filter(r => r.testStatus === 'overdue')
    : ALL_RECORDS.filter(r => r.testResult === activeFilter as TestResult)

  return (
    <Card glow>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: 'rgba(74,158,255,0.1)',
              border: '1px solid rgba(74,158,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FlaskConical size={14} style={{ color: '#4A9EFF' }} />
          </div>
          <CardTitle>ICOFAR Control Testing Engine</CardTitle>
        </div>

        {/* Summary chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <MetricChip value={SUMMARY.total}    label="Total Controls"  color="var(--text-secondary)" />
          <MetricChip value={SUMMARY.pass}     label="Pass"            color="#22C55E" />
          <MetricChip value={SUMMARY.fail}     label="Fail"            color="#FF3B3B" />
          <MetricChip value={SUMMARY.partial}  label="Partial"         color="#F5C518" />
          <MetricChip value={SUMMARY.overdue}  label="Overdue"         color="#FF3B3B" />
          <MetricChip value={`${SUMMARY.passRate}%`} label="Pass Rate" color={SUMMARY.passRate >= 60 ? '#22C55E' : '#FF3B3B'} />
        </div>
      </CardHeader>

      <CardBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Integration pending notice */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '7px',
              padding: '8px 10px',
              borderRadius: '7px',
              backgroundColor: 'rgba(245,197,24,0.05)',
              border: '1px solid rgba(245,197,24,0.2)',
            }}
          >
            <Hourglass size={11} style={{ color: '#F5C518', flexShrink: 0, marginTop: '1px' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', lineHeight: 1.5 }}>
              <span style={{ color: '#F5C518', fontWeight: 700 }}>Integration Pending — </span>
              Test results are simulated. Connect GRC testing workflow to receive live test evidence and tester sign-offs.
            </span>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <FilterTab active={activeFilter === 'all'}     onClick={() => setActiveFilter('all')}     label="All"      count={SUMMARY.total}   color="var(--text-secondary)" />
            <FilterTab active={activeFilter === 'fail'}    onClick={() => setActiveFilter('fail')}    label="Failed"   count={SUMMARY.fail}    color="#FF3B3B" />
            <FilterTab active={activeFilter === 'partial'} onClick={() => setActiveFilter('partial')} label="Partial"  count={SUMMARY.partial} color="#F5C518" />
            <FilterTab active={activeFilter === 'pass'}    onClick={() => setActiveFilter('pass')}    label="Passed"   count={SUMMARY.pass}    color="#22C55E" />
            <FilterTab active={activeFilter === 'overdue'} onClick={() => setActiveFilter('overdue')} label="Overdue"  count={SUMMARY.overdue} color="#FF3B3B" />
          </div>

          {/* Records list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filtered.map((record, i) => (
              <TestRecordRow key={record.controlId} record={record} index={i} />
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
