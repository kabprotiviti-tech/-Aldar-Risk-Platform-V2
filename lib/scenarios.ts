// lib/scenarios.ts
// Quick-fire scenario engine for live state mutation + propagation analysis

import type { Portfolio } from './simulated-data'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScenarioDelta {
  hospitality?: {
    occupancyRate?: number   // absolute delta (e.g. -18 means 68 → 50%)
    revPARChange?: number    // absolute delta on RevPAR MoM %
  }
  retail?: {
    footfallChange?: number  // absolute delta on YoY %
    stressedTenants?: number // absolute delta
    tenantStress?: 'low' | 'medium' | 'high'
  }
  realEstate?: {
    offPlanSales?: number    // absolute delta on MTD units
    collectionRate?: number  // absolute delta on %
    handoverDelays?: number  // absolute delta on units
  }
  projects?: {
    delayedProjects?: number
    costVariancePercent?: number
  }
  riskRegister?: {
    criticalRisks?: number
    highRisks?: number
    mediumRisks?: number
    activeRisks?: number
  }
  finance?: {
    cashFlowVariance?: number  // absolute delta on %
    debtServiceCoverage?: number
    gearingRatio?: number
  }
}

export interface PropagationStep {
  trigger: string
  effect: string
  portfolio: Portfolio | 'cross-portfolio'
  severity: 'critical' | 'high' | 'medium'
}

export interface QuickScenario {
  id: 'tourism_drop' | 'interest_rate_hike' | 'tenant_default_spike'
  name: string
  tagline: string
  affectedBusiness: string[]
  affectedPortfolios: Portfolio[]
  impactLevel: 'critical' | 'high' | 'medium'
  description: string
  color: string
  propagationSteps: PropagationStep[]
  deltas: ScenarioDelta
  totalImpactAED: number     // AED M estimated headline impact
  impactPct: number          // % of total revenue
}

// ─── Scenario Definitions ─────────────────────────────────────────────────────

