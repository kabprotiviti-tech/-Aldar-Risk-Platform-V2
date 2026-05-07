'use client'

/**
 * ERMScorecard — Module 4 / E4
 * -----------------------------
 * Departmental KPI summary surfaced on the Portfolio Tower. Six tiles:
 *   - Total residual exposure (AED mn)
 *   - Critical + High risk count
 *   - Mitigation actions: open / overdue
 *   - KRI breach posture (red / amber / green count)
 *   - Average composite control effectiveness
 *   - "ARC ready" rollup — a simple traffic-light derived from the above
 *
 * Honors CLAUDE.md: every tile derives from engine state + user
 * mitigations + KRI entries × thresholds. No fabrication. The "ARC
 * ready" tile applies a transparent rule the user can read in the
 * tooltip — no opaque scoring.
 */

import React, { useMemo } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  Activity,
  Shield,
  FileCheck,
} from 'lucide-react'
import { useSimulation } from '@/lib/context/SimulationContext'
import { useMitigationActions } from '@/lib/context/MitigationActionsContext'
import { useKRIThresholds } from '@/lib/context/KRIThresholdsContext'
import { useKRIEntries } from '@/lib/context/KRIEntriesContext'
import { KRI_DEFINITIONS } from '@/lib/data/kri-definitions'
import { computeKRIStatus, type KRIStatus } from '@/lib/data/kri-status'

