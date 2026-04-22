'use client'

/**
 * SimulationWorkbench
 * -------------------
 * One drop-in component that mounts the full simulation layer:
 *   - Driver sliders
 *   - Baseline vs Simulation
 *   - Explainability
 *   - AI Decision layer
 *
 * Wraps everything in its own SimulationProvider so callers don't need to
 * modify the app layout. Does NOT alter or conflict with any existing UI.
 *
 * Board Mode (toggle top-right) hides detail-heavy panels for a 90-sec
 * board-room demo; the full analyst view is available to everyone else.
 */

import React from 'react'
import { SimulationProvider } from '@/lib/context/SimulationContext'
import { BoardModeProvider, useBoardMode } from '@/lib/context/BoardModeContext'
import { useDerivedRisks } from '@/lib/context/DerivedRisksContext'
import { DriverControlPanel } from './DriverControlPanel'
import { ScenarioControlPanel } from './ScenarioControlPanel'
import { ScenarioImpactPanel } from './ScenarioImpactPanel'
import { BaselineVsSimulationPanel } from './BaselineVsSimulationPanel'
import { ExplainabilityPanel } from './ExplainabilityPanel'
import { DecisionPanel } from './DecisionPanel'
import { RegisterCriticPanel } from './RegisterCriticPanel'
import { ExternalSignalCouplingPanel } from './ExternalSignalCouplingPanel'
import { NewsIntelligenceCards } from './NewsIntelligenceCards'
import { AssumptionsFooter } from './AssumptionsFooter'
import { BoardModeToggle } from './BoardModeToggle'

const SEED_HEADLINES = [
  'Steel prices surge 18% on China demand',
  'UAE tightens ESG disclosure rules for listed developers',
  'Red Sea shipping disruption extends lead times on imports',
]

export function SimulationWorkbench() {
  return (
    <SimulationProvider>
      <BoardModeProvider>
        <WorkbenchBody />
      </BoardModeProvider>
    </SimulationProvider>
  )
}

function WorkbenchBody() {
  const { boardMode } = useBoardMode()
  const { derivedRisks, sourceFileName, clearDerivedRisks } = useDerivedRisks()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: '16px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Intelligence Workbench {boardMode && '· Board View'}
        </div>
        <BoardModeToggle />
      </div>

      {derivedRisks.length > 0 && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--accent-primary)',
            borderLeft: '3px solid var(--accent-primary)',
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <b style={{ color: 'var(--accent-primary)' }}>+{derivedRisks.length} control-based risks</b> from{' '}
            <i>{sourceFileName}</i> are live in this simulation (source = control_assessment).
          </div>
          <button
            onClick={clearDerivedRisks}
            style={{
              background: 'transparent',
              color: 'var(--text-tertiary)',
              border: '1px solid var(--border-primary)',
              fontSize: 10,
              padding: '5px 10px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Remove derived risks
          </button>
        </div>
      )}

      <ScenarioControlPanel />
      <ScenarioImpactPanel />

      <DriverControlPanel />

      {!boardMode && <NewsIntelligenceCards headlines={SEED_HEADLINES} />}
      {!boardMode && <ExternalSignalCouplingPanel seedHeadlines={SEED_HEADLINES} />}

      <BaselineVsSimulationPanel />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: boardMode ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 16,
        }}
      >
        {!boardMode && <ExplainabilityPanel />}
        <DecisionPanel />
      </div>

      {!boardMode && <RegisterCriticPanel />}
      {!boardMode && <AssumptionsFooter />}
    </div>
  )
}
