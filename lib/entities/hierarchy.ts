/**
 * Aldar Entity Hierarchy — Demo
 * -----------------------------
 * Mirrors Aldar's publicly disclosed business segments. Used as the spine
 * for the master-subsidiary cascade, portfolio roll-up, and RBAC scoping.
 *
 * IMPORTANT: this is the DEMO hierarchy, surfaced clearly in the UI as:
 *   "Demo hierarchy mirrors Aldar's public business segments. Production
 *    will reflect Aldar's actual legal entity structure post-IT review."
 *
 * Source: Aldar Properties PJSC FY2024 Integrated Annual Report
 * (segment reporting). Public investor document.
 */

export type EntityKind = 'holding' | 'subsidiary' | 'department'

export interface Entity {
  id: string
  kind: EntityKind
  name: string
  /** Short label for chips / charts. */
  shortName: string
  /** Parent entity id; null for the holding. */
  parentId: string | null
  /** Public segment description from Aldar disclosures. */
  description: string
  /** ISO-3166 country code for the primary operating jurisdiction. */
  country: string
  /** Optional ADX ticker (only the holding has one). */
  ticker?: string
  /** Hex color for charts / heatmaps. */
  color: string
}

export const ENTITIES: Entity[] = [
  // ---- Holding ----
  {
    id: 'aldar-group',
    kind: 'holding',
    name: 'Aldar Properties PJSC',
    shortName: 'Aldar Group',
    parentId: null,
    description:
      'Listed Abu Dhabi real estate group; operates across development, investment, education and hospitality.',
    country: 'AE',
    ticker: 'ALDAR',
    color: '#C9A84C',
  },
  // ---- Subsidiaries ----
  {
    id: 'aldar-development',
    kind: 'subsidiary',
    name: 'Aldar Development',
    shortName: 'Development',
    parentId: 'aldar-group',
    description:
      'Master developer of off-plan and built residential, mixed-use, and commercial projects across the UAE.',
    country: 'AE',
    color: '#FF6600',
  },
  {
    id: 'aldar-investment',
    kind: 'subsidiary',
    name: 'Aldar Investment',
    shortName: 'Investment',
    parentId: 'aldar-group',
    description:
      'Recurring-income portfolio: investment properties (commercial, residential leasing), retail, and principal investments.',
    country: 'AE',
    color: '#2D9EFF',
  },
  {
    id: 'aldar-education',
    kind: 'subsidiary',
    name: 'Aldar Education',
    shortName: 'Education',
    parentId: 'aldar-group',
    description:
      'Operator of K-12 schools and nurseries across the UAE, including own-brand and franchised academies.',
    country: 'AE',
    color: '#22C55E',
  },
  {
    id: 'aldar-hospitality',
    kind: 'subsidiary',
    name: 'Aldar Hospitality',
    shortName: 'Hospitality',
    parentId: 'aldar-group',
    description:
      'Hotel, leisure and theme park operations including assets on Yas Island and Saadiyat (held within the Aldar group structure).',
    country: 'AE',
    color: '#A855F7',
  },
]

// ---- Helpers ----

export const HOLDING: Entity = ENTITIES.find((e) => e.kind === 'holding')!

export const SUBSIDIARIES: Entity[] = ENTITIES.filter((e) => e.kind === 'subsidiary')

export function getEntity(id: string): Entity | undefined {
  return ENTITIES.find((e) => e.id === id)
}

export function getChildren(parentId: string): Entity[] {
  return ENTITIES.filter((e) => e.parentId === parentId)
}

/**
 * Caveat string surfaced on every cross-entity screen, per CLAUDE.md.
 */
export const HIERARCHY_DISCLAIMER =
  "Demo hierarchy mirrors Aldar's public business segments. Production will reflect Aldar's actual legal entity structure post-IT review."
