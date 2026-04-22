'use client'

/**
 * DerivedRisksContext
 * -------------------
 * Global, app-level store for risks generated from control-assessment uploads.
 *
 * The main simulation engine is fed these risks IN ADDITION to the seed
 * RISKS. Clearing returns the engine to its original behaviour.
 *
 * The hook returns safe defaults if no provider is mounted — so any component
 * can call useDerivedRisks() without crashing outside the provider tree.
 */

import React, { createContext, useCallback, useContext, useState } from 'react'
import type { RiskDef } from '@/lib/engine/types'
import type { DerivedRiskMeta, ControlArea } from '@/lib/engine/controlAssessmentAdapter'

interface DerivedRisksCtx {
  derivedRisks: RiskDef[]
  derivedMeta: Record<string, DerivedRiskMeta>
  controlAreas: ControlArea[]
  sourceFileName: string | null
  setDerivedRisks: (args: {
    risks: RiskDef[]
    meta: Record<string, DerivedRiskMeta>
    areas: ControlArea[]
    sourceFileName: string
  }) => void
  clearDerivedRisks: () => void
}

const EMPTY: DerivedRisksCtx = {
  derivedRisks: [],
  derivedMeta: {},
  controlAreas: [],
  sourceFileName: null,
  setDerivedRisks: () => {},
  clearDerivedRisks: () => {},
}

const Ctx = createContext<DerivedRisksCtx>(EMPTY)

export function DerivedRisksProvider({ children }: { children: React.ReactNode }) {
  const [derivedRisks, setRisks] = useState<RiskDef[]>([])
  const [derivedMeta, setMeta] = useState<Record<string, DerivedRiskMeta>>({})
  const [controlAreas, setAreas] = useState<ControlArea[]>([])
  const [sourceFileName, setFileName] = useState<string | null>(null)

  const setDerivedRisks = useCallback(
    (args: {
      risks: RiskDef[]
      meta: Record<string, DerivedRiskMeta>
      areas: ControlArea[]
      sourceFileName: string
    }) => {
      setRisks(args.risks)
      setMeta(args.meta)
      setAreas(args.areas)
      setFileName(args.sourceFileName)
    },
    [],
  )

  const clearDerivedRisks = useCallback(() => {
    setRisks([])
    setMeta({})
    setAreas([])
    setFileName(null)
  }, [])

  return (
    <Ctx.Provider
      value={{
        derivedRisks,
        derivedMeta,
        controlAreas,
        sourceFileName,
        setDerivedRisks,
        clearDerivedRisks,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useDerivedRisks(): DerivedRisksCtx {
  return useContext(Ctx)
}
