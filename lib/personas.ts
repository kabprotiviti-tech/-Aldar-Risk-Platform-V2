/**
 * Personas — Block 2 P1
 * ----------------------
 * The 5 user personas locked from the BCG-partner synthesis. These map
 * to the IIA 3-Lines model adapted to a UAE listed PJSC (SCA Corporate
 * Governance Code Art. 31 + 33 mandate independence for ARC Chair and
 * Internal Audit — both are distinct from ERM Head).
 *
 * Each persona carries:
 *   - default landing route after login
 *   - whether subsidiary scope picker is required at login (Champion / CEO)
 *   - which subsidiary entities are valid scope choices
 *
 * Pilot wires SSO + RBAC; pre-pilot the persona is selected at login.
 */

import type { EntityId } from '@/lib/data/risk-entity-mapping'

export type PersonaId =
  | 'group-cro'
  | 'risk-champion'
  | 'subsidiary-ceo'
  | 'internal-audit'
  | 'arc-chair'

export interface Persona {
  id: PersonaId
  title: string
  /** One-line elevator pitch surfaced on the login tile. */
  subtitle: string
  /** Position in the 3-Lines / Governing Body taxonomy. */
  line: '1st line' | '2nd line' | '3rd line' | 'governing'
  /** Default landing route after login. */
  landing: string
  /** True iff the persona must pick a subsidiary at login (Champion / Sub CEO). */
  requiresSubsidiary: boolean
  /** Subsidiary entities valid for this persona. Empty = scoped to group. */
  validSubsidiaries: EntityId[]
  /** Killer question this persona's dashboard must answer in 8 seconds. */
  killerQuestion: string
}

const SUBSIDIARY_IDS: EntityId[] = [
  'aldar-development',
  'aldar-investment',
  'aldar-education',
  'aldar-hospitality',
]

export const PERSONAS: Persona[] = [
  {
    id: 'group-cro',
    title: 'Group CRO',
    subtitle: 'Consumes consolidated risk synthesis · Prepares ARC pack',
    line: '2nd line',
    landing: '/home',
    requiresSubsidiary: false,
    validSubsidiaries: [],
    killerQuestion:
      "What changed in our top-10 enterprise risks since last ARC, and is anything outside appetite?",
  },
  {
    id: 'risk-champion',
    title: 'Risk Champion',
    subtitle: 'Owns + maintains subsidiary register · Enters KRI values',
    line: '1st line',
    landing: '/home',
    requiresSubsidiary: true,
    validSubsidiaries: SUBSIDIARY_IDS,
    killerQuestion: "What's overdue from me and what's escalating?",
  },
  {
    id: 'subsidiary-ceo',
    title: 'Subsidiary CEO',
    subtitle: 'Accountable for subsidiary risk profile · Sign-off on appetite breach',
    line: '1st line',
    landing: '/home',
    requiresSubsidiary: true,
    validSubsidiaries: SUBSIDIARY_IDS,
    killerQuestion:
      "How is MY P&L tracking and what is Group escalating to me?",
  },
  {
    id: 'internal-audit',
    title: 'Chief Internal Auditor',
    subtitle: 'Independent assurance to ARC · Read-mostly · Audit planning',
    line: '3rd line',
    landing: '/home',
    requiresSubsidiary: false,
    validSubsidiaries: [],
    killerQuestion:
      "Where is the assurance gap between declared risk and tested controls?",
  },
  {
    id: 'arc-chair',
    title: 'ARC Chair',
    subtitle: 'Board oversight · Quarterly pack · Independent NED',
    line: 'governing',
    landing: '/home',
    requiresSubsidiary: false,
    validSubsidiaries: [],
    killerQuestion:
      "Has anything material happened since the last ARC meeting — is management on top of it?",
  },
]

export function getPersona(id: PersonaId | null): Persona | null {
  if (!id) return null
  return PERSONAS.find((p) => p.id === id) ?? null
}

/** Display the persona's scope: "Group" or "Aldar Development" etc. */
export function personaScopeLabel(
  personaId: PersonaId | null,
  entityScope: EntityId | null,
): string {
  if (!personaId) return ''
  if (entityScope && entityScope !== 'aldar-group') {
    return entityScope
      .replace(/^aldar-/, '')
      .replace(/(^.)|(\s.)/g, (m) => m.toUpperCase())
  }
  return 'Group'
}
