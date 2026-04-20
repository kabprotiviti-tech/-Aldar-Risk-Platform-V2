'use client'

// ─── Document Control Extractor ───────────────────────────────────────────────
// Accepts document text, runs simulated keyword-matching extraction,
// displays matched controls with confidence scores.
// Label: "Integration Pending — simulated extraction"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Hourglass,
  ChevronDown,
  ChevronUp,
  Brain,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import {
  extractControlsFromDocument,
  extractionSummary,
  type ExtractedControl,
} from '@/lib/documentControlExtraction'

// ─── Confidence bar ───────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 50 ? '#22C55E' : pct >= 30 ? '#F5C518' : '#94A3B8'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div
        style={{
          flex: 1,
          height: '4px',
          borderRadius: '2px',
          backgroundColor: 'var(--border-color)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: '2px',
            backgroundColor: color,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          color,
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
          minWidth: '28px',
          textAlign: 'right',
        }}
      >
        {pct}%
      </span>
    </div>
  )
}

// ─── Process badge ────────────────────────────────────────────────────────────

const PROCESS_COLOR: Record<string, string> = {
  'Finance':                '#4A9EFF',
  'Projects':               '#A855F7',
  'Procurement':            '#F97316',
  'IT & Cyber':             '#FF3B3B',
  'Revenue & Commercial':   '#22C55E',
  'Governance & Compliance':'#F5C518',
}

function ProcessBadge({ process }: { process: string }) {
  const color = PROCESS_COLOR[process] ?? 'var(--text-muted)'
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 7px',
        borderRadius: '4px',
        fontSize: '0.6rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color,
        backgroundColor: `${color}14`,
        border: `1px solid ${color}30`,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {process}
    </span>
  )
}

// ─── Single extracted control card ───────────────────────────────────────────

function ExtractedControlRow({
  result,
  index,
}: {
  result: ExtractedControl
  index: number
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      style={{
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
    >
      {/* Row header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          cursor: 'pointer',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        {/* Icon */}
        <ShieldCheck size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />

        {/* Title + process */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              {result.controlName}
            </span>
            <ProcessBadge process={result.process} />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '4px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.67rem',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {result.controlId}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.67rem' }}>·</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.67rem' }}>
              Risk: {result.linkedRisk}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.67rem' }}>·</span>
            <span
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.65rem',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={result.linkedRiskTitle}
            >
              {result.linkedRiskTitle}
            </span>
          </div>
        </div>

        {/* Confidence + chevron */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '90px', flexShrink: 0 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Confidence
          </span>
          <ConfidenceBar value={result.confidence} />
        </div>

        {expanded
          ? <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          : <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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
                padding: '10px 12px 12px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Keywords */}
              <div>
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: '5px',
                  }}
                >
                  Matched Keywords
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {result.matchedKeywords.map(kw => (
                    <span
                      key={kw}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '0.63rem',
                        fontWeight: 500,
                        color: 'var(--accent-primary)',
                        backgroundColor: 'var(--accent-glow)',
                        border: '1px solid var(--border-accent)',
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Extraction note */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  padding: '7px 9px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(74,158,255,0.05)',
                  border: '1px solid rgba(74,158,255,0.15)',
                }}
              >
                <Brain size={11} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.67rem', lineHeight: 1.5 }}>
                  {result.extractionNote}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Integration pending banner ───────────────────────────────────────────────

function IntegrationPendingBanner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '9px 12px',
        borderRadius: '7px',
        backgroundColor: 'rgba(245,197,24,0.05)',
        border: '1px solid rgba(245,197,24,0.25)',
      }}
    >
      <Hourglass size={12} style={{ color: '#F5C518', flexShrink: 0, marginTop: '1px' }} />
      <div>
        <div
          style={{
            color: '#F5C518',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
          }}
        >
          Integration Pending — Simulated Extraction
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.63rem', marginTop: '2px', lineHeight: 1.5 }}>
          Control extraction is using keyword-matching simulation. Connect to your GRC system to enable AI-powered extraction from live policy documents.
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '28px 16px',
        textAlign: 'center',
      }}
    >
      <FileSearch size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        No controls matched. Try loading a project report or governance document.
      </div>
    </div>
  )
}

// ─── Summary chips ────────────────────────────────────────────────────────────

function SummaryChip({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number | string
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
      <Icon size={11} style={{ color }} />
      <span style={{ color, fontSize: '0.9rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DocumentControlExtractorProps {
  documentText: string   // text passed in from document upload / paste
}

export function DocumentControlExtractor({ documentText }: DocumentControlExtractorProps) {
  const results = documentText.trim().length > 0
    ? extractControlsFromDocument(documentText)
    : []

  const summary = extractionSummary(results)

  if (documentText.trim().length === 0) return null

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={14} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <CardTitle>ICOFR Control Extraction</CardTitle>
        </div>

        {/* Summary chips */}
        {results.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <SummaryChip
              icon={ShieldCheck}
              label="Controls Found"
              value={summary.total}
              color="var(--accent-primary)"
            />
            <SummaryChip
              icon={CheckCircle2}
              label="High Confidence"
              value={summary.highConfidence}
              color="#22C55E"
            />
            <SummaryChip
              icon={AlertTriangle}
              label="Processes"
              value={Object.keys(summary.processGroups).length}
              color="#F5C518"
            />
          </div>
        )}
      </CardHeader>

      <CardBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Always-visible banner */}
          <IntegrationPendingBanner />

          {/* Process breakdown (if results exist) */}
          {results.length > 0 && Object.keys(summary.processGroups).length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '5px',
                padding: '8px 10px',
                borderRadius: '7px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  alignSelf: 'center',
                  marginRight: '4px',
                }}
              >
                Processes:
              </span>
              {Object.entries(summary.processGroups).map(([proc, count]) => (
                <span
                  key={proc}
                  style={{
                    padding: '1px 7px',
                    borderRadius: '4px',
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    color: PROCESS_COLOR[proc] ?? 'var(--text-muted)',
                    backgroundColor: `${PROCESS_COLOR[proc] ?? '#888'}12`,
                    border: `1px solid ${PROCESS_COLOR[proc] ?? '#888'}28`,
                  }}
                >
                  {proc} ({count})
                </span>
              ))}
            </div>
          )}

          {/* Results list */}
          {results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {results.map((r, i) => (
                <ExtractedControlRow key={r.controlId} result={r} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}

          {/* No results note */}
          {results.length === 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(148,163,184,0.05)',
                border: '1px dashed var(--border-color)',
              }}
            >
              <XCircle size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                Extraction requires at least 2 keyword matches per control. Load a sample document to see results.
              </span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
