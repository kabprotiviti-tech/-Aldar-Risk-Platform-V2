'use client'

import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  File,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Zap,
  Clock,
  X,
  TrendingUp,
  ShieldAlert,
  Database,
  RefreshCw,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { RiskBadge } from '@/components/ui/Badge'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewRisk {
  id: string
  title: string
  category: string
  portfolio: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  likelihood: number
  impact: number
  score: number
  financialImpact: string
  description: string
  source: string
}

interface UpdatedRisk {
  riskId: string
  title: string
  changeType: 'escalate' | 'de-escalate' | 'close' | 'update'
  previousStatus: string
  newStatus: string
  rationale: string
  urgency: 'immediate' | 'standard' | 'low'
}

interface ProjectImpact {
  project: string
  type: 'delay' | 'cost-overrun' | 'scope-change' | 'regulatory'
  description: string
  financialImpact: string
  timeline: string
  portfolio: string
}

interface AnalyzeResult {
  newRisks: NewRisk[]
  updatedRisks: UpdatedRisk[]
  projectImpacts: ProjectImpact[]
  summary: string
  analyzedAt: string
  fileName: string
}

interface ChangeEntry {
  id: string
  type: 'new_risk' | 'updated_risk' | 'project_impact'
  description: string
  severity?: string
  timestamp: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  csv: FileSpreadsheet,
  txt: FileText,
}

function fileExt(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? 'unknown'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function cleanText(raw: string): string {
  // Strip non-printable chars (keeps ASCII 32–126 + common whitespace)
  return raw.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, ' ').replace(/\s{3,}/g, '\n').trim()
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const raw = e.target?.result as string
      resolve(cleanText(raw))
    }
    reader.onerror = () => reject(new Error('File read error'))
    reader.readAsText(file, 'UTF-8')
  })
}

const CHANGE_TYPE_COLOR: Record<UpdatedRisk['changeType'], string> = {
  escalate: 'var(--risk-critical)',
  'de-escalate': 'var(--risk-low)',
  close: 'var(--text-muted)',
  update: 'var(--risk-medium)',
}

const CHANGE_TYPE_BG: Record<UpdatedRisk['changeType'], string> = {
  escalate: 'rgba(255,59,59,0.12)',
  'de-escalate': 'rgba(34,197,94,0.12)',
  close: 'rgba(255,255,255,0.05)',
  update: 'rgba(245,197,24,0.12)',
}

