'use client'

/**
 * ARC Pack — Module 7 / E6 (scaffold)
 * ------------------------------------
 * Print-friendly Audit & Risk Committee pack. Renders as a regular page
 * for review on screen, then the user clicks "Print / Save as PDF" to
 * produce a board-ready document via the browser's native print engine
 * (no external PDF library dependency yet — keeps MVP light).
 *
 * E6 ships: cover page + table of contents + a print stylesheet that
 * formats the page like a clean A4 deliverable when printed.
 *
 * E7 adds: top-10 risks section, group heatmap, narrative.
 * E8 adds: KRI summary section, scenario results, sign-off block.
 *
 * Honors CLAUDE.md: header sourced figures (Aldar FY25/Q1 26) carry
 * provenance click-throughs on screen; the page-level "Illustrative"
 * banner is hidden in print so the printed pack reads as a polished
 * deliverable while the on-screen review version stays honest.
 */

import React, { useCallback, useState } from 'react'
import { Printer, FileText, FileDown, Loader2 } from 'lucide-react'
import { SimulationProvider, useSimulation } from '@/lib/context/SimulationContext'
import { KRIThresholdsProvider } from '@/lib/context/KRIThresholdsContext'
import { KRIEntriesProvider } from '@/lib/context/KRIEntriesContext'
import { MitigationActionsProvider } from '@/lib/context/MitigationActionsContext'
import { ACTIONS } from '@/lib/engine/seedData'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { NumericValue } from '@/components/provenance/NumericValue'
import {
  ALDAR_FY25_GROUP_REVENUE,
  ALDAR_FY25_GROUP_EBITDA,
  ALDAR_FY25_NET_PROFIT_AFTER_TAX,
  ALDAR_Q1_26_BACKLOG,
} from '@/lib/data/aldar-financials'
import { RiskContentSection } from '@/components/arc-pack/RiskContentSection'
import { ARCFinalSections } from '@/components/arc-pack/ARCFinalSections'

function CoverPage() {
  const today = new Date().toLocaleDateString('en-AE', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  return (
    <section
      className="arc-page"
      style={{
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '40px 48px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        pageBreakAfter: 'always',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--accent-primary)',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Audit &amp; Risk Committee
        </div>
        <h1
          style={{
            fontSize: 38,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '6px 0 12px',
            lineHeight: 1.15,
          }}
        >
          ARC Risk Pack
        </h1>
        <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 18 }}>
          Aldar Properties PJSC · {today} · Q2 FY2026 review
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-tertiary)',
            maxWidth: 540,
            lineHeight: 1.6,
          }}
        >
          Quarterly snapshot of Group enterprise risk, KRI breach posture,
          and mitigation status across Aldar Development, Investment,
          Education, and Hospitality. Sourced figures cite Aldar&rsquo;s
          published FY2025 and Q1 FY2026 results; illustrative figures are
          labelled and remain pending pilot calibration.
        </div>
      </div>

      {/* Anchor figures with provenance */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 14,
          padding: 18,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid var(--accent-primary)',
          borderRadius: 6,
        }}
      >
        <AnchorTile label="FY25 Group Revenue" data={ALDAR_FY25_GROUP_REVENUE} />
        <AnchorTile label="FY25 EBITDA" data={ALDAR_FY25_GROUP_EBITDA} />
        <AnchorTile label="FY25 Net Profit (PAT)" data={ALDAR_FY25_NET_PROFIT_AFTER_TAX} />
        <AnchorTile label="Q1 FY26 Backlog" data={ALDAR_Q1_26_BACKLOG} />
      </div>

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          textAlign: 'right',
          paddingTop: 24,
        }}
      >
        Prepared by Group ERM · Reviewed by Audit &amp; Risk Committee
      </div>
    </section>
  )
}

function AnchorTile({
  label,
  data,
}: {
  label: string
  data: import('@/lib/provenance/types').DataPoint
}) {
  const displayInBn = data.unit === 'AED mn' && data.value >= 1000
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
        <NumericValue
          data={data}
          format={(v) => (displayInBn ? `${(v / 1000).toFixed(1)}` : v.toLocaleString())}
          unitOverride={displayInBn ? 'AED bn' : data.unit}
        />
      </span>
    </div>
  )
}

