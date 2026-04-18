// lib/portfolioData.ts
// Enterprise-scale portfolio risk universe — Aldar Properties PJSC
// Simulates 200–400 risks per business unit as would feed from Oracle Fusion ERP + risk register

export type PortfolioKey = 'real-estate' | 'retail' | 'hospitality' | 'education' | 'facilities'
export type RiskCategory = 'demand' | 'market' | 'operational' | 'financial'
export type RiskLevel = 'high' | 'medium' | 'low'
export type RiskTrend = 'increasing' | 'stable' | 'decreasing'

export interface EnterpriseRisk {
  id: string
  title: string
  description: string
  category: RiskCategory
  level: RiskLevel
  trend: RiskTrend
  score: number          // 1–25
  financialImpact: number // AED M
}

export interface CategoryBreakdown {
  total: number
  high: number
  medium: number
  low: number
}

export interface PortfolioRiskProfile {
  id: PortfolioKey
  name: string
  color: string
  assets: number
  revenue: number                              // AED annual
  revenueAtRisk: { low: number; high: number } // AED M
  totalRisks: number
  breakdown: Record<RiskLevel, number>
  categoryBreakdown: Record<RiskCategory, CategoryBreakdown>
  trend: RiskTrend
  overallLevel: 'critical' | RiskLevel
  topRisks: EnterpriseRisk[]  // top 10 by score
}

// ─── Seeded deterministic PRNG ────────────────────────────────────────────────
function mkRng(seed: number) {
  let s = seed
  const next = (): number => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(arr: T[]): T => arr[Math.floor(next() * arr.length)],
    level: (highPct: number, medPct: number): RiskLevel => {
      const r = next()
      return r < highPct ? 'high' : r < highPct + medPct ? 'medium' : 'low'
    },
    trend: (incrPct: number): RiskTrend => {
      const r = next()
      return r < incrPct ? 'increasing' : r < incrPct + 0.35 ? 'stable' : 'decreasing'
    },
  }
}

// ─── Category description templates (5 per category, cycled) ─────────────────
const DESC: Record<RiskCategory, string[]> = {
  demand: [
    'Market intelligence signals a measurable contraction in demand pipeline. CRM conversion tracking indicates buyer hesitation driven by macro-economic uncertainty and competitive alternatives. Requires immediate pricing and incentive review.',
    'Demand shortfall identified through sales velocity analysis and pipeline aging metrics. Early-warning indicators show conversion rates below 90-day rolling average. Proactive engagement with target buyer segments recommended.',
    'Consumer demand pressure detected across primary target segments. Foot-traffic, inquiry volumes, and lead-to-sale conversion metrics all trending below plan. Management attention required within 30-day window.',
    'Demand-side risk emerging from external market forces and shifting consumer preferences. Internal data validates reduced inbound enquiry rate and extended decision cycles. Competitive repositioning analysis warranted.',
    'Structural demand pressure from digital disruption, demographic shift, or competitive entry. Sales team feedback corroborates pipeline thinning. Revenue forecast revision likely without demand stimulation actions.',
  ],
  market: [
    'External market forces creating headwinds for pricing power and competitive positioning. Macro-economic indicators and sector intelligence point to sustained pressure over 6–12 month horizon.',
    'Competitive landscape analysis indicates intensifying pressure from new entrants and substitutes. Market share defence requires differentiated value proposition and accelerated product innovation response.',
    'Regulatory and policy environment in transition, creating uncertainty for business planning and investment decisions. Scenario modelling around two to three policy outcomes recommended to stress-test strategy.',
    'Macroeconomic variables — interest rates, oil price, FX, global sentiment — creating correlated external risk exposure. Portfolio sensitivity analysis against core scenarios should be updated quarterly.',
    'Market structure disruption from technology, regulation, or competitive dynamics is reshaping the competitive context. Strategic response planning and capability investment decisions are time-sensitive.',
  ],
  operational: [
    'Operational performance metric trending below threshold. Root cause analysis indicates resource constraint, process inefficiency, or technology limitation requiring targeted remediation within 60 days.',
    'Process failure or capacity constraint identified through operational monitoring. KPI deviation from plan is widening, indicating a systemic issue rather than one-off variance. Management escalation appropriate.',
    'Operational risk signal from quality monitoring, safety audits, or system performance tracking. Non-compliance or performance shortfall requires corrective action plan with defined accountability and milestones.',
    'Workforce or supply chain constraint creating operational delivery risk. Capacity planning review and contingency sourcing options should be activated to protect service levels and project commitments.',
    'Technology, infrastructure, or vendor performance risk flagged by operational monitoring systems. Business continuity implications require assessment, with fallback procedures tested and confirmed adequate.',
  ],
  financial: [
    'Financial performance variance against budget identified through management accounts review. Cash flow, margin, or collection metrics trending adversely. CFO attention and reforecast warranted.',
    'Revenue or cost driver deviating from plan, creating P&L pressure. Financial risk model sensitivity analysis indicates potential material impact on full-year outlook if trend is not reversed.',
    'Liquidity, leverage, or covenant metric approaching threshold. Early warning trigger activated. Proactive communication with banking relationships and financial risk committee escalation recommended.',
    'Cost inflation, pricing pressure, or volume shortfall creating margin compression. Financial planning team to update rolling forecast with revised assumptions and management mitigation options.',
    'Audit, compliance, or regulatory financial reporting risk identified. External auditor communication and internal control review required to assess materiality and disclosure obligations.',
  ],
}

