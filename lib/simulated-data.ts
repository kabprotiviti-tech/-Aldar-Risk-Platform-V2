// ─── Risk Propagation Engine — provides dynamically computed metrics ──────────
// Import must come first; engine uses `import type` from this file so no circular dep at runtime
import { PROPAGATED_METRICS, COMPUTED_HISTORY } from './riskPropagationEngine'

export type Portfolio = 'real-estate' | 'retail' | 'hospitality' | 'education' | 'facilities'
export type RiskStatus = 'open' | 'mitigating' | 'monitoring' | 'closed'
export type RiskTrend = 'increasing' | 'stable' | 'decreasing'
export type Severity = 'critical' | 'high' | 'medium' | 'low'

export interface Risk {
  id: string
  title: string
  category: string
  portfolio: Portfolio
  likelihood: number  // 1-5
  impact: number      // 1-5
  score: number       // likelihood * impact
  status: RiskStatus
  trend: RiskTrend
  lastUpdated: string
  owner: string
  description: string
  financialImpact: number  // AED millions
  aiInsight: string
}

export interface ExternalNews {
  id: string
  headline: string
  source: string
  publishedAt: string
  region: string
  category: string
  aiClassification: {
    riskType: string
    severity: Severity
    portfoliosAffected: Portfolio[]
    confidence: number
  }
  aiExplanation: string
}

export interface ERPSignal {
  id: string
  type: string
  description: string
  value: number
  threshold: number
  unit: string
  portfolio: Portfolio
  severity: Severity
  timestamp: string
}

export interface CRMSignal {
  id: string
  type: string
  description: string
  metric: string
  value: number
  benchmark: number
  portfolio: Portfolio
  severity: Severity
  timestamp: string
}

export interface ProjectSignal {
  id: string
  projectName: string
  type: string
  description: string
  delayDays?: number
  costVariance?: number  // % over budget
  portfolio: Portfolio
  severity: Severity
  timestamp: string
}

export interface PortfolioMetrics {
  riskScore: number
  riskCount: {
    critical: number
    high: number
    medium: number
    low: number
  }
  financialExposure: number  // AED millions
  trend: RiskTrend
}

export interface ScenarioTemplate {
  id: string
  name: string
  description: string
  category: string
  affectedPortfolios: Portfolio[]
  estimatedImpact: {
    portfolio: Portfolio
    impactAED: number
    impactPercent: number
    description: string
  }[]
  parameters: {
    intensity: 'mild' | 'moderate' | 'severe'
    duration: string
    probability: number
  }
}

// ============================================================
// RISK REGISTER - 15 Risks
// ============================================================

