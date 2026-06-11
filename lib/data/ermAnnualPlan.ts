/**
 * ERM Annual Plan — the year's ERM activities with PLANNED vs ACTUAL timing.
 * Illustrative POC data for a UAE listed PJSC. "Today" is June (month 6), so
 * Jan–May are history (done or overdue), June is in-flight, Jul–Dec are ahead.
 */

export type ErmStatus = 'completed' | 'completed-late' | 'in-progress' | 'overdue' | 'planned'

export interface ErmActivity {
  id: string
  name: string
  owner: string
  plannedMonth: number // 1-12, planned start
  plannedEndMonth: number // 1-12, planned finish (same as start for point activities)
  actualMonth: number | null // month completed; null if not yet completed
  status: ErmStatus
}

export const ERM_PLAN_YEAR = 2026
export const ERM_CURRENT_MONTH = 6 // illustrative "today" = June

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const ERM_ACTIVITIES: ErmActivity[] = [
  { id: 'ERM-01', name: 'Annual risk register refresh', owner: 'ERM Head', plannedMonth: 1, plannedEndMonth: 1, actualMonth: 1, status: 'completed' },
  { id: 'ERM-02', name: 'Group risk appetite review (ARC)', owner: 'ARC Chair', plannedMonth: 2, plannedEndMonth: 2, actualMonth: 3, status: 'completed-late' },
  { id: 'ERM-03', name: 'Q1 ARC board pack', owner: 'Risk Head', plannedMonth: 3, plannedEndMonth: 3, actualMonth: 3, status: 'completed' },
  { id: 'ERM-04', name: 'KRI threshold recalibration', owner: 'ERM Head', plannedMonth: 4, plannedEndMonth: 4, actualMonth: 4, status: 'completed' },
  { id: 'ERM-05', name: 'ICOFR control testing — cycle 1', owner: 'Controls Lead', plannedMonth: 4, plannedEndMonth: 5, actualMonth: 5, status: 'completed-late' },
  { id: 'ERM-06', name: 'Enterprise scenario stress test', owner: 'Risk Head', plannedMonth: 5, plannedEndMonth: 5, actualMonth: 5, status: 'completed' },
  { id: 'ERM-07', name: 'Emerging-risk horizon scan', owner: 'ERM Head', plannedMonth: 5, plannedEndMonth: 5, actualMonth: null, status: 'overdue' },
  { id: 'ERM-08', name: 'Q2 ARC board pack', owner: 'Risk Head', plannedMonth: 6, plannedEndMonth: 6, actualMonth: null, status: 'in-progress' },
  { id: 'ERM-09', name: 'BCM / DR test', owner: 'BCM Coordinator', plannedMonth: 7, plannedEndMonth: 7, actualMonth: null, status: 'planned' },
  { id: 'ERM-10', name: 'Policy & procedure review', owner: 'ERM Head', plannedMonth: 8, plannedEndMonth: 8, actualMonth: null, status: 'planned' },
  { id: 'ERM-11', name: 'Half-year risk register refresh', owner: 'Risk Champions', plannedMonth: 9, plannedEndMonth: 9, actualMonth: null, status: 'planned' },
  { id: 'ERM-12', name: 'ICOFR control testing — cycle 2', owner: 'Controls Lead', plannedMonth: 9, plannedEndMonth: 10, actualMonth: null, status: 'planned' },
  { id: 'ERM-13', name: 'Q3 ARC board pack', owner: 'Risk Head', plannedMonth: 9, plannedEndMonth: 9, actualMonth: null, status: 'planned' },
  { id: 'ERM-14', name: 'Annual ERM framework review', owner: 'ARC Chair', plannedMonth: 11, plannedEndMonth: 11, actualMonth: null, status: 'planned' },
  { id: 'ERM-15', name: 'Q4 ARC pack + annual board report', owner: 'Risk Head', plannedMonth: 12, plannedEndMonth: 12, actualMonth: null, status: 'planned' },
]

export const ERM_STATUS_META: Record<ErmStatus, { label: string; color: string }> = {
  completed: { label: 'Completed on time', color: '#067647' },
  'completed-late': { label: 'Completed late', color: '#B54708' },
  'in-progress': { label: 'In progress', color: '#1D4ED8' },
  overdue: { label: 'Overdue', color: '#B42318' },
  planned: { label: 'Planned', color: '#9A9A95' },
}

export function ermPlanSummary() {
  const completed = ERM_ACTIVITIES.filter((a) => a.status === 'completed' || a.status === 'completed-late').length
  const late = ERM_ACTIVITIES.filter((a) => a.status === 'completed-late').length
  const overdue = ERM_ACTIVITIES.filter((a) => a.status === 'overdue').length
  const inProgress = ERM_ACTIVITIES.filter((a) => a.status === 'in-progress').length
  const planned = ERM_ACTIVITIES.filter((a) => a.status === 'planned').length
  return { total: ERM_ACTIVITIES.length, completed, late, overdue, inProgress, planned }
}
