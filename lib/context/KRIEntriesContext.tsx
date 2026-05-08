'use client'

/**
 * KRIEntriesContext
 * -----------------
 * User-entered monthly KRI values, persisted to localStorage. Each
 * entry is keyed by kriId + period (yyyy-mm) — re-submitting the same
 * period replaces the prior value.
 *
 * Entries are user-attributed (no AI / no auto-fill). The traffic-light
 * status (D4) and trend chart (D5) consume these entries.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { buildKRIDemoEntries } from '@/lib/data/kri-demo-seed'
import { recordAuditEventDirect } from '@/lib/context/AuditTrailContext'

const STORAGE_KEY = 'aldar-kri-entries-v1'
/**
 * Sentinel marking that the demo seed has run for this browser. Once
 * set, we never auto-seed again — even if the user deletes everything.
 * (User can clear localStorage manually to reset.)
 */
const SEEDED_KEY = 'aldar-kri-entries-seeded-v1'

export interface KRIEntry {
  id: string
  kriId: string
  /** yyyy-mm (e.g. "2026-04"). Unique per kriId. */
  period: string
  value: number
  enteredBy: string
  /** ISO timestamp when the entry was last saved. */
  enteredAt: string
  note?: string
}

interface CtxValue {
  entries: KRIEntry[]
  entriesFor: (kriId: string) => KRIEntry[]
  /** Returns the most recent entry for a KRI (by period desc), or null. */
  latestFor: (kriId: string) => KRIEntry | null
  upsertEntry: (
    input: Omit<KRIEntry, 'id' | 'enteredAt'> & { id?: string },
  ) => KRIEntry
  removeEntry: (id: string) => void
}

const Ctx = createContext<CtxValue | null>(null)

function uid(): string {
  return `kri-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function KRIEntriesProvider({ children }: { children: React.ReactNode }) {
  // Lazy-init with the demo seed so SSR renders the seeded values
  // immediately (no flash from "No Data" on first paint). The seed is
  // deterministic (no Date.now / Math.random) so SSR and client produce
  // identical output — no hydration mismatch.
  // On hydration, the effect below replaces this with whatever
  // localStorage has (real user data wins).
  const [entries, setEntries] = useState<KRIEntry[]>(() => buildKRIDemoEntries())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let loaded: KRIEntry[] = []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as KRIEntry[]
        if (Array.isArray(parsed)) loaded = parsed
      }
    } catch {}

    // First-visit auto-seed: if nothing in storage AND we have not
    // already seeded this browser, load the illustrative demo history.
    // Never overwrite real user data.
    let seedFlag = false
    try {
      seedFlag = localStorage.getItem(SEEDED_KEY) === '1'
    } catch {}

    if (loaded.length === 0 && !seedFlag) {
      loaded = buildKRIDemoEntries()
      try {
        localStorage.setItem(SEEDED_KEY, '1')
      } catch {}
    }

    setEntries(loaded)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch {}
  }, [entries, hydrated])

  const entriesFor = useCallback<CtxValue['entriesFor']>(
    (kriId) =>
      entries
        .filter((e) => e.kriId === kriId)
        .sort((a, b) => (a.period < b.period ? -1 : a.period > b.period ? 1 : 0)),
    [entries],
  )

  const latestFor = useCallback<CtxValue['latestFor']>(
    (kriId) => {
      const list = entries.filter((e) => e.kriId === kriId)
      if (list.length === 0) return null
      return list.reduce((acc, cur) => (cur.period > acc.period ? cur : acc))
    },
    [entries],
  )

  const upsertEntry = useCallback<CtxValue['upsertEntry']>((input) => {
    const now = new Date().toISOString()
    // Strip optional `id` from spread to avoid duplicate-key TS warning when
    // we re-assign it below.
    const { id: providedId, ...rest } = input
    let saved!: KRIEntry
    setEntries((prev) => {
      // Match by kriId+period (replace existing month) OR by id if supplied
      const idx = providedId
        ? prev.findIndex((e) => e.id === providedId)
        : prev.findIndex(
            (e) => e.kriId === rest.kriId && e.period === rest.period,
          )
      if (idx >= 0) {
        const next = [...prev]
        const existing = next[idx]
        saved = {
          ...existing,
          ...rest,
          id: existing.id,
          enteredAt: now,
        }
        next[idx] = saved
        return next
      }
      saved = {
        ...rest,
        id: providedId || uid(),
        enteredAt: now,
      }
      return [...prev, saved]
    })
    // Record after the state-update closure so `saved` is set.
    queueMicrotask(() => {
      if (!saved) return
      const isUpdate = !!providedId || (!!rest.kriId && !!rest.period)
      recordAuditEventDirect({
        category: 'kri_entry',
        action: isUpdate ? 'update' : 'create',
        actor: saved.enteredBy || 'unknown',
        targetId: saved.kriId,
        summary: `KRI ${saved.kriId} ${saved.period}: value ${saved.value} entered.`,
      })
    })
    return saved
  }, [])

  const removeEntry = useCallback<CtxValue['removeEntry']>((id) => {
    setEntries((prev) => {
      const target = prev.find((e) => e.id === id)
      if (target) {
        recordAuditEventDirect({
          category: 'kri_entry',
          action: 'delete',
          actor: target.enteredBy || 'unknown',
          targetId: target.kriId,
          summary: `KRI ${target.kriId} ${target.period} entry removed.`,
        })
      }
      return prev.filter((e) => e.id !== id)
    })
  }, [])

  const value = useMemo<CtxValue>(
    () => ({ entries, entriesFor, latestFor, upsertEntry, removeEntry }),
    [entries, entriesFor, latestFor, upsertEntry, removeEntry],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useKRIEntries(): CtxValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useKRIEntries must be used inside <KRIEntriesProvider>')
  return ctx
}
