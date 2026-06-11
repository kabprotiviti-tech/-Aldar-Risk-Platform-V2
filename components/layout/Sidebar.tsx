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
  ChevronDown,
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
  Radio,
  ClipboardList,
  ArrowRight,
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

// All 4 personas, used as a convenience for "visible to everyone".
const ALL: PersonaId[] = [
  'group-cro',
  'risk-champion',
  'subsidiary-ceo',
  'arc-chair',
]

// ─── Narrative spine (Batch 4) ──────────────────────────────────────────
// The sidebar reads like a story, not a sitemap. Seven ordered beats take
// a leader from "what is our posture" to "what goes to the Board".
// The STORY_SPINE array (href order) also powers the persistent "Next →".
export interface SpineBeat {
  href: string
  label: string
  /** One causal sentence handed to the NEXT beat — the connective tissue. */
  handoff: string
}

export const STORY_SPINE: SpineBeat[] = [
  { href: '/my-dashboard', label: 'Dashboard', handoff: '3 external signals moved the score — see what changed.' },
  { href: '/dashboard', label: 'External Intelligence', handoff: '2 signals map to your top-10 risks — open the register.' },
  { href: '/risk-register', label: 'Risk Register', handoff: 'These 9 Critical/High concentrate in 2 entities — see where.' },
  { href: '/portfolio-tower', label: 'Portfolio Summary', handoff: 'Stress that concentration — what does doing nothing cost?' },
  { href: '/scenarios', label: 'Scenario Analysis', handoff: 'One decision needs sign-off — route it for approval.' },
  { href: '/respond/approvals', label: 'Approvals', handoff: 'It’s decided — the board pack is ready to assemble.' },
  { href: '/arc-pack', label: 'Board Pack', handoff: 'That’s the loop — restart the story from posture.' },
]

/** The golden-thread risk that travels every beat (Batch C). */
export const GOLDEN_THREAD = {
  riskId: 'R-007',
  kri: 'KRI-13',
  name: 'Domestic buyer-default risk',
  decision: 'FX hedge top-up + GMP freeze',
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'story',
    label: 'Risk Ops',
    icon: Activity,
    items: [
      { href: '/my-dashboard', label: '1 · Dashboard', icon: UserCircle2, description: 'Where do we stand right now?', personas: ALL },
      { href: '/dashboard', label: '2 · External Intelligence', icon: Radio, description: 'What changed in the outside world?', personas: ALL },
      { href: '/risk-register', label: '3 · Risk Register', icon: ListChecks, description: 'AI challenges the register; human approves', personas: ALL },
      { href: '/portfolio-tower', label: '4 · Portfolio Summary', icon: Network, description: 'Where does the exposure concentrate?', personas: ['group-cro', 'subsidiary-ceo', 'arc-chair'] },
      { href: '/scenarios', label: '5 · Scenario Analysis', icon: FlaskConical, description: 'What does it cost — and what must we decide?', personas: ['group-cro', 'risk-champion', 'subsidiary-ceo'] },
      { href: '/respond/approvals', label: '6 · Approvals', icon: ClipboardList, description: 'Route the decision for sign-off', personas: ALL },
      { href: '/arc-pack', label: '7 · Board Pack', icon: FileBarChart, description: 'The board-ready pack, written live', personas: ['group-cro', 'arc-chair', 'subsidiary-ceo'] },
    ],
  },
  {
    // Full reference / governance shelf. These sit below the 7-beat spine so
    // the demo leads with the story, but every screen is one click away.
    id: 'depth',
    label: 'Detailed Review Section',
    icon: Search,
    items: [
      { href: '/kri', label: 'KRIs', icon: Gauge, description: 'Key Risk Indicators', personas: ALL },
      { href: '/risk-appetite', label: 'Risk Appetite', icon: ShieldQuestion, description: 'Appetite statements', personas: ALL },
      { href: '/control-command-center', label: 'Control Center', icon: Gauge, description: 'ICOFR control catalogue', personas: ['group-cro', 'arc-chair', 'risk-champion'] },
      { href: '/risk-library', label: 'Risk Library', icon: BookOpen, description: 'UAE risk starter library', personas: ['group-cro', 'risk-champion', 'subsidiary-ceo'] },
      { href: '/executive-brief', label: 'Executive Brief', icon: FileBarChart, description: 'AI board summary', personas: ['group-cro', 'arc-chair', 'subsidiary-ceo'] },
      { href: '/documents', label: 'Documents', icon: FileText, description: 'Document intelligence', personas: ['group-cro', 'risk-champion'] },
      { href: '/audit-trail', label: 'Audit Trail', icon: ShieldCheck, description: 'Append-only event log', personas: ['group-cro', 'arc-chair', 'subsidiary-ceo'] },
      { href: '/policy-and-procedure', label: 'Policy & Procedure', icon: BookMarked, description: 'Policy register', personas: ALL },
      { href: '/regulator-map', label: 'Regulator Map', icon: Landmark, description: 'UAE regulatory bodies', personas: ['group-cro', 'arc-chair'] },
      { href: '/three-lines-of-defense', label: '3 Lines of Defense', icon: ShieldHalf, description: 'Governance operating model', personas: ALL },
      { href: '/standards-reference', label: 'Standards Ref', icon: BookMarked, description: 'ISO 31000 + COSO ERM', personas: ['group-cro', 'arc-chair'] },
      { href: '/bcm', label: 'BCM', icon: LifeBuoy, description: 'Business Continuity', personas: ['group-cro', 'arc-chair'] },
    ],
  },
]

