/**
 * ERM User Directory — Phase 0 (illustrative)
 * -------------------------------------------
 * A seed directory of named users so the lifecycle (owners, reviewers,
 * approvers, sign-off) can use STRUCTURED people instead of free text.
 * This is demo/illustrative data — it proves the capability (assign to a
 * real person in a real role) without a backend identity store. Phase 3
 * replaces this seed with an admin-managed user CRUD.
 *
 * Roles map onto the existing 4 personas (lib/personas.ts) plus two
 * accountability roles the BRD asks for (Risk Owner, Control Owner) that
 * do not yet have their own persona.
 */

import type { PersonaId } from '@/lib/personas'
import type { EntityId } from '@/lib/data/risk-entity-mapping'

export type ErmRole =
  | 'ERM Administrator'
  | 'Risk Champion'
  | 'Risk Owner'
  | 'Control Owner'
  | 'Group CRO'
  | 'ARC Chair'

export interface ErmUser {
  id: string
  name: string
  role: ErmRole
  /** Closest existing persona, for RBAC gate checks. */
  persona: PersonaId
  /** Entity the user belongs to (group or a subsidiary). */
  entity: EntityId
  title: string
}

export const ERM_USERS: ErmUser[] = [
  { id: 'u-cro',   name: 'Layla Al Mansoori',  role: 'Group CRO',          persona: 'group-cro',     entity: 'aldar-group',         title: 'Group Chief Risk Officer' },
  { id: 'u-erm',   name: 'Omar Haddad',        role: 'ERM Administrator',  persona: 'group-cro',     entity: 'aldar-group',         title: 'Head of Enterprise Risk' },
  { id: 'u-arc',   name: 'Sir Geoffrey Pike',  role: 'ARC Chair',          persona: 'arc-chair',     entity: 'aldar-group',         title: 'Audit & Risk Committee Chair (NED)' },
  { id: 'u-dev-champ', name: 'Rashid Al Nuaimi', role: 'Risk Champion',    persona: 'risk-champion', entity: 'aldar-development',    title: 'Risk Champion — Development' },
  { id: 'u-dev-own',   name: 'Sara Khalifa',     role: 'Risk Owner',       persona: 'subsidiary-ceo', entity: 'aldar-development',   title: 'CEO — Development' },
  { id: 'u-inv-champ', name: 'Priya Nair',       role: 'Risk Champion',    persona: 'risk-champion', entity: 'aldar-investment',     title: 'Risk Champion — Investment' },
  { id: 'u-inv-own',   name: 'James Carter',     role: 'Risk Owner',       persona: 'subsidiary-ceo', entity: 'aldar-investment',    title: 'CEO — Investment' },
  { id: 'u-edu-champ', name: 'Mariam Saeed',     role: 'Risk Champion',    persona: 'risk-champion', entity: 'aldar-education',       title: 'Risk Champion — Education' },
  { id: 'u-hos-champ', name: 'Daniel Meyer',     role: 'Risk Champion',    persona: 'risk-champion', entity: 'aldar-hospitality',     title: 'Risk Champion — Hospitality' },
  { id: 'u-ctrl-fin',  name: 'Anita Verma',      role: 'Control Owner',    persona: 'risk-champion', entity: 'aldar-group',          title: 'Financial Controls Lead' },
  { id: 'u-ctrl-it',   name: 'Hassan Ali',       role: 'Control Owner',    persona: 'risk-champion', entity: 'aldar-group',          title: 'IT & Cyber Controls Lead' },
]

export function getUser(id: string | null | undefined): ErmUser | null {
  if (!id) return null
  return ERM_USERS.find((u) => u.id === id) ?? null
}

export function usersByRole(role: ErmRole): ErmUser[] {
  return ERM_USERS.filter((u) => u.role === role)
}

/** Users that can be assigned as an owner of a risk/action (Champions + Owners). */
export function assignableOwners(): ErmUser[] {
  return ERM_USERS.filter((u) =>
    u.role === 'Risk Champion' || u.role === 'Risk Owner' || u.role === 'Control Owner',
  )
}
