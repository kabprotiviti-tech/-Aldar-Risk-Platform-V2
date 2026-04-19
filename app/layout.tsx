import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/context/ThemeContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { AIRiskAdvisor } from '@/components/AIRiskAdvisor'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Aldar Risk & Control Operating System',
  description: 'Enterprise AI-powered risk and control operating system for Aldar Properties PJSC — Abu Dhabi',
  keywords: ['risk management', 'internal controls', 'ICOFAR', 'Aldar Properties', 'Abu Dhabi', 'real estate', 'enterprise risk'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="executive-dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('aldar-theme') || 'executive-dark';
                document.documentElement.setAttribute('data-theme', theme);
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={inter.variable} suppressHydrationWarning>
        <ThemeProvider>
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
              <main className="layout-main-content">
                {children}
              </main>
            </div>
          </div>
          <MobileNav />
          <AIRiskAdvisor />
        </ThemeProvider>
      </body>
    </html>
  )
}
