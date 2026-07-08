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
import { CalendarDays } from 'lucide-react'
import { ERMPlanActivitiesProvider } from '@/lib/context/ERMPlanActivitiesContext'
import { ERMAnnualPlan } from '@/components/portfolio-tower/ERMAnnualPlan'
import { IllustrativeDataBanner } from '@/components/provenance/IllustrativeDataBanner'
import { PageHeader } from '@/components/ui/PageHeader'

/**
 * Standalone full-page ERM Annual Plan. Renders the SAME <ERMAnnualPlan />
 * card as the Dashboard (single source, identical visual).
 */
export default function ERMPlanPage() {
  return (
    <ERMPlanActivitiesProvider>
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <IllustrativeDataBanner pilotFeeds="ERM calendar + ARC schedule — locked against Aldar's actual governance cycle in pilot" />
        <PageHeader
          eyebrow="Risk Operations"
          icon={<CalendarDays size={17} />}
          title="ERM Annual Plan"
          subtitle="The full 12-month ERM cycle, plotted. Click any month cell to mark it Planned, In Progress or Completed — Due and Overdue are derived from today's date."
        />
        <ERMAnnualPlan />
      </div>
    </ERMPlanActivitiesProvider>
  )
}
