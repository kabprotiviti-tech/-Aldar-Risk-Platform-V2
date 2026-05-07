'use client'

/**
 * createPersistedContext
 * ----------------------
 * Reusable helper for "state in React + persisted to localStorage" — the
 * pattern the existing RiskDraftContext / MitigationActionsContext /
 * KRIThresholdsContext / KRIEntriesContext all reimplement nearly verbatim.
 *
 * Usage:
 *   const { Provider, useStore } = createPersistedContext<MyState>({
 *     storageKey: 'aldar-my-state-v1',
 *     defaultValue: [],
 *     migrate: (raw) => Array.isArray(raw) ? raw : [],
 *     // optional: seed when localStorage is empty AND a sentinel hasn't fired
 *     seed: () => buildInitialEntries(),
 *     seedSentinelKey: 'aldar-my-state-seeded-v1',
 *   })
 *
 * Returned `useStore()` exposes:
 *   - state: T
 *   - setState: React.Dispatch<React.SetStateAction<T>>
 *   - hydrated: boolean (true after first effect runs)
 *
 * Honest hydration: state is `defaultValue` until the localStorage read
 * has finished. Reads to `state` before `hydrated` will see the default,
 * not stale storage data — this prevents the SSR-mismatch bug the four
 * earlier contexts each rediscovered.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'

interface Options<T> {
  /** localStorage key for the persisted blob. */
  storageKey: string
  /** Value used on first render and as a fallback when storage is empty. */
  defaultValue: T
  /**
   * Optional migration / shape-validation. Receives the parsed JSON and
   * must return a value that satisfies T (or the defaultValue).
   * If omitted, the parsed JSON is used as-is when truthy.
   */
  migrate?: (raw: unknown) => T
  /**
   * Optional one-time seed. Runs only when:
   *   1. nothing is stored under storageKey, AND
   *   2. the seedSentinelKey is not set
   * After a successful seed the sentinel is written so we never
   * auto-seed twice (even if the user wipes the data).
   */
  seed?: () => T
  seedSentinelKey?: string
}

export interface PersistedStore<T> {
  state: T
  setState: Dispatch<SetStateAction<T>>
  hydrated: boolean
}

export function createPersistedContext<T>(opts: Options<T>) {
  const Ctx = createContext<PersistedStore<T> | null>(null)

  function Provider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<T>(opts.defaultValue)
    const [hydrated, setHydrated] = useState(false)

    // Hydrate once on mount
    useEffect(() => {
      let next: T = opts.defaultValue
      try {
        const raw = localStorage.getItem(opts.storageKey)
        if (raw) {
          const parsed = JSON.parse(raw)
          next = opts.migrate ? opts.migrate(parsed) : (parsed as T)
        } else if (opts.seed && opts.seedSentinelKey) {
          // First-visit seed — never overwrites real data, never re-seeds
          let alreadySeeded = false
          try {
            alreadySeeded = localStorage.getItem(opts.seedSentinelKey) === '1'
          } catch {}
          if (!alreadySeeded) {
            next = opts.seed()
            try {
              localStorage.setItem(opts.seedSentinelKey, '1')
            } catch {}
          }
        }
      } catch {
        // corrupt or unavailable storage — keep default
      }
      setState(next)
      setHydrated(true)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Persist on change after hydration
    useEffect(() => {
      if (!hydrated) return
      try {
        localStorage.setItem(opts.storageKey, JSON.stringify(state))
      } catch {
        // quota exceeded / private mode — non-fatal
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, hydrated])

    const value = useMemo<PersistedStore<T>>(
      () => ({ state, setState, hydrated }),
      [state, hydrated],
    )

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
  }

  function useStore(): PersistedStore<T> {
    const ctx = useContext(Ctx)
    if (!ctx)
      throw new Error(
        `useStore must be used inside the Provider for storage key "${opts.storageKey}"`,
      )
    return ctx
  }

  return { Provider, useStore, RawCtx: Ctx }
}

// ────────────────────────────────────────────────────────────────────────
// Tiny shared id generator for client-side records.
// Replaces duplicated `uid()` definitions across MitigationActions and
// KRIEntries contexts.
// ────────────────────────────────────────────────────────────────────────
export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}
