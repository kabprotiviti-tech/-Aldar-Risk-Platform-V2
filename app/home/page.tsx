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
    // P4b-e: champion / subsidiary-ceo / internal-audit / arc-chair dashboards.
    // Until they ship, fall through to the CRO dashboard as a placeholder so
    // every persona has a coherent /home — better than redirecting to a half-built page.
    default:
      return <CRODashboard variant="fallback" persona={persona.title} />
  }
}