export const riskRegister: Risk[] = [
  {
    id: 'R-001',
    title: 'UAE Interest Rate Hike Impact on Mortgage Demand',
    category: 'Market Risk',
    portfolio: 'real-estate',
    likelihood: 4,
    impact: 4,
    score: 16,
    status: 'monitoring',
    trend: 'increasing',
    lastUpdated: '2026-04-14',
    owner: 'CFO Office',
    description: 'Rising interest rates in UAE (following US Fed trajectory) reducing mortgage affordability, potentially suppressing off-plan sales volumes by 15-25% in residential communities.',
    financialImpact: 285,
    aiInsight: 'Mortgage rate increases of 50bps correlate with 8-12% reduction in off-plan absorption rates across Yas Island and Saadiyat. Recommend accelerating payment plan flexibility and partnering with ADCB/FAB on preferential rate packages for end-buyers.',
  },
  {
    id: 'R-002',
    title: 'Yas Mall Anchor Tenant Lease Non-Renewal Risk',
    category: 'Revenue Risk',
    portfolio: 'retail',
    likelihood: 3,
    impact: 5,
    score: 15,
    status: 'mitigating',
    trend: 'stable',
    lastUpdated: '2026-04-13',
    owner: 'Retail Asset Management',
    description: 'Two anchor tenants (combined 18,000 sqm) approaching lease expiry in Q4 2026. Global retail headwinds and e-commerce disruption creating uncertainty around renewal. Potential 14-month void period if replacements not secured.',
    financialImpact: 120,
    aiInsight: 'Anchor tenant churn in GCC malls historically creates 18-24 month recovery cycles. Aldar should proactively engage experiential F&B and entertainment operators to reposition the footprint before formal expiry negotiations.',
  },
  {
    id: 'R-003',
    title: 'Tourism Demand Softening — Yas Island Hospitality',
    category: 'Demand Risk',
    portfolio: 'hospitality',
    likelihood: 3,
    impact: 5,
    score: 15,
    status: 'monitoring',
    trend: 'increasing',
    lastUpdated: '2026-04-15',
    owner: 'Hospitality Division',
    description: 'Shoulder season transition (April) with no major events until F1 GP (November) has pushed effective tourism index to 48/100. Hotel occupancy at 68% — below the 70% risk threshold. RevPAR declined 6.2% YoY. Signal propagation: geopolitical risk (medium) → tourism index compression → occupancy decline → RevPAR pressure → EBITDA margin erosion.',
    financialImpact: 115,
    aiInsight: 'Propagation engine flags a 7-month demand valley (April–October) with no major event catalyst. Effective tourism index of 48/100 (geopolitical-adjusted, seasonality-adjusted) is approaching the 45/100 threshold that triggers high severity. Aldar should activate corporate long-stay packages and summer staycation promotions to bridge the gap before F1 season.',
  },
  {
    id: 'R-004',
    title: 'Construction Cost Inflation — Active Development Pipeline',
    category: 'Cost Risk',
    portfolio: 'real-estate',
    likelihood: 4,
    impact: 4,
    score: 16,
    status: 'open',
    trend: 'increasing',
    lastUpdated: '2026-04-14',
    owner: 'Development Division',
    description: 'Steel and cement costs up 18% YTD, driven by Red Sea shipping disruptions and post-conflict regional supply chain pressures. Active pipeline of AED 8.2Bn in development projects exposed to cost overrun risk.',
    financialImpact: 410,
    aiInsight: 'Supply chain triangulation using multiple GCC and South Asian suppliers could reduce cost exposure by 12-15%. Recommend activating fixed-price contract provisions and exploring prefab construction for upcoming Saadiyat Lagoons phases.',
  },
  {
    id: 'R-005',
    title: 'Aldar Education Regulatory Compliance — ADEK Curriculum Changes',
    category: 'Regulatory Risk',
    portfolio: 'education',
    likelihood: 3,
    impact: 3,
    score: 9,
    status: 'mitigating',
    trend: 'stable',
    lastUpdated: '2026-04-10',
    owner: 'Aldar Education CEO',
    description: 'Abu Dhabi Department of Education and Knowledge (ADEK) mandating enhanced Arabic and UAE Studies integration across all curricula by September 2026. Requires significant teacher retraining and curriculum redesign across 30+ schools.',
    financialImpact: 35,
    aiInsight: 'ADEK compliance is a non-negotiable. Aldar Education should treat this as a brand differentiation opportunity by launching a "UAE Heritage Excellence" program positioning schools as leaders in national curriculum integration.',
  },
  {
    id: 'R-006',
    title: 'Data Centre & Smart Building Cyber Vulnerability',
    category: 'Cyber Risk',
    portfolio: 'facilities',
    likelihood: 3,
    impact: 5,
    score: 15,
    status: 'mitigating',
    trend: 'increasing',
    lastUpdated: '2026-04-11',
    owner: 'CTO Office',
    description: 'Aldar\'s smart building infrastructure across 40+ assets now integrated with IoT sensors and BMS platforms. Recent UAE sector cybersecurity advisories highlight increased nation-state threat actor targeting of real estate operators.',
    financialImpact: 180,
    aiInsight: 'IoT-connected building systems create a 340% larger attack surface vs. traditional assets. Recommend immediate OT/IT network segmentation audit and adopting UAE National Cybersecurity Authority (NCA) ECC framework compliance posture.',
  },
  {
    id: 'R-007',
    title: 'Geopolitical Escalation — Regional Investor Sentiment',
    category: 'Geopolitical Risk',
    portfolio: 'real-estate',
    likelihood: 3,
    impact: 4,
    score: 12,
    status: 'monitoring',
    trend: 'increasing',
    lastUpdated: '2026-04-15',
    owner: 'Strategy & Investments',
    description: 'Geopolitical risk signal elevated to MEDIUM (April 2026). Ongoing Red Sea shipping disruptions and regional tensions are sustaining a moderate risk premium. HNI buyers from Russia, CIS and Iran (~22% of premium sales) are showing increased caution. Signal propagation: geopolitical_risk_level (medium) → tourism_index compression (-8pts) → HNI investment sentiment → off-plan absorption slowdown → construction supply chain disruption.',
    financialImpact: 540,
    aiInsight: 'Propagation engine shows geopolitical signals at medium severity are already compressing the effective tourism index by 8 points and suppressing HNI buyer sentiment. The key watch indicator is whether current regional tensions escalate to high severity — that scenario would reduce off-plan absorption by an estimated additional 18% and push real estate risk score above 90/100.',
  },
  {
    id: 'R-008',
    title: 'Sustainability Reporting Non-Compliance Risk (ESG)',
    category: 'ESG Risk',
    portfolio: 'real-estate',
    likelihood: 2,
    impact: 3,
    score: 6,
    status: 'mitigating',
    trend: 'decreasing',
    lastUpdated: '2026-04-08',
    owner: 'Sustainability Office',
    description: 'UAE mandatory ESG reporting requirements under ADX listing rules effective FY2026. Aldar\'s Scope 3 emissions data across construction supply chain remains incomplete, creating disclosure risk.',
    financialImpact: 45,
    aiInsight: 'ADX ESG disclosure requirements align with ISSB IFRS S1/S2 standards. Aldar should implement AI-powered supply chain emissions tracking now to avoid restatement risk in first mandatory filings and protect international investor relations.',
  },
  {
    id: 'R-009',
    title: 'Community Retail Vacancy Rate Increase',
    category: 'Revenue Risk',
    portfolio: 'retail',
    likelihood: 3,
    impact: 4,
    score: 12,
    status: 'open',
    trend: 'increasing',
    lastUpdated: '2026-04-15',
    owner: 'Retail Asset Management',
    description: 'Community retail vacancy worsening driven by downstream propagation from hospitality sector. Shoulder-season tourism decline (effective tourism index 48/100) reduces Yas Island footfall, which cascades into lower patronage at community retail centres. Current vacancy 8.5% vs. 5.2% benchmark. Footfall index: 67/100, declining. Base rent compression of 12% forecast for 2026.',
    financialImpact: 82,
    aiInsight: 'Propagation engine identifies this risk as downstream amplification: tourism index (48) → occupancy (68%) → retail footfall (67/100) → turnover rent underperformance → covenant stress increase. The risk escalates significantly if footfall falls below 62/100 (triggered by further summer tourism decline). Repositioning vacant units toward convenience and health categories reduces exposure by ~AED 35M within 18 months.',
  },
  {
    id: 'R-010',
    title: 'FM Outsourcing Partner Performance Risk',
    category: 'Operational Risk',
    portfolio: 'facilities',
    likelihood: 3,
    impact: 3,
    score: 9,
    status: 'monitoring',
    trend: 'stable',
    lastUpdated: '2026-04-07',
    owner: 'Aldar Investment Properties',
    description: 'Two key FM outsourcing partners (covering 60% of managed portfolio by area) showing declining SLA performance — CSAT scores dropped from 87% to 79% in Q1 2026. Contract renewal decisions due Q3 2026.',
    financialImpact: 28,
    aiInsight: 'FM service quality directly impacts tenant retention and asset valuation premiums. Recommend conducting independent FM benchmarking and issuing performance improvement notices with clawback provisions before entering renewal discussions.',
  },
  {
    id: 'R-011',
    title: 'Residential Oversupply in Abu Dhabi Market',
    category: 'Market Risk',
    portfolio: 'real-estate',
    likelihood: 4,
    impact: 3,
    score: 12,
    status: 'monitoring',
    trend: 'increasing',
    lastUpdated: '2026-04-12',
    owner: 'Market Intelligence',
    description: 'Abu Dhabi pipeline of 38,000 units expected for delivery 2026-2028 vs. annual demand of ~22,000 units. Oversupply conditions could compress secondary market capital values by 8-15% in non-premium locations.',
    financialImpact: 230,
    aiInsight: 'Aldar\'s premium, masterplanned community positioning provides insulation vs. mid-market oversupply. Focus on differentiated buyer experience, community lifestyle features and school catchment desirability to maintain pricing premium.',
  },
  {
    id: 'R-012',
    title: 'School Enrollment Shortfall Risk — New Campus Openings',
    category: 'Revenue Risk',
    portfolio: 'education',
    likelihood: 2,
    impact: 3,
    score: 6,
    status: 'monitoring',
    trend: 'stable',
    lastUpdated: '2026-04-06',
    owner: 'Aldar Education CFO',
    description: 'Three new Aldar Education campuses opening in 2026 require 850+ enrollment to breakeven in Year 1. Current pre-registration at 62% of target. Demographic shift toward smaller family sizes in UAE could persist.',
    financialImpact: 42,
    aiInsight: 'Aldar Education enrollment is structurally linked to residential community launch sequencing. Synchronizing school openings with community handovers and offering guaranteed placement packages to homebuyers creates a captive enrollment pipeline.',
  },
  {
    id: 'R-013',
    title: 'UAE Visa Policy Changes — Tenant Base Disruption',
    category: 'Regulatory Risk',
    portfolio: 'real-estate',
    likelihood: 2,
    impact: 4,
    score: 8,
    status: 'monitoring',
    trend: 'decreasing',
    lastUpdated: '2026-04-05',
    owner: 'Legal & Compliance',
    description: 'Any reversal of UAE Golden Visa program or changes to qualifying thresholds could reduce HNI investment demand for residential assets. Current favorable visa policies are a key demand driver.',
    financialImpact: 195,
    aiInsight: 'UAE government signals continued commitment to talent and investor retention via residency programs. Risk is low but tail risk warrants monitoring. Diversify buyer base toward end-user GCC nationals and UAE-resident professionals.',
  },
  {
    id: 'R-014',
    title: 'F1 Grand Prix & Events Dependency — Hospitality Revenue Concentration',
    category: 'Concentration Risk',
    portfolio: 'hospitality',
    likelihood: 3,
    impact: 4,
    score: 12,
    status: 'monitoring',
    trend: 'increasing',
    lastUpdated: '2026-04-15',
    owner: 'Hospitality Division',
    description: 'Elevated risk: event_density is currently LOW and no major event is scheduled until F1 GP in November 2026 — a 7-month demand valley. Hotels generating ~28% of annual revenue from F1/Yasalam window face acute concentration risk during the void period. Signal context: major_event_flag = false, event_density = low, season = shoulder → compound occupancy depression.',
    financialImpact: 105,
    aiInsight: 'Propagation engine flags event concentration as the highest-priority near-term risk given current signal state: 7 months to next major demand catalyst, shoulder season active, and no bridging events in the calendar. Each week of sub-70% occupancy represents ~AED 2.8M in RevPAR shortfall vs. peak-season baseline. Activating F1 advance-booking campaigns and securing one mid-year anchor event could recover AED 40–60M.',
  },
  {
    id: 'R-015',
    title: 'AI & Proptech Disruption to Traditional FM Model',
    category: 'Technology Risk',
    portfolio: 'facilities',
    likelihood: 3,
    impact: 3,
    score: 9,
    status: 'open',
    trend: 'increasing',
    lastUpdated: '2026-04-14',
    owner: 'CTO Office',
    description: 'AI-powered predictive maintenance and autonomous building management platforms are disrupting traditional FM models. Competitors adopting these technologies are achieving 22% cost reductions. Aldar FM digital maturity lags industry leaders.',
    financialImpact: 55,
    aiInsight: 'Opportunity cost of FM digitization delay is estimated at AED 55M annually in maintenance inefficiencies. Recommend piloting AI-powered BMS at 5 flagship assets in H1 2026 before broader rollout, targeting 18% opex reduction.',
  },
]

