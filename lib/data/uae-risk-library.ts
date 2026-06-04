/**
 * UAE Risk Library — sector-specific risk scenarios
 * --------------------------------------------------
 * A curated library of risks ABC's peer set across the UAE listed
 * real-estate sector typically discloses or that materially affects the
 * Abu Dhabi / Dubai property cycle. Risk Champions can review and lift
 * any of these into the Risk Register as a starting draft.
 *
 * All exposure ranges and likelihood narratives are illustrative pilot-
 * pre-calibration. Pilot will replace with ABC's actual residual
 * exposure and Champion-attributed appetite.
 */

export type RiskLibraryCategory =
  | 'project_construction'
  | 'financial'
  | 'market'
  | 'regulatory'
  | 'operational'
  | 'esg'
  | 'cyber'
  | 'macro'

export interface RiskLibraryEntry {
  id: string
  name: string
  category: RiskLibraryCategory
  /** 1-2 sentence cause-event-impact narrative. */
  description: string
  /** Why this risk is material to ABC specifically. */
  aldarRelevance: string
  /** Illustrative residual exposure range (AED mn). */
  exposureRangeAedMn: [number, number]
  /** Illustrative likelihood band. */
  likelihood: 'low' | 'medium' | 'high'
  /** Linked KRI ids (where the platform monitors this). */
  linkedKRIs: string[]
  /** Linked regulator ids. */
  linkedRegulators: string[]
  /** Common controls. */
  commonControls: string[]
  /** Applicable subsidiary kinds. */
  applicableTo: ('group' | 'development' | 'investment' | 'education' | 'hospitality')[]
}

export const CATEGORY_META: Record<
  RiskLibraryCategory,
  { label: string; color: string }
> = {
  project_construction: { label: 'Project & Construction', color: '#FF6600' },
  financial: { label: 'Financial', color: '#A855F7' },
  market: { label: 'Market', color: '#2D9EFF' },
  regulatory: { label: 'Regulatory', color: '#22C55E' },
  operational: { label: 'Operational', color: '#F5C518' },
  esg: { label: 'ESG', color: '#14B8A6' },
  cyber: { label: 'Cyber & Tech', color: '#FF3B3B' },
  macro: { label: 'Macro', color: '#888888' },
}

