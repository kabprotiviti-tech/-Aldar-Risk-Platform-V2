'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  FlaskConical,
  FileText,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Shield,
  ListChecks,
} from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Risk Overview',
  },
  {
    href: '/portfolio',
    label: 'Portfolio Risk',
    icon: Building2,
    description: 'Portfolio Analysis',
  },
  {
    href: '/risk-register',
    label: 'Risk Register',
    icon: ListChecks,
    description: 'Cause-Event-Impact register',
  },
  {
    href: '/scenarios',
    label: 'Scenarios',
    icon: FlaskConical,
    description: 'Scenario Simulation',
  },
  {
    href: '/documents',
    label: 'Documents',
    icon: FileText,
    description: 'Document Intelligence',
  },
  {
    href: '/executive-brief',
    label: 'Executive Brief',
    icon: ScrollText,
    description: 'Board Summary',
  },
  {
    href: '/control-command-center',
    label: 'Control Center',
    icon: Shield,
    description: 'ICOFR Controls',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Auto-collapse on tablet/mobile
  React.useEffect(() => {
    const check = () => {
      if (window.innerWidth < 1024) setCollapsed(true)
      else setCollapsed(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <aside
      className="sidebar-fixed"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        width: collapsed ? '72px' : '220px',
        transition: 'width 0.25s ease',
        flexShrink: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        overflowX: 'hidden',
      }}
    >
      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '11px 18px' : '11px 20px',
                margin: '2px 8px',
                borderRadius: '9px',
                textDecoration: 'none',
                backgroundColor: isActive ? 'var(--accent-glow)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }
              }}
            >
              <Icon
                size={18}
                style={{
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  flexShrink: 0,
                }}
              />
              {!collapsed && (
                <div>
                  <div
                    style={{
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.825rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.65rem',
                    }}
                  >
                    {item.description}
                  </div>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* AI Status */}
      <div
        style={{
          padding: collapsed ? '12px 16px' : '12px 20px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        {!collapsed ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#22C55E',
                }}
                className="animate-pulse"
              />
            </div>
            <div>
              <div
                style={{
                  color: '#22C55E',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                AI ENGINE ACTIVE
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>
                Claude Sonnet · Live
              </div>
            </div>
            <Cpu size={14} style={{ color: '#22C55E', marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        ) : (
          <div
            title="AI Engine Active"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#22C55E',
              margin: '0 auto',
            }}
            className="animate-pulse"
          />
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          top: '50%',
          right: '-12px',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 50,
          color: 'var(--text-muted)',
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
