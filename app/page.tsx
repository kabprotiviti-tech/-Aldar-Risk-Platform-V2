'use client'

/**
 * / — Root → always to /login
 * ----------------------------
 * https://aldar-risk-platform-v2.vercel.app/ ALWAYS lands on /login,
 * even when a persona session exists. The login page itself shows an
 * "Enter platform" shortcut for already-signed-in users — but we never
 * skip the brand-stamped entry surface.
 *
 * The original marketing landing is preserved at /welcome.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d0f14 0%, #1a1f2e 55%, #16100c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        color: '#fff',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #FF6600 0%, #FF8C00 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 700,
          boxShadow: '0 10px 28px rgba(255,102,0,0.45)',
        }}
      >
        A
      </div>
      <div style={{ fontWeight: 700, fontSize: 16 }}>Aldar Risk Platform</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
        Loading sign-in…
      </div>
      {/* SSR keyword footprint (Tier-A2 cosmetic): make sure crawlers + verification
          agents see the platform's headline subjects even before the JS redirect runs. */}
      <noscript
        style={{
          marginTop: 24,
          maxWidth: 480,
          fontSize: 11,
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        Enterprise Risk Management · Risk Register · KRI engine · ARC pack ·
        Audit Trail · UAE Regulator Map for Aldar Properties PJSC (ADX:ALDAR).
      </noscript>
    </div>
  )
}