const GROUP_OPEN_STORAGE = 'aldar-sidebar-group-open-v1'

function loadGroupState(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(GROUP_OPEN_STORAGE)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function Sidebar() {
  const pathname = usePathname()
  // Default expanded (200px) so users see the L2 labels by default.
  const [collapsed, setCollapsed] = useState(false)
  const [userToggled, setUserToggled] = useState(false)
  const { persona, isAuthenticated } = usePersona()

  // Per-group expand state. Default: all OPEN. Persists to localStorage.
  // Note: the active route's group always force-opens regardless of saved state.
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({})
  const [groupHydrated, setGroupHydrated] = useState(false)

  React.useEffect(() => {
    setGroupOpen(loadGroupState())
    setGroupHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!groupHydrated) return
    try {
      window.localStorage.setItem(GROUP_OPEN_STORAGE, JSON.stringify(groupOpen))
    } catch {
      // private mode / quota — non-fatal
    }
  }, [groupOpen, groupHydrated])

  function toggleGroup(groupId: string) {
    setGroupOpen((prev) => ({
      ...prev,
      [groupId]: prev[groupId] === undefined ? false : !prev[groupId],
    }))
  }

  function isGroupOpen(groupId: string, hasActiveItem: boolean): boolean {
    // Active route's group always opens, even if user collapsed it earlier.
    if (hasActiveItem) return true
    const saved = groupOpen[groupId]
    // The narrative spine ("story") leads; "Depth on demand" starts folded so
    // the eye lands on the 7-beat story, not the 12-item reference shelf.
    if (saved === undefined) return groupId !== 'depth'
    return saved
  }

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
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_GROUPS.map((group) => {
          const items = visibleItems(group.items)
          if (items.length === 0) return null
          const GroupIcon = group.icon
          const hasActiveItem = items.some(
            (i) => pathname === i.href || pathname.startsWith(i.href + '/'),
          )
          const open = isGroupOpen(group.id, hasActiveItem)

          return (
            <div key={group.id} style={{ marginBottom: 4 }}>
              {!collapsed ? (
                // ── L2 expanded: clickable group header with accordion chevron
                <button
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={open}
                  aria-controls={`sidebar-group-${group.id}`}
                  style={{
                    width: 'calc(100% - 12px)',
                    margin: '4px 6px 2px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    transition: 'background 0.15s ease, color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <GroupIcon
                    size={13}
                    style={{
                      color: hasActiveItem ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      color: hasActiveItem ? 'var(--text-primary)' : 'var(--text-secondary)',
                      letterSpacing: 1.2,
                      textTransform: 'uppercase',
                    }}
                  >
                    {group.label}
                  </span>
                  <ChevronDown
                    size={12}
                    style={{
                      color: 'var(--text-tertiary)',
                      transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                    }}
                  />
                </button>
              ) : (
                // ── L1 collapsed: divider between groups, no header
                <div
                  style={{
                    height: 1,
                    margin: '6px 12px',
                    background: 'var(--border-color)',
                    opacity: 0.4,
                  }}
                />
              )}

              {/* Children — hidden when group is collapsed AND sidebar is expanded.
                  When sidebar is icon-rail collapsed, always show icons regardless. */}
              <div
                id={`sidebar-group-${group.id}`}
                style={{
                  display: collapsed || open ? 'block' : 'none',
                  overflow: 'hidden',
                }}
              >
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

