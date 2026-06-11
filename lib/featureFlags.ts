/**
 * Feature Flags — gate new capability behind a switch so half-built work
 * never affects the live demo. Each phase ships dark until flipped on.
 *
 * Default state per flag is set here. A flag can be overridden at runtime
 * via localStorage (key `flag:<name>` = '1' | '0') for ad-hoc demo control
 * without a redeploy. Reads are SSR-safe (fall back to the default).
 */

export type FeatureFlag =
  | 'erm_lifecycle'    // Phase 0 — enforced add→review→approve→sign-off
  | 'erm_entities'     // Phase 1 — incidents / acceptance / lessons / control reuse / framework tag
  | 'erm_history'      // Phase 2 — review cycles + movement/trend + mitigation→control
  | 'erm_reporting'    // Phase 3 — reporting freeze + scenario versioning + user admin

const DEFAULTS: Record<FeatureFlag, boolean> = {
  erm_lifecycle: true,
  erm_entities: true,
  erm_history: true,
  erm_reporting: true,
}

export function isFlagOn(flag: FeatureFlag): boolean {
  let v = DEFAULTS[flag]
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(`flag:${flag}`)
      if (raw === '1') v = true
      else if (raw === '0') v = false
    } catch {
      // storage blocked — use default
    }
  }
  return v
}

export function setFlag(flag: FeatureFlag, on: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(`flag:${flag}`, on ? '1' : '0')
  } catch {
    // non-fatal
  }
}