export const RISK_LIBRARY: RiskLibraryEntry[] = [
  {
    id: 'LIB-001',
    name: 'Off-plan project handover delay',
    category: 'project_construction',
    description:
      'Construction or fit-out delays push contractual handover dates, triggering DLD penalties, deferred revenue recognition, and customer-default cascades.',
    aldarRelevance:
      'ABC Development carries a multi-billion AED off-plan pipeline; handover slip rates are tracked monthly via KRI-12. FY25 disclosed delivery records ~88% on-plan.',
    exposureRangeAedMn: [200, 600],
    likelihood: 'high',
    linkedKRIs: ['KRI-11', 'KRI-12'],
    linkedRegulators: ['REG-DLD', 'REG-ADREC'],
    commonControls: [
      'Stage-gate project review with monthly schedule freeze',
      'Contractor bond / retention',
      'Independent quantity-surveyor verification on milestones',
    ],
    applicableTo: ['development'],
  },
  {
    id: 'LIB-002',
    name: 'Buyer default cluster (overseas / expat)',
    category: 'financial',
    description:
      'Concentrated default rate uplift on overseas-resident escrow installments due to foreign-currency moves, source-country macroeconomic stress, or sanctions exposure.',
    aldarRelevance:
      'Q1 2026 disclosed 88% of UAE sales to overseas / expat buyers — KRI-16 is high-leverage. A 70% uplift would materially impair installment receivables.',
    exposureRangeAedMn: [150, 500],
    likelihood: 'medium',
    linkedKRIs: ['KRI-16'],
    linkedRegulators: ['REG-CBUAE', 'REG-DLD'],
    commonControls: [
      'KYC + source-of-funds at onboarding',
      'Sanctions-list re-screening on payment',
      'Concentration caps by buyer-country',
    ],
    applicableTo: ['development', 'group'],
  },
  {
    id: 'LIB-003',
    name: 'Residential price correction',
    category: 'market',
    description:
      'Abu Dhabi / Dubai residential price index falls materially against budget, eroding GDV on unsold inventory and unbooked revenue on staged launches.',
    aldarRelevance:
      'Tracked via KRI-14 (ADREC / Bayut benchmark). -25% / -35% / -50% mapped to Mild / Moderate / Severe in the scenario engine.',
    exposureRangeAedMn: [400, 1500],
    likelihood: 'medium',
    linkedKRIs: ['KRI-14'],
    linkedRegulators: ['REG-ADREC', 'REG-DLD'],
    commonControls: [
      'Pre-sale ratio targeting before construction commitment',
      'Phased launch strategy',
      'Land-bank revaluation policy',
    ],
    applicableTo: ['development', 'investment', 'group'],
  },
  {
    id: 'LIB-004',
    name: 'Commercial leasing softness',
    category: 'market',
    description:
      'Commercial rent index falls / lease-renewal terms compress on expiring contracts; vacancy in office and retail GLA increases above appetite.',
    aldarRelevance:
      'ABC Investment Commercial portfolio (incl. Yas Mall) carries multi-billion AED valuation. KRI-10 (commercial occupancy) and KRI-15 (rent index) track this.',
    exposureRangeAedMn: [200, 800],
    likelihood: 'medium',
    linkedKRIs: ['KRI-10', 'KRI-15'],
    linkedRegulators: ['REG-ADREC'],
    commonControls: [
      'Tenant-mix diversification',
      'Anchor-tenant retention contracts',
      'Lease-staircasing and break-clause management',
    ],
    applicableTo: ['investment'],
  },
  {
    id: 'LIB-005',
    name: 'Escrow law non-compliance',
    category: 'regulatory',
    description:
      'Mismanagement of project escrow accounts (Mollak / DLD / ADREC) results in regulator penalty, project deregistration, and customer claims.',
    aldarRelevance:
      'Off-plan portfolio fully escrow-bound. Compliance breach materially escalates to ARC. Linked to GA-CMP-01 zero-appetite statement.',
    exposureRangeAedMn: [50, 300],
    likelihood: 'low',
    linkedKRIs: [],
    linkedRegulators: ['REG-DLD', 'REG-ADREC', 'REG-RERA'],
    commonControls: [
      'Monthly escrow reconciliation',
      'Independent escrow agent audit',
      'Project-completion certificate gating',
    ],
    applicableTo: ['development', 'group'],
  },
  {
    id: 'LIB-006',
    name: 'ADX continuous-disclosure breach',
    category: 'regulatory',
    description:
      'Material information not disclosed within statutory windows or disclosed inconsistently across channels — triggers ADX / SCA penalty and reputational damage.',
    aldarRelevance:
      'ADX-listed (ABC). Quarterly results, M&A, and material contract awards must hit continuous-disclosure rules. Investor-relations workflow is the front-line control.',
    exposureRangeAedMn: [10, 100],
    likelihood: 'low',
    linkedKRIs: [],
    linkedRegulators: ['REG-ADX', 'REG-SCA'],
    commonControls: [
      'IR pre-clearance workflow',
      'Closed-period black-out enforcement',
      'Disclosure committee review',
    ],
    applicableTo: ['group'],
  },
  {
    id: 'LIB-007',
    name: 'Cost overrun on flagship project',
    category: 'project_construction',
    description:
      'Materials or labour cost inflation, scope creep, or contractor failure pushes project costs above approved budget, eroding margin and IRR.',
    aldarRelevance:
      'ABC Development pipeline includes mixed-use flagships with significant fit-out cost components. Steel / cement price moves are watched.',
    exposureRangeAedMn: [80, 350],
    likelihood: 'medium',
    linkedKRIs: [],
    linkedRegulators: [],
    commonControls: [
      'Fixed-price contract with escalation cap',
      'Quantity-surveyor monthly cost report',
      'Monthly project review committee',
    ],
    applicableTo: ['development'],
  },
  {
    id: 'LIB-008',
    name: 'School inspection downgrade',
    category: 'regulatory',
    description:
      'ADEK / KHDA inspection rating downgrade triggers parent-driven enrolment loss and fee-cap downside on existing ABC Education assets.',
    aldarRelevance:
      'ABC Education portfolio depends on inspection ratings for fee-tier permission and parent enrolment retention. Linked to GA-REP-01.',
    exposureRangeAedMn: [20, 120],
    likelihood: 'low',
    linkedKRIs: [],
    linkedRegulators: ['REG-MOE'],
    commonControls: [
      'Standing improvement plan with monthly principal review',
      'Pre-inspection independent audit',
      'Teacher CPD compliance tracking',
    ],
    applicableTo: ['education'],
  },
  {
    id: 'LIB-009',
    name: 'Cyber incident / data breach',
    category: 'cyber',
    description:
      'Ransomware, data exfiltration, or critical-system outage disrupts customer onboarding, escrow reconciliation, or hotel front-of-house operations.',
    aldarRelevance:
      'Yardi, SAP, escrow agent, and hotel PMS are critical. Regulatory data-protection breach exposure under UAE Federal PDP Law.',
    exposureRangeAedMn: [40, 250],
    likelihood: 'medium',
    linkedKRIs: [],
    linkedRegulators: ['REG-CBUAE'],
    commonControls: [
      '24/7 SOC monitoring with EDR',
      'Quarterly DR / BCP exercises',
      'Privileged-access review',
    ],
    applicableTo: ['group'],
  },
  {
    id: 'LIB-010',
    name: 'Net-zero / Estidama trajectory slip',
    category: 'esg',
    description:
      'Material slippage from disclosed net-zero or Estidama / LEED commitments triggers ESG-rating downgrade, sustainability-linked-loan margin step-up, and reputational damage.',
    aldarRelevance:
      'ABC has published net-zero and green-financing commitments. Rating-watch by MSCI / Sustainalytics is material to investor relations.',
    exposureRangeAedMn: [10, 80],
    likelihood: 'low',
    linkedKRIs: [],
    linkedRegulators: ['REG-ADX', 'REG-SCA'],
    commonControls: [
      'Quarterly ESG steering-committee review',
      'Independent ESG verification',
      'Sustainability-linked-loan covenant monitoring',
    ],
    applicableTo: ['group'],
  },
  {
    id: 'LIB-011',
    name: 'Interest-rate / FX shock',
    category: 'macro',
    description:
      'Sustained UAE policy-rate uplift or AED-pegged dollar tightening compresses buyer affordability, raises ABC finance costs, and stresses non-AED revenue lines.',
    aldarRelevance:
      'ABC holds AED-denominated debt; AED-USD peg means Fed moves transmit. Affordability stress on KRI-13 and KRI-16 is the leading indicator.',
    exposureRangeAedMn: [60, 300],
    likelihood: 'medium',
    linkedKRIs: ['KRI-13', 'KRI-16'],
    linkedRegulators: ['REG-CBUAE'],
    commonControls: [
      'Interest-rate hedge programme (caps / swaps)',
      'Buyer-affordability stress at sale',
      'Refinancing maturity-ladder management',
    ],
    applicableTo: ['group'],
  },
  {
    id: 'LIB-012',
    name: 'Hospitality demand shock',
    category: 'operational',
    description:
      'Geopolitical event, pandemic recurrence, or inbound-tourism slowdown materially compresses hotel occupancy and ADR across ABC Hospitality assets.',
    aldarRelevance:
      'ABC Hospitality assets sensitive to Abu Dhabi tourism cycles. ADR / occupancy KPIs roll into segment EBITDA contribution.',
    exposureRangeAedMn: [30, 180],
    likelihood: 'low',
    linkedKRIs: [],
    linkedRegulators: ['REG-DTCM'],
    commonControls: [
      'Diversified inbound source-market mix',
      'Flexible cost base (variable F&B, contracted housekeeping)',
      'Tourism-levy / loyalty programme management',
    ],
    applicableTo: ['hospitality'],
  },
]
