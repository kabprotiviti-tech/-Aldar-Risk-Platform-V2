import React from 'react'
import type { Metadata } from 'next'
import { Inter, Newsreader } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/context/ThemeContext'
import { DerivedRisksProvider } from '@/lib/context/DerivedRisksContext'
import { UploadedDocumentProvider } from '@/lib/context/UploadedDocumentContext'
import { AuditTrailProvider } from '@/lib/context/AuditTrailContext'
import { PersonaProvider } from '@/lib/context/PersonaContext'
import { MultiEntityScopeProvider } from '@/lib/context/MultiEntityScopeContext'
import { AppChrome } from '@/components/layout/AppChrome'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Meridian design system — an editorial serif for display headlines and hero
// figures, paired with Inter for body/data. Exposed as --font-newsreader.
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
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
    <html lang="en" data-theme="executive-light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('pros-theme') || 'executive-light';
                document.documentElement.setAttribute('data-theme', theme);
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${newsreader.variable}`} suppressHydrationWarning>
        <ThemeProvider>
          <AuditTrailProvider>
            <PersonaProvider>
              <MultiEntityScopeProvider>
                <UploadedDocumentProvider>
                  <DerivedRisksProvider>
                    {/* Top "V0.5 MVP / pre-contract POC" strip removed (Batch 1) —
                        version + provenance now live in the footer / data chip. */}
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
