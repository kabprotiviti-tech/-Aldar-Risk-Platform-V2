'use client'

/**
 * ControlOverlaysContext — Phase 1
 * Two browser-persisted overlays layered ON TOP of the read-only seed
 * controls (lib/controlData.ts), so we never mutate that source:
 *   - frameworkTags: controlId -> ISO/COSO/NIST tag (P3.2)
 *   - extraRiskLinks: controlId -> additional riskIds it also covers (3.2,
 *     proving a control can be reused across many risks)
 */

import React from 'react'
import { createPersistedContext } from '@/lib/context/createPersistedContext'

export interface FrameworkTag {
  iso31000: string
  coso: string
  nist: string
  rationale: string
}

interface Overlays {
  frameworkTags: Record<string, FrameworkTag>
  extraRiskLinks: Record<string, string[]>
}

const ctx = createPersistedContext<Overlays>({
  storageKey: 'aldar-control-overlays-v1',
  defaultValue: { frameworkTags: {}, extraRiskLinks: {} },
  migrate: (raw) => {
    const r = (raw || {}) as Partial<Overlays>
    return { frameworkTags: r.frameworkTags || {}, extraRiskLinks: r.extraRiskLinks || {} }
  },
})

export function ControlOverlaysProvider({ children }: { children: React.ReactNode }) {
  return <ctx.Provider>{children}</ctx.Provider>
}

export function useControlOverlays() {
  const { state, setState, hydrated } = ctx.useStore()

  const setFrameworkTag = (controlId: string, tag: FrameworkTag) =>
    setState((prev) => ({ ...prev, frameworkTags: { ...prev.frameworkTags, [controlId]: tag } }))

  const linkRisk = (controlId: string, riskId: string) =>
    setState((prev) => {
      const cur = prev.extraRiskLinks[controlId] || []
      if (cur.includes(riskId)) return prev
      return { ...prev, extraRiskLinks: { ...prev.extraRiskLinks, [controlId]: [...cur, riskId] } }
    })

  const unlinkRisk = (controlId: string, riskId: string) =>
    setState((prev) => ({
      ...prev,
      extraRiskLinks: { ...prev.extraRiskLinks, [controlId]: (prev.extraRiskLinks[controlId] || []).filter((r) => r !== riskId) },
    }))

  return {
    hydrated,
    frameworkTags: state.frameworkTags,
    extraRiskLinks: state.extraRiskLinks,
    setFrameworkTag,
    linkRisk,
    unlinkRisk,
  }
}