// ============================================================
// EXTERNAL NEWS
// ============================================================

export const externalNews: ExternalNews[] = [
  {
    id: 'N-001',
    headline: 'US Federal Reserve Signals Two More Rate Hikes in 2026 Amid Inflation Persistence',
    source: 'Bloomberg',
    publishedAt: '2026-04-15T07:30:00Z',
    region: 'Global',
    category: 'Monetary Policy',
    aiClassification: {
      riskType: 'Interest Rate Risk',
      severity: 'high',
      portfoliosAffected: ['real-estate', 'retail'],
      confidence: 0.91,
    },
    aiExplanation: 'USD-pegged AED means UAE interest rates move in lockstep with US Fed. Two additional 25bps hikes would further compress mortgage affordability and commercial real estate cap rate compression, directly impacting Aldar\'s off-plan sales velocity and asset valuations.',
  },
  {
    id: 'N-002',
    headline: 'Saudi Arabia Announces 15 New Tourism Megaprojects — NEOM Accelerates Hotel Openings',
    source: 'Arabian Business',
    publishedAt: '2026-04-14T09:15:00Z',
    region: 'GCC',
    category: 'Competitive Landscape',
    aiClassification: {
      riskType: 'Competitive Risk',
      severity: 'medium',
      portfoliosAffected: ['hospitality', 'retail'],
      confidence: 0.84,
    },
    aiExplanation: 'Saudi tourism pipeline adds 28,000 hotel keys over 2026-2028 in the luxury/experience segment. While UAE\'s infrastructure and connectivity advantages persist, long-haul leisure travelers may reallocate budgets toward Saudi experiences, pressuring Yas Island RevPAR from 2027.',
  },
  {
    id: 'N-003',
    headline: 'Red Sea Shipping Disruptions Extend Through Q3 2026 — Freight Costs Up 34% YTD',
    source: 'Reuters',
    publishedAt: '2026-04-14T06:45:00Z',
    region: 'MENA',
    category: 'Supply Chain',
    aiClassification: {
      riskType: 'Construction Cost Risk',
      severity: 'high',
      portfoliosAffected: ['real-estate', 'facilities'],
      confidence: 0.89,
    },
    aiExplanation: 'Continued Red Sea disruptions extend construction material import cost inflation. Aldar\'s AED 8.2Bn development pipeline uses significant imported steel, MEP components and specialist materials. 34% freight cost increase translates to ~AED 180M additional pipeline cost exposure.',
  },
  {
    id: 'N-004',
    headline: 'UAE Golden Visa Applications Hit Record 2.3M — Government Signals Further Expansion',
    source: 'WAM (UAE News Agency)',
    publishedAt: '2026-04-13T11:00:00Z',
    region: 'UAE',
    category: 'Regulatory / Policy',
    aiClassification: {
      riskType: 'Positive Demand Signal',
      severity: 'low',
      portfoliosAffected: ['real-estate', 'education'],
      confidence: 0.95,
    },
    aiExplanation: 'Record Golden Visa uptake is a structural positive for premium residential demand. Aldar\'s target HNI buyer segment (AED 3M+ properties) is directly incentivized by visa benefits. This also drives school enrollment demand as HNI families relocate, benefiting Aldar Education.',
  },
  {
    id: 'N-005',
    headline: 'Abu Dhabi Real Estate Transactions Reach AED 102Bn in Q1 2026 — Highest on Record',
    source: 'CBRE MENA',
    publishedAt: '2026-04-12T10:30:00Z',
    region: 'UAE',
    category: 'Market Data',
    aiClassification: {
      riskType: 'Market Opportunity',
      severity: 'low',
      portfoliosAffected: ['real-estate'],
      confidence: 0.93,
    },
    aiExplanation: 'Record Abu Dhabi transaction volumes validate Aldar\'s core residential development strategy. Premium community prices rose 11% YoY. This positive demand environment provides runway for planned 2026 launches but also signals potential oversupply risk if pipeline is not managed.',
  },
  {
    id: 'N-006',
    headline: 'Global Cyber Attack Targets Middle East Infrastructure — CISA Issues Critical Advisory',
    source: 'Cybersecurity & Infrastructure Security Agency',
    publishedAt: '2026-04-12T15:20:00Z',
    region: 'Global/MENA',
    category: 'Cybersecurity',
    aiClassification: {
      riskType: 'Cyber Risk',
      severity: 'critical',
      portfoliosAffected: ['facilities', 'real-estate', 'retail'],
      confidence: 0.88,
    },
    aiExplanation: 'Coordinated attacks on smart building infrastructure in the GCC region require immediate response. Aldar\'s IoT-connected portfolio of 40+ assets with BMS integration is directly exposed. Recommend urgent security posture review and threat intelligence sharing with UAE NCA.',
  },
  {
    id: 'N-007',
    headline: 'UAE Schools Face Teacher Retention Crisis as Cost of Living Rises — 23% Increase in Departures',
    source: 'The National',
    publishedAt: '2026-04-11T08:00:00Z',
    region: 'UAE',
    category: 'Human Capital',
    aiClassification: {
      riskType: 'Operational Risk',
      severity: 'medium',
      portfoliosAffected: ['education'],
      confidence: 0.82,
    },
    aiExplanation: 'Teacher attrition at 23% above normal rates creates quality risk for Aldar Education\'s 30+ school network. Replacing specialist STEM and IB teachers in Abu Dhabi takes 4-6 months and costs AED 45,000+ per replacement. Risk to school ratings and parent retention is secondary concern.',
  },
  {
    id: 'N-008',
    headline: 'GCC E-commerce Penetration Hits 18% — Physical Retail Faces Structural Headwinds',
    source: 'McKinsey & Company',
    publishedAt: '2026-04-10T12:00:00Z',
    region: 'GCC',
    category: 'Retail Disruption',
    aiClassification: {
      riskType: 'Structural Market Risk',
      severity: 'medium',
      portfoliosAffected: ['retail'],
      confidence: 0.86,
    },
    aiExplanation: 'GCC e-commerce growth accelerating, reaching 18% penetration vs. 14% in 2024. Fashion and electronics categories most affected — both major tenant categories at Yas Mall. Aldar Retail should accelerate experiential and F&B-led repositioning to maintain footfall and tenant covenant strength.',
  },
  {
    id: 'N-009',
    headline: 'ADX Mandates IFRS S1/S2 ESG Disclosure for Listed Companies From FY2026',
    source: 'Abu Dhabi Securities Exchange',
    publishedAt: '2026-04-09T09:00:00Z',
    region: 'UAE',
    category: 'Regulatory',
    aiClassification: {
      riskType: 'Compliance Risk',
      severity: 'high',
      portfoliosAffected: ['real-estate', 'retail', 'hospitality', 'education', 'facilities'],
      confidence: 0.97,
    },
    aiExplanation: 'ADX ESG mandate is now confirmed for FY2026 reporting. Aldar, as an ADX-listed company, must deliver IFRS S1 general sustainability and S2 climate-related disclosures. Incomplete Scope 3 data across construction supply chain creates material non-compliance risk if not addressed in H1 2026.',
  },
  {
    id: 'N-010',
    headline: 'India and South Asia Construction Labor Pool Tightening — UAE Wage Inflation 14% YoY',
    source: 'MEED Projects',
    publishedAt: '2026-04-08T07:30:00Z',
    region: 'MENA',
    category: 'Labor Market',
    aiClassification: {
      riskType: 'Cost Inflation Risk',
      severity: 'medium',
      portfoliosAffected: ['real-estate', 'facilities'],
      confidence: 0.79,
    },
    aiExplanation: 'Construction labor cost inflation of 14% YoY in UAE, driven by competing demand from Saudi Giga-projects and Gulf infrastructure boom. Skilled trades (MEP, fit-out) most affected. Aldar\'s active construction pipeline faces AED 95M additional labor cost exposure if not locked in via multi-year labor contracts.',
  },
]

