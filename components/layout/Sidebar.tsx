'use client'

/**
 * Sidebar — Block 2 P3
 * ---------------------
 * Lifecycle IA per locked BCG-partner design: 6 sections instead of a
 * flat 19-item list. Visibility filters by PersonaContext — each item
 * declares which persona ids can see it; CRO sees everything, others
 * see a subset matching their day-to-day surfaces.
 *
 * Legacy routes (`/dashboard`, `/portfolio`, `/executive-brief`,
 * `/control-command-center`) are intentionally dropped from the nav.
 * The URLs still resolve for bookmarks; P7 wires 302 redirects.
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FlaskConical,
  FileText,
  ChevronLeft,
  ChevronRight,
  Cpu,
  ListChecks,
  Gauge,
  Network,
  FileBarChart,
  ShieldCheck,
  ShieldQuestion,
  ShieldHalf,
  Landmark,
  BookOpen,
  UserCircle2,
  BookMarked,
  LifeBuoy,
  Search,
  Telescope,
  Activity,
  type LucideIcon,
} from 'lucide-react'
import { usePersona } from '@/lib/context/PersonaContext'
import type { PersonaId } from '@/lib/personas'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  description: string
  /** Personas allowed to see this nav entry. `null` = visible to all (incl. unauthenticated). */
  personas: PersonaId[] | null
}

interface NavGroup {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

// All 5 personas, used as a convenience for "visible to everyone".
const ALL: PersonaId[] = [
  'group-cro',
  'risk-champion',
  'subsidiary-ceo',
  'internal-audit',
  'arc-chair',
]

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'home',
    label: 'Home',
    icon: LayoutDashboard,
    items: [
      {
        href: '/my-dashboard',
        label: 'My Dashboard',
        icon: UserCircle2,
        description: 'Personal "My Day" view',
        personas: ALL,
      },
    ],
  },
  {
    id: 'identify',
    label: 'Identify',
    icon: Search,
    items: [
      {
        href: '/risk-register',
        label: 'Risk Register',
        icon: ListChecks,
        description: 'Cause-Event-Impact register',
        personas: ALL,
      },
      {
        href: '/risk-library',
        label: 'Risk Library',
        icon: BookOpen,
        description: 'UAE risks + peer benchmark',
        personas: ['group-cro', 'risk-champion', 'subsidiary-ceo', 'internal-audit'],
      },
    ],
  },
  {
    id: 'assess',
    label: 'Assess',
    icon: Telescope,
    items: [
      {
        href: '/portfolio-tower',
        label: 'Portfolio Tower',
        icon: Network,
        description: 'Group + Subsidiaries',
        personas: ['group-cro', 'subsidiary-ceo', 'internal-audit', 'arc-chair'],
      },
      {
        href: '/scenarios',
        label: 'Scenarios',
        icon: FlaskConical,
        description: 'Stress test simulation',
        personas: ['group-cro', 'risk-champion', 'subsidiary-ceo'],
      },
    ],
  },
  {
    id: 'monitor',
    label: 'Monitor',
    icon: Activity,
    items: [
      {
        href: '/kri',
        label: 'KRIs',
        icon: Gauge,
        description: 'Key Risk Indicators',
        personas: ALL,
      },
      {
        href: '/audit-trail',
        label: 'Audit Trail',
        icon: ShieldCheck,
        description: 'Append-only event log',
        personas: ['group-cro', 'internal-audit', 'arc-chair', 'subsidiary-ceo'],
      },
      {
        href: '/documents',
        label: 'Documents',
        icon: FileText,
        description: 'Document Intelligence',
        personas: ['group-cro', 'risk-champion', 'internal-audit'],
      },
    ],
  },
  {
    id: 'report',
    label: 'Report',
    icon: FileBarChart,
    items: [
      {
        href: '/arc-pack',
        label: 'ARC Pack',
        icon: FileBarChart,
        description: 'Board-ready PDF report',
        personas: ['group-cro', 'arc-chair', 'subsidiary-ceo', 'internal-audit'],
      },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    icon: ShieldHalf,
    items: [
      {
        href: '/risk-appetite',
        label: 'Risk Appetite',
        icon: ShieldQuestion,
        description: 'Appetite statements',
        personas: ALL,
      },
      {
        href: '/three-lines-of-defense',
        label: '3 Lines of Defense',
        icon: ShieldHalf,
        description: 'Operating model',
        personas: ALL,
      },
      {
        href: '/regulator-map',
        label: 'Regulator Map',
        icon: Landmark,
        description: 'UAE regulatory bodies',
        personas: ['group-cro', 'internal-audit', 'arc-chair'],
      },
      {
        href: '/standards-reference',
        label: 'Standards Ref',
        icon: BookMarked,
        description: 'ISO 31000 + COSO ERM',
        personas: ['group-cro', 'internal-audit', 'arc-chair'],
      },
      {
        href: '/bcm',
        label: 'BCM',
        icon: LifeBuoy,
        description: 'Business Continuity · Phase 4 roadmap',
        personas: ['group-cro', 'arc-chair'],
      },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { persona, isAuthenticated } = usePersona()

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

  // Filter items by persona. Unauthenticated = show everything (so demo
  // users browsing without login see the full surface area).
  function visibleItems(items: NavItem[]): NavItem[] {
    if (!isAuthenticated || !persona) return items
    return items.filter(
      (i) => i.personas === null || i.personas.includes(persona.id),
    )
  }

  return (
    <aside
      className="sidebar-fixed"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        width: collapsed ? '72px' : '240px',
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
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_GROUPS.map((group) => {
          const items = visibleItems(group.items)
          if (items.length === 0) return null
          const GroupIcon = group.icon
          return (
            <div key={group.id} style={{ marginBottom: 8 }}>
              {!collapsed ? (
                <div
                  style={{
                    padding: '8px 20px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <GroupIcon size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      letterSpacing: 1.2,
                      textTransform: 'uppercase',
                    }}
                  >
                    {group.label}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    height: 1,
                    margin: '6px 16px',
                    background: 'var(--border-color)',
                    opacity: 0.4,
                  }}
                />
              )}
              {items.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? `${group.label} · ${item.label}` : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: collapsed ? '9px 18px' : '8px 20px',
                      margin: '1px 8px',
                      borderRadius: '7px',
                      textDecoration: 'none',
                      backgroundColor: isActive ? 'var(--accent-glow)' : 'transparent',
                      borderLeft: isActive
                        ? '2px solid var(--accent-primary)'
                        : '2px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor =
                          'var(--bg-hover)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor =
                          'transparent'
                      }
                    }}
                  >
                    <Icon
                      size={16}
                      style={{
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    />
                    {!collapsed && (
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontSize: '0.8rem',
                            fontWeight: isActive ? 600 : 500,
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.62rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.description}
                        </div>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Persona indicator (collapsed footer) — only when authenticated */}
      {isAuthenticated && persona && (
        <div
          style={{
            padding: collapsed ? '10px 14px' : '10px 16px',
            borderTop: '1px solid var(--border-color)',
            fontSize: collapsed ? 0 : 10,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
          }}
          title={`Persona: ${persona.title}`}
        >
          <UserCircle2 size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          {!collapsed && (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                {persona.title}
              </span>
            </span>
          )}
        </div>
      )}

      {/* AI Status footer */}
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
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22C55E',
                flexShrink: 0,
              }}
              className="animate-pulse"
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: '#22C55E',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                AI ENGINE ACTIVE
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.55rem' }}>AI · Live</div>
            </div>
            <Cpu size={13} style={{ color: '#22C55E', marginLeft: 'auto', flexShrink: 0 }} />
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

