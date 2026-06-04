import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/context/ThemeContext'
import { DerivedRisksProvider } from '@/lib/context/DerivedRisksContext'
import { UploadedDocumentProvider } from '@/lib/context/UploadedDocumentContext'
import { AuditTrailProvider } from '@/lib/context/AuditTrailContext'
import { PersonaProvider } from '@/lib/context/PersonaContext'
import { MultiEntityScopeProvider } from '@/lib/context/MultiEntityScopeContext'
import { AppChrome } from '@/components/layout/AppChrome'
import { EnvironmentBanner } from '@/components/provenance/EnvironmentBanner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PROS — Protiviti Risk Operating System',
  description: 'PROS — Protiviti Risk Operating System. AI-enabled enterprise risk and control platform for diversified holding companies.',
  keywords: ['PROS', 'Protiviti', 'risk management', 'internal controls', 'ICOFR', 'ERM', 'enterprise risk', 'GRC'],
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
          <AuditTrailProvider>
            <PersonaProvider>
              <MultiEntityScopeProvider>
                <UploadedDocumentProvider>
                  <DerivedRisksProvider>
                    <EnvironmentBanner env="demo" />
                    <AppChrome>{children}</AppChrome>
                  </DerivedRisksProvider>
                </UploadedDocumentProvider>
              </MultiEntityScopeProvider>
            </PersonaProvider>
          </AuditTrailProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