// ============================================================
// ERP SIGNALS
// ============================================================

export const erpSignals: ERPSignal[] = [
  {
    id: 'ERP-001',
    type: 'Receivables Aging',
    description: 'Trade receivables >90 days have increased to AED 142M, up 31% from Q4 2025',
    value: 142,
    threshold: 100,
    unit: 'AED Millions',
    portfolio: 'retail',
    severity: 'high',
    timestamp: '2026-04-15T06:00:00Z',
  },
  {
    id: 'ERP-002',
    type: 'Construction Cost Overrun',
    description: 'Saadiyat Grove Phase 2 showing 11.2% cost overrun vs. approved budget',
    value: 11.2,
    threshold: 5,
    unit: '% Over Budget',
    portfolio: 'real-estate',
    severity: 'high',
    timestamp: '2026-04-14T12:00:00Z',
  },
  {
    id: 'ERP-003',
    type: 'Revenue Variance',
    description: 'Hospitality division Q1 revenue 7.8% below budget forecast',
    value: -7.8,
    threshold: -5,
    unit: '% vs Budget',
    portfolio: 'hospitality',
    severity: 'medium',
    timestamp: '2026-04-13T09:00:00Z',
  },
  {
    id: 'ERP-004',
    type: 'Liquidity Alert',
    description: 'FM division cash conversion cycle extended to 78 days vs. 55-day target',
    value: 78,
    threshold: 55,
    unit: 'Days',
    portfolio: 'facilities',
    severity: 'medium',
    timestamp: '2026-04-12T14:00:00Z',
  },
]

