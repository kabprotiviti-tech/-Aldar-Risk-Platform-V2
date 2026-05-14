'use client'

/**
 * CommandPalette — Tier-1 navigation primitive
 * ---------------------------------------------
 * Cmd-K / Ctrl-K global launcher (Linear / Stripe / Notion / Raycast
 * pattern). One keystroke to jump between any of the 25+ routes in
 * the platform without going through the sidebar accordion.
 *
 * Behaviour:
 *   - ⌘K  (mac) or Ctrl-K (win/linux) toggles the palette from anywhere
 *   - ↑ / ↓  navigate items
 *   - Enter activates highlighted item
 *   - Esc closes
 *   - Typing filters by label / description / group / keyword
 *   - Group headers stay visible while filtering — so a CRO who types
 *     "appetite" sees instantly that it's in Governance
 *
 * Keyboard-only design. No mouse-only paths. No dependencies beyond
 * lucide-react + next/navigation.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePersona } from '@/lib/context/PersonaContext'
import { canAccessRoute } from '@/lib/rbac/policy'
import {
  Search,
  ArrowRight,
  Clock,
  Command as CommandIcon,
  Crown as PersonaIcon,
  type LucideIcon,
  LayoutDashboard,
  ListChecks,
  BookOpen,
  Network,
  FlaskConical,
  Gauge,
  ShieldCheck,
  FileText,
  ClipboardList,
  FileBarChart,
  Crown,
  Building2,
  Globe2,
  ShieldHalf,
  UserCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react'

interface PaletteItem {
  href: string
  label: string
  group: string
  description: string
  icon: LucideIcon
  /** Extra search terms not visible in the UI. */
  keywords?: string[]
}

const ITEMS: PaletteItem[] = [
  // Home
  { href: '/my-dashboard', label: 'My Dashboard', group: 'Home', description: 'Personal "My Day" view', icon: UserCircle2, keywords: ['home', 'today', 'me'] },
  { href: '/home', label: 'Persona Landing', group: 'Home', description: 'Persona-routed landing page', icon: Crown, keywords: ['cro', 'arc', 'sub-ceo'] },
  // Identify
  { href: '/risk-register', label: 'Risk Register', group: 'Identify', description: 'Cause-Event-Impact register', icon: ListChecks, keywords: ['risks', 'log', 'cei'] },
  { href: '/risk-library', label: 'Risk Library', group: 'Identify', description: 'UAE risks + peer benchmark', icon: BookOpen, keywords: ['catalog', 'taxonomy'] },
  // Assess
  { href: '/portfolio-tower', label: 'Portfolio Tower', group: 'Assess', description: 'Group + subsidiaries heatmap', icon: Network, keywords: ['heatmap', 'group'] },
  { href: '/scenarios', label: 'Scenarios', group: 'Assess', description: 'Stress test simulation', icon: FlaskConical, keywords: ['simulation', 'stress'] },
  // Monitor
  { href: '/dashboard', label: 'External Intelligence', group: 'Monitor', description: 'News + decision intelligence', icon: Radio, keywords: ['news', 'reuters', 'bayut', 'adrec', 'market'] },
  { href: '/control-command-center', label: 'Control Center', group: 'Monitor', description: 'ICOFR control catalog', icon: Gauge, keywords: ['icofr', 'controls', 'sox'] },
  { href: '/kri', label: 'KRI Engine', group: 'Monitor', description: 'Key Risk Indicators', icon: AlertTriangle, keywords: ['indicators', 'thresholds'] },
  { href: '/audit-trail', label: 'Audit Trail', group: 'Monitor', description: 'Append-only event log', icon: ShieldCheck, keywords: ['events', 'history'] },
  { href: '/documents', label: 'Documents', group: 'Monitor', description: 'Document intelligence', icon: FileText, keywords: ['extract', 'upload'] },
  // Respond
  { href: '/respond/approvals', label: 'Approvals Queue', group: 'Respond', description: 'All approval routings', icon: ClipboardList, keywords: ['approve', 'sign-off'] },
  // Report
  { href: '/arc-pack', label: 'ARC Pack', group: 'Report', description: 'Board-ready PDF report', icon: FileBarChart, keywords: ['board', 'pdf', 'pack'] },
  { href: '/executive-brief', label: 'Executive Brief', group: 'Report', description: 'CEO + Board summary', icon: FileBarChart, keywords: ['ceo', 'board', 'summary'] },
  // Governance
  { href: '/risk-appetite', label: 'Risk Appetite', group: 'Governance', description: 'Group + subsidiary tolerances', icon: ShieldHalf, keywords: ['tolerance', 'appetite'] },
  { href: '/three-lines-of-defense', label: 'Three Lines of Defense', group: 'Governance', description: 'IIA model + roles', icon: ShieldHalf, keywords: ['iia', '3-lines', 'lod'] },
  { href: '/policy-and-procedure', label: 'Policy & Procedure', group: 'Governance', description: 'Policy register · status · review cycle', icon: BookOpen, keywords: ['policy', 'procedure', 'register', 'compliance'] },
  { href: '/regulator-map', label: 'Regulator Map', group: 'Governance', description: 'UAE regulator obligations', icon: Building2, keywords: ['sca', 'cbuae', 'adgm'] },
  { href: '/standards-reference', label: 'Standards Reference', group: 'Governance', description: 'COSO / ISO 31000 / SCA', icon: BookOpen, keywords: ['coso', 'iso', 'reference'] },
  { href: '/bcm', label: 'Business Continuity', group: 'Governance', description: 'BCM plans + tests', icon: Globe2, keywords: ['continuity', 'bcm', 'dr'] },
]

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

