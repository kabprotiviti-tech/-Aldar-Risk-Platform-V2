'use client'

/**
 * Section — shared dashboard primitive
 * -------------------------------------
 * Consolidates the ~5 nearly-identical Section implementations that
 * lived inline in CRODashboard, ChampionDashboard, SubsidiaryCEODashboard,
 * InternalAuditDashboard, ARCChairDashboard, /my-dashboard.
 *
 * Variants:
 *   - default — flat card, no accent border, used on /my-dashboard
 *     redesign (Batch 2 calm style)
 *   - bordered — colour-accented left border (legacy persona dashboards)
 *
 * Callers can migrate at their own pace; existing inline Section
 * functions keep working.
 */

import React from 'react'

export interface SectionProps {
  title: string
  subtitle?: string
  /** Accent colour for the left border + title (bordered variant only). */
  accent?: string
  /** Optional icon rendered next to the title. */
  icon?: React.ReactNode
  /** Optional CTA element (button or Link) rendered on the right of the header. */
  cta?: React.ReactNode
  /** Visual variant. Default 'flat' (Batch 2 calm direction). */
  variant?: 'flat' | 'bordered'
  /** Inner padding. Default 14. */
  padding?: number
  children: React.ReactNode
}

export function Section({
  title,
  subtitle,
  accent,
  icon,
  cta,
  variant = 'flat',
  padding = 14,
  children,
}: SectionProps) {
  const titleColor = variant === 'bordered' && accent ? accent : 'var(--text-primary)'
  return (
    <section
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: variant === 'bordered' && accent ? `4px solid ${accent}` : '1px solid var(--border-color)',
        borderRadius: variant === 'bordered' ? 8 : 10,
        padding,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: variant === 'bordered' ? 11 : 13,
              fontWeight: variant === 'bordered' ? 700 : 600,
              color: titleColor,
              letterSpacing: variant === 'bordered' ? 0.5 : '-0.005em',
              textTransform: variant === 'bordered' ? 'uppercase' : 'none',
            }}
          >
            {icon}
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
        {cta}
      </div>
      {children}
    </section>
  )
}
