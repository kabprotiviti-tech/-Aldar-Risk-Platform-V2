'use client'

/**
 * ERM Annual Plan — dedicated full-page view
 * -------------------------------------------
 * The entire 12-month ERM cycle plotted on one screen. Same interactive
 * grid surfaced on the Dashboard (Planned / In Progress / Completed;
 * Due & Overdue derived from today vs. the schedule), but given its own
 * route so the full plan can be reviewed without the dashboard context.
 *
 * Honors CLAUDE.md: seeded cycle is illustrative; user-added activities
 * are attributed; status changes are audit-trailed. No fabricated AED.
 */

import React from 'react'
import { CalendarClock } from 'lucide-react'
import { ERMPlanActivitiesProvider } from '@/lib/context/ERMPlanActivitiesContext'
import { ERMAnnualPlan } from '@/components/portfolio-tower/ERMAnnualPlan'
import { StatusBadge } from '@/components/provenance/StatusBadge'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'

export default function ERMPlanPage() {
  return (
    <ERMPlanActivitiesProvider>
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <IllustrativeDataBanner pilotFeeds="ERM calendar + ARC schedule — locked against Aldar's actual governance cycle in pilot" />

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              className="ui-page-title"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
            >
              <CalendarClock size={20} style={{ color: 'var(--accent-primary)' }} />
              ERM Annual Plan · 2026
            </h1>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                margin: '4px 0 0',
                maxWidth: 820,
                lineHeight: 1.55,
              }}
            >
              The full 12-month ERM cycle plotted on one screen. Click any
              activity&rsquo;s status chip to mark it Planned, In Progress or
              Completed — <strong>Due</strong> and <strong>Overdue</strong> are
              derived automatically from today&rsquo;s date against each
              activity&rsquo;s scheduled months. Add ad-hoc activities with
              <strong> + Add Activity</strong>.
            </p>
          </div>
          <StatusBadge tier="MVP" note="Illustrative cycle · status & additions persist locally" />
        </div>

        <ERMAnnualPlan />
      </div>
    </ERMPlanActivitiesProvider>
  )
}
