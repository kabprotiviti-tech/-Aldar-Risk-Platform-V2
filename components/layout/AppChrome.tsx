'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
// AIRiskAdvisor temporarily disabled — RiskMemoryChat (deterministic,
// no-hallucination) is the single conversational surface until the
// 10-agent UX synthesis lands a merged design.
// import { AIRiskAdvisor } from '@/components/AIRiskAdvisor'
import { RiskMemoryChat } from '@/components/RiskMemoryChat'
import { StealthToggle } from './StealthToggle'
import { CommandPalette, useCommandPalette } from './CommandPalette'

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isRootRedirect = pathname === '/'
  const isLogin = pathname === '/login'
  const isWelcome = pathname === '/welcome'
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette()

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
    <>
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
          <main className="layout-main-content">{children}</main>
        </div>
      </div>
      <MobileNav />
      <RiskMemoryChat />
      <StealthToggle />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}
