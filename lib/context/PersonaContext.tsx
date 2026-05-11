'use client'

/**
 * PersonaContext — Block 2 P1
 * ----------------------------
 * Persisted current-user persona + entity scope. Set at /login, read by
 * every chrome surface (Header role badge, Sidebar nav filter, persona
 * dashboards, Risk Memory chat).
 *
 * Pre-pilot: localStorage. Pilot: SSO + real backend session.
 * Tier-B createPersistedContext + audit-trail integration on login/switch.
 */

import React, { useCallback, useMemo } from 'react'
import { createPersistedContext } from '@/lib/context/createPersistedContext'
import { recordAuditEventDirect } from '@/lib/context/AuditTrailContext'
import { PERSONAS, getPersona, type PersonaId, type Persona } from '@/lib/personas'
import type { EntityId } from '@/lib/data/risk-entity-mapping'

export interface PersonaSession {
  personaId: PersonaId | null
  entityScope: EntityId | null
  /** Display label entered at login (email-style). */
  displayName: string | null
  /** ISO timestamp of login. */
  loggedInAt: string | null
}

const EMPTY: PersonaSession = {
  personaId: null,
  entityScope: null,
  displayName: null,
  loggedInAt: null,
}

const { Provider: StoreProvider, useStore } = createPersistedContext<PersonaSession>({
  storageKey: 'aldar-persona-session-v1',
  defaultValue: EMPTY,
  migrate: (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return EMPTY
    const r = raw as Partial<PersonaSession>
    return {
      personaId: (r.personaId as PersonaId | null) ?? null,
      entityScope: (r.entityScope as EntityId | null) ?? null,
      displayName: r.displayName ?? null,
      loggedInAt: r.loggedInAt ?? null,
    }
  },
})

interface CtxValue {
  session: PersonaSession
  persona: Persona | null
  /** True iff a persona is currently set. */
  isAuthenticated: boolean
  /** Log in — accepts any displayName, validates personaId. */
  login: (input: {
    personaId: PersonaId
    entityScope?: EntityId | null
    displayName: string
  }) => void
  /** Clear session and return to /login. */
  logout: () => void
  /** Change subsidiary scope without re-login (CRO/ARC/IA scope toggle). */
  setEntityScope: (entityScope: EntityId | null) => void
}

const Ctx = React.createContext<CtxValue | null>(null)

function Inner({ children }: { children: React.ReactNode }) {
  const { state: session, setState } = useStore()

  const persona = useMemo(() => getPersona(session.personaId), [session.personaId])
  const isAuthenticated = Boolean(session.personaId)

  const login = useCallback<CtxValue['login']>(
    ({ personaId, entityScope = null, displayName }) => {
      const p = PERSONAS.find((x) => x.id === personaId)
      if (!p) return
      const now = new Date().toISOString()
      const finalScope = p.requiresSubsidiary ? entityScope : null
      setState({
        personaId,
        entityScope: finalScope,
        displayName: displayName.trim() || 'demo-user',
        loggedInAt: now,
      })
      recordAuditEventDirect({
        category: 'system',
        action: 'login',
        actor: displayName.trim() || 'demo-user',
        targetId: personaId,
        summary: `Login as ${p.title}${finalScope ? ` · scope ${finalScope}` : ''}.`,
      })
    },
    [setState],
  )

  const logout = useCallback<CtxValue['logout']>(() => {
    if (session.personaId) {
      recordAuditEventDirect({
        category: 'system',
        action: 'status_change',
        actor: session.displayName || 'demo-user',
        targetId: session.personaId,
        summary: `Logout from ${session.personaId}.`,
      })
    }
    setState(EMPTY)
  }, [session, setState])

  const setEntityScope = useCallback<CtxValue['setEntityScope']>(
    (entityScope) => {
      setState((prev) => ({ ...prev, entityScope }))
    },
    [setState],
  )

  const value = useMemo<CtxValue>(
    () => ({ session, persona, isAuthenticated, login, logout, setEntityScope }),
    [session, persona, isAuthenticated, login, logout, setEntityScope],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Inner>{children}</Inner>
    </StoreProvider>
  )
}

export function usePersona(): CtxValue {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('usePersona must be used inside <PersonaProvider>')
  return ctx
}