const IMPACT_TYPE_COLOR: Record<ProjectImpact['type'], string> = {
  delay: 'var(--risk-high)',
  'cost-overrun': 'var(--risk-critical)',
  'scope-change': 'var(--risk-medium)',
  regulatory: '#4A9EFF',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState(false)
  const [applying, setApplying] = useState(false)
  const [changeLog, setChangeLog] = useState<ChangeEntry[]>([])
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null)

  const handleFile = useCallback(async (f: File) => {
    const ext = fileExt(f.name)
    if (!['pdf', 'csv', 'txt'].includes(ext)) {
      setError('Unsupported file type. Please upload PDF, CSV, or TXT.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10 MB.')
      return
    }
    setError(null)
    setResult(null)
    setApplied(false)
    setChangeLog([])
    setFile(f)
    try {
      const text = await readFileAsText(f)
      setFileContent(text)
    } catch {
      setError('Could not read file. Ensure it is a valid text-based document.')
    }
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile]
  )

  const analyze = async () => {
    if (!file || !fileContent) return
    setLoading(true)
    setError(null)
    setResult(null)
    setApplied(false)
    setChangeLog([])

    try {
      const res = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fileContent, fileName: file.name }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const applyToSystem = async () => {
    if (!result) return
    setApplying(true)
    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 1200))

    const entries: ChangeEntry[] = []
    const now = new Date().toISOString()

    result.newRisks.forEach((r) => {
      entries.push({
        id: `CL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'new_risk',
        description: `Added new ${r.severity.toUpperCase()} risk: "${r.title}" → ${r.portfolio} · ${r.financialImpact}`,
        severity: r.severity,
        timestamp: now,
      })
    })

    result.updatedRisks.forEach((u) => {
      entries.push({
        id: `CL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'updated_risk',
        description: `${u.changeType.toUpperCase()}: ${u.title} — ${u.previousStatus} → ${u.newStatus}`,
        severity: u.urgency === 'immediate' ? 'high' : 'medium',
        timestamp: now,
      })
    })

    result.projectImpacts.forEach((p) => {
      entries.push({
        id: `CL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'project_impact',
        description: `${p.type.replace('-', ' ').toUpperCase()} logged: ${p.project} — ${p.financialImpact} · ${p.timeline}`,
        timestamp: now,
      })
    })

    setChangeLog(entries)
    setApplied(true)
    setApplying(false)
  }

  const resetUpload = () => {
    setFile(null)
    setFileContent('')
    setResult(null)
    setError(null)
    setApplied(false)
    setChangeLog([])
    if (inputRef.current) inputRef.current.value = ''
  }

  const ext = file ? fileExt(file.name) : ''
  const FileIcon = FILE_ICONS[ext] ?? File

  const totalChanges = result
    ? result.newRisks.length + result.updatedRisks.length + result.projectImpacts.length
    : 0

  return (
    <div className="space-y-5">
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UploadCloud size={14} style={{ color: 'var(--accent-primary)' }} />
            <CardTitle>Upload &amp; Intelligence Engine</CardTitle>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            PDF · CSV · TXT — AI risk extraction in seconds
          </span>
        </CardHeader>
        <CardBody>
          {!file ? (
            // Drop zone
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: dragOver ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                transition: 'all 0.18s ease',
              }}
            >
              <UploadCloud
                size={36}
                style={{ color: dragOver ? 'var(--accent-primary)' : 'var(--text-muted)', margin: '0 auto 12px' }}
              />
              <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Drop file here or click to browse
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Supported: PDF · CSV · TXT &nbsp;·&nbsp; Max 10 MB
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {['Project Reports', 'Board Papers', 'Risk Registers', 'Audit Reports', 'Contract Documents'].map((t) => (
                  <span
                    key={t}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '0.68rem',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            // File preview
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--accent-glow)',
                    border: '1px solid var(--border-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileIcon size={22} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span>{formatBytes(file.size)}</span>
                    <span style={{ textTransform: 'uppercase', color: 'var(--accent-primary)', fontWeight: 600 }}>.{ext}</span>
                    <span>{fileContent.length.toLocaleString()} chars extracted</span>
                  </div>
                  {fileContent && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.5,
                        maxHeight: '60px',
                        overflow: 'hidden',
                      }}
                    >
                      {fileContent.substring(0, 200)}…
                    </div>
                  )}
                </div>
                <button
                  onClick={resetUpload}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '4px',
                    flexShrink: 0,
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {error && (
                <div
                  style={{
                    marginTop: '10px',
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

              <div className="flex items-center justify-between mt-4">
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Ready for AI analysis
                </span>
                <button
                  onClick={analyze}
                  disabled={loading || !fileContent}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Extracting risks...
                    </>
                  ) : (
                    <>
                      <Zap size={15} />
                      Analyze Document
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.csv,.txt"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </CardBody>
      </Card>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '32px' }}
          >
            <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: 'var(--accent-primary)' }} />
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px' }}>
              AI is analyzing your document...
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Extracting new risks · Identifying updates · Mapping project impacts
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Summary + Stats */}
            <div className="grid grid-cols-3 gap-4">
              {/* Summary */}
              <div style={{ gridColumn: 'span 2' }}>
                <Card accent>
                  <CardHeader>
                    <CardTitle>Executive Summary</CardTitle>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {new Date(result.analyzedAt).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })}
                    </span>
                  </CardHeader>
                  <CardBody>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65 }}>
                      {result.summary}
                    </p>
                    <div
                      style={{
                        marginTop: '12px',
                        display: 'flex',
                        gap: '16px',
                        flexWrap: 'wrap',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--border-color)',
                      }}
                    >
                      <Stat label="New Risks" value={result.newRisks.length} color="var(--risk-high)" />
                      <Stat label="Updated Risks" value={result.updatedRisks.length} color="var(--risk-medium)" />
                      <Stat label="Project Impacts" value={result.projectImpacts.length} color="var(--accent-primary)" />
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Apply to System */}
              <Card>
                <CardHeader>
                  <CardTitle>Apply to System</CardTitle>
                </CardHeader>
                <CardBody>
                  {!applied ? (
                    <div className="space-y-4">
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        {totalChanges} change{totalChanges !== 1 ? 's' : ''} ready to apply — updates risk register, portfolio signals and fusion engine.
                      </p>
                      <div className="space-y-2">
                        {result.newRisks.length > 0 && <ApplyLine label={`${result.newRisks.length} new risk${result.newRisks.length !== 1 ? 's' : ''} added`} color="var(--risk-high)" />}
                        {result.updatedRisks.length > 0 && <ApplyLine label={`${result.updatedRisks.length} register update${result.updatedRisks.length !== 1 ? 's' : ''}`} color="var(--risk-medium)" />}
                        {result.projectImpacts.length > 0 && <ApplyLine label={`${result.projectImpacts.length} project impact${result.projectImpacts.length !== 1 ? 's' : ''} logged`} color="var(--accent-primary)" />}
                      </div>
                      <button
                        onClick={applyToSystem}
                        disabled={applying}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                        style={{ marginTop: '8px' }}
                      >
                        {applying ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <Database size={14} />
                            Apply to System
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-3"
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '16px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(34,197,94,0.08)',
                          border: '1px solid rgba(34,197,94,0.25)',
                        }}
                      >
                        <CheckCircle2 size={24} style={{ color: 'var(--risk-low)' }} />
                        <div style={{ color: 'var(--risk-low)', fontWeight: 700, fontSize: '0.875rem' }}>
                          Updates Applied
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textAlign: 'center' }}>
                          {totalChanges} changes committed to risk register
                        </div>
                      </div>
                      <button
                        onClick={resetUpload}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Upload Another Document
                      </button>
                    </motion.div>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* New Risks Table */}
            {result.newRisks.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} style={{ color: 'var(--risk-high)' }} />
                    <CardTitle>New Risks Extracted ({result.newRisks.length})</CardTitle>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    Click a row to expand description
                  </span>
                </CardHeader>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Risk Title</th>
                        <th>Category</th>
                        <th>Portfolio</th>
                        <th>Severity</th>
                        <th>L</th>
                        <th>I</th>
                        <th>Score</th>
                        <th>Financial Impact</th>
                        <th>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.newRisks.map((risk) => (
                        <React.Fragment key={risk.id}>
                          <tr
                            onClick={() => setExpandedRisk(expandedRisk === risk.id ? null : risk.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{risk.id}</td>
                            <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{risk.title}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'capitalize' }}>{risk.category}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{risk.portfolio}</td>
                            <td><RiskBadge severity={risk.severity as 'critical' | 'high' | 'medium' | 'low'} /></td>
                            <td style={{ textAlign: 'center' }}>{risk.likelihood}</td>
                            <td style={{ textAlign: 'center' }}>{risk.impact}</td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--risk-high)' }}>{risk.score}</td>
                            <td style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>{risk.financialImpact}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.72rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{risk.source}</td>
                          </tr>
                          <AnimatePresence>
                            {expandedRisk === risk.id && (
                              <tr>
                                <td colSpan={10} style={{ padding: 0 }}>
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{
                                      padding: '12px 16px',
                                      backgroundColor: 'var(--bg-secondary)',
                                      borderLeft: '3px solid var(--accent-primary)',
                                      fontSize: '0.8rem',
                                      lineHeight: 1.6,
                                      color: 'var(--text-secondary)',
                                    }}
                                  >
                                    <strong style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description:</strong>
                                    <br />
                                    {risk.description}
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Updated Risks + Project Impacts — 2 col */}
            {(result.updatedRisks.length > 0 || result.projectImpacts.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {/* Updated Risks */}
                {result.updatedRisks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <RefreshCw size={13} style={{ color: 'var(--risk-medium)' }} />
                        <CardTitle>Register Updates ({result.updatedRisks.length})</CardTitle>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-3">
                      {result.updatedRisks.map((u, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '12px',
                            borderRadius: '9px',
                            backgroundColor: CHANGE_TYPE_BG[u.changeType],
                            borderLeft: `3px solid ${CHANGE_TYPE_COLOR[u.changeType]}`,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                padding: '2px 7px',
                                borderRadius: '5px',
                                backgroundColor: CHANGE_TYPE_BG[u.changeType],
                                color: CHANGE_TYPE_COLOR[u.changeType],
                                border: `1px solid ${CHANGE_TYPE_COLOR[u.changeType]}40`,
                              }}
                            >
                              {u.changeType}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'monospace' }}>{u.riskId}</span>
                            {u.urgency === 'immediate' && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', backgroundColor: 'rgba(255,59,59,0.12)', color: 'var(--risk-critical)' }}>
                                Immediate
                              </span>
                            )}
                          </div>
                          <div style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
                            {u.title}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{u.previousStatus}</span>
                            {' '}
                            <ArrowRight size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                            {' '}
                            <span style={{ color: CHANGE_TYPE_COLOR[u.changeType], fontWeight: 600 }}>{u.newStatus}</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{u.rationale}</div>
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                )}

                {/* Project Impacts */}
                {result.projectImpacts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={13} style={{ color: 'var(--accent-primary)' }} />
                        <CardTitle>Project Impacts ({result.projectImpacts.length})</CardTitle>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-3">
                      {result.projectImpacts.map((p, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '12px',
                            borderRadius: '9px',
                            backgroundColor: 'var(--bg-secondary)',
                            borderLeft: `3px solid ${IMPACT_TYPE_COLOR[p.type]}`,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                padding: '2px 7px',
                                borderRadius: '5px',
                                backgroundColor: `${IMPACT_TYPE_COLOR[p.type]}18`,
                                color: IMPACT_TYPE_COLOR[p.type],
                              }}
                            >
                              {p.type.replace('-', ' ')}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{p.portfolio}</span>
                          </div>
                          <div style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '3px' }}>
                            {p.project}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '6px' }}>
                            {p.description}
                          </div>
                          <div className="flex gap-3">
                            <span style={{ color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 600 }}>{p.financialImpact}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{p.timeline}</span>
                          </div>
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Log */}
      <AnimatePresence>
        {changeLog.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                  <CardTitle>System Change Log</CardTitle>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  {changeLog.length} changes · {new Date(changeLog[0].timestamp).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })}
                </span>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {changeLog.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '7px',
                        backgroundColor: 'var(--bg-secondary)',
                      }}
                    >
                      <div
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor:
                            entry.type === 'new_risk'
                              ? 'var(--risk-high)'
                              : entry.type === 'updated_risk'
                              ? 'var(--risk-medium)'
                              : 'var(--accent-primary)',
                          marginTop: '5px',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', flex: 1, lineHeight: 1.5 }}>
                        {entry.description}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {new Date(entry.timestamp).toLocaleTimeString('en-AE', { timeZone: 'Asia/Dubai' })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        {label}: <strong style={{ color }}>{value}</strong>
      </span>
    </div>
  )
}

function ApplyLine({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <ArrowRight size={12} style={{ color, flexShrink: 0 }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{label}</span>
    </div>
  )
}
