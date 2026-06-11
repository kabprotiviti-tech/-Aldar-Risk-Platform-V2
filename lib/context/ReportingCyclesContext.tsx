'use client'

/**
 * ReportingCyclesContext — Phase 3 (6.3 reporting cut-off / freeze / version / sign-off)
 * A reporting cut-off freezes the risk posture at a point in time into a
 * versioned, immutable pack that can be signed off. Browser-persisted.
 */

import React from 'react'
import { createPersistedContext, uid } from '@/lib/context/createPersistedContext'
import { recordAuditEventDirect } from '@/lib/context/AuditTrailContext'

export interface ReportPack {
  id: string
  version: number
  label: string
  cutOffDate: string
  frozenAt: string
  posture: { critical: number; high: number; medium: number; low: number; totalExposureAedM: number }
  status: 'draft' | 'signed'
  signedBy?: string
  signedAt?: string
}

const ctx = createPersistedContext<ReportPack[]>({
  storageKey: 'aldar-report-packs-v1',
  defaultValue: [],
  migrate: (raw) => (Array.isArray(raw) ? (raw as ReportPack[]) : []),
})

export function ReportingCyclesProvider({ children }: { children: React.ReactNode }) {
  return <ctx.Provider>{children}</ctx.Provider>
}

export function useReportingCycles() {
  const { state, setState, hydrated } = ctx.useStore()

  const createPack = (label: string, cutOffDate: string, posture: ReportPack['posture']) => {
    const version = state.length + 1
    const pack: ReportPack = { id: uid('PACK').toUpperCase(), version, label, cutOffDate, frozenAt: new Date().toISOString(), posture, status: 'draft' }
    setState((prev) => [pack, ...prev])
    recordAuditEventDirect({ category: 'system', action: 'export', actor: 'ERM', targetId: pack.id, summary: `Reporting cut-off frozen: ${label} v${version} (cut-off ${cutOffDate}). Data is now versioned and immutable.` })
    return pack
  }

  const signOff = (id: string, signedBy: string) =>
    setState((prev) => prev.map((p) => {
      if (p.id !== id || p.status === 'signed') return p
      recordAuditEventDirect({ category: 'system', action: 'status_change', actor: signedBy, targetId: id, summary: `Reporting pack ${id} signed off by ${signedBy}.` })
      return { ...p, status: 'signed', signedBy, signedAt: new Date().toISOString() }
    }))

  const remove = (id: string) => setState((prev) => prev.filter((p) => p.id !== id))

  return { packs: state, hydrated, createPack, signOff, remove }
}
