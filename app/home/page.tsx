'use client'

/**
 * /home
 * ------
 * Renders the same unified "My Dashboard" view as /my-dashboard so the
 * two routes are identical (per product decision). The persona-specific
 * dashboards (CRODashboard, ChampionDashboard, etc.) remain in the
 * codebase for future use but are no longer the landing surface — the
 * one consolidated, persona-aware My-Day view is the single home screen.
 */

import React from 'react'
import MyDashboardPage from '@/app/my-dashboard/page'

export default function HomePage() {
  return <MyDashboardPage />
}