// ============================================================
// CRM SIGNALS
// ============================================================

export const crmSignals: CRMSignal[] = [
  {
    id: 'CRM-001',
    type: 'Vacancy Rate',
    description: 'Reem Island community retail vacancy rate rising above portfolio benchmark',
    metric: 'Vacancy Rate',
    value: 8.5,
    benchmark: 5.2,
    portfolio: 'retail',
    severity: 'medium',
    timestamp: '2026-04-15T07:00:00Z',
  },
  {
    id: 'CRM-002',
    type: 'Tenant Satisfaction',
    description: 'Yas Mall tenant NPS score declined 12 points to 54 in Q1 2026 survey',
    metric: 'NPS Score',
    value: 54,
    benchmark: 66,
    portfolio: 'retail',
    severity: 'medium',
    timestamp: '2026-04-10T10:00:00Z',
  },
  {
    id: 'CRM-003',
    type: 'Hotel Occupancy',
    description: 'Yas Island hotel average occupancy YTD at 71% vs. 78% target',
    metric: 'Occupancy Rate %',
    value: 71,
    benchmark: 78,
    portfolio: 'hospitality',
    severity: 'medium',
    timestamp: '2026-04-14T08:00:00Z',
  },
  {
    id: 'CRM-004',
    type: 'School Enrollment',
    description: 'New campus pre-enrollment at 62% of Year 1 breakeven target',
    metric: 'Enrollment vs Target %',
    value: 62,
    benchmark: 85,
    portfolio: 'education',
    severity: 'high',
    timestamp: '2026-04-11T11:00:00Z',
  },
]

