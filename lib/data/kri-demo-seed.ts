/**
 * KRI Demo Seed Data
 * ------------------
 * Six months of illustrative KRI entries (2025-11 through 2026-04) that
 * produce a realistic traffic-light story across the 8 KRIs:
 *   KRI-09 Residential Occupancy ............. trending amber
 *   KRI-10 Commercial Occupancy ............... stable green
 *   KRI-11 Project Delay (Phases) ............. amber, drifting toward red
 *   KRI-12 Handover Delay (Units) ............. red breach in latest period
 *   KRI-13 Domestic Default Rate .............. trending amber
 *   KRI-14 Residential Price Index ............ green, slight softening
 *   KRI-15 Commercial Rent Index .............. amber, recovering
 *   KRI-16 International Default Rate ......... red breach (CRO demo moment)
 *
 * IMPORTANT: every value is ILLUSTRATIVE. Pilot will replace with live
 * feeds from Aldar PMS / Yardi / SAP / escrow agents. Each entry's
 * `enteredBy` is "Demo Seed" so it's traceable to the seed step.
 *
 * Loaded on first visit if no entries exist; never overwrites
 * user-entered data.
 */

import type { KRIEntry } from '@/lib/context/KRIEntriesContext'

// 6 monthly periods, oldest → newest (M-5 .. M-0 from May 2026)
const PERIODS = [
  '2025-11',
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
]

interface SeedSpec {
  kriId: string
  values: number[] // length must match PERIODS
  notes?: (string | undefined)[]
}

const SEED_SPECS: SeedSpec[] = [
  // KRI-09 Residential Occupancy — declining from green into amber
  {
    kriId: 'KRI-09',
    values: [98, 96, 94, 92, 89, 87],
    notes: [
      undefined,
      undefined,
      'Yas Acres handover wave',
      undefined,
      'Q1 churn in Saadiyat tower',
      'Below appetite — see R-005',
    ],
  },
  // KRI-10 Commercial Occupancy — stable in green band (~Yas Mall 99%)
  {
    kriId: 'KRI-10',
    values: [97, 97, 96, 97, 97, 96],
  },
  // KRI-11 Project Delay (Phases) — drifting up, edging red
  {
    kriId: 'KRI-11',
    values: [105, 108, 112, 118, 124, 128],
    notes: [
      undefined,
      undefined,
      'Procurement delays on 2 sites',
      undefined,
      'Contractor renegotiation',
      'Approaching red — escalate',
    ],
  },
  // KRI-12 Handover Delay (Units) — recently breached red
  {
    kriId: 'KRI-12',
    values: [108, 112, 118, 122, 128, 134],
    notes: [
      undefined,
      undefined,
      undefined,
      'DLD inspection backlog',
      undefined,
      'RED breach — DLD penalty exposure',
    ],
  },
  // KRI-13 Domestic Default Rate — trending amber
  {
    kriId: 'KRI-13',
    values: [105, 108, 115, 122, 128, 135],
    notes: [
      undefined,
      undefined,
      undefined,
      'Mortgage rate sensitivity',
      undefined,
      'Above amber — monitor',
    ],
  },
  // KRI-14 Residential Price Index — green, mild softening
  {
    kriId: 'KRI-14',
    values: [102, 101, 100, 99, 98, 96],
    notes: [
      undefined,
      undefined,
      undefined,
      'ADREC index easing',
      undefined,
      undefined,
    ],
  },
  // KRI-15 Commercial Rent Index — amber band, recovering
  {
    kriId: 'KRI-15',
    values: [88, 86, 85, 87, 89, 92],
    notes: [
      'Below amber — supply pressure',
      undefined,
      undefined,
      undefined,
      'Recovery on Grade A',
      undefined,
    ],
  },
  // KRI-16 International Default Rate — RED breach (CRO demo moment)
  {
    kriId: 'KRI-16',
    values: [110, 115, 130, 145, 160, 178],
    notes: [
      undefined,
      undefined,
      'Overseas buyer cohort softness',
      'Crossed amber',
      undefined,
      'RED — 88% of UAE sales are overseas; high leverage',
    ],
  },
]

/**
 * Build the full seed entry list. Caller may inject a deterministic id
 * generator for SSR-safe rendering, otherwise uses a counter.
 */
export function buildKRIDemoEntries(): KRIEntry[] {
  const seedTimestamp = new Date('2026-05-05T08:00:00.000Z').toISOString()
  const out: KRIEntry[] = []
  let n = 1
  for (const spec of SEED_SPECS) {
    for (let i = 0; i < PERIODS.length; i++) {
      const value = spec.values[i]
      const note = spec.notes?.[i]
      out.push({
        id: `kri-seed-${spec.kriId}-${PERIODS[i]}-${n++}`,
        kriId: spec.kriId,
        period: PERIODS[i],
        value,
        enteredBy: 'Demo Seed',
        enteredAt: seedTimestamp,
        ...(note ? { note } : {}),
      })
    }
  }
  return out
}
