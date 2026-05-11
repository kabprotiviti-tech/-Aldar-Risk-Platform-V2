'use client'

/**
 * / — Root redirect (Block 2 P4)
 * --------------------------------
 * Visiting https://aldar-risk-platform-v2.vercel.app/ now sends the
 * visitor to /login (unauthenticated) or /home (persona already set).
 *
 * The original marketing-style landing is preserved at /welcome for
 * stakeholders who want the storytelling-first version.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePersona } from '@/lib/context/PersonaContext'

export default function RootRedirect() {
  const router = useRouter()
  const { isAuthenticated } = usePersona()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isAuthenticated) {
      router.replace('/home')
    } else {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 20% 20%, rgba(255,102,0,0.12), transparent 50%), radial-gradient(circle at 80% 80%, rgba(45,158,255,0.10), transparent 50%), var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 14,
        color: 'var(--text-secondary)',
        fontSize: 13,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          background: 'var(--accent-primary)',
          color: 'var(--on-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        A
      </div>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
        Aldar Risk Platform
      </div>
      <div>Loading sign-in…</div>
    </div>
  )
}