// ─── Risk title templates per portfolio × category ────────────────────────────

const TITLES: Record<PortfolioKey, Record<RiskCategory, string[]>> = {
  'real-estate': {
    demand: [
      'Off-Plan Sales Shortfall — Saadiyat Beach Phase 3',
      'Off-Plan Sales Shortfall — Yas Island Residences Block C',
      'Off-Plan Sales Shortfall — Al Raha Beach Development',
      'Off-Plan Sales Shortfall — Reem Island Tower 5',
      'Off-Plan Sales Shortfall — Jubail Island Phase 2',
      'Buyer Demand Decline — Luxury Segment (>AED 3M)',
      'Buyer Demand Decline — Mid-Market Residential',
      'Buyer Demand Decline — Foreign National Investors',
      'Buyer Demand Decline — Holiday Home Purchasers',
      'Mortgage Affordability Constraint — Expat First-Time Buyers',
      'Mortgage Affordability Constraint — UAE National Buyers',
      'Expat Population Churn — Oil & Gas Sector Relocation',
      'Expat Population Churn — Financial Services Workforce',
      'Sales Conversion Rate Decline — Digital Channel',
      'Sales Conversion Rate Decline — International Roadshows',
      'Secondary Market Liquidity Decline — Resale Volume',
      'Demand-Supply Imbalance — Abu Dhabi Residential Corridor',
      'Handover Delay Sentiment Impact on Future Sales',
      'Community Amenity Quality Impact on Buyer Decision',
      'Payment Plan Competitiveness vs. Market Alternatives',
      'Saadiyat Lagoons Phase 2 Uptake Below Target',
      'Yas Acres Community Demand Softening',
      'Mayan Yas Island Buyer Profile Shift',
      'Developer Brand Sentiment — Post-Handover Quality',
      'Investment Return Expectation Gap vs. Market',
    ],
    market: [
      'Interest Rate Headwind — UAE Central Bank Benchmark Rate',
      'Interest Rate Headwind — Mortgage Rate Sensitivity (50bps+)',
      'Competitive Launch — Emaar Off-Plan Abu Dhabi Entry',
      'Competitive Launch — Bloom Holding Scale-Up',
      'Competitive Launch — Modon Properties Abu Dhabi',
      'Residential Oversupply — Saadiyat Island Corridor',
      'Residential Oversupply — Yas Island New Supply',
      'Global Real Estate Cycle — US/UK Market Correction Spillover',
      'Land Price Escalation — Prime Abu Dhabi Zones',
      'Regulatory Change — RERA Policy Update Risk',
      'Regulatory Change — Foreign Ownership Rules Expansion',
      'FX Volatility — EUR/GBP Depreciation Reduces European Buyers',
      'REIT Competition for Institutional Investment Demand',
      'Sustainability Mandate — Green Building Cost Impact',
      'Abu Dhabi GDP Growth Trajectory Uncertainty',
      'Oil Price Decline — Government Multiplier Effect on Demand',
      'PropTech Disintermediation — Digital Sales Bypass',
      'Global Investor Sentiment — Emerging Market Risk-Off',
      'UAE Visa Policy Change — Golden Visa Program Impact',
      'ADX Aldar Share Price Sensitivity to Development Volumes',
    ],
    operational: [
      'Construction Delay — Saadiyat Phase 3 Foundation Works',
      'Construction Delay — Yas Residences Block C MEP Installations',
      'Construction Delay — Al Raha Creek Phase 2 Structural',
      'Construction Cost Overrun — Steel & Concrete Materials',
      'Construction Cost Overrun — Mechanical & Electrical Works',
      'Construction Cost Overrun — Fit-Out to Specification',
      'Subcontractor Default Risk — Tier 2 Civil Works',
      'Subcontractor Default Risk — Specialist Facade Contractor',
      'Labor Availability — Skilled Trades Shortage',
      'Labor Availability — Engineers & Site Supervisors',
      'Supply Chain Disruption — Imported Specialist Materials',
      'Supply Chain Disruption — Equipment Lead Times',
      'Design Change Orders — Client-Driven Variations',
      'Regulatory Approval Delay — Municipality Permits',
      'Regulatory Approval Delay — Utilities Connection',
      'Quality Defect Risk — Structural Snagging Volume',
      'Quality Defect Risk — Premium Finishing Standards',
      'HSE Incident — Lost Time Injury Rate',
      'HSE Incident — Regulatory Investigation Trigger',
      'BIM Coordination Failure — Clash Detection',
      'Infrastructure Readiness — Road Access Timing',
      'Infrastructure Readiness — District Cooling Availability',
      'Estidama Pearl Rating Compliance Cost',
      'Project Management Resource Constraint',
      'Post-Handover Warranty Claims Backlog',
    ],
    financial: [
      'Development Cost Overrun — Portfolio-Wide AED 8.2Bn Pipeline',
      'Off-Plan Collection Rate Below 95% Target',
      'Escrow Fund Adequacy — Regulatory Compliance',
      'Project Finance Availability — Bank Appetite Tightening',
      'Development Margin Compression — Cost + Revenue Squeeze',
      'FX Hedging Cost — Development Currency Mismatch',
      'Working Capital Strain — Long 36-Month Development Cycles',
      'Capex Planning Accuracy — Phase 2 Commitment Exposure',
      'Bank Covenant Compliance — LTV Threshold Breach',
      'Interest Expense Escalation — Development Financing',
      'Cash Flow Forecasting Accuracy — Phased Sales Recognition',
      'VAT Compliance — Property Sale Classification',
      'Receivables Aging — Slow Payer Portfolio',
      'Insurance Coverage Gap — Construction CAR Policy',
      'Audit Finding — Revenue Recognition Timing (IFRS 15)',
    ],
  },

  retail: {
    demand: [
      'Footfall Decline — Yas Mall General Weekend Traffic',
      'Footfall Decline — Al Jimi Mall Weekday Visitors',
      'Footfall Decline — Abu Dhabi Mall Shoulder Period',
      'Footfall Decline — Tourist Spend Contribution Decline',
      'E-Commerce Cannibalization — Fashion & Apparel Category',
      'E-Commerce Cannibalization — Electronics & Gadgets',
      'E-Commerce Cannibalization — Home Goods & Furniture',
      'Tenant Health Deterioration — F&B Operators',
      'Tenant Health Deterioration — Fashion Anchor Tenants',
      'Tenant Health Deterioration — Entertainment Operators',
      'Anchor Tenant Exit Risk — Department Store Lease Expiry',
      'Anchor Tenant Exit Risk — Cinema Operator Contract',
      'Anchor Tenant Exit Risk — Hypermarket Relocation',
      'Consumer Confidence Decline — UAE Resident Discretionary Spend',
      'Seasonal Sales Variation — Extreme Summer Low Season',
      'Tourist Spend Shift — Declining International Retail Conversion',
      'Ramadan Trading Pattern — Shift to Online',
      'Community Mall Vacancy Uptick — Neighborhood Centers',
      'Experiential Retail Demand Shift — Repositioning Lag',
      'Digital Payment Adoption — Transaction Mix Impact',
    ],
    market: [
      'Online Retail Disruption — Noon.com Market Share Growth',
      'Online Retail Disruption — Amazon.ae Category Expansion',
      'Mall Competition — New GLA Supply Abu Dhabi 2026–28',
      'Consumer Spending Contraction — Oil Price Multiplier',
      'Inflation Impact — Discretionary Spend Reallocation',
      'Destination vs. Community Mall Polarization',
      'Luxury Retail Market Saturation — Abu Dhabi',
      'F&B Category Oversaturation — Mall Competitive Density',
      'Omnichannel Retail Disruption — Click & Collect Shift',
      'Social Commerce Rise — TikTok/Instagram Shopping Bypass',
      'Sustainable Consumer Preference Shift — Tenant Mix',
      'Grocery Delivery Platform Impact — Hypermarket Footfall',
      'Remote Work Pattern — Weekday vs. Weekend Footfall Gap',
      'Retail-to-Other-Use Conversion — Market Structural Shift',
    ],
    operational: [
      'Lease Renewal Risk — High-Value Anchor Tenant Expiry',
      'Lease Renewal Risk — Cluster of Leases Expiring Q3 2026',
      'Vacancy Management — Dark Unit Strategy',
      'Marketing Campaign ROI Decline',
      'Events Programming Cancellation — Revenue Impact',
      'Energy Cost Escalation — Electricity Tariff Review',
      'HVAC System Reliability — Cooling Failure in Peak Season',
      'Car Parking Capacity — Peak Friday Management',
      'Wi-Fi & Digital Infrastructure Reliability',
      'CRM Data Quality — Customer Insight Accuracy',
      'Loyalty Program Engagement Decline',
      'Cleaning & Hygiene Standards Audit Failure',
      'Security Incident Management',
      'Tenant Fit-Out Delay — New Openings Program',
      'Service Charge Recovery Rate Below Target',
      'Wayfinding & Customer Experience Quality Decline',
    ],
    financial: [
      'Rental Income Shortfall — Vacancy Rate Increase',
      'Rental Income Shortfall — Rent-Free Period Extensions',
      'Tenant Default — Payment Arrears Aging',
      'Tenant Default — CVA or Administration Event',
      'Service Charge Collection — Arrears Growth',
      'Marketing Fund Adequacy for Repositioning',
      'Insurance Premium Escalation — Retail Asset Coverage',
      'Maintenance Capex — Asset Life Extension Program',
      'IFRS 16 Lease Accounting Compliance',
      'Bank Covenant Compliance — Mall Asset LTV',
      'Tenant Incentive ROI — Fit-Out Contribution Returns',
    ],
  },

  hospitality: {
    demand: [
      'Hotel Occupancy Decline — Yas Island Properties (Q1 68%)',
      'Hotel Occupancy Decline — Abu Dhabi City Hotels',
      'Hotel Occupancy Decline — Weekend Leisure Segment',
      'ADR Pressure — Yas Viceroy Competitive Undercutting',
      'ADR Pressure — Rotana Portfolio Rate Erosion',
      'MICE Event Cancellation — Abu Dhabi Convention Centre',
      'MICE Demand Shortfall — Corporate Meetings Market',
      'F&B Covers Decline — Signature Restaurant Portfolio',
      'F&B Covers Decline — Banqueting & Events Revenue',
      'Theme Park Attendance Shortfall — Ferrari World',
      'Theme Park Attendance Shortfall — Yas Waterworld',
      'Theme Park Attendance Shortfall — Warner Bros. World',
      'Business Travel Demand Decline — Corporate Segment',
      'Leisure Package Demand — International Source Markets',
      'Spa & Wellness Revenue Below Forecast',
      'Event-Driven Revenue Concentration Risk — GP/Formula',
      'Summer Low Season Occupancy Trough',
      'Long-Stay Corporate Segment Underdevelopment',
      'GCC Domestic Tourist Source Market Shift',
    ],
    market: [
      'Saudi Arabia Tourism Competition — NEOM / Red Sea Hotels',
      'Saudi Arabia Vision 2030 — New Luxury Hotel Supply',
      'Qatar Post-World Cup — Distressed Hotel Pricing',
      'Dubai Spillover Competition — Shared Tourism Market',
      'Oil Price Decline — GCC Leisure Spend Contraction',
      'Geopolitical Instability — Regional Travel Advisory',
      'Airline Connectivity Reduction — Abu Dhabi Routes',
      'Gaming Tourism — Regulatory Uncertainty (UAE)',
      'Global Tourism Recession — Recessionary Travel Pullback',
      'Luxury Hotel Oversupply — Abu Dhabi New Openings 2026',
      'Brand Affiliation Contract — Franchise Renewal Risk',
      'Wellness Tourism Emergence — Repositioning Requirement',
      'Sustainability Traveler Preference — Certification Gap',
    ],
    operational: [
      'Staffing Shortage — F&B Service Staff Turnover',
      'Staffing Shortage — Front-of-House Reception Quality',
      'Staffing Shortage — Housekeeping Team Attrition',
      'Brand Standards Compliance — Annual Franchise Audit',
      'F&B Quality Control — Supplier Standards Deviation',
      'Maintenance Backlog — Rooms Renovation Programme',
      'Maintenance Backlog — Pool & Leisure Facility Upkeep',
      'Health & Safety — Food Hygiene Compliance Audit',
      'Health & Safety — Pool Safety Standards Review',
      'Revenue Management System Optimisation Lag',
      'OTA Channel Mix — Commission Escalation',
      'Guest Satisfaction Score Decline — TripAdvisor/Google',
      'Energy Efficiency — HVAC Operational Cost Overrun',
      'Sustainability Certification — Green Globe / LEED Gap',
      'Emergency Response Protocol — Incident Management',
    ],
    financial: [
      'RevPAR Trajectory — YoY Decline (Q1 -6%)',
      'EBITDA Margin Compression — Cost Inflation Impact',
      'Debt Service Coverage — Hotel Asset Financing',
      'FF&E Renovation Capex — 5-Year Programme Funding',
      'Insurance Premium — Business Interruption Cover',
      'Working Capital — Seasonal Cash Flow Trough (Summer)',
      'OTA Commission Cost Growth — Revenue Dilution',
      'F&B Input Cost Inflation — Supply Chain',
      'Staff Cost Inflation — UAE Wage Benchmark',
      'Energy Cost Escalation — Hotel Electricity & Cooling',
    ],
  },

  education: {
    demand: [
      'Student Enrollment Shortfall — Primary Phase Schools',
      'Student Enrollment Shortfall — Secondary Phase Intake',
      'Student Enrollment Shortfall — New School Opening',
      'Enrollment Shortfall — Foundation / EYFS Stage',
      'Community Catchment Timing — Residential Handover Lag',
      'Expat Family Churn — Corporate Workforce Relocation',
      'Demographic Shift — Birth Rate Decline in Catchment',
      'School Reputation Decline — ADEK Inspection Outcome',
      'Extra-Curricular Quality — Retention Programme Impact',
      'Transport Convenience — Bus Route Coverage Gap',
      'Fee Sensitivity — Parental Willingness-to-Pay Ceiling',
      'Competitor School Opening — Catchment Area Overlap',
      'Parent Referral Rate Decline — NPS Score Trend',
    ],
    market: [
      'ADEK Regulatory Change — Curriculum Mandate Update',
      'ADEK Regulatory Change — Teacher Certification Requirements',
      'ADEK Inspection Outcome — Rating Downgrade Risk',
      'Private School Competition — GEMS Education Expansion',
      'Private School Competition — Taaleem New Schools Opening',
      'National Curriculum Reform — IB vs. British vs. American',
      'EdTech Disruption — Hybrid & Online Learning Adoption',
      'Parent Consumer Rights Legislation — Fee Regulation',
      'School Accreditation Standards — Tightening Criteria',
      'UAE Vision 2031 Education Policy Alignment Requirement',
      'International Teacher Recruitment Market Competition',
    ],
    operational: [
      'Teacher Retention — Key Subject Specialist Attrition',
      'Teacher Recruitment — STEM Subject Gap',
      'IT Infrastructure Reliability — Learning Platform Uptime',
      'Student Welfare & Safeguarding Compliance',
      'Curriculum Delivery Quality — KHDA/OFSTED Benchmark',
      'Parent Communication Effectiveness — App & Portal',
      'School Bus Logistics — Route Coverage & Reliability',
      'Facilities Maintenance — Aging School Building Stock',
      'Campus Security — Access Control Systems',
      'Data Protection — Student Records (GDPR-aligned Policy)',
      'Emergency Response — Pandemic & Incident Protocols',
      'SEN Provision Quality — Specialist Support Staff',
      'Learning Management System — Teacher Adoption Rate',
      'School Canteen Quality & Nutrition Standards',
    ],
    financial: [
      'Fee Collection Rate — Arrears Management',
      'Fee Collection Rate — Instalment Plan Defaults',
      'Operating Cost — Staff-to-Student Ratio Efficiency',
      'Capex — New School Construction Cost Overrun',
      'Government Grant Dependency — Abu Dhabi Education Fund',
      'Bursary & Scholarship Programme Cost Management',
      'Audit Compliance — Regulatory Financial Accounts',
      'Insurance Coverage — Liability & Property',
      'Utility Cost Escalation — Schools Estate Portfolio',
    ],
  },

  facilities: {
    demand: [
      'FM Contract Non-Renewal — Government Portfolio Client',
      'FM Contract Non-Renewal — Real Estate Asset Owner',
      'FM Contract Non-Renewal — Hospitality Division',
      'FM Scope Reduction — Client Cost-Cutting Programme',
      'In-House FM Reversion — Client Insourcing Decision',
      'New Contract Pipeline — Award Conversion Rate',
      'Client Satisfaction Score — Contract Retention Risk',
      'Bundled Services Adoption — Cross-Sell Revenue Gap',
      'Smart Building Services Demand Not Captured',
      'Energy Services Expansion — Market Opportunity Loss',
    ],
    market: [
      'FM Price Competition — Emrill Services Market Share',
      'FM Price Competition — Farnek Group Aggressive Pricing',
      'FM Price Competition — Khidmah Government Contracts',
      'Smart Building Technology Disruption — Market Shift',
      'IoT-Enabled FM — Technology Adoption Lag',
      'Digital Twin Platform Emergence — Competitive Gap',
      'International FM Player Entry — CBRE / JLL FM Division',
      'Consolidation Trend — M&A Activity Competitive Threat',
      'Outsourcing Regulation Changes — UAE Labour Policy',
      'Energy Services Market Commoditisation',
      'Sustainability Services Market Shift — ESG FM Demand',
    ],
    operational: [
      'Cyber Security — BMS (Building Management System) Breach',
      'Cyber Security — IoT Sensor Network Vulnerability',
      'Cyber Security — SCADA System Exposure Risk',
      'Cyber Security — Ransomware Attack on CAFM Platform',
      'Staff Productivity Decline — Field Workforce KPIs',
      'Skilled Technician Attrition — Mechanical & Electrical',
      'Asset Lifecycle Management — CMMS Data Accuracy',
      'Preventive Maintenance Compliance Rate Below SLA',
      'Reactive Maintenance Response Time — SLA Breach',
      'Environmental Compliance — Waste Management Standards',
      'Environmental Compliance — Carbon Emissions Monitoring',
      'Emergency Response Time — Critical Systems Failure',
      'Contractor Management — Third-Party Quality Assurance',
      'ISO 41001 Quality Audit — Non-Conformance Risk',
      'Health & Safety — Field Worker Incident Rate',
      'Energy Management System — Smart Metering Accuracy',
      'CAFM Platform Reliability — System Downtime',
    ],
    financial: [
      'Margin Compression — Labour Cost Inflation Impact',
      'Procurement Cost Escalation — Materials & Spare Parts',
      'Contract Profitability — Underperforming Accounts Review',
      'Insurance Claims — Third-Party Liability Exposure',
      'Working Capital — Receivables Aging Management',
      'Capex — Fleet & Equipment Replacement Programme',
      'Audit Compliance — Revenue Recognition Timing',
      'Subcontractor Default — Payment Dispute Resolution',
      'Mobilisation Cost Overrun — New Contract Activation',
    ],
  },
}