function TableOfContents() {
  const items: { num: string; title: string; status: string }[] = [
    { num: '1', title: 'Cover & Anchor Figures', status: 'live' },
    { num: '2', title: 'Group Risk Posture (top-10, heatmap, narrative)', status: 'live' },
    { num: '3', title: 'KRI Summary & Breach Posture', status: 'live' },
    { num: '4', title: 'Scenario Results (Mild / Moderate / Severe)', status: 'live' },
    { num: '5', title: 'Outstanding Mitigation Actions', status: 'live' },
    { num: '6', title: 'Sign-off Block', status: 'live' },
  ]
  return (
    <section
      className="arc-page"
      style={{
        minHeight: '70vh',
        padding: '40px 48px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        marginTop: 14,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--accent-primary)',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Table of Contents
      </div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 20px',
        }}
      >
        Contents
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it) => (
          <div
            key={it.num}
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr auto',
              gap: 12,
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                fontSize: 14,
              }}
            >
              {it.num}.
            </span>
            <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
              {it.title}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: it.status === 'live' ? 'var(--risk-low)' : 'var(--text-tertiary)',
                background:
                  it.status === 'live'
                    ? 'rgba(34,197,94,0.18)'
                    : 'var(--bg-secondary)',
                border: `1px solid ${it.status === 'live' ? 'rgba(34,197,94,0.55)' : 'var(--border-color)'}`,
                padding: '2px 8px',
                borderRadius: 3,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {it.status}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 18,
          padding: 12,
          background: 'var(--bg-secondary)',
          border: '1px dashed var(--border-color)',
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>All 6 sections live.</strong>{' '}
        Click <em>Print / Save as PDF</em> to produce a board-ready document
        using the browser&rsquo;s native engine. The on-screen toolbar,
        sidebar, and demo banners are hidden in print so the output reads
        as a polished pack.
      </div>
    </section>
  )
}

function ARCPackContent() {
  const handlePrint = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }, [])

  const [exporting, setExporting] = useState(false)
  const handleExportPDF = useCallback(async () => {
    if (exporting) return
    setExporting(true)
    try {
      // Dynamic import keeps @react-pdf/renderer out of the initial bundle.
      const { downloadARCPackPDF } = await import(
        '@/components/arc-pack/ARCPackPDFDocument'
      )
      // Rank ACTIONS by expectedReductionPct desc — surfaces the highest-impact
      // levers in the printed pack.
      const top = [...ACTIONS].sort(
        (a, b) => b.expectedReductionPct - a.expectedReductionPct,
      )
      await downloadARCPackPDF(top)
    } catch (err) {
      console.error('PDF export failed', err)
      alert('PDF export failed — see console for details.')
    } finally {
      setExporting(false)
    }
  }, [exporting])

  // Pull risks just to show the count in the header (real content lands in E7)
  const { risks } = useSimulation()

  return (
    <div
      style={{
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Screen-only toolbar — hidden in print */}
      <div
        className="arc-toolbar"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
            ARC Pack Builder
          </h1>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: '4px 0 0',
              maxWidth: 720,
              lineHeight: 1.5,
            }}
          >
            Print-friendly Audit &amp; Risk Committee deliverable.
            Review on screen, then click Print / Save as PDF for a
            board-ready document. {risks.length} engine risks in current scope.
            All 6 sections live.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge tier="LIVE" note="All 6 sections live · PDF engine ready" />
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--accent-primary)',
              color: 'var(--on-accent)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: exporting ? 'wait' : 'pointer',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              opacity: exporting ? 0.7 : 1,
            }}
          >
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
            {exporting ? 'Generating PDF…' : 'Export PDF'}
          </button>
          <button
            onClick={handlePrint}
            title="Browser print engine fallback"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              padding: '8px 14px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            <Printer size={12} />
            Print
          </button>
        </div>
      </div>

      <div className="arc-document">
        <CoverPage />
        <TableOfContents />
        <RiskContentSection />
        <ARCFinalSections />
      </div>

      {/* Print styles — applied only when printing */}
      <style jsx global>{`
        @media print {
          /* Hide toolbar, sidebar, mobile nav, anonymise pill, env banner */
          .arc-toolbar,
          .sidebar-fixed,
          .mobile-bottom-nav,
          [data-stealth-ignore='true'],
          [role='status'][aria-label*='simulated'],
          .arc-print-hide {
            display: none !important;
          }
          html,
          body {
            background: white !important;
            color: black !important;
          }
          .arc-page {
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            page-break-inside: avoid;
            margin: 0 !important;
          }
          .arc-page h1,
          .arc-page h2,
          .arc-page h3 {
            color: black !important;
          }
          @page {
            size: A4;
            margin: 16mm 14mm;
          }
        }
      `}</style>
    </div>
  )
}

export default function ARCPackPage() {
  return (
    <SimulationProvider>
      <KRIThresholdsProvider>
        <KRIEntriesProvider>
          <MitigationActionsProvider>
            <ARCPackContent />
          </MitigationActionsProvider>
        </KRIEntriesProvider>
      </KRIThresholdsProvider>
    </SimulationProvider>
  )
}
