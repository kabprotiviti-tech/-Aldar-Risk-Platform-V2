import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/context/ThemeContext'
import { AppChrome } from '@/components/layout/AppChrome'

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
          <AppChrome>{children}</AppChrome>
        </ThemeProvider>
      </body>
    </html>
  )
}
