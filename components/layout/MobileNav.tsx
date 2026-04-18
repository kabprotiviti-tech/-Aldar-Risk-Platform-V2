'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, FlaskConical, FileText, ScrollText } from 'lucide-react'

const navItems = [
  { href: '/dashboard',       label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/portfolio',       label: 'Portfolio',  icon: Building2 },
  { href: '/scenarios',       label: 'Scenarios',  icon: FlaskConical },
  { href: '/documents',       label: 'Documents',  icon: FileText },
  { href: '/executive-brief', label: 'Brief',      icon: ScrollText },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link key={href} href={href} className={active ? 'active' : ''}>
            <Icon size={20} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
