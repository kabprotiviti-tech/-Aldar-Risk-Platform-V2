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
  ClipboardList,
  Settings,
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
        href: '/dashboard',
        label: 'External Intel',
        icon: LayoutDashboard,
        description: 'News + decision intelligence',
        personas: ALL,
      },
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
    id: 'respond',
    label: 'Respond',
    icon: Settings,
    items: [
      {
        href: '/respond/approvals',
        label: 'Approvals',
        icon: ClipboardList,
        description: 'Approvals queue · all routings',
        personas: ALL,
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
  // Default collapsed (icon-only L1). User explicitly expands to see L2.
  const [collapsed, setCollapsed] = useState(true)
  const [userToggled, setUserToggled] = useState(false)
  const { persona, isAuthenticated } = usePersona()

  // Auto-collapse on tablet/mobile, but respect explicit user toggle.
  React.useEffect(() => {
    const check = () => {
      if (userToggled) return
      if (window.innerWidth < 1024) setCollapsed(true)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [userToggled])

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
        width: collapsed ? '56px' : '200px',
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
                    padding: '6px 14px 2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <GroupIcon size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      letterSpacing: 1,
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
                      gap: '10px',
                      padding: collapsed ? '8px 14px' : '6px 14px',
                      margin: '1px 6px',
                      borderRadius: '6px',
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
                      size={15}
                      style={{
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    />
                    {!collapsed && (
                      <div
                        style={{
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: '0.76rem',
                          fontWeight: isActive ? 600 : 500,
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minWidth: 0,
                        }}
                      >
                        {item.label}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Persona indicator (footer) — only when authenticated */}
      {isAuthenticated && persona && (
        <div
          style={{
            padding: collapsed ? '6px 12px' : '6px 14px',
            borderTop: '1px solid var(--border-color)',
            fontSize: collapsed ? 0 : 10,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
          title={`Persona: ${persona.title}`}
        >
          <UserCircle2 size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          {!collapsed && (
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              {persona.title}
            </span>
          )}
        </div>
      )}

      {/* AI Status footer */}
      <div
        style={{
          padding: collapsed ? '8px 12px' : '8px 14px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        {!collapsed ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}
          >
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#22C55E',
                flexShrink: 0,
              }}
              className="animate-pulse"
            />
            <span
              style={{
                color: '#22C55E',
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              AI ENGINE
            </span>
            <Cpu size={11} style={{ color: '#22C55E', marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        ) : (
          <div
            title="AI Engine Active"
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#22C55E',
              margin: '0 auto',
            }}
            className="animate-pulse"
          />
        )}
      </div>

      <button
        onClick={() => {
          setUserToggled(true)
          setCollapsed(!collapsed)
        }}
        title={collapsed ? 'Expand sidebar (show labels)' : 'Collapse sidebar (icons only)'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute',
          top: 18,
          right: '-13px',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-primary)',
          border: '2px solid var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 50,
          color: 'var(--on-accent)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          transition: 'transform 0.18s ease',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
        }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}

