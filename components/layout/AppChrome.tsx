'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { AIRiskAdvisor } from '@/components/AIRiskAdvisor'

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLanding = pathname === '/'

  if (isLanding) {
    return <>{children}</>
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
      <AIRiskAdvisor />
    </>
  )
}