const RECENT_KEY = 'aldar-cmdk-recent-v1'
const RECENT_LIMIT = 4

function loadRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string').slice(0, RECENT_LIMIT) : []
  } catch {
    return []
  }
}

function pushRecent(href: string) {
  if (typeof window === 'undefined') return
  try {
    const cur = loadRecent()
    const next = [href, ...cur.filter((h) => h !== href)].slice(0, RECENT_LIMIT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // ignore quota / disabled localStorage
  }
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const { persona } = usePersona()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [recent, setRecent] = useState<string[]>([])

  // Hydrate recent list on each open so updates land between sessions.
  useEffect(() => {
    if (open) setRecent(loadRecent())
  }, [open])

  // Persona-scoped item set — palette only surfaces routes the
  // logged-in persona is authorised to view. Mirrors the sidebar
  // and tightens the persona-binding theme: Cmd-K is now a
  // legitimate alternative nav, not a back-door.
  const personaItems = useMemo(() => {
    if (!persona) return ITEMS // unauth (shouldn't happen — guard catches it)
    return ITEMS.filter((it) => canAccessRoute(persona.id, it.href))
  }, [persona])

  // Resolve recent hrefs back to PaletteItem, drop any that the
  // persona no longer has access to.
  const recentItems = useMemo<PaletteItem[]>(() => {
    if (query.trim()) return [] // hide recents while searching
    return recent
      .map((h) => personaItems.find((it) => it.href === h))
      .filter((it): it is PaletteItem => Boolean(it))
  }, [recent, personaItems, query])

  // Direct-jump detection: user types a risk ID (R-001) or KRI ID
  // (KRI-09) and we add a "Jump to <ID>" item at the top that routes
  // straight to the drawer. Lets a CRO surface R-001 in two keystrokes
  // (⌘K then r-001).
  const directJump = useMemo<PaletteItem | null>(() => {
    const q = query.trim().toUpperCase()
    const riskMatch = /^R-\d{1,4}$/.test(q)
    const kriMatch = /^KRI-\d{1,4}$/.test(q)
    const gaMatch = /^GA-[A-Z0-9-]+$/.test(q)
    if (!riskMatch && !kriMatch && !gaMatch) return null
    const href = riskMatch
      ? `/risk-register?focus=${q}`
      : kriMatch
        ? '/kri'
        : `/risk-appetite?focus=${q}`
    const label = riskMatch
      ? `Jump to risk ${q}`
      : kriMatch
        ? `Jump to ${q}`
        : `Jump to appetite ${q}`
    return {
      href,
      label,
      group: 'Direct jump',
      description: riskMatch
        ? 'Open the risk register focused on this risk'
        : kriMatch
          ? 'Open the KRI engine'
          : 'Open the risk-appetite page',
      icon: ITEMS[0].icon, // generic — overridden visually by accent
    }
  }, [query])

  // Free-text filter on top of the persona scope. When no query and
  // recents exist, drop those recents from the main list to avoid
  // duplication.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q
      ? personaItems.filter((it) => {
          const hay = `${it.label} ${it.description} ${it.group} ${(it.keywords ?? []).join(' ')}`.toLowerCase()
          return hay.includes(q)
        })
      : personaItems
    if (!q && recentItems.length > 0) {
      const recentHrefs = new Set(recentItems.map((r) => r.href))
      return base.filter((it) => !recentHrefs.has(it.href))
    }
    return base
  }, [query, personaItems, recentItems])

  // Combined navigation list — direct-jump first (when matched),
  // then recents, then filtered taxonomic items.
  const combined = useMemo<PaletteItem[]>(
    () => [
      ...(directJump ? [directJump] : []),
      ...recentItems,
      ...filtered,
    ],
    [directJump, recentItems, filtered],
  )

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      // Defer focus until after the modal mounts
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [open])

  // Keep active index in range when filter changes
  useEffect(() => {
    if (activeIdx >= combined.length) setActiveIdx(Math.max(0, combined.length - 1))
  }, [combined.length, activeIdx])

  // Scroll active into view
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx, open])

  const go = useCallback(
    (href: string) => {
      pushRecent(href)
      onClose()
      router.push(href)
    },
    [onClose, router],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(combined.length - 1, i + 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(0, i - 1))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const it = combined[activeIdx]
        if (it) go(it.href)
      }
    },
    [combined, activeIdx, go, onClose],
  )

  // Body scroll lock
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        style={{
          width: 'min(640px, 92vw)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-lg, 0 32px 64px rgba(0,0,0,0.55))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '70vh',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIdx(0)
            }}
            placeholder={
              persona
                ? `Jump to anywhere you can access as ${persona.title}…`
                : 'Jump to risk register, KRI, appetite, scenarios…'
            }
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: '-0.005em',
            }}
          />
          <kbd
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              padding: '2px 6px',
              borderRadius: 3,
              letterSpacing: 0.4,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            overflowY: 'auto',
            padding: 6,
            minHeight: 0,
          }}
        >
          {combined.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: 12,
              }}
            >
              No matches for &ldquo;{query}&rdquo;.
            </div>
          )}
          {combined.map((it, idx) => {
            const Icon = it.icon
            const active = idx === activeIdx
            // Direct-jump takes index 0; recents follow; taxonomic items last.
            const directOffset = directJump ? 1 : 0
            const isDirect = directJump && idx === 0
            const isRecent = !isDirect && idx >= directOffset && idx < directOffset + recentItems.length
            const prev = combined[idx - 1]
            const prevIsDirect = directJump && idx === 1
            const prevIsRecent = !prevIsDirect && idx - 1 >= directOffset && idx - 1 < directOffset + recentItems.length && idx > 0
            const itemGroup = isDirect ? 'Direct jump' : isRecent ? 'Recent' : it.group
            const prevGroup = prev
              ? prevIsDirect
                ? 'Direct jump'
                : prevIsRecent
                  ? 'Recent'
                  : prev.group
              : null
            const showGroupHeader = !prev || prevGroup !== itemGroup
            return (
              <React.Fragment key={`${isDirect ? 'd-' : isRecent ? 'r-' : ''}${it.href}-${idx}`}>
                {showGroupHeader && (
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      color: isDirect
                        ? 'var(--state-warning, #F5C518)'
                        : isRecent
                          ? 'var(--accent-primary)'
                          : 'var(--text-tertiary)',
                      padding: '8px 12px 4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    {isDirect && <ArrowRight size={9} />}
                    {isRecent && <Clock size={9} />}
                    {itemGroup}
                  </div>
                )}
                <button
                  data-idx={idx}
                  onClick={() => go(it.href)}
                  onMouseEnter={() => setActiveIdx(idx)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    background: active ? 'rgba(255,102,0,0.12)' : 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: '-0.005em',
                        color: active ? 'var(--accent-primary)' : 'var(--text-primary)',
                      }}
                    >
                      {it.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-tertiary)',
                        marginTop: 2,
                      }}
                    >
                      {it.description}
                    </div>
                  </div>
                  {active && (
                    <ArrowRight size={13} style={{ color: 'var(--accent-primary)' }} />
                  )}
                </button>
              </React.Fragment>
            )
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '8px 14px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            fontSize: 9,
            color: 'var(--text-tertiary)',
            letterSpacing: 0.4,
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <CommandIcon size={10} />
            <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>Command palette</span>
            {persona && (
              <span
                title={`Scoped to ${persona.title} · ${persona.line}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  background: 'rgba(255,102,0,0.10)',
                  border: '1px solid rgba(255,102,0,0.35)',
                  padding: '1px 6px',
                  borderRadius: 3,
                }}
              >
                <PersonaIcon size={9} />
                {persona.title} · {personaItems.length} routes
              </span>
            )}
          </div>
          <div style={{ display: 'inline-flex', gap: 12 }}>
            <span><kbd style={kbdStyle}>↑</kbd><kbd style={kbdStyle}>↓</kbd> navigate</span>
            <span><kbd style={kbdStyle}>↵</kbd> open</span>
            <span><kbd style={kbdStyle}>ESC</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const kbdStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  padding: '1px 5px',
  borderRadius: 3,
  marginRight: 3,
}

/**
 * Command-palette context — lifts open/close state so any descendant
 * (Header button, sidebar, FAB) can trigger the palette without
 * routing through props.
 */
interface CommandPaletteCtx {
  open: boolean
  setOpen: (v: boolean) => void
  toggle: () => void
}

const PaletteCtx = React.createContext<CommandPaletteCtx | null>(null)

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen((v) => !v), [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle])
  return (
    <PaletteCtx.Provider value={value}>
      {children}
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </PaletteCtx.Provider>
  )
}

export function useCommandPalette(): CommandPaletteCtx {
  const ctx = React.useContext(PaletteCtx)
  if (!ctx) {
    // Graceful fallback for use outside the provider — return noops.
    return { open: false, setOpen: () => {}, toggle: () => {} }
  }
  return ctx
}
