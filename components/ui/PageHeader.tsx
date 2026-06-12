'use client'

/**
 * PageHeader — the one premium page-header pattern for the tier-1 overhaul.
 * Eyebrow + big tracked title + subtitle on the left; actions on the right;
 * a clean divider underneath. Used across every screen for consistency.
 */

import React from 'react'

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="ui-page-header">
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="ui-eyebrow">{eyebrow}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          {icon && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--accent-glow)',
                border: '1px solid var(--border-accent)',
                color: 'var(--accent-primary)',
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          )}
          <h1 className="ui-page-title">{title}</h1>
        </div>
        {subtitle && <p className="ui-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  )
}
