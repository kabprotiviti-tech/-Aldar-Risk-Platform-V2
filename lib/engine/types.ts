// Central types for the simulation / decision engine.
// All downstream modules import from here.

export type DriverId =
  | 'DRV-01' // Construction Cost
  | 'DRV-02' // Sales Volume
  | 'DRV-03' // Lease Rate
  | 'DRV-04' // Occupancy
  | 'DRV-05' // Project Delay (days)
  | 'DRV-06' // Contractor Performance
  | 'DRV-07' // Liquidity / Cash Flow
  | 'DRV-08' // Supply Chain
  // KRI-based drivers (additive — do not replace existing ones)
  | 'DRV-09' // Residential Occupancy %
  | 'DRV-10' // Commercial Occupancy %
  | 'DRV-11' // Project Delay KRI %
  | 'DRV-12' // Handover Delay %
  | 'DRV-13' // Sales Default Rate
  | 'DRV-14' // Residential Price Index
  | 'DRV-15' // Commercial Rent Index

export type Sensitivity = 'low' | 'medium' | 'high'
export type Rating = 'Low' | 'Medium' | 'High' | 'Critical'
export type Urgency = 'Low' | 'Medium' | 'High' | 'Critical'
export type SimulationMode = 'baseline' | 'scenario' | 'custom'

export interface Driver {
  id: DriverId
  name: string
  unit: string
  baseValue: number
  adjustedValue: number
  sliderMin: number
  sliderMax: number
  deltaPct: number // normalised (adjusted-base)/base OR custom normalisation for days/index
}

export interface DriverImpact {
  driverId: DriverId
  weight: number // -1 to +1
  sensitivity: Sensitivity
}

export interface ControlDef {
  name: string
  type: 'Preventive' | 'Detective' | 'Corrective' | 'Directive'
  effectiveness: number // 0..1
}

export interface RiskDef {
  id: string
  name: string
  category:
    | 'Strategic'
    | 'Financial'
    | 'Operational'
    | 'Project/Construction'
    | 'Market/Sales'
    | 'External/Geopolitical'
  cause: string
  event: string
  impact: string
  baseLikelihood: number // 1..5
  baseImpact: number // 1..5
  driverImpacts: DriverImpact[]
  controls: ControlDef[]
  owner: string
  financialBaseAedMn: number
  sensitivityCoefficient: number // 0..1 — portion of financial base at risk when residual=25
  financialWeight: number // portfolio aggregation weight (Σ=1)
  source?: 'seed' | 'control_assessment' | 'document' // provenance tag — defaults to seed when omitted
  linkedControlArea?: string // set when source = 'control_assessment'
  controlScore?: number // raw control score (0..1, higher = stronger control) — only for derived risks
}

export interface RiskState {
  id: string
  name: string
  category: RiskDef['category']
  baseInherent: number
  newInherent: number
  baseResidual: number
  newResidual: number
  ratingFrom: Rating
  ratingTo: Rating
  exposureAedMn: number
  baseExposureAedMn: number
  deltaExposureAedMn: number
  compositeEffectiveness: number
  contributingDrivers: Array<{
    driverId: DriverId
    driverName: string
    deltaPct: number
    weight: number
    sensitivity: Sensitivity
    contributionPoints: number
  }>
  owner: string
}

export interface PortfolioState {
  baselineExposureAedMn: number
  scenarioExposureAedMn: number
  deltaAedMn: number
  deltaPct: number
  ratingFrom: 'Stable' | 'Elevated' | 'Stressed' | 'Distressed'
  ratingTo: 'Stable' | 'Elevated' | 'Stressed' | 'Distressed'
}
