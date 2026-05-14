'use client'

/**
 * /home — Block 2 P4 router
 * --------------------------
 * Persona-router landing. Reads PersonaContext; routes to the
 * hand-crafted dashboard for the active persona. Until P4b-e ship, the
 * default fallback for personas other than CRO is the existing
 * /my-dashboard view.
 *
 * Per BCG synthesis: 5 hand-crafted dashboards (NOT one configurable
 * page). Each persona's killer question is answered on first paint.
 */

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePersona } from '@/lib/context/PersonaContext'
import { CRODashboard } from '@/components/home/CRODashboard'
import { ChampionDashboard } from '@/components/home/ChampionDashboard'
import { SubsidiaryCEODashboard } from '@/components/home/SubsidiaryCEODashboard'
import { ARCChairDashboard } from '@/components/home/ARCChairDashboard'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, persona } = usePersona()

  // Redirect to /login when no persona is set.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  if (!persona) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: 13,
        }}
      >
        Redirecting to login…
      </div>
    )
  }

  switch (persona.id) {
    case 'group-cro':
      return <CRODashboard />
    case 'risk-champion':
      return <ChampionDashboard />
    case 'subsidiary-ceo':
      return <SubsidiaryCEODashboard />
    case 'arc-chair':
      return <ARCChairDashboard />
    default:
      return <CRODashboard />
  }
}