// ============================================================
// PROJECT SIGNALS
// ============================================================

export const projectSignals: ProjectSignal[] = [
  {
    id: 'PRJ-001',
    projectName: 'Saadiyat Grove Phase 2',
    type: 'Cost Overrun',
    description: 'MEP contractor claiming force majeure on steel cost increases — AED 48M variation order submitted',
    costVariance: 11.2,
    portfolio: 'real-estate',
    severity: 'high',
    timestamp: '2026-04-14T09:00:00Z',
  },
  {
    id: 'PRJ-002',
    projectName: 'Yas Bay Waterfront Tower C',
    type: 'Schedule Delay',
    description: 'Structural works delayed 45 days due to crane availability constraints and labor shortage',
    delayDays: 45,
    costVariance: 3.1,
    portfolio: 'real-estate',
    severity: 'medium',
    timestamp: '2026-04-13T11:00:00Z',
  },
  {
    id: 'PRJ-003',
    projectName: 'Al Ghadeer Community Centre Expansion',
    type: 'Permit Delay',
    description: 'Municipality NOC delayed by 30 days awaiting updated traffic impact study',
    delayDays: 30,
    portfolio: 'real-estate',
    severity: 'low',
    timestamp: '2026-04-12T14:00:00Z',
  },
]

// ============================================================
// PORTFOLIO METRICS
// ============================================================

// Portfolio metrics are dynamically computed by the Risk Propagation Engine.
// Scores reflect current signal state: shoulder season, tourism index 61/100,
// hotel occupancy 68% (below threshold), restrictive rate environment (+175bps),
// construction cost index 118 (+18% vs. 2023), medium geopolitical risk.
export const portfolioMetrics: Record<Portfolio, PortfolioMetrics> = PROPAGATED_METRICS

// ============================================================
// SCENARIO TEMPLATES
// ============================================================

