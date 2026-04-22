// Seed data for the simulation engine.
// This is the single source of truth for drivers, risks, and actions.

import type { RiskDef, Driver } from './types'

export const FINANCIAL_ANCHORS = {
  portfolioRevenueAedMn: 11000,
  activeProjectGdvAedMn: 28000,
  recurringRentalNoiAedMn: 1800,
  hospitalityRevenueAedMn: 1400,
  annualCapexAedMn: 6500,
  annualOffPlanSalesAedMn: 7500,
} as const

export const SCALE_CONSTANT = 10
export const SENSITIVITY_FACTOR = { low: 0.5, medium: 1.0, high: 1.5 } as const

export const INITIAL_DRIVERS: Driver[] = [
  { id: 'DRV-01', name: 'Construction Cost',     unit: '%',    baseValue: 100, adjustedValue: 100, sliderMin: 0,   sliderMax: 50, deltaPct: 0 },
  { id: 'DRV-02', name: 'Sales Volume',          unit: '%',    baseValue: 100, adjustedValue: 100, sliderMin: -60, sliderMax: 0,  deltaPct: 0 },
  { id: 'DRV-03', name: 'Lease Rate',            unit: '%',    baseValue: 100, adjustedValue: 100, sliderMin: -40, sliderMax: 0,  deltaPct: 0 },
  { id: 'DRV-04', name: 'Occupancy Rate',        unit: '%',    baseValue: 100, adjustedValue: 100, sliderMin: -50, sliderMax: 0,  deltaPct: 0 },
  { id: 'DRV-05', name: 'Project Delay',         unit: 'days', baseValue: 0,   adjustedValue: 0,   sliderMin: 0,   sliderMax: 90, deltaPct: 0 },
  { id: 'DRV-06', name: 'Contractor Performance',unit: '%',    baseValue: 100, adjustedValue: 100, sliderMin: -30, sliderMax: 0,  deltaPct: 0 },
  { id: 'DRV-07', name: 'Liquidity',             unit: '%',    baseValue: 100, adjustedValue: 100, sliderMin: -45, sliderMax: 0,  deltaPct: 0 },
  { id: 'DRV-08', name: 'Supply Chain Stability',unit: '%',    baseValue: 100, adjustedValue: 100, sliderMin: -45, sliderMax: 0,  deltaPct: 0 },
  // ── KRI-based drivers (client-derived) ──────────────────────────────────────
  { id: 'DRV-09', name: 'Residential Occupancy',   unit: '%',   baseValue: 100, adjustedValue: 100, sliderMin: -50, sliderMax: 10, deltaPct: 0 },
  { id: 'DRV-10', name: 'Commercial Occupancy',    unit: '%',   baseValue: 100, adjustedValue: 100, sliderMin: -50, sliderMax: 10, deltaPct: 0 },
  { id: 'DRV-11', name: 'Project Delay KRI',       unit: 'idx', baseValue: 100, adjustedValue: 100, sliderMin: 0,   sliderMax: 120,deltaPct: 0 },
  { id: 'DRV-12', name: 'Handover Delay',          unit: '%',   baseValue: 100, adjustedValue: 100, sliderMin: 0,   sliderMax: 100,deltaPct: 0 },
  { id: 'DRV-13', name: 'Domestic Default Rate',   unit: 'idx', baseValue: 100, adjustedValue: 100, sliderMin: 0,   sliderMax: 200,deltaPct: 0 },
  { id: 'DRV-14', name: 'Residential Price Index', unit: 'idx', baseValue: 100, adjustedValue: 100, sliderMin: -60, sliderMax: 20, deltaPct: 0 },
  { id: 'DRV-15', name: 'Commercial Rent Index',   unit: 'idx', baseValue: 100, adjustedValue: 100, sliderMin: -50, sliderMax: 20, deltaPct: 0 },
  { id: 'DRV-16', name: 'International Default Rate', unit: 'idx', baseValue: 100, adjustedValue: 100, sliderMin: 0,  sliderMax: 200,deltaPct: 0 },
]

