'use client'

import React, { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
// AIRiskAdvisor temporarily disabled — RiskMemoryChat (deterministic,
// no-hallucination) is the single conversational surface until the
// 10-agent UX synthesis lands a merged design.
// import { AIRiskAdvisor } from '@/components/AIRiskAdvisor'
import { RiskMemoryChat } from '@/components/RiskMemoryChat'
import { StealthToggle } from './StealthToggle'
import { StoryThread } from './StoryThread'
import { StoryRail } from './StoryRail'
import { CommandPaletteProvider } from './CommandPalette'
import { usePersona } from '@/lib/context/PersonaContext'

/**
 * Auth guard — redirect to /login when the user hits a protected
 * route without a persona. Pre-pilot we have no SSO, so the persona
 * lives in localStorage; once cleared, every protected page kicks
 * back to /login. This closes the "persona binding" loophole the
 * /my-dashboard local picker used to expose.
 */
function AuthGuard({
  pathname,
  children,
}: {
  pathname: string
  children: React.ReactNode
}) {
  const { isAuthenticated } = usePersona()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    // Render a thin loading sliver while the redirect lands so we
    // never flash protected content to an unauthenticated user.
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-tertiary)',
          fontSize: 12,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
        aria-label={`Redirecting to login from ${pathname}`}
      >
        Redirecting to login…
      </div>
    )
  }

  return <>{children}</>
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isRootRedirect = pathname === '/'
  const isLogin = pathname === '/login'
  const isWelcome = pathname === '/welcome'

  if (isLogin || isRootRedirect) {
    // Login screen + root-redirect both run without chrome.
    return <>{children}</>
  }

  if (isWelcome) {
    // Original marketing landing — keep clean, no sidebar/header.
    return (
      <>
        {children}
        <StealthToggle />
      </>
    )
  }

  return (
    <CommandPaletteProvider>
      <AuthGuard pathname={pathname}>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <Sidebar />
          <div className="layout-content-area">
            <Header />
            {/* Story Thread — persistent ledger on spine screens (Batch C) */}
            <StoryThread />
            <main className="layout-main-content">{children}</main>
          </div>
        </div>
        <MobileNav />
        <RiskMemoryChat />
        {/* Story Rail — 7-node wayfinding + causal handoff (replaces the FAB) */}
        <StoryRail />
        <StealthToggle />
      </AuthGuard>
    </CommandPaletteProvider>
  )
}