export const scenarioTemplates: ScenarioTemplate[] = [
  {
    id: 'S-001',
    name: 'Tourism Demand Collapse',
    description: 'Severe regional tourism downturn driven by geopolitical tensions, reducing Yas Island visitor volumes by 30% over 18 months',
    category: 'Demand Shock',
    affectedPortfolios: ['hospitality', 'retail', 'real-estate'],
    estimatedImpact: [
      { portfolio: 'hospitality', impactAED: -285, impactPercent: -32, description: 'RevPAR decline, occupancy drop to 52%, event revenue collapse' },
      { portfolio: 'retail', impactAED: -120, impactPercent: -18, description: 'Footfall-linked tenant revenue clauses trigger, turnover rent reduction' },
      { portfolio: 'real-estate', impactAED: -195, impactPercent: -8, description: 'Off-plan absorption slowdown in leisure-adjacent communities' },
    ],
    parameters: { intensity: 'severe', duration: '18 months', probability: 0.18 },
  },
  {
    id: 'S-002',
    name: 'Interest Rate Surge (+200bps)',
    description: 'US Fed emergency rate action drives UAE rates up 200 basis points, severely impacting mortgage affordability and commercial real estate yields',
    category: 'Macro Financial Shock',
    affectedPortfolios: ['real-estate', 'retail', 'facilities'],
    estimatedImpact: [
      { portfolio: 'real-estate', impactAED: -520, impactPercent: -21, description: 'Off-plan sales drop 35%, developer margin compression, land value decline' },
      { portfolio: 'retail', impactAED: -95, impactPercent: -14, description: 'Cap rate expansion reduces asset valuations, tenant borrowing costs rise' },
      { portfolio: 'facilities', impactAED: -45, impactPercent: -8, description: 'Floating rate debt on FM SPVs increases financing costs' },
    ],
    parameters: { intensity: 'severe', duration: '24 months', probability: 0.12 },
  },
  {
    id: 'S-003',
    name: 'Regional Geopolitical Escalation',
    description: 'Major conflict outbreak in the broader MENA region causing HNI flight risk, supply chain disruption and temporary investment freeze across UAE real estate',
    category: 'Geopolitical Crisis',
    affectedPortfolios: ['real-estate', 'hospitality', 'retail', 'education'],
    estimatedImpact: [
      { portfolio: 'real-estate', impactAED: -720, impactPercent: -29, description: 'Foreign HNI buyer freeze, off-plan cancellation uptick, sentiment shock' },
      { portfolio: 'hospitality', impactAED: -340, impactPercent: -38, description: 'International arrivals drop, event cancellations, corporate travel freeze' },
      { portfolio: 'retail', impactAED: -180, impactPercent: -27, description: 'Footfall collapse, luxury category shutdown, tourist spending elimination' },
      { portfolio: 'education', impactAED: -85, impactPercent: -15, description: 'Expat family relocations, enrollment withdrawals across international schools' },
    ],
    parameters: { intensity: 'severe', duration: '12 months', probability: 0.08 },
  },
  {
    id: 'S-004',
    name: 'Construction Cost Surge (+25%)',
    description: 'Global supply chain crisis drives construction input costs up 25% across all materials categories, severely impacting active development economics',
    category: 'Input Cost Shock',
    affectedPortfolios: ['real-estate', 'facilities'],
    estimatedImpact: [
      { portfolio: 'real-estate', impactAED: -680, impactPercent: -27, description: 'Pipeline project margin erosion, 3 projects potentially unviable at current launch prices' },
      { portfolio: 'facilities', impactAED: -120, impactPercent: -22, description: 'Capex maintenance budgets exceeded, deferred maintenance risk accumulation' },
    ],
    parameters: { intensity: 'moderate', duration: '30 months', probability: 0.22 },
  },
  {
    id: 'S-005',
    name: 'Major Cyber Attack — Smart Building Infrastructure',
    description: 'Coordinated nation-state cyber attack targets Aldar\'s IoT-connected BMS across 40+ assets, causing operational disruption, data breach, and reputational damage',
    category: 'Cyber / Operational Crisis',
    affectedPortfolios: ['facilities', 'retail', 'hospitality'],
    estimatedImpact: [
      { portfolio: 'facilities', impactAED: -180, impactPercent: -35, description: 'Emergency remediation costs, 15+ asset operational shutdown, SLA penalties' },
      { portfolio: 'retail', impactAED: -65, impactPercent: -10, description: 'Mall HVAC and access system outages, tenant compensation claims' },
      { portfolio: 'hospitality', impactAED: -95, impactPercent: -18, description: 'Hotel systems disruption, guest data breach liability, brand reputational damage' },
    ],
    parameters: { intensity: 'severe', duration: '6 months', probability: 0.14 },
  },
  {
    id: 'S-006',
    name: 'UAE Oil Price Crash (Below $45/bbl)',
    description: 'Sustained oil price collapse below $45/bbl triggers significant UAE government spending contraction, reducing disposable income, employment levels and consumer confidence across all sectors',
    category: 'Macro Demand Shock',
    affectedPortfolios: ['real-estate', 'retail', 'hospitality', 'education', 'facilities'],
    estimatedImpact: [
      { portfolio: 'real-estate', impactAED: -850, impactPercent: -34, description: 'Government employee pay freezes reduce housing demand, off-plan sales halt' },
      { portfolio: 'retail', impactAED: -220, impactPercent: -33, description: 'Consumer spending contraction, luxury and discretionary categories collapse' },
      { portfolio: 'hospitality', impactAED: -195, impactPercent: -22, description: 'MICE and corporate segment evaporates, government event spending cut' },
      { portfolio: 'education', impactAED: -110, impactPercent: -20, description: 'Expat departures accelerate, enrollment drops, fee sensitivity spikes' },
      { portfolio: 'facilities', impactAED: -85, impactPercent: -16, description: 'Government FM contract deferrals, maintenance budget cuts' },
    ],
    parameters: { intensity: 'severe', duration: '36 months', probability: 0.10 },
  },
  {
    id: 'S-007',
    name: 'ESG Regulatory Non-Compliance',
    description: 'ADX imposes material penalties for IFRS S1/S2 non-compliance; international institutional investors divest Aldar shares pending ESG restatement, causing share price decline and cost of capital increase',
    category: 'Regulatory / ESG',
    affectedPortfolios: ['real-estate', 'retail', 'hospitality', 'education', 'facilities'],
    estimatedImpact: [
      { portfolio: 'real-estate', impactAED: -320, impactPercent: -13, description: 'Higher financing cost, reduced international investor confidence in premium launches' },
      { portfolio: 'retail', impactAED: -85, impactPercent: -13, description: 'Green building certification gap increases operating costs, tenant pressure' },
      { portfolio: 'hospitality', impactAED: -75, impactPercent: -8, description: 'Sustainability-conscious corporate clients shift to certified competitors' },
      { portfolio: 'education', impactAED: -30, impactPercent: -5, description: 'Regulatory reputation impact on school ratings and parent trust' },
      { portfolio: 'facilities', impactAED: -55, impactPercent: -10, description: 'Carbon compliance costs, energy efficiency retrofit capex acceleration' },
    ],
    parameters: { intensity: 'moderate', duration: '18 months', probability: 0.25 },
  },
  {
    id: 'S-008',
    name: 'Pandemic / Health Crisis Resurgence',
    description: 'Novel respiratory pandemic causes UAE government to impose social distancing measures for 6–9 months, impacting all physical-space-dependent businesses across the portfolio',
    category: 'Health / Black Swan',
    affectedPortfolios: ['hospitality', 'retail', 'education', 'real-estate'],
    estimatedImpact: [
      { portfolio: 'hospitality', impactAED: -580, impactPercent: -65, description: 'Hotels temporarily closed, theme parks shut, events cancelled for 6+ months' },
      { portfolio: 'retail', impactAED: -360, impactPercent: -54, description: 'Mall closures, turnover rent collapses, rent deferrals to preserve tenant covenant' },
      { portfolio: 'education', impactAED: -95, impactPercent: -17, description: 'School closures, hybrid learning costs, enrollment pause for new campuses' },
      { portfolio: 'real-estate', impactAED: -480, impactPercent: -19, description: 'Construction halt, off-plan sales freeze, handover delays cascade' },
    ],
    parameters: { intensity: 'severe', duration: '12 months', probability: 0.07 },
  },
]