export function ERMScorecard() {
  const { risks } = useSimulation()
  const { actions, isOverdue } = useMitigationActions()
  const { thresholdsFor } = useKRIThresholds()
  const { latestFor } = useKRIEntries()

  const totalExposure = useMemo(
    () => risks.reduce((s, r) => s + r.exposureAedMn, 0),
    [risks],
  )
  const criticalHigh = useMemo(
    () => risks.filter((r) => r.ratingTo === 'Critical' || r.ratingTo === 'High').length,
    [risks],
  )
  const openActions = useMemo(
    () => actions.filter((a) => a.status !== 'closed').length,
    [actions],
  )
  const overdueActions = useMemo(() => actions.filter(isOverdue).length, [actions, isOverdue])

  // KRI breach posture — count rows by status using the same compute helper.
  const kriCounts = useMemo(() => {
    const counts: Record<KRIStatus | 'no_data', number> = {
      green: 0,
      amber: 0,
      red: 0,
      no_data: 0,
    }
    for (const kri of KRI_DEFINITIONS) {
      const latest = latestFor(kri.id)
      if (!latest) {
        counts.no_data += 1
        continue
      }
      const status = computeKRIStatus(latest.value, thresholdsFor(kri), kri.direction)
      counts[status] += 1
    }
    return counts
  }, [latestFor, thresholdsFor])

  // Average composite effectiveness (engine output, 0..1)
  const avgControlEff = useMemo(() => {
    if (risks.length === 0) return 0
    const sum = risks.reduce((s, r) => s + r.compositeEffectiveness, 0)
    return sum / risks.length
  }, [risks])

  // "ARC ready" rollup — transparent rule:
  //   green if criticalHigh ≤ 3 AND overdueActions = 0 AND kri red ≤ 1
  //   amber if criticalHigh ≤ 5 AND overdueActions ≤ 2 AND kri red ≤ 3
  //   else red
  const arcReady: { status: KRIStatus; reason: string } = useMemo(() => {
    if (criticalHigh <= 3 && overdueActions === 0 && kriCounts.red <= 1) {
      return {
        status: 'green',
        reason: `≤3 critical/high risks (current ${criticalHigh}), no overdue actions (current ${overdueActions}), ≤1 red KRI (current ${kriCounts.red}).`,
      }
    }
    if (criticalHigh <= 5 && overdueActions <= 2 && kriCounts.red <= 3) {
      return {
        status: 'amber',
        reason: `${criticalHigh} critical/high · ${overdueActions} overdue · ${kriCounts.red} red KRIs — within tolerance, watching.`,
      }
    }
    return {
      status: 'red',
      reason: `${criticalHigh} critical/high · ${overdueActions} overdue · ${kriCounts.red} red KRIs — escalate before next ARC.`,
    }
  }, [criticalHigh, overdueActions, kriCounts.red])

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <FileCheck size={11} />
          ERM Scorecard
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
          Group-level KPI summary. Each tile derives from engine output ×
          user-entered mitigations × KRI entries.
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        <Tile
          icon={<Activity size={14} />}
          label="Residual Exposure"
          value={`${totalExposure.toFixed(0)}`}
          unit="AED mn"
          accent="var(--accent-primary)"
          hint={`across ${risks.length} risks`}
        />
        <Tile
          icon={<AlertTriangle size={14} />}
          label="Critical + High"
          value={`${criticalHigh}`}
          unit={`/ ${risks.length} risks`}
          accent={criticalHigh >= 5 ? 'var(--risk-critical)' : criticalHigh >= 3 ? 'var(--risk-medium)' : 'var(--risk-low)'}
          hint={criticalHigh === 0 ? 'all manageable' : 'requires action'}
        />
        <Tile
          icon={<ListChecks size={14} />}
          label="Open Mitigations"
          value={`${openActions}`}
          unit={overdueActions > 0 ? `· ${overdueActions} overdue` : 'on track'}
          accent={overdueActions > 0 ? 'var(--risk-critical)' : 'var(--risk-low)'}
          hint={`${actions.length} total in register`}
        />
        <Tile
          icon={<AlertTriangle size={14} />}
          label="KRI Breach Posture"
          value={`${kriCounts.red}/${kriCounts.amber}/${kriCounts.green}`}
          unit="R / A / G"
          accent={
            kriCounts.red >= 2
              ? 'var(--risk-critical)'
              : kriCounts.red >= 1 || kriCounts.amber >= 3
                ? 'var(--risk-medium)'
                : 'var(--risk-low)'
          }
          hint={kriCounts.no_data > 0 ? `${kriCounts.no_data} no data` : `${KRI_DEFINITIONS.length} KRIs tracked`}
        />
        <Tile
          icon={<Shield size={14} />}
          label="Avg Control Effectiveness"
          value={`${(avgControlEff * 100).toFixed(0)}%`}
          unit="composite"
          accent={avgControlEff >= 0.6 ? 'var(--risk-low)' : avgControlEff >= 0.4 ? 'var(--risk-medium)' : 'var(--risk-critical)'}
          hint="engine-derived"
        />
        <Tile
          icon={
            arcReady.status === 'green' ? (
              <CheckCircle2 size={14} />
            ) : (
              <AlertTriangle size={14} />
            )
          }
          label="ARC Ready"
          value={
            arcReady.status === 'green'
              ? 'Yes'
              : arcReady.status === 'amber'
                ? 'Watch'
                : 'Escalate'
          }
          unit={
            arcReady.status === 'green'
              ? '🟢'
              : arcReady.status === 'amber'
                ? '🟡'
                : '🔴'
          }
          accent={
            arcReady.status === 'green'
              ? 'var(--risk-low)'
              : arcReady.status === 'amber'
                ? 'var(--risk-medium)'
                : 'var(--risk-critical)'
          }
          hint={arcReady.reason}
          hintIsTooltip
        />
      </div>

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}
      >
        ARC Ready rule (transparent, no AI):{' '}
        <strong style={{ color: 'var(--risk-low)' }}>Yes</strong> if ≤3 critical/high &amp; 0 overdue &amp; ≤1 red KRI.{' '}
        <strong style={{ color: 'var(--risk-medium)' }}>Watch</strong> if ≤5 / ≤2 / ≤3.{' '}
        <strong style={{ color: 'var(--risk-critical)' }}>Escalate</strong> otherwise. Pilot
        will let the Group ERM Head edit the rule with approval.
      </div>
    </div>
  )
}

function Tile({
  icon,
  label,
  value,
  unit,
  accent,
  hint,
  hintIsTooltip,
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
  accent: string
  hint?: string
  hintIsTooltip?: boolean
}) {
  return (
    <div
      title={hintIsTooltip ? hint : undefined}
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 6,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 9,
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{unit}</span>
        )}
      </div>
      {hint && !hintIsTooltip && (
        <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{hint}</div>
      )}
    </div>
  )
}