// ─── Portfolio configuration ──────────────────────────────────────────────────

interface PortfolioConfig {
  name: string
  color: string
  assets: number
  revenue: number
  revenueAtRisk: { low: number; high: number }
  overallLevel: 'critical' | RiskLevel
  trend: RiskTrend
  seed: number
  counts: Record<RiskCategory, number>
  highPct: number
  medPct: number
  trendIncrPct: number
}

const CONFIGS: Record<PortfolioKey, PortfolioConfig> = {
  'real-estate': {
    name: 'Real Estate',
    color: '#C9A84C',
    assets: 25,
    revenue: 1_200_000_000,
    revenueAtRisk: { low: 85, high: 220 },
    overallLevel: 'high',
    trend: 'increasing',
    seed: 4291,
    counts: { demand: 75, market: 70, operational: 90, financial: 65 },
    highPct: 0.22,
    medPct: 0.42,
    trendIncrPct: 0.40,
  },
  retail: {
    name: 'Retail',
    color: '#4A9EFF',
    assets: 12,
    revenue: 800_000_000,
    revenueAtRisk: { low: 55, high: 140 },
    overallLevel: 'medium',
    trend: 'stable',
    seed: 7813,
    counts: { demand: 70, market: 60, operational: 85, financial: 55 },
    highPct: 0.18,
    medPct: 0.44,
    trendIncrPct: 0.30,
  },
  hospitality: {
    name: 'Hospitality',
    color: '#A855F7',
    assets: 10,
    revenue: 600_000_000,
    revenueAtRisk: { low: 40, high: 110 },
    overallLevel: 'high',
    trend: 'increasing',
    seed: 3157,
    counts: { demand: 65, market: 55, operational: 80, financial: 50 },
    highPct: 0.24,
    medPct: 0.40,
    trendIncrPct: 0.45,
  },
  education: {
    name: 'Education',
    color: '#22C55E',
    assets: 20,
    revenue: 400_000_000,
    revenueAtRisk: { low: 20, high: 55 },
    overallLevel: 'medium',
    trend: 'stable',
    seed: 9624,
    counts: { demand: 55, market: 45, operational: 75, financial: 45 },
    highPct: 0.16,
    medPct: 0.46,
    trendIncrPct: 0.25,
  },
  facilities: {
    name: 'Facilities',
    color: '#FF6B6B',
    assets: 35,
    revenue: 350_000_000,
    revenueAtRisk: { low: 15, high: 45 },
    overallLevel: 'medium',
    trend: 'stable',
    seed: 6042,
    counts: { demand: 50, market: 55, operational: 90, financial: 45 },
    highPct: 0.17,
    medPct: 0.43,
    trendIncrPct: 0.28,
  },
}