// ============================================================
// KPI TIME SERIES DATA (12 months)
// ============================================================

// KPI time series computed by propagation engine — reflects realistic seasonality:
// Summer (Jun–Aug): tourism low → hospitality/retail risk scores spike.
// Peak (Nov–Dec): F1 GP + Yasalam events → scores drop to seasonal minimum.
// Shoulder (Apr): transitioning back upward as events approach 7-month horizon.
export const kpiData = {
  months: COMPUTED_HISTORY.months,
  portfolioRiskScores: COMPUTED_HISTORY.portfolioRiskScores,
  overallRiskScore: COMPUTED_HISTORY.overallRiskScore,
  // AI alerts correlate with risk score velocity (higher when scores rising fast)
  aiAlertsPerMonth: [11, 18, 22, 20, 14, 13, 9, 10, 13, 16, 19, 21],
  financialExposure: COMPUTED_HISTORY.financialExposure,
}

// ============================================================
// AGGREGATE KPIs
// ============================================================

// Aggregate KPIs derived from propagation engine output.
// Risk counts reflect updated riskRegister scores (propagation-adjusted):
// R-003 +3pts (shoulder season tourism), R-007 +2pts (medium geopolitical),
// R-009 +3pts (downstream footfall), R-014 +4pts (7-month event void).
export const aggregateKPIs = {
  totalRiskScore: Math.round(
    Object.values(PROPAGATED_METRICS).reduce((s, m) => s + m.riskScore, 0) / 5
  ),
  criticalRisks: 2,    // R-001 (16), R-004 (16)
  highRisks: 7,        // R-002,003,006,007,009,011,014 (all ≥10, <16)
  mediumRisks: 6,      // R-005,008,010,012,013,015
  lowRisks: 0,
  totalFinancialExposure: Object.values(PROPAGATED_METRICS).reduce((s, m) => s + m.financialExposure, 0),
  aiAlertsToday: 26,   // 10 external + 4 ERP + 4 CRM + 3 project + 5 AI generated
  risksIncreasing: 8,  // R-001,003,004,007,009,011,014,015
  risksStable: 5,      // R-002,005,006,010,012
  risksDecreasing: 2,  // R-008,013
}

// Portfolio display names
export const portfolioNames: Record<Portfolio, string> = {
  'real-estate': 'Real Estate',
  'retail': 'Retail',
  'hospitality': 'Hospitality',
  'education': 'Education',
  'facilities': 'Facilities',
}
