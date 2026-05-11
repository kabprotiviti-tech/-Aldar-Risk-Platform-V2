'use client'

/**
 * ARC Pack PDF Document — Patch E6
 * ---------------------------------
 * Real PDF generator using @react-pdf/renderer (replaces the previous
 * window.print() approach which was browser-dependent and styling-fragile).
 *
 * Renders the 6 standard ARC Pack sections — Cover, Group Risk Posture,
 * KRI Summary, Scenario Results, Outstanding Mitigation, Sign-off — into
 * a deterministic A4 multi-page PDF.
 *
 * Honors CLAUDE.md: every numeric on the cover anchors traces back to
 * the published Aldar press release; illustrative values are tagged.
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'
import {
  ALDAR_FY25_GROUP_REVENUE,
  ALDAR_FY25_GROUP_EBITDA,
  ALDAR_FY25_NET_PROFIT_AFTER_TAX,
  ALDAR_Q1_26_BACKLOG,
} from '@/lib/data/aldar-financials'
import { RISKS, type ActionDef } from '@/lib/engine/seedData'
import { KRI_DEFINITIONS } from '@/lib/data/kri-definitions'
import { entityForRisk } from '@/lib/data/risk-entity-mapping'
import { getEntity } from '@/lib/entities/hierarchy'

const COLORS = {
  bg: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  faint: '#e5e7eb',
  accent: '#FF6600',
  critical: '#FF3B3B',
  high: '#FF8C00',
  medium: '#F5C518',
  low: '#22C55E',
}

const s = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
    fontFamily: 'Helvetica',
  },
  sectionLabel: {
    fontSize: 8,
    color: COLORS.accent,
    letterSpacing: 1.5,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  h1: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  h2: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  body: {
    fontSize: 9,
    lineHeight: 1.55,
    color: COLORS.text,
  },
  muted: {
    fontSize: 8,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  tile: {
    flexBasis: '48%',
    padding: 10,
    border: `1px solid ${COLORS.faint}`,
    borderRadius: 4,
    marginBottom: 8,
  },
  tileLabel: {
    fontSize: 7,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  tileValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  table: { marginTop: 6 },
  th: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottom: `1px solid ${COLORS.faint}`,
  },
  thCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tr: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: `1px solid ${COLORS.faint}`,
  },
  tdCell: { fontSize: 8, color: COLORS.text },
  footerBar: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    fontSize: 7,
    color: COLORS.muted,
    textAlign: 'center',
    borderTop: `1px solid ${COLORS.faint}`,
    paddingTop: 6,
  },
  ratingPill: {
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 2,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  divider: {
    borderBottom: `1px dashed ${COLORS.faint}`,
    marginVertical: 10,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bulletDot: { width: 8, color: COLORS.accent },
})

function fmt(n: number, unit: string): string {
  if (unit === 'AED mn' && n >= 1000) {
    return `${(n / 1000).toFixed(1)} AED bn`
  }
  return `${n.toLocaleString()} ${unit}`
}

function ratingColor(score: number): string {
  if (score >= 16) return COLORS.critical
  if (score >= 12) return COLORS.high
  if (score >= 8) return COLORS.medium
  return COLORS.low
}

function ratingLabel(score: number): string {
  if (score >= 16) return 'Critical'
  if (score >= 12) return 'High'
  if (score >= 8) return 'Medium'
  return 'Low'
}

interface ARCPDFProps {
  topMitigations: ActionDef[]
}

export function ARCPackPDFDocument({ topMitigations }: ARCPDFProps) {
  const today = new Date().toLocaleDateString('en-AE', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const sortedRisks = [...RISKS]
    .map((r) => ({
      ...r,
      inherent: r.baseLikelihood * r.baseImpact,
    }))
    .sort((a, b) => b.inherent - a.inherent)

  return (
    <Document
      title="Aldar ARC Risk Pack"
      author="Aldar Group ERM"
      subject="Audit & Risk Committee Quarterly Pack"
      keywords="Aldar, ARC, ERM, risk"
    >
      {/* SECTION 1 — COVER */}
      <Page size="A4" style={s.page}>
        <View>
          <Text style={s.sectionLabel}>Audit &amp; Risk Committee</Text>
          <Text style={s.h1}>ARC Risk Pack</Text>
          <Text style={[s.body, { marginBottom: 12 }]}>
            Aldar Properties PJSC · {today} · Q2 FY2026 review
          </Text>
          <Text style={[s.body, { color: COLORS.muted, marginBottom: 20 }]}>
            Quarterly snapshot of Group enterprise risk, KRI breach
            posture, and mitigation status across Aldar Development,
            Investment, Education, and Hospitality. Sourced figures cite
            Aldar's published FY2025 and Q1 FY2026 results; illustrative
            figures are labelled and remain pending pilot calibration.
          </Text>
        </View>

        <View style={[s.row, { marginTop: 16 }]}>
          <View style={s.tile}>
            <Text style={s.tileLabel}>FY25 Group Revenue</Text>
            <Text style={s.tileValue}>
              {fmt(ALDAR_FY25_GROUP_REVENUE.value, ALDAR_FY25_GROUP_REVENUE.unit)}
            </Text>
          </View>
          <View style={s.tile}>
            <Text style={s.tileLabel}>FY25 EBITDA</Text>
            <Text style={s.tileValue}>
              {fmt(ALDAR_FY25_GROUP_EBITDA.value, ALDAR_FY25_GROUP_EBITDA.unit)}
            </Text>
          </View>
          <View style={s.tile}>
            <Text style={s.tileLabel}>FY25 Net Profit (PAT)</Text>
            <Text style={s.tileValue}>
              {fmt(ALDAR_FY25_NET_PROFIT_AFTER_TAX.value, ALDAR_FY25_NET_PROFIT_AFTER_TAX.unit)}
            </Text>
          </View>
          <View style={s.tile}>
            <Text style={s.tileLabel}>Q1 FY26 Backlog</Text>
            <Text style={s.tileValue}>
              {fmt(ALDAR_Q1_26_BACKLOG.value, ALDAR_Q1_26_BACKLOG.unit)}
            </Text>
          </View>
        </View>

        <Text style={[s.muted, { marginTop: 18, textAlign: 'right' }]}>
          Prepared by Group ERM · Reviewed by Audit &amp; Risk Committee
        </Text>

        <Text style={s.footerBar} fixed>
          Aldar ARC Pack · {today} · Page 1 of 5
        </Text>
      </Page>

      {/* SECTION 2 — GROUP RISK POSTURE (TOP-10) */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionLabel}>Section 2 — Group Risk Posture</Text>
        <Text style={s.h2}>Top 10 Risks &amp; Heatmap</Text>
        <Text style={[s.body, { marginBottom: 8 }]}>
          {sortedRisks.length} active engine risks across {' '}
          {new Set(sortedRisks.map((r) => entityForRisk(r.id))).size} entities.
          Top residual risk: {sortedRisks[0]?.id} {sortedRisks[0]?.name},
          inherent {sortedRisks[0]?.inherent}/25, owner {sortedRisks[0]?.owner}.
        </Text>

        <View style={s.table}>
          <View style={s.th}>
            <Text style={[s.thCell, { width: 22 }]}>#</Text>
            <Text style={[s.thCell, { width: 36 }]}>ID</Text>
            <Text style={[s.thCell, { flex: 2 }]}>Risk</Text>
            <Text style={[s.thCell, { flex: 1.4 }]}>Entity</Text>
            <Text style={[s.thCell, { width: 50, textAlign: 'right' }]}>Inherent</Text>
            <Text style={[s.thCell, { flex: 1 }]}>Rating</Text>
          </View>
          {sortedRisks.slice(0, 10).map((r, i) => {
            const e = getEntity(entityForRisk(r.id))
            const c = ratingColor(r.inherent)
            return (
              <View key={r.id} style={s.tr}>
                <Text style={[s.tdCell, { width: 22, color: COLORS.muted }]}>{i + 1}</Text>
                <Text style={[s.tdCell, { width: 36 }]}>{r.id}</Text>
                <Text style={[s.tdCell, { flex: 2 }]}>{r.name}</Text>
                <Text style={[s.tdCell, { flex: 1.4, color: COLORS.muted }]}>{e?.shortName ?? '—'}</Text>
                <Text style={[s.tdCell, { width: 50, textAlign: 'right' }]}>{r.inherent}/25</Text>
                <Text style={[s.tdCell, { flex: 1, color: c, fontFamily: 'Helvetica-Bold' }]}>{ratingLabel(r.inherent)}</Text>
              </View>
            )
          })}
        </View>

        <Text style={[s.muted, { marginTop: 12 }]}>
          Rating bands: Critical &gt;= 16, High 12-15, Medium 8-11, Low &lt; 8.
        </Text>

        <Text style={s.footerBar} fixed>
          Aldar ARC Pack · {today} · Page 2 of 5
        </Text>
      </Page>

      {/* SECTION 3 — KRI SUMMARY */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionLabel}>Section 3 — KRI Summary</Text>
        <Text style={s.h2}>Key Risk Indicators &amp; Appetite Anchors</Text>
        <Text style={[s.body, { marginBottom: 8 }]}>
          {KRI_DEFINITIONS.length} active KRIs tracked across Group + 4
          subsidiaries. Each KRI's amber / red boundary anchors back to a
          Risk Appetite Statement signed by the Audit &amp; Risk Committee
          or Group Treasury.
        </Text>

        <View style={s.table}>
          <View style={s.th}>
            <Text style={[s.thCell, { width: 44 }]}>ID</Text>
            <Text style={[s.thCell, { flex: 2 }]}>KRI</Text>
            <Text style={[s.thCell, { flex: 1.4 }]}>Owner</Text>
            <Text style={[s.thCell, { width: 64 }]}>Direction</Text>
            <Text style={[s.thCell, { width: 64, textAlign: 'right' }]}>Amber / Red</Text>
          </View>
          {KRI_DEFINITIONS.map((k) => (
            <View key={k.id} style={s.tr}>
              <Text style={[s.tdCell, { width: 44, fontFamily: 'Helvetica-Bold' }]}>{k.id}</Text>
              <Text style={[s.tdCell, { flex: 2 }]}>{k.name}</Text>
              <Text style={[s.tdCell, { flex: 1.4, color: COLORS.muted }]}>{k.owner}</Text>
              <Text style={[s.tdCell, { width: 64, color: COLORS.muted }]}>
                {k.direction === 'higher_is_better' ? 'higher-is-better' : 'lower-is-better'}
              </Text>
              <Text style={[s.tdCell, { width: 64, textAlign: 'right' }]}>
                {k.defaultThresholds.amberBoundary} / {k.defaultThresholds.redBoundary}
              </Text>
            </View>
          ))}
        </View>

        <Text style={s.footerBar} fixed>
          Aldar ARC Pack · {today} · Page 3 of 5
        </Text>
      </Page>

      {/* SECTION 4 — SCENARIO RESULTS + 5 — OUTSTANDING MITIGATIONS */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionLabel}>Section 4 — Scenario Results</Text>
        <Text style={s.h2}>Stress-Test Posture (Mild / Moderate / Severe)</Text>
        <Text style={[s.body, { marginBottom: 6 }]}>
          The simulation engine surfaces three pre-built scenarios across
          three intensity bands. Mild applies a 50% multiplier, Moderate
          100%, Severe 170%. Sliders on /scenarios let the AVP recalibrate.
        </Text>
        <View style={{ marginBottom: 6 }}>
          {[
            { name: 'Residential Price Collapse', driver: 'KRI-14 Residential Price Index', impact: 'Compresses GDV on unsold inventory; engine routes through R-003 + R-008.' },
            { name: 'Commercial Rental Decline', driver: 'KRI-15 Commercial Rent Index, KRI-10 Commercial Occupancy', impact: 'Compresses Aldar Investment NOI; routes through R-004 + R-005.' },
            { name: 'Global Financial Stress', driver: 'KRI-13 + KRI-16 default rates, KRI-14 + KRI-15 indices', impact: 'Compound stress; routes through R-008 (liquidity) primarily.' },
          ].map((scen, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <Text style={[s.body, { fontFamily: 'Helvetica-Bold' }]}>{scen.name}</Text>
              <Text style={s.body}>Drivers: {scen.driver}</Text>
              <Text style={[s.body, { color: COLORS.muted }]}>{scen.impact}</Text>
            </View>
          ))}
        </View>

        <View style={s.divider} />

        <Text style={s.sectionLabel}>Section 5 — Outstanding Mitigation Actions</Text>
        <Text style={s.h2}>Top Mitigation Levers</Text>
        <View style={s.table}>
          <View style={s.th}>
            <Text style={[s.thCell, { width: 50 }]}>ID</Text>
            <Text style={[s.thCell, { flex: 2 }]}>Action</Text>
            <Text style={[s.thCell, { flex: 1.4 }]}>Owner</Text>
            <Text style={[s.thCell, { width: 70 }]}>Effort</Text>
            <Text style={[s.thCell, { width: 50, textAlign: 'right' }]}>Reduction</Text>
          </View>
          {topMitigations.slice(0, 8).map((a) => (
            <View key={a.id} style={s.tr}>
              <Text style={[s.tdCell, { width: 50 }]}>{a.id}</Text>
              <Text style={[s.tdCell, { flex: 2 }]}>{a.name}</Text>
              <Text style={[s.tdCell, { flex: 1.4, color: COLORS.muted }]}>{a.ownerRole}</Text>
              <Text style={[s.tdCell, { width: 70, color: COLORS.muted }]}>
                {a.effort} · {a.horizon}
              </Text>
              <Text style={[s.tdCell, { width: 50, textAlign: 'right' }]}>
                -{a.expectedReductionPct}%
              </Text>
            </View>
          ))}
        </View>

        <Text style={s.footerBar} fixed>
          Aldar ARC Pack · {today} · Page 4 of 5
        </Text>
      </Page>

      {/* SECTION 6 — SIGN-OFF */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionLabel}>Section 6 — Sign-off</Text>
        <Text style={s.h2}>Pack Approval Block</Text>
        <Text style={[s.body, { marginBottom: 14 }]}>
          The undersigned confirm that the risks, KRIs, scenarios and
          mitigation programmes presented above represent Group ERM's
          best assessment of the Aldar enterprise risk profile as at
          {' '}{today}, and that all material exposures above appetite have
          been escalated to the Audit &amp; Risk Committee.
        </Text>

        {[
          { role: 'Group ERM Head', name: '__________________________' },
          { role: 'ARC Chair', name: '__________________________' },
          { role: 'Group CEO', name: '__________________________' },
        ].map((sig) => (
          <View key={sig.role} style={{ marginBottom: 22 }}>
            <Text style={[s.body, { fontFamily: 'Helvetica-Bold', marginBottom: 4 }]}>{sig.role}</Text>
            <Text style={s.body}>Signature: {sig.name}</Text>
            <Text style={[s.body, { color: COLORS.muted }]}>Date: {today}</Text>
          </View>
        ))}

        <View style={s.divider} />

        <Text style={s.muted}>
          Generated by the Aldar Risk Platform. Anchor figures verified
          against Aldar published results (FY25 Q4 + Q1 FY26 press
          releases). Engine-derived figures are illustrative MVP
          calibration — pilot replaces them with live feeds from PMS /
          Yardi / SAP / escrow agents.
        </Text>

        <Text style={s.footerBar} fixed>
          Aldar ARC Pack · {today} · Page 5 of 5
        </Text>
      </Page>
    </Document>
  )
}

/**
 * Trigger a browser download of the ARC Pack PDF. Caller passes the
 * mitigation actions (lifted from MitigationActionsContext + engine
 * ACTIONS) so the function stays pure.
 */
export async function downloadARCPackPDF(topMitigations: ActionDef[]) {
  const blob = await pdf(
    <ARCPackPDFDocument topMitigations={topMitigations} />,
  ).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `aldar-arc-pack-${new Date().toISOString().slice(0, 10)}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
