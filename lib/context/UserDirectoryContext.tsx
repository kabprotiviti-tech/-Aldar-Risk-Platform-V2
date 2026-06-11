'use client'

/**
 * UserDirectoryContext — Phase 3 (1.2 user management)
 * Browser-persisted, admin-manageable user directory seeded from the static
 * ERM_USERS list. Add / edit / remove users and their roles. Demo-real.
 */

import React from 'react'
import { createPersistedContext, uid } from '@/lib/context/createPersistedContext'
import { recordAuditEventDirect } from '@/lib/context/AuditTrailContext'
import { ERM_USERS, type ErmUser } from '@/lib/data/erm-users'

const ctx = createPersistedContext<ErmUser[]>({
  storageKey: 'aldar-user-directory-v1',
  defaultValue: [],
  migrate: (raw) => (Array.isArray(raw) ? (raw as ErmUser[]) : []),
  seed: () => ERM_USERS.map((u) => ({ ...u })),
  seedSentinelKey: 'aldar-user-directory-seeded-v1',
})

export function UserDirectoryProvider({ children }: { children: React.ReactNode }) {
  return <ctx.Provider>{children}</ctx.Provider>
}

export function useUserDirectory() {
  const { state, setState, hydrated } = ctx.useStore()
  const add = (rec: Omit<ErmUser, 'id'>) => {
    const full: ErmUser = { ...rec, id: uid('u').toLowerCase() }
    setState((prev) => [...prev, full])
    recordAuditEventDirect({ category: 'system', action: 'create', actor: 'ERM Administrator', targetId: full.id, summary: `User created: ${full.name} (${full.role}).` })
    return full
  }
  const update = (id: string, patch: Partial<ErmUser>) => {
    setState((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch, id: u.id } : u)))
    recordAuditEventDirect({ category: 'system', action: 'update', actor: 'ERM Administrator', targetId: id, summary: `User ${id} updated (${Object.keys(patch).join(', ')}).` })
  }
  const remove = (id: string) => {
    setState((prev) => prev.filter((u) => u.id !== id))
    recordAuditEventDirect({ category: 'system', action: 'delete', actor: 'ERM Administrator', targetId: id, summary: `User ${id} removed.` })
  }
  return { users: state, hydrated, add, update, remove }
}
