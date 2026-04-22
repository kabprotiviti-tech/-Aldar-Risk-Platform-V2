'use client'

/**
 * Executive Impact Panel
 * ----------------------
 * Sits directly under the slider controls and answers, in <5 seconds,
 * "So what does this mean for Aldar?"
 *
 * ⚠️ Additive only — NO new simulation logic. All numbers come from existing
 *    engine outputs exposed via SimulationContext + decisionEngine:
 *      • portfolio.* (runSimulation)
 *      • costOfDelay() per risk (decisionEngine)
 *      • ceoSummary() top action + reduction (decisionEngine)
 *
 * Four blocks, business language only:
 *   1. Financial Impact        — revenue, cash flow, exposure change (AED + %)
 *   2. Risk Impact Summary     — top-3 risks with % increase + driving sliders
 *   3. Cost of Delay           — exposure in 7 and 30 days if nothing is done
 *   4. Action Summary          — top recommended action + risk-reduction %
 */

import React from 'react'
import { useSimulation } from '@/lib/context/SimulationContext'
import { costOfDelay, ceoSummary } from '@/lib/engine/decisionEngine'

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtMn = (v: number) =>
  `${v >= 0 ? '+' : ''}${v.toFixed(0)} AED mn`
const fmtAbsMn = (v: number) => `${v.toFixed(0)} AED mn`
const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`

const colourFor = (delta: number): string => {
  if (delta > 0.5) return 'var(--risk-critical)'
  if (delta > 0.05) return 'var(--risk-high)'
  if (delta < -0.05) return 'var(--risk-low)'
  return 'var(--text-tertiary)'
}

// ─── block wrapper ───────────────────────────────────────────────────────────
function Block({
  no,
  title,
  accent,
  children,
}: {
  no: string
  title: string
  accent: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#fff',
            background: accent,
            borderRadius: 4,
            padding: '2px 6px',
          }}
        >
          {no}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────
export function LiveBusinessImpact() {
  const { risks, portfolio, drivers, mode } = useSimulation()

  // ── 1. Financial Impact ─────────────────────────────────────────────────────
  // Aggregate existing risk-weighted Δ exposure by risk category. No new math.
  // Revenue lines: customer-facing income streams that fall when demand / price /
  // occupancy weaken  → Financial, Market/Sales, Strategic, Operational.
  // Cash-flow lines: items that defer / consume cash immediately → Project/
  // Construction (handover delays defer sales cash) + Financial (liquidity).
  const revenueCats = new Set([
    'Financial',
    'Market/Sales',
    'Strategic',
    'Operational',
  ])
  const cashflowCats = new Set(['Project/Construction', 'Financial'])

  let revenueImpact = 0
  let cashflowImpact = 0
  for (const r of risks) {
    if (revenueCats.has(r.category)) revenueImpact += r.deltaExposureAedMn
    if (cashflowCats.has(r.category)) cashflowImpact += r.deltaExposureAedMn
  }

  const exposureDelta = portfolio.deltaAedMn
  const exposurePct = portfolio.deltaPct

  // ── 2. Risk Impact Summary ─────────────────────────────────────────────────
  // Top-3 risks by % increase in inherent score (newInherent vs baseInherent).
  // Attach the top 2 driving sliders per risk from existing contributingDrivers.
  const top3 = [...risks]
    .map((r) => {
      const pctIncrease =
        r.baseInherent > 0
          ? ((r.newInherent - r.baseInherent) / r.baseInherent) * 100
          : 0
      const topDrivers = [...r.contributingDrivers]
        .sort((a, b) => Math.abs(b.contributionPoints) - Math.abs(a.contributionPoints))
        .slice(0, 2)
        .map((d) => d.driverName)
      return { ...r, pctIncrease, topDrivers }
    })
    .filter((r) => Math.abs(r.pctIncrease) > 0.5)
    .sort((a, b) => Math.abs(b.pctIncrease) - Math.abs(a.pctIncrease))
    .slice(0, 3)

  // ── 3. Cost of Delay (from existing decision engine) ───────────────────────
  let delay7 = 0
  let delay30 = 0
  for (const r of risks) {
    const cd = costOfDelay(r)
    delay7 += cd.at_7d_aed_mn
    delay30 += cd.at_30d_aed_mn
  }
  const currentExposureTotal = risks.reduce((s, r) => s + r.exposureAedMn, 0)
  const exposureIn7 = currentExposureTotal + delay7
  const exposureIn30 = currentExposureTotal + delay30

  // ── 4. Action Summary (from existing ceoSummary) ───────────────────────────
  const summary = ceoSummary(drivers, risks)
  const topAction = summary.top3Priorities[0]
  const topActionReductionPct =
    topAction && currentExposureTotal > 0
      ? (topAction.reductionAedMn / currentExposureTotal) * 100
      : 0

  // ── Headline narrative (boardroom-friendly, <5s read) ─────────────────────
  const atRest = Math.abs(exposurePct) < 0.5
  const dir = exposureDelta >= 0 ? 'worsens' : 'improves'
  const headline = atRest
    ? `Aldar is within baseline tolerance — no material change from current assumptions.`
    : `Aldar's risk-weighted exposure ${dir} by ${fmtAbsMn(Math.abs(exposureDelta))} (${fmtPct(exposurePct)}). ${
        portfolio.ratingFrom !== portfolio.ratingTo
          ? `Portfolio moves ${portfolio.ratingFrom} → ${portfolio.ratingTo}.`
          : `Portfolio band holds at ${portfolio.ratingTo}.`
      }`

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: '2px solid var(--accent-primary)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header + one-line headline */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            letterSpacing: 1.2,
          }}
        >
          Executive Impact Panel · So what does this mean for Aldar?
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-primary)',
            fontWeight: 600,
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          {headline}
        </div>
      </div>

      {/* 4 blocks in a responsive grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 10,
        }}
      >
        {/* ── BLOCK 1 — Financial Impact ─────────────────────────────────── */}
        <Block no="1" title="Financial Impact" accent="var(--accent-primary)">
          <Row label="Revenue at risk" value={fmtMn(revenueImpact)} color={colourFor(revenueImpact)} />
          <Row label="Cash flow at risk" value={fmtMn(cashflowImpact)} color={colourFor(cashflowImpact)} />
          <Row
            label="Portfolio exposure change"
            value={`${fmtMn(exposureDelta)} (${fmtPct(exposurePct)})`}
            color={colourFor(exposureDelta)}
            strong
          />
          <Caption text={`${portfolio.ratingFrom} → ${portfolio.ratingTo}`} />
        </Block>

        {/* ── BLOCK 2 — Risk Impact Summary ─────────────────────────────── */}
        <Block no="2" title="Top Risks Moving" accent="var(--risk-high)">
          {top3.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              No risks materially moving from baseline.
            </div>
          )}
          {top3.map((r, idx) => (
            <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: 6,
                  alignItems: 'center',
                  fontSize: 12,
                }}
              >
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 700 }}>#{idx + 1}</span>
                <span
                  style={{
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.name}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: colourFor(r.pctIncrease),
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmtPct(r.pctIncrease)}
                </span>
              </div>
              {r.topDrivers.length > 0 && (
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', paddingLeft: 22 }}>
                  driven by: {r.topDrivers.join(' · ')}
                </div>
              )}
            </div>
          ))}
        </Block>

        {/* ── BLOCK 3 — Cost of Delay ────────────────────────────────────── */}
        <Block no="3" title="Cost of Doing Nothing" accent="var(--risk-critical)">
          <Row
            label="Today"
            value={fmtAbsMn(currentExposureTotal)}
            color="var(--text-primary)"
          />
          <Row
            label="In 7 days"
            value={fmtAbsMn(exposureIn7)}
            color={colourFor(exposureIn7 - currentExposureTotal)}
          />
          <Row
            label="In 30 days"
            value={fmtAbsMn(exposureIn30)}
            color={colourFor(exposureIn30 - currentExposureTotal)}
            strong
          />
          <Caption
            text={`Exposure grows AED ${delay30.toFixed(0)} mn in 30 days if no action is taken.`}
          />
        </Block>

        {/* ── BLOCK 4 — Action Summary ───────────────────────────────────── */}
        <Block no="4" title="Recommended Action" accent="var(--risk-low)">
          {topAction && topAction.reductionAedMn > 0 ? (
            <>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                }}
              >
                {topAction.actionName}
              </div>
              <Row
                label="Expected risk reduction"
                value={`-${fmtAbsMn(topAction.reductionAedMn)} (${topActionReductionPct.toFixed(1)}%)`}
                color="var(--risk-low)"
                strong
              />
              <Row label="Owner" value={topAction.ownerRole} color="var(--text-secondary)" />
              <Row label="Time to act" value={topAction.timeToAct} color="var(--text-secondary)" />
              <Caption text={`Addresses: ${topAction.riskName}`} />
            </>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              No critical action required at current settings.
            </div>
          )}
        </Block>
      </div>

      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'right' }}>
        Mode: <b style={{ color: 'var(--text-secondary)' }}>{mode}</b> · figures are risk-weighted exposure (probability × impact × financial base), refreshed on every slider move
      </div>
    </div>
  )
}

// ─── small presentational helpers ────────────────────────────────────────────
function Row({
  label,
  value,
  color,
  strong,
}: {
  label: string
  value: string
  color: string
  strong?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 8,
        fontSize: strong ? 12 : 11,
      }}
    >
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color, fontWeight: strong ? 800 : 600, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}

function Caption({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        color: 'var(--text-tertiary)',
        fontStyle: 'italic',
        marginTop: 2,
      }}
    >
      {text}
    </div>
  )
}
