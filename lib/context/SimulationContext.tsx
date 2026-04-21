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

interface SimulationContextValue {
  drivers: Driver[]
  risks: RiskState[]
  portfolio: PortfolioState
  explainability: ExplainabilityBlock
  mode: SimulationMode
  setDriverValue: (id: DriverId, value: number) => void
  resetDrivers: () => void
  setMode: (m: SimulationMode) => void
}

const Ctx = createContext<SimulationContextValue | null>(null)

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS)
  const [mode, setMode] = useState<SimulationMode>('baseline')

  const setDriverValue = useCallback((id: DriverId, value: number) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? applyDriverChange(d, value) : d)),
    )
    setMode((m) => (m === 'baseline' ? 'custom' : m))
  }, [])

  const resetDrivers = useCallback(() => {
    setDrivers(INITIAL_DRIVERS)
    setMode('baseline')
  }, [])

  const { risks, portfolio } = useMemo(() => runSimulation(drivers), [drivers])
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
    setDriverValue,
    resetDrivers,
    setMode,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSimulation() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSimulation must be used inside <SimulationProvider>')
  return ctx
}
