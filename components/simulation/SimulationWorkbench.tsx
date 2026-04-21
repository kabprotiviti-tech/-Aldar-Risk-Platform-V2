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
 */

import React from 'react'
import { SimulationProvider } from '@/lib/context/SimulationContext'
import { DriverControlPanel } from './DriverControlPanel'
import { BaselineVsSimulationPanel } from './BaselineVsSimulationPanel'
import { ExplainabilityPanel } from './ExplainabilityPanel'
import { DecisionPanel } from './DecisionPanel'

export function SimulationWorkbench() {
  return (
    <SimulationProvider>
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
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Intelligence Workbench
        </div>

        <DriverControlPanel />
        <BaselineVsSimulationPanel />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 16,
          }}
        >
          <ExplainabilityPanel />
          <DecisionPanel />
        </div>
      </div>
    </SimulationProvider>
  )
}