export const QUICK_SCENARIOS: Record<QuickScenario['id'], QuickScenario> = {

  tourism_drop: {
    id: 'tourism_drop',
    name: 'Tourism Drop',
    tagline: 'Geopolitical escalation compounds current shoulder-season weakness — arrivals -30%',
    affectedBusiness: ['Hospitality', 'Retail', 'Real Estate', 'Facilities'],
    affectedPortfolios: ['hospitality', 'retail', 'real-estate', 'facilities'],
    impactLevel: 'critical',
    description:
      'Geopolitical risk escalates from MEDIUM to HIGH, amplifying the existing shoulder-season tourism deficit. ' +
      'Starting from current baseline (tourism index 61, occupancy 68%, no events until Nov), a -30% arrivals shock pushes ' +
      'effective tourism index to ~29/100 and hotel occupancy to ~50%. Retail footfall collapses downstream. ' +
      'Signal path: geopolitical HIGH → tourism_index 61→31 → flight_capacity reduced → occupancy 68%→50% → ' +
      'RevPAR AED 420→AED 294 → retail footfall index 67→47 → tenant_stress HIGH → retail risk critical.',
    color: '#A855F7',
    totalImpactAED: 485,
    impactPct: 5.0,
    propagationSteps: [
      {
        trigger: 'Geopolitical risk escalates MEDIUM → HIGH',
        effect: 'Tourism index 61 → 31 (−30pts after seasonal & event adjustments)',
        portfolio: 'hospitality',
        severity: 'critical',
      },
      {
        trigger: 'Flight capacity reduced — route disruptions activated',
        effect: 'Hotel occupancy 68% → 50% (−18pts). RevPAR AED 420 → AED 294 (−30%)',
        portfolio: 'hospitality',
        severity: 'critical',
      },
      {
        trigger: 'Occupancy below 50% threshold — hospitality risk critical',
        effect: 'Retail footfall index 67 → 47 — Yas Island catchment tourist spend collapses',
        portfolio: 'retail',
        severity: 'high',
      },
      {
        trigger: 'Footfall 47/100 triggers tenant covenant stress',
        effect: 'Tenant stress: MEDIUM → HIGH. 12+ tenants enter covenant review. Anchor tenant non-renewal accelerated.',
        portfolio: 'retail',
        severity: 'high',
      },
      {
        trigger: 'HNI investor sentiment drops on geopolitical signal',
        effect: 'Off-plan sales −25%, construction supply chain disruption (+6% cost variance)',
        portfolio: 'real-estate',
        severity: 'high',
      },
    ],
    deltas: {
      hospitality: {
        occupancyRate: -18,
        revPARChange: -30,
      },
      retail: {
        footfallChange: -20,
        stressedTenants: 8,
        tenantStress: 'high',
      },
      realEstate: {
        offPlanSales: -50,
        collectionRate: -6,
        handoverDelays: 8,
      },
      finance: {
        cashFlowVariance: -4.2,
        debtServiceCoverage: -0.3,
      },
      riskRegister: {
        criticalRisks: 2,
        highRisks: 3,
        activeRisks: 5,
      },
    },
  },

  interest_rate_hike: {
    id: 'interest_rate_hike',
    name: 'Interest Rate Hike',
    tagline: 'CBUAE benchmark +150bps — mortgage affordability squeeze',
    affectedBusiness: ['Real Estate', 'Finance', 'Retail'],
    affectedPortfolios: ['real-estate', 'retail'],
    impactLevel: 'high',
    description:
      'The UAE Central Bank raises the benchmark rate by 150bps in response to Fed tightening. Mortgage affordability deteriorates for expat first-time buyers, off-plan conversion rates decline, and buyer decision cycles lengthen significantly.',
    color: '#FF6B6B',
    totalImpactAED: 285,
    impactPct: 2.9,
    propagationSteps: [
      {
        trigger: 'CBUAE rate +150bps',
        effect: 'Mortgage monthly payment rises ~12%',
        portfolio: 'real-estate',
        severity: 'high',
      },
      {
        trigger: 'Buyer affordability squeeze',
        effect: 'Off-plan sales conversion -30% — 200 → 142 units MTD',
        portfolio: 'real-estate',
        severity: 'high',
      },
      {
        trigger: 'Off-plan collection slows',
        effect: 'Cash flow variance widens to -7.7% vs budget',
        portfolio: 'real-estate',
        severity: 'high',
      },
      {
        trigger: 'Consumer confidence falls',
        effect: 'Retail discretionary spend contracts -4%',
        portfolio: 'retail',
        severity: 'medium',
      },
    ],
    deltas: {
      realEstate: {
        offPlanSales: -45,
        collectionRate: -5.2,
        handoverDelays: 8,
      },
      retail: {
        footfallChange: -4,
        stressedTenants: 3,
      },
      finance: {
        cashFlowVariance: -3.5,
        debtServiceCoverage: -0.3,
      },
      riskRegister: {
        criticalRisks: 1,
        highRisks: 2,
        mediumRisks: 2,
        activeRisks: 5,
      },
    },
  },

  tenant_default_spike: {
    id: 'tenant_default_spike',
    name: 'Tenant Default Spike',
    tagline: 'Retail CVA wave — 15 tenants unable to meet Q2 obligations',
    affectedBusiness: ['Retail', 'Facilities', 'Finance'],
    affectedPortfolios: ['retail', 'facilities'],
    impactLevel: 'critical',
    description:
      'An economic downturn triggers a CVA wave across UAE retail — 15 Aldar tenants fail to meet Q2 rent obligations. Yas Mall and Al Jimi Mall face accelerated vacancy risk with AED 42M annual rent in arrears.',
    color: '#F97316',
    totalImpactAED: 198,
    impactPct: 2.0,
    propagationSteps: [
      {
        trigger: 'Economic downturn — retail sector',
        effect: '15 tenants in CVA or payment default',
        portfolio: 'retail',
        severity: 'critical',
      },
      {
        trigger: 'AED 42M rent in arrears',
        effect: 'Retail cash flow shortfall — FM contracts at risk',
        portfolio: 'facilities',
        severity: 'high',
      },
      {
        trigger: 'Vacancy risk accelerates',
        effect: 'Lease-up costs + incentives required for replacement',
        portfolio: 'retail',
        severity: 'high',
      },
      {
        trigger: 'Covenant breach triggers',
        effect: 'Bank LTV covenants on retail assets require review',
        portfolio: 'retail',
        severity: 'critical',
      },
    ],
    deltas: {
      retail: {
        footfallChange: -8,
        stressedTenants: 12,
        tenantStress: 'high',
      },
      finance: {
        cashFlowVariance: -5.8,
        gearingRatio: 2.4,
      },
      riskRegister: {
        criticalRisks: 2,
        highRisks: 3,
        mediumRisks: 1,
        activeRisks: 6,
      },
    },
  },
}

export const QUICK_SCENARIO_LIST = Object.values(QUICK_SCENARIOS)