// ─── Score ranges per level ───────────────────────────────────────────────────
const SCORE_RANGE: Record<RiskLevel, [number, number]> = {
  high: [12, 25],
  medium: [6, 11],
  low: [1, 5],
}

const IMPACT_RANGE: Record<RiskLevel, [number, number]> = {
  high: [25, 150],
  medium: [8, 40],
  low: [1, 12],
}

// ─── Risk generation ──────────────────────────────────────────────────────────
function generateRisks(
  portfolioId: PortfolioKey,
  config: PortfolioConfig
): EnterpriseRisk[] {
  const rng = mkRng(config.seed)
  const risks: EnterpriseRisk[] = []
  const categories: RiskCategory[] = ['demand', 'market', 'operational', 'financial']

  for (const cat of categories) {
    const count = config.counts[cat]
    const titles = TITLES[portfolioId][cat]
    const descriptions = DESC[cat]

    for (let i = 0; i < count; i++) {
      const title = titles[i % titles.length]
      const suffix = i >= titles.length ? ` — Variant ${Math.floor(i / titles.length) + 1}` : ''
      const level = rng.level(config.highPct, config.medPct)
      const trend = rng.trend(config.trendIncrPct)
      const [sMin, sMax] = SCORE_RANGE[level]
      const [iMin, iMax] = IMPACT_RANGE[level]

      risks.push({
        id: `${portfolioId.substring(0, 2).toUpperCase()}-${cat.substring(0, 1).toUpperCase()}-${String(risks.length + 1).padStart(3, '0')}`,
        title: title + suffix,
        description: descriptions[i % descriptions.length],
        category: cat,
        level,
        trend,
        score: rng.int(sMin, sMax),
        financialImpact: rng.int(iMin, iMax),
      })
    }
  }

  return risks
}

