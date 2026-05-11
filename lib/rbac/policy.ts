/**
 * RBAC Policy — Block 2 P5
 * -------------------------
 * Pre-pilot role-based access control. Pure data (no React). Every
 * permission predicate takes a `PersonaId | null` and returns a boolean.
 *
 * Two layers:
 *   1. Permission keys (e.g. `risk:create`, `appetite:propose`,
 *      `appetite:approve`, `kri:edit-threshold`, `escalation:create`)
 *      drive button/action visibility throughout the app.
 *   2. Route allowlists support future middleware-level route gating
 *      (P5b will plug these into a server middleware; for now the
 *      client uses `canAccessRoute()` from a wrapper component).
 *
 * The design intentionally favours WHITELIST per persona (verbose but
 * audit-friendly) over a BLACKLIST. SCA Corporate Governance Code Art.
 * 31 + 33 separation of duties demands explicit grants, not implicit
 * default-allow.
 */

import type { PersonaId } from '@/lib/personas'

// ─── Permission catalog ───────────────────────────────────────────────────

export type Permission =
  // Risk Register
  | 'risk:view'
  | 'risk:create'
  | 'risk:edit'
  | 'risk:delete'
  | 'risk:status-change'
  // Mitigation
  | 'mitigation:create'
  | 'mitigation:edit'
  | 'mitigation:close'
  // Escalation
  | 'escalation:create'
  | 'escalation:acknowledge'
  | 'escalation:close'
  // KRI
  | 'kri:view'
  | 'kri:enter-value'
  | 'kri:edit-threshold'
  // Risk Appetite
  | 'appetite:view'
  | 'appetite:propose'
  | 'appetite:approve'
  | 'appetite:reset'
  // ARC Pack
  | 'arc:view'
  | 'arc:export-pdf'
  // Audit Trail
  | 'audit:view'
  | 'audit:export'
  | 'audit:clear'
  // Documents
  | 'doc:upload'
  | 'doc:extract'
  | 'doc:approve'
  // Admin (gear icon — future)
  | 'admin:taxonomy'
  | 'admin:users'

/**
 * Permissions granted to each persona. Order matters only for
 * readability; the actual check is `includes(perm)`.
 */
const PERSONA_PERMISSIONS: Record<PersonaId, Permission[]> = {
  // ─── Group CRO ── 2nd line head, consumes synthesis, approves.
  'group-cro': [
    'risk:view', 'risk:edit', 'risk:status-change',
    'mitigation:edit', 'mitigation:close',
    'escalation:acknowledge', 'escalation:close',
    'kri:view', 'kri:edit-threshold',
    'appetite:view', 'appetite:approve', 'appetite:reset',
    'arc:view', 'arc:export-pdf',
    'audit:view', 'audit:export',
    'doc:approve',
    'admin:taxonomy',
  ],
  // ─── Risk Champion ── 1st line, the data-entry persona.
  'risk-champion': [
    'risk:view', 'risk:create', 'risk:edit',
    'mitigation:create', 'mitigation:edit',
    'escalation:create',
    'kri:view', 'kri:enter-value',
    'appetite:view', 'appetite:propose',
    'audit:view',
    'doc:upload', 'doc:extract',
  ],
  // ─── Subsidiary CEO ── 1st line accountable executive.
  'subsidiary-ceo': [
    'risk:view', 'risk:edit',
    'mitigation:edit',
    'escalation:create', 'escalation:acknowledge',
    'kri:view',
    'appetite:view', 'appetite:propose',
    'arc:view',
    'audit:view',
  ],
  // ─── Chief Internal Auditor ── 3rd line, read-mostly assurance.
  'internal-audit': [
    'risk:view',
    'mitigation:edit', // can write findings → actions
    'kri:view',
    'appetite:view',
    'arc:view',
    'audit:view', 'audit:export',
  ],
  // ─── ARC Chair ── Governing body, approves appetite + sees ARC pack.
  'arc-chair': [
    'risk:view',
    'kri:view',
    'appetite:view', 'appetite:approve',
    'arc:view', 'arc:export-pdf',
    'audit:view',
  ],
}

/**
 * Permission check. Returns true when no persona is set (unauthenticated
 * demo mode) so the platform stays browsable for stakeholders without
 * forcing them through /login during exploratory sessions. Pilot will
 * flip this to `return false` once SSO is wired.
 */
export function can(personaId: PersonaId | null, perm: Permission): boolean {
  if (!personaId) return true
  return PERSONA_PERMISSIONS[personaId]?.includes(perm) ?? false
}

// ─── Route allowlist (for future middleware-level gating) ──────────────

/**
 * Routes any authenticated persona may visit. Empty allowlists fall
 * through to public access (no route is hard-locked until P5b wires
 * middleware).
 *
 * Each entry is a route PREFIX — `/risk-register` matches `/risk-register`
 * and `/risk-register?focus=R-001`.
 */
const ROUTE_ALLOWLIST: Record<PersonaId, string[]> = {
  'group-cro': [
    '/', '/login', '/welcome', '/home',
    '/my-dashboard',
    '/risk-register', '/risk-library',
    '/kri', '/portfolio-tower', '/scenarios',
    '/audit-trail', '/documents',
    '/arc-pack',
    '/risk-appetite', '/three-lines-of-defense', '/regulator-map',
    '/standards-reference', '/bcm',
  ],
  'risk-champion': [
    '/', '/login', '/welcome', '/home',
    '/my-dashboard',
    '/risk-register', '/risk-library',
    '/kri', '/scenarios',
    '/audit-trail', '/documents',
    '/risk-appetite', '/three-lines-of-defense',
  ],
  'subsidiary-ceo': [
    '/', '/login', '/welcome', '/home',
    '/my-dashboard',
    '/risk-register',
    '/kri', '/portfolio-tower', '/scenarios',
    '/audit-trail',
    '/arc-pack',
    '/risk-appetite', '/three-lines-of-defense',
  ],
  'internal-audit': [
    '/', '/login', '/welcome', '/home',
    '/my-dashboard',
    '/risk-register', '/risk-library',
    '/kri', '/portfolio-tower',
    '/audit-trail', '/documents',
    '/arc-pack',
    '/risk-appetite', '/three-lines-of-defense', '/regulator-map',
    '/standards-reference',
  ],
  'arc-chair': [
    '/', '/login', '/welcome', '/home',
    '/my-dashboard',
    '/risk-register',
    '/kri', '/portfolio-tower',
    '/audit-trail',
    '/arc-pack',
    '/risk-appetite', '/three-lines-of-defense', '/regulator-map',
    '/standards-reference', '/bcm',
  ],
}

/**
 * Route-level access check. Returns true for unauthenticated demo mode
 * (same rationale as `can()`). Pilot flips the default after SSO.
 */
export function canAccessRoute(
  personaId: PersonaId | null,
  pathname: string,
): boolean {
  if (!personaId) return true
  const allow = ROUTE_ALLOWLIST[personaId]
  if (!allow) return false
  return allow.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
}

/**
 * Convenience: returns all permissions for a persona (for the
 * future admin / debug surface).
 */
export function permissionsFor(personaId: PersonaId | null): Permission[] {
  if (!personaId) return []
  return PERSONA_PERMISSIONS[personaId] ?? []
}
