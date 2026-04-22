'use client'

/**
 * SimulationContext
 * -----------------
 * Central state for the simulation workbench. Drivers are the only input;
 * risks, exposure, and explainability are derived via useMemo every render.
 *
 * This context is OPTIONAL — components that don't need it are unaffected.
 */

import React, { createContext, useContext, useMemo, useState, useCallback } from 'react'
import type { Driver, DriverId, RiskState, PortfolioState, SimulationMode } from '@/lib/engine/types'
import { INITIAL_DRIVERS } from '@/lib/engine/seedData'
import { applyDriverChange, runSimulation } from '@/lib/engine/simulationEngine'
import { generateExplainability, type ExplainabilityBlock } from '@/lib/engine/explainabilityEngine'
import { useDerivedRisks } from '@/lib/context/DerivedRisksContext'
import {
  SCENARIOS,
  scenarioTargetValues,
  type ScenarioIntensity,
} from '@/lib/engine/scenarios'

export interface ActiveScenario {
  scenarioId: string
  intensity: ScenarioIntensity
}

interface SimulationContextValue {
  drivers: Driver[]
  risks: RiskState[]
  portfolio: PortfolioState
  explainability: ExplainabilityBlock
  mode: SimulationMode
  activeScenario: ActiveScenario | null
  setDriverValue: (id: DriverId, value: number) => void
  resetDrivers: () => void
  setMode: (m: SimulationMode) => void
  applyScenario: (scenarioId: string, intensity: ScenarioIntensity) => void
  clearScenario: () => void
}

const Ctx = createContext<SimulationContextValue | null>(null)

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS)
  const [mode, setMode] = useState<SimulationMode>('baseline')
  const [activeScenario, setActiveScenario] = useState<ActiveScenario | null>(null)

  const setDriverValue = useCallback((id: DriverId, value: number) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? applyDriverChange(d, value) : d)),
    )
    setMode((m) => (m === 'baseline' ? 'custom' : m))
    // Manual driver edit breaks an active scenario preset
    setActiveScenario(null)
  }, [])

  const resetDrivers = useCallback(() => {
    setDrivers(INITIAL_DRIVERS)
    setMode('baseline')
    setActiveScenario(null)
  }, [])

  const applyScenario = useCallback(
    (scenarioId: string, intensity: ScenarioIntensity) => {
      const scenario = SCENARIOS.find((s) => s.id === scenarioId)
      if (!scenario) return
      setDrivers((prev) => {
        // start from a clean baseline so scenarios don't stack with prior edits
        const base = INITIAL_DRIVERS.map((d) => ({ ...d }))
        const targets = scenarioTargetValues(scenario, intensity, base)
        const byId = new Map(targets.map((t) => [t.driverId, t.targetValue]))
        return base.map((d) =>
          byId.has(d.id) ? applyDriverChange(d, byId.get(d.id) as number) : d,
        )
      })
      setMode('scenario')
      setActiveScenario({ scenarioId, intensity })
    },
    [],
  )

  const clearScenario = useCallback(() => {
    setDrivers(INITIAL_DRIVERS)
    setMode('baseline')
    setActiveScenario(null)
  }, [])

  // Derived risks from control-assessment uploads are added ON TOP of seed RISKS.
  // If no upload has happened the array is empty → behaviour is unchanged.
  const { derivedRisks } = useDerivedRisks()
  const { risks, portfolio } = useMemo(
    () => runSimulation(drivers, derivedRisks),
    [drivers, derivedRisks],
  )
  const explainability = useMemo(
    () => generateExplainability(mode, drivers, risks, portfolio),
    [mode, drivers, risks, portfolio],
  )

  const value: SimulationContextValue = {
    drivers,
    risks,
    portfolio,
    explainability,
    mode,
    activeScenario,
    setDriverValue,
    resetDrivers,
    setMode,
    applyScenario,
    clearScenario,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSimulation() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSimulation must be used inside <SimulationProvider>')
  return ctx
}
