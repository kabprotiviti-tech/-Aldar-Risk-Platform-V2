// ─── Aldar Internal Signals — Simulated ERP / CRM / Project Data ─────────────
// In production: integrated with Oracle Fusion ERP, Salesforce CRM,
// Primavera P6 project management, and Aldar risk register systems.

export interface InternalSignal {
  id: string
  system: 'ERP' | 'CRM' | 'Projects' | 'Risk Register' | 'Finance'
  category: string
  label: string
  value: string | number
  unit?: string
  trend: 'improving' | 'stable' | 'declining' | 'alert'
  severity: 'low' | 'medium' | 'high' | 'critical'
  detail: string
  portfolio: 'real-estate' | 'retail' | 'hospitality' | 'education' | 'facilities' | 'cross-portfolio'
  lastUpdated: string
}

export interface InternalDataSnapshot {
  hospitality: {
    occupancyRate: number
    occupancyTrend: 'improving' | 'stable' | 'declining'
    revPAR: number        // Revenue per Available Room (AED)
    revPARChange: number  // % change MoM
    riskFlag: boolean
    flagReason: string
  }
  retail: {
    occupancyRate: number
    tenantStress: 'low' | 'medium' | 'high'
    footfallTrend: 'improving' | 'stable' | 'declining'
    footfallChange: number  // % change YoY
    vacancyRate: number
    stressedTenants: number
  }
  realEstate: {
    offPlanSales: number     // units sold MTD
    offPlanTarget: number
    collectionRate: number   // % of receivables collected
    handoverDelays: number   // units delayed
  }
  projects: {
    delays: boolean
    delayedProjects: number
    totalActiveProjects: number
    averageDelayDays: number
    costVariancePercent: number
  }
  riskRegister: {
    activeRisks: number
    criticalRisks: number
    highRisks: number
    mediumRisks: number
    newRisksThisMonth: number
    overdueMitigations: number
  }
  finance: {
    cashFlowVariance: number  // % vs budget
    debtServiceCoverage: number
    gearingRatio: number      // %
    alertFlag: boolean
  }
}

// ─── Live snapshot (simulates what would come from ERP/CRM in production) ────
export const internalSnapshot: InternalDataSnapshot = {
  hospitality: {
    occupancyRate: 68,
    occupancyTrend: 'declining',
    revPAR: 420,
    revPARChange: -8.4,
    riskFlag: true,
    flagReason: 'Yas Island occupancy below 70% threshold for 3rd consecutive week',
  },
  retail: {
    occupancyRate: 94.2,
    tenantStress: 'medium',
    footfallTrend: 'stable',
    footfallChange: -3.1,
    vacancyRate: 5.8,
    stressedTenants: 7,
  },
  realEstate: {
    offPlanSales: 142,
    offPlanTarget: 200,
    collectionRate: 88.5,
    handoverDelays: 14,
  },
  projects: {
    delays: true,
    delayedProjects: 2,
    totalActiveProjects: 11,
    averageDelayDays: 34,
    costVariancePercent: 6.2,
  },
  riskRegister: {
    activeRisks: 12,
    criticalRisks: 1,
    highRisks: 4,
    mediumRisks: 7,
    newRisksThisMonth: 2,
    overdueMitigations: 3,
  },
  finance: {
    cashFlowVariance: -4.2,
    debtServiceCoverage: 2.8,
    gearingRatio: 28.4,
    alertFlag: false,
  },
}

// ─── Signal cards for display ─────────────────────────────────────────────────
export const internalSignals: InternalSignal[] = [
  {
    id: 'INT-001',
    system: 'ERP',
    category: 'Hospitality Performance',
    label: 'Yas Island Occupancy',
    value: 68,
    unit: '%',
    trend: 'declining',
    severity: 'high',
    detail: 'Occupancy rate at 68%, below 70% operational threshold for 3 consecutive weeks. RevPAR down 8.4% MoM.',
    portfolio: 'hospitality',
    lastUpdated: '2026-04-15T06:00:00Z',
  },
  {
    id: 'INT-002',
    system: 'CRM',
    category: 'Retail Tenant Health',
    label: 'Tenant Stress Index',
    value: 'Medium',
    trend: 'stable',
    severity: 'medium',
    detail: '7 tenants flagged for payment delays or sales underperformance. Yas Mall foot traffic down 3.1% YoY.',
    portfolio: 'retail',
    lastUpdated: '2026-04-15T06:00:00Z',
  },
  {
    id: 'INT-003',
    system: 'Projects',
    category: 'Construction Pipeline',
    label: 'Project Delays',
    value: 2,
    unit: ' projects',
    trend: 'alert',
    severity: 'high',
    detail: '2 of 11 active projects flagged: Saadiyat Phase 3 (34-day delay) and Yas Residences Block C (29-day delay). Cost variance at +6.2%.',
    portfolio: 'real-estate',
    lastUpdated: '2026-04-14T18:00:00Z',
  },
  {
    id: 'INT-004',
    system: 'Risk Register',
    category: 'Enterprise Risk',
    label: 'Active High Risks',
    value: 4,
    unit: ' high risks',
    trend: 'stable',
    severity: 'high',
    detail: '12 active risks: 1 critical, 4 high, 7 medium. 3 mitigations overdue. 2 new risks registered this month.',
    portfolio: 'cross-portfolio',
    lastUpdated: '2026-04-15T08:00:00Z',
  },
  {
    id: 'INT-005',
    system: 'Finance',
    category: 'Cash Flow',
    label: 'Cash Flow vs Budget',
    value: -4.2,
    unit: '%',
    trend: 'declining',
    severity: 'medium',
    detail: 'Cash flow 4.2% below YTD budget. Driven by slower off-plan collections (88.5% vs 95% target) and project cost overruns.',
    portfolio: 'cross-portfolio',
    lastUpdated: '2026-04-15T07:00:00Z',
  },
  {
    id: 'INT-006',
    system: 'ERP',
    category: 'Off-Plan Sales',
    label: 'Sales vs Target',
    value: 142,
    unit: ' / 200 units',
    trend: 'declining',
    severity: 'medium',
    detail: 'MTD off-plan sales at 142 vs 200-unit target (71%). Interest rate sensitivity impacting buyer conversion rates.',
    portfolio: 'real-estate',
    lastUpdated: '2026-04-15T06:00:00Z',
  },
]