export const RISKS: RiskDef[] = [
  {
    id: 'R-001',
    name: 'Construction Cost Overrun',
    category: 'Project/Construction',
    cause: 'Commodity volatility + scope variations',
    event: 'Actual cost exceeds sanctioned budget beyond contingency',
    impact: 'Margin erosion, delayed handover, reforecast to ARC',
    baseLikelihood: 4, baseImpact: 4,
    driverImpacts: [
      { driverId: 'DRV-01', weight: 0.90, sensitivity: 'high' },
      { driverId: 'DRV-08', weight: -0.55, sensitivity: 'medium' },
      { driverId: 'DRV-06', weight: -0.35, sensitivity: 'medium' },
      { driverId: 'DRV-05', weight: 0.40, sensitivity: 'medium' },
      // KRI additions
      { driverId: 'DRV-11', weight: 0.35, sensitivity: 'medium' },
    ],
    controls: [
      { name: 'GMP contracts', type: 'Preventive', effectiveness: 0.65 },
      { name: 'Monthly cost-to-complete review', type: 'Detective', effectiveness: 0.55 },
      { name: 'Commodity hedging', type: 'Preventive', effectiveness: 0.45 },
    ],
    owner: 'Chief Development Officer',
    financialBaseAedMn: FINANCIAL_ANCHORS.activeProjectGdvAedMn,
    sensitivityCoefficient: 0.04,
    financialWeight: 0.18,
  },
  {
    id: 'R-002',
    name: 'Project Delivery Delay',
    category: 'Project/Construction',
    cause: 'Contractor underperformance + permitting delays',
    event: 'Handover milestone slips beyond contractual date',
    impact: 'DLD penalties, buyer refunds, revenue deferral',
    baseLikelihood: 4, baseImpact: 4,
    driverImpacts: [
      { driverId: 'DRV-05', weight: 0.95, sensitivity: 'high' },
      { driverId: 'DRV-06', weight: -0.70, sensitivity: 'high' },
      { driverId: 'DRV-08', weight: -0.45, sensitivity: 'medium' },
      { driverId: 'DRV-01', weight: 0.25, sensitivity: 'low' },
      // KRI additions
      { driverId: 'DRV-11', weight: 0.70, sensitivity: 'high' },
      { driverId: 'DRV-12', weight: 0.60, sensitivity: 'high' },
    ],
    controls: [
      { name: 'Primavera milestone tracking', type: 'Detective', effectiveness: 0.60 },
      { name: 'LD clauses + performance bonds', type: 'Corrective', effectiveness: 0.50 },
      { name: 'Dual-sourced critical trades', type: 'Preventive', effectiveness: 0.40 },
    ],
    owner: 'Head of Project Delivery',
    financialBaseAedMn: FINANCIAL_ANCHORS.activeProjectGdvAedMn,
    sensitivityCoefficient: 0.03,
    financialWeight: 0.15,
  },
  {
    id: 'R-003',
    name: 'Off-Plan Sales Slowdown',
    category: 'Market/Sales',
    cause: 'Interest rate pressure + global sentiment',
    event: 'Weekly sales velocity falls below underwriting assumption',
    impact: 'Cashflow slippage, marketing overrun, launch deferral',
    baseLikelihood: 3, baseImpact: 4,
    driverImpacts: [
      { driverId: 'DRV-02', weight: -0.95, sensitivity: 'high' },
      { driverId: 'DRV-07', weight: -0.40, sensitivity: 'medium' },
      { driverId: 'DRV-03', weight: -0.25, sensitivity: 'low' },
      // KRI additions
      { driverId: 'DRV-13', weight: 0.55, sensitivity: 'high' },  // domestic defaults up = bad
      { driverId: 'DRV-16', weight: 0.70, sensitivity: 'high' },  // international defaults up = worse (larger share)
      { driverId: 'DRV-14', weight: -0.80, sensitivity: 'high' }, // down = bad
      { driverId: 'DRV-12', weight: 0.30, sensitivity: 'medium' },
    ],
    controls: [
      { name: 'Dynamic pricing committee', type: 'Directive', effectiveness: 0.55 },
      { name: 'Broker incentive scaling', type: 'Corrective', effectiveness: 0.45 },
      { name: 'Diversified distribution', type: 'Preventive', effectiveness: 0.50 },
    ],
    owner: 'Chief Commercial Officer',
    financialBaseAedMn: FINANCIAL_ANCHORS.annualOffPlanSalesAedMn,
    sensitivityCoefficient: 0.15,
    financialWeight: 0.14,
  },
  {
    id: 'R-004',
    name: 'Lease Revenue Decline',
    category: 'Market/Sales',
    cause: 'Tenant consolidation + rental benchmark softening',
    event: 'Renewal rents re-base below budget',
    impact: 'Recurring EBITDA compression, asset valuation decline',
    baseLikelihood: 3, baseImpact: 4,
    driverImpacts: [
      { driverId: 'DRV-03', weight: -0.85, sensitivity: 'high' },
      { driverId: 'DRV-04', weight: -0.75, sensitivity: 'high' },
      { driverId: 'DRV-02', weight: -0.20, sensitivity: 'low' },
      // KRI additions
      { driverId: 'DRV-10', weight: -0.80, sensitivity: 'high' }, // commercial occupancy down
      { driverId: 'DRV-15', weight: -0.85, sensitivity: 'high' }, // commercial rent index down
      { driverId: 'DRV-09', weight: -0.30, sensitivity: 'medium' },
    ],
    controls: [
      { name: 'Anchor tenant retention', type: 'Preventive', effectiveness: 0.60 },
      { name: 'Turnover-rent clauses', type: 'Preventive', effectiveness: 0.40 },
      { name: 'Asset upgrades', type: 'Directive', effectiveness: 0.45 },
    ],
    owner: 'Head of Asset Management',
    financialBaseAedMn: FINANCIAL_ANCHORS.recurringRentalNoiAedMn,
    sensitivityCoefficient: 0.20,
    financialWeight: 0.12,
  },
  {
    id: 'R-005',
    name: 'Occupancy Decline — Hospitality & Residential',
    category: 'Market/Sales',
    cause: 'Tourism seasonality + new supply + expat outflow',
    event: 'Occupancy drops below budget on hotels and residential',
    impact: 'RevPAR/ADR compression, loss-making asset P&L',
    baseLikelihood: 3, baseImpact: 3,
    driverImpacts: [
      { driverId: 'DRV-04', weight: -0.90, sensitivity: 'high' },
      { driverId: 'DRV-03', weight: -0.40, sensitivity: 'medium' },
      // KRI additions
      { driverId: 'DRV-09', weight: -0.75, sensitivity: 'high' },
      { driverId: 'DRV-10', weight: -0.55, sensitivity: 'medium' },
      { driverId: 'DRV-15', weight: -0.35, sensitivity: 'medium' },
    ],
    controls: [
      { name: 'Direct booking / loyalty', type: 'Preventive', effectiveness: 0.50 },
      { name: 'MICE + entertainment bundling', type: 'Directive', effectiveness: 0.55 },
    ],
    owner: 'Head of Hospitality',
    financialBaseAedMn: FINANCIAL_ANCHORS.hospitalityRevenueAedMn,
    sensitivityCoefficient: 0.25,
    financialWeight: 0.08,
  },
  {
    id: 'R-006',
    name: 'Contractor Default / Underperformance',
    category: 'Operational',
    cause: 'Contractor liquidity stress or quality failures',
    event: 'Contractor misses milestones or delivers defective work',
    impact: 'Re-tender, cost escalation, programme delay',
    baseLikelihood: 3, baseImpact: 4,
    driverImpacts: [
      { driverId: 'DRV-06', weight: -0.90, sensitivity: 'high' },
      { driverId: 'DRV-05', weight: 0.50, sensitivity: 'medium' },
      { driverId: 'DRV-01', weight: 0.30, sensitivity: 'low' },
    ],
    controls: [
      { name: 'Financial pre-qualification', type: 'Preventive', effectiveness: 0.60 },
      { name: 'Performance bonds', type: 'Corrective', effectiveness: 0.55 },
      { name: 'Perf. index monitoring', type: 'Detective', effectiveness: 0.50 },
    ],
    owner: 'Head of Procurement',
    financialBaseAedMn: FINANCIAL_ANCHORS.activeProjectGdvAedMn,
    sensitivityCoefficient: 0.025,
    financialWeight: 0.09,
  },
  {
    id: 'R-007',
    name: 'Supply Chain Disruption',
    category: 'External/Geopolitical',
    cause: 'Shipping disruption + export bans + port congestion',
    event: 'Lead times for MEP / façade exceed programme buffer',
    impact: 'Schedule slip, expedited freight premium',
    baseLikelihood: 4, baseImpact: 3,
    driverImpacts: [
      { driverId: 'DRV-08', weight: -0.95, sensitivity: 'high' },
      { driverId: 'DRV-01', weight: 0.50, sensitivity: 'medium' },
      { driverId: 'DRV-05', weight: 0.55, sensitivity: 'medium' },
    ],
    controls: [
      { name: 'Dual-sourcing', type: 'Preventive', effectiveness: 0.55 },
      { name: 'Strategic stockholding', type: 'Preventive', effectiveness: 0.45 },
      { name: 'Control tower dashboard', type: 'Detective', effectiveness: 0.50 },
    ],
    owner: 'Chief Procurement Officer',
    financialBaseAedMn: FINANCIAL_ANCHORS.annualCapexAedMn,
    sensitivityCoefficient: 0.05,
    financialWeight: 0.07,
  },
  {
    id: 'R-008',
    name: 'Cash Flow / Liquidity Stress',
    category: 'Financial',
    cause: 'Collection slippage + capex front-loading + rate exposure',
    event: 'Operating cash + facilities < 90-day obligations',
    impact: 'Forced refinance, dividend risk, construction pause',
    baseLikelihood: 2, baseImpact: 5,
    driverImpacts: [
      { driverId: 'DRV-07', weight: -0.95, sensitivity: 'high' },
      { driverId: 'DRV-02', weight: -0.65, sensitivity: 'high' },
      { driverId: 'DRV-04', weight: -0.40, sensitivity: 'medium' },
      { driverId: 'DRV-03', weight: -0.30, sensitivity: 'low' },
      // KRI additions
      { driverId: 'DRV-13', weight: 0.45, sensitivity: 'high' },  // domestic defaults up = liquidity hit
      { driverId: 'DRV-16', weight: 0.55, sensitivity: 'high' },  // international defaults up = larger liquidity hit
      { driverId: 'DRV-14', weight: -0.45, sensitivity: 'medium' },
      { driverId: 'DRV-09', weight: -0.35, sensitivity: 'medium' },
    ],
    controls: [
      { name: '13-week rolling cashflow', type: 'Detective', effectiveness: 0.70 },
      { name: 'RCF + sukuk programme', type: 'Preventive', effectiveness: 0.75 },
      { name: 'Escrow billing (RERA)', type: 'Preventive', effectiveness: 0.60 },
    ],
    owner: 'Group CFO',
    financialBaseAedMn: FINANCIAL_ANCHORS.portfolioRevenueAedMn,
    sensitivityCoefficient: 0.08,
    financialWeight: 0.10,
  },
  {
    id: 'R-009',
    name: 'Regulatory Change — RERA / ESG',
    category: 'External/Geopolitical',
    cause: 'UAE federal + emirate rule changes',
    event: 'New compliance requirement impacts financing or reporting',
    impact: 'Remediation cost, disclosure restatement, delayed launches',
    baseLikelihood: 3, baseImpact: 3,
    driverImpacts: [
      { driverId: 'DRV-05', weight: 0.30, sensitivity: 'low' },
      { driverId: 'DRV-07', weight: -0.25, sensitivity: 'low' },
    ],
    controls: [
      { name: 'Regulatory horizon-scanning', type: 'Detective', effectiveness: 0.65 },
      { name: 'ESG disclosure automation', type: 'Preventive', effectiveness: 0.55 },
    ],
    owner: 'General Counsel',
    financialBaseAedMn: FINANCIAL_ANCHORS.portfolioRevenueAedMn,
    sensitivityCoefficient: 0.015,
    financialWeight: 0.03,
  },
  {
    id: 'R-010',
    name: 'HSE / Safety Incident',
    category: 'Operational',
    cause: 'Contractor safety culture gaps + heat stress',
    event: 'Major HSE incident on active site',
    impact: 'Stop-work, litigation, reputational harm, insurance re-rating',
    baseLikelihood: 2, baseImpact: 5,
    driverImpacts: [
      { driverId: 'DRV-06', weight: -0.80, sensitivity: 'high' },
      { driverId: 'DRV-05', weight: 0.30, sensitivity: 'low' },
    ],
    controls: [
      { name: 'Zero-harm safety programme', type: 'Directive', effectiveness: 0.70 },
      { name: 'Permit-to-work system', type: 'Preventive', effectiveness: 0.65 },
      { name: 'Monthly HSE audits', type: 'Detective', effectiveness: 0.60 },
    ],
    owner: 'Head of HSE',
    financialBaseAedMn: FINANCIAL_ANCHORS.activeProjectGdvAedMn,
    sensitivityCoefficient: 0.02,
    financialWeight: 0.04,
  },
]

