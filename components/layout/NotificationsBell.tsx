'use client'

/**
 * NotificationsBell — Block 3 #7
 * --------------------------------
 * Header notifications inbox. Derived live from:
 *   - Audit-trail events in the last 30 minutes (PersonaContext)
 *   - Pending Risk Appetite proposals (RiskAppetiteContext)
 *   - Pending Escalations (EscalationsContext)
 *
 * Pilot wires email / Slack / Teams push; pre-pilot this is in-app only.
 */

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, BellRing, X, AlertTriangle, Mail } from 'lucide-react'
import { useAuditTrail } from '@/lib/context/AuditTrailContext'
import { usePersona } from '@/lib/context/PersonaContext'

interface NotificationItem {
  id: string
  kind: 'audit' | 'pending' | 'system'
  title: string
  detail: string
  at: string
  href?: string
  severity: 'info' | 'warning' | 'danger'
}

const RECENT_WINDOW_MIN = 60

export function NotificationsBell() {
  const { events } = useAuditTrail()
  const { isAuthenticated, persona } = usePersona()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handle)
    return () => window.removeEventListener('mousedown', handle)
  }, [open])

  if (!isAuthenticated) return null

  // Build the notification list — last 60 minutes of audit activity,
  // any escalation events surface as warning, anything tagged 'red' as danger.
  const cutoff = Date.now() - RECENT_WINDOW_MIN * 60_000
  const recent = events
    .filter((e) => new Date(e.at).getTime() >= cutoff)
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 8)
    .map<NotificationItem>((e) => ({
      id: e.id,
      kind: 'audit',
      title: `${e.category.toUpperCase().replace('_', ' ')} · ${e.action}`,
      detail: e.summary,
      at: e.at,
      href:
        e.targetId && /^R-/.test(e.targetId)
          ? `/risk-register?focus=${e.targetId}`
          : e.targetId && /^KRI-/.test(e.targetId)
            ? '/kri'
            : e.targetId && /^GA-/.test(e.targetId)
              ? '/risk-appetite'
              : '/audit-trail',
      severity: e.category === 'escalation' ? 'danger' : 'info',
    }))

  const count = recent.length
  const hasUrgent = recent.some((r) => r.severity === 'danger')

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={`${count} new notification${count === 1 ? '' : 's'}`}
        aria-label="Notifications"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 7,
          color: hasUrgent ? 'var(--state-danger, #FF3B3B)' : 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        {hasUrgent ? <BellRing size={14} className="animate-pulse" /> : <Bell size={14} />}
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 8,
              background: hasUrgent ? 'var(--state-danger, #FF3B3B)' : 'var(--accent-primary)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-secondary)',
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 'min(420px, 92vw)',
            maxHeight: '70vh',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-lg, 0 24px 60px rgba(0,0,0,0.55))',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Bell size={14} style={{ color: 'var(--accent-primary)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                Notifications
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                Last {RECENT_WINDOW_MIN} min · {persona?.title ?? 'you'}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: 4,
                display: 'inline-flex',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {recent.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                fontSize: 11,
                color: 'var(--text-tertiary)',
                fontStyle: 'italic',
              }}
            >
              No new activity in the last {RECENT_WINDOW_MIN} minutes.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recent.map((n) => {
                const Icon =
                  n.severity === 'danger' ? AlertTriangle : Mail
                const sevColor =
                  n.severity === 'danger'
                    ? 'var(--state-danger, #FF3B3B)'
                    : n.severity === 'warning'
                      ? 'var(--state-warning, #F5C518)'
                      : 'var(--state-info, #2D9EFF)'
                const linkProps: React.ComponentProps<typeof Link> = n.href
                  ? { href: n.href }
                  : { href: '/audit-trail' }
                return (
                  <Link
                    key={n.id}
                    {...linkProps}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border-color)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 5,
                        background: `${sevColor}1f`,
                        color: sevColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={12} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: sevColor,
                          letterSpacing: 0.4,
                          textTransform: 'uppercase',
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-primary)',
                          lineHeight: 1.5,
                          marginTop: 2,
                        }}
                      >
                        {n.detail}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: 'var(--text-tertiary)',
                          marginTop: 2,
                        }}
                      >
                        {new Date(n.at).toLocaleString('en-AE', {
                          timeZone: 'Asia/Dubai',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        GST
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <div
            style={{
              padding: '8px 14px',
              fontSize: 9,
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
              borderTop: '1px solid var(--border-color)',
              lineHeight: 1.5,
            }}
          >
            Pilot wires email / Slack / Teams push for breach + escalation
            events. Pre-pilot this inbox is in-app only.
          </div>
        </div>
      )}
    </div>
  )
}