// ─── Compute aggregates ───────────────────────────────────────────────────────
function buildProfile(portfolioId: PortfolioKey): PortfolioRiskProfile {
  const config = CONFIGS[portfolioId]
  const allRisks = generateRisks(portfolioId, config)

  const breakdown: Record<RiskLevel, number> = { high: 0, medium: 0, low: 0 }
  const catBreak: Record<RiskCategory, CategoryBreakdown> = {
    demand: { total: 0, high: 0, medium: 0, low: 0 },
    market: { total: 0, high: 0, medium: 0, low: 0 },
    operational: { total: 0, high: 0, medium: 0, low: 0 },
    financial: { total: 0, high: 0, medium: 0, low: 0 },
  }

  for (const r of allRisks) {
    breakdown[r.level]++
    catBreak[r.category].total++
    catBreak[r.category][r.level]++
  }

  const topRisks = [...allRisks]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  return {
    id: portfolioId,
    name: config.name,
    color: config.color,
    assets: config.assets,
    revenue: config.revenue,
    revenueAtRisk: config.revenueAtRisk,
    totalRisks: allRisks.length,
    breakdown,
    categoryBreakdown: catBreak,
    trend: config.trend,
    overallLevel: config.overallLevel,
    topRisks,
  }
}

// ─── Exported profiles ────────────────────────────────────────────────────────
export const portfolioProfiles: Record<PortfolioKey, PortfolioRiskProfile> = {
  'real-estate': buildProfile('real-estate'),
  retail: buildProfile('retail'),
  hospitality: buildProfile('hospitality'),
  education: buildProfile('education'),
  facilities: buildProfile('facilities'),
}

export const PORTFOLIO_KEYS: PortfolioKey[] = [
  'real-estate', 'retail', 'hospitality', 'education', 'facilities',
]