// Action library — linked to drivers for impact simulation
export interface ActionDef {
  id: string
  name: string
  description: string
  appliesTo: string[]
  expectedReductionPct: number
  implementationTime: string
  effort: 'Low' | 'Medium' | 'High'
  horizon: 'immediate' | 'short' | 'strategic'
  ownerRole: string
  driverDeltas: Array<{ driverId: string; deltaPct: number }>
}

export const ACTIONS: ActionDef[] = [
  { id: 'ACT-001', name: 'Renegotiate contractor terms', description: 'Convert fixed-price to target-cost with 50/50 pain-share', appliesTo: ['R-001','R-002','R-006'], expectedReductionPct: 18, implementationTime: '2-4 weeks', effort: 'Medium', horizon: 'short', ownerRole: 'CDO', driverDeltas: [{ driverId:'DRV-01', deltaPct:-5 },{ driverId:'DRV-06', deltaPct:8 }] },
  { id: 'ACT-002', name: 'Accelerate commodity hedge coverage', description: 'Lock forward prices on steel/cement at 60% of FY demand', appliesTo: ['R-001','R-007'], expectedReductionPct: 22, implementationTime: '1-2 weeks', effort: 'Low', horizon: 'immediate', ownerRole: 'CFO', driverDeltas: [{ driverId:'DRV-01', deltaPct:-10 }] },
  { id: 'ACT-003', name: 'Diversify suppliers', description: 'Onboard 2 regional MEP/façade vendors; split volume 60/25/15', appliesTo: ['R-007','R-002'], expectedReductionPct: 15, implementationTime: '4-8 weeks', effort: 'Medium', horizon: 'strategic', ownerRole: 'CPO', driverDeltas: [{ driverId:'DRV-08', deltaPct:12 }] },
  { id: 'ACT-004', name: 'Accelerate collections on top buyers', description: 'Early-payment discount 1.5%; dedicated collections team', appliesTo: ['R-003','R-008'], expectedReductionPct: 14, implementationTime: '1-3 weeks', effort: 'Low', horizon: 'immediate', ownerRole: 'CFO', driverDeltas: [{ driverId:'DRV-07', deltaPct:8 }] },
  { id: 'ACT-005', name: 'Adjust pricing strategy', description: '5% tiered discount on slow-moving units + broker uplift 50bps', appliesTo: ['R-003','R-004'], expectedReductionPct: 12, implementationTime: '1 week', effort: 'Low', horizon: 'immediate', ownerRole: 'CCO', driverDeltas: [{ driverId:'DRV-02', deltaPct:10 }] },
  { id: 'ACT-006', name: 'Defer non-critical capex', description: 'Re-phase AED 400-600 mn of discretionary capex', appliesTo: ['R-008'], expectedReductionPct: 20, implementationTime: '2-3 weeks', effort: 'Medium', horizon: 'short', ownerRole: 'CFO', driverDeltas: [{ driverId:'DRV-07', deltaPct:15 }] },
  { id: 'ACT-007', name: 'Anchor tenant retention', description: 'Early renewal with top 10 anchors at 3% uplift', appliesTo: ['R-004','R-005'], expectedReductionPct: 16, implementationTime: '3-6 weeks', effort: 'Medium', horizon: 'strategic', ownerRole: 'Head of Asset Mgmt', driverDeltas: [{ driverId:'DRV-03', deltaPct:6 },{ driverId:'DRV-04', deltaPct:4 }] },
  { id: 'ACT-008', name: 'Enforce LD + performance bond call', description: 'Formal notice + call 10% bond + parallel tender', appliesTo: ['R-002','R-006'], expectedReductionPct: 10, implementationTime: '1-2 weeks', effort: 'High', horizon: 'short', ownerRole: 'CDO', driverDeltas: [{ driverId:'DRV-05', deltaPct:-10 },{ driverId:'DRV-06', deltaPct:12 }] },
  { id: 'ACT-009', name: 'Hospitality yield-management', description: 'Dynamic pricing + MICE bundling across 14 hotels', appliesTo: ['R-005'], expectedReductionPct: 13, implementationTime: '2 weeks', effort: 'Low', horizon: 'short', ownerRole: 'Head of Hospitality', driverDeltas: [{ driverId:'DRV-04', deltaPct:5 },{ driverId:'DRV-03', deltaPct:3 }] },
  { id: 'ACT-010', name: 'Site-wide HSE stand-down', description: '48-hr safety reset + re-certify permits', appliesTo: ['R-010'], expectedReductionPct: 25, implementationTime: '1 week', effort: 'Medium', horizon: 'immediate', ownerRole: 'Head of HSE', driverDeltas: [{ driverId:'DRV-06', deltaPct:8 }] },
  { id: 'ACT-011', name: 'Heat-stress + high-risk work protocol', description: 'Mandatory rest cycles Jun-Sep; mandatory 2-person rule for confined/high-rise work', appliesTo: ['R-010'], expectedReductionPct: 15, implementationTime: '2 weeks', effort: 'Low', horizon: 'short', ownerRole: 'Head of HSE', driverDeltas: [{ driverId:'DRV-06', deltaPct:5 }] },
  { id: 'ACT-012', name: 'Contractor HSE pre-qualification tightening', description: 'Reject contractors with LTIFR > 2.5; quarterly re-assessment of top-10 contractors', appliesTo: ['R-010', 'R-006'], expectedReductionPct: 12, implementationTime: '3-4 weeks', effort: 'Medium', horizon: 'strategic', ownerRole: 'CPO', driverDeltas: [{ driverId:'DRV-06', deltaPct:6 }] },
  { id: 'ACT-013', name: 'Regulatory horizon-scan war-room', description: 'Weekly cross-functional review of RERA/ESG/ADX changes; 30-day compliance burn-down', appliesTo: ['R-009'], expectedReductionPct: 20, implementationTime: '1-2 weeks', effort: 'Low', horizon: 'immediate', ownerRole: 'General Counsel', driverDeltas: [{ driverId:'DRV-05', deltaPct:-3 }] },
  { id: 'ACT-014', name: 'ESG disclosure automation + ADX/GRI mapping', description: 'Automate TCFD/ESG reporting pipeline to cut restatement risk and audit cost', appliesTo: ['R-009'], expectedReductionPct: 18, implementationTime: '6-8 weeks', effort: 'Medium', horizon: 'strategic', ownerRole: 'CFO', driverDeltas: [{ driverId:'DRV-07', deltaPct:2 }] },
  { id: 'ACT-015', name: 'Pre-emptive regulatory engagement', description: 'Structured dialogue with DLD/RERA/MoEI on upcoming rule changes; position papers on industry impact', appliesTo: ['R-009'], expectedReductionPct: 10, implementationTime: '4-6 weeks', effort: 'Medium', horizon: 'strategic', ownerRole: 'General Counsel', driverDeltas: [{ driverId:'DRV-05', deltaPct:-2 }] },
]
