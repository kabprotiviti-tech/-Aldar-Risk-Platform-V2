/**
 * UAE Regulator Map — illustrative scope
 * --------------------------------------
 * The regulatory bodies whose mandates touch a listed Abu Dhabi real
 * estate group. Each entry summarises authority, scope, and the
 * obligations Aldar must meet — plus the linked Group Appetite
 * Statements that frame our tolerance.
 *
 * All summary text is illustrative pre-pilot — pilot will replace each
 * entry with the Compliance team's authoritative obligations register
 * and the actual Aldar-tracked deadlines.
 */

export type RegulatorTier = 'federal' | 'emirate' | 'market' | 'sector'

export interface Regulator {
  id: string
  /** Short acronym e.g. "ADX". */
  acronym: string
  /** Full name. */
  name: string
  tier: RegulatorTier
  /** One-paragraph mandate summary. */
  mandate: string
  /** Key obligations Aldar carries vis-à-vis this body. */
  obligations: string[]
  /** Reporting cadence to this regulator. */
  cadence: string
  /** Group appetite statement IDs that anchor tolerance to this regulator. */
  linkedAppetiteIds: string[]
  /** External website (illustrative — used only for the badge label). */
  website: string
}

export const REGULATORS: Regulator[] = [
  {
    id: 'REG-ADX',
    acronym: 'ADX',
    name: 'Abu Dhabi Securities Exchange',
    tier: 'market',
    mandate:
      'Abu Dhabi listing venue. Sets continuous-disclosure, market-conduct, and listing rules for all listed issuers. Aldar (ticker: ALDAR) is required to disclose material information promptly and file periodic financial statements.',
    obligations: [
      'Continuous disclosure of material information',
      'Half-year and annual audited financial statements',
      'Insider-trading and closed-period black-out rules',
      'Material related-party transaction notifications',
      'Annual ESG / governance report',
    ],
    cadence: 'Continuous + Half-yearly + Annual',
    linkedAppetiteIds: ['GA-CMP-01', 'GA-REP-01'],
    website: 'adx.ae',
  },
  {
    id: 'REG-SCA',
    acronym: 'SCA',
    name: 'Securities & Commodities Authority',
    tier: 'federal',
    mandate:
      'UAE federal securities regulator. Sets the disclosure framework, governance code, and corporate-actions rules that listed issuers must comply with across ADX and DFM.',
    obligations: [
      'Compliance with SCA Corporate Governance Code',
      'Disclosure of material events within statutory windows',
      'Annual governance and shareholder report',
      'Approval flow for capital-structure actions (rights issues, bond issuance, M&A)',
    ],
    cadence: 'Continuous + Annual',
    linkedAppetiteIds: ['GA-CMP-01', 'GA-FIN-01'],
    website: 'sca.gov.ae',
  },
  {
    id: 'REG-CBUAE',
    acronym: 'CB UAE',
    name: 'Central Bank of the UAE',
    tier: 'federal',
    mandate:
      'Indirectly material via banking counterparties. Sets the AML / CFT framework that Aldar must align with at customer onboarding, supervises bank counterparties holding escrow accounts, and frames the broad financial-stability environment that affects buyer financing.',
    obligations: [
      'AML / CFT compliance for customer onboarding (KYC, source-of-funds)',
      'Sanctions-list screening on buyers and counterparties',
      'Bank-counterparty due diligence on escrow account providers',
    ],
    cadence: 'Continuous',
    linkedAppetiteIds: ['GA-CMP-01', 'GA-FIN-02'],
    website: 'centralbank.ae',
  },
  {
    id: 'REG-ADREC',
    acronym: 'ADREC',
    name: 'Abu Dhabi Real Estate Centre',
    tier: 'emirate',
    mandate:
      'Abu Dhabi real-estate sector regulator. Oversees brokerage licensing, project registration, escrow law application in Abu Dhabi, valuation standards, and the property index (used as the residential price benchmark in the platform).',
    obligations: [
      'Project registration and escrow-account compliance for off-plan sales',
      'Broker / valuer licensing and conduct',
      'Adherence to ADREC valuation standards on annual revaluation',
      'Submission of project handover and unit-status data',
    ],
    cadence: 'Per-project + Annual',
    linkedAppetiteIds: ['GA-CMP-01', 'GA-OP-01'],
    website: 'adrec.gov.ae',
  },
  {
    id: 'REG-DLD',
    acronym: 'DLD',
    name: 'Dubai Land Department',
    tier: 'emirate',
    mandate:
      'Dubai counterpart of ADREC. Material to Aldar where projects are in the Dubai emirate (joint ventures, expansions). Operates the Mollak escrow service, Oqood off-plan registration, and DLD project-handover compliance.',
    obligations: [
      'Mollak / DLD escrow account compliance',
      'Oqood off-plan unit registration',
      'Project-handover compliance and DLD penalty avoidance (ties to KRI-12)',
      'Title-deed registration on completion',
    ],
    cadence: 'Per-project + Per-handover',
    linkedAppetiteIds: ['GA-CMP-01', 'GA-OP-01'],
    website: 'dld.gov.ae',
  },
  {
    id: 'REG-RERA',
    acronym: 'RERA',
    name: 'Real Estate Regulatory Agency (Dubai)',
    tier: 'emirate',
    mandate:
      'Operating arm of DLD. Issues developer licences, oversees off-plan project registration, escrow audits, and brokerage / property-management conduct in the Dubai emirate.',
    obligations: [
      'Developer registration and renewal',
      'Project escrow audit submissions',
      'Brokerage and property-management licensing',
      'Service-charge and owners-association compliance',
    ],
    cadence: 'Annual + Per-project',
    linkedAppetiteIds: ['GA-CMP-01'],
    website: 'rera.gov.ae',
  },
  {
    id: 'REG-DTCM',
    acronym: 'DET / DTCM',
    name: 'Department of Economy & Tourism',
    tier: 'emirate',
    mandate:
      'Hospitality regulator across Abu Dhabi (DCT) and Dubai (DET). Material to Aldar Hospitality through hotel licensing, classification, tourism levy, and guest-data privacy obligations.',
    obligations: [
      'Hotel licence and star-classification compliance',
      'Tourism levy / Tourism Dirham collection and remittance',
      'Guest-data privacy and PCI-DSS for card processing',
      'Health & safety inspections on hospitality assets',
    ],
    cadence: 'Annual + Quarterly remittance',
    linkedAppetiteIds: ['GA-CMP-01', 'GA-OP-02'],
    website: 'dct.gov.ae',
  },
  {
    id: 'REG-MOE',
    acronym: 'MoE / ADEK',
    name: 'Ministry of Education / Abu Dhabi Dept of Education & Knowledge',
    tier: 'sector',
    mandate:
      'Federal MoE plus Abu Dhabi ADEK regulate Aldar Education schools and higher-education assets. Set curriculum standards, fee-cap windows, teacher licensing, school inspection, and student-data privacy requirements.',
    obligations: [
      'School licensing and annual renewal',
      'ADEK / KHDA inspection compliance and rating maintenance',
      'Fee-increase approvals within prescribed windows',
      'Teacher licensing and CPD compliance',
      'Student-data privacy (Federal Data Protection Law)',
    ],
    cadence: 'Annual + Per-inspection',
    linkedAppetiteIds: ['GA-CMP-01', 'GA-REP-01'],
    website: 'moe.gov.ae',
  },
  {
    id: 'REG-FTA',
    acronym: 'FTA',
    name: 'Federal Tax Authority',
    tier: 'federal',
    mandate:
      'Administers UAE VAT (5% on most real-estate transactions outside specific exempt categories) and Corporate Tax (9% from June 2023 onwards on qualifying profits). Material to financial reporting and pricing.',
    obligations: [
      'VAT registration, return filing, and remittance',
      'Corporate Tax registration, return filing, and remittance',
      'Maintenance of contemporaneous transfer-pricing documentation',
      'Audit support on FTA review queries',
    ],
    cadence: 'Quarterly VAT + Annual CT',
    linkedAppetiteIds: ['GA-CMP-01', 'GA-FIN-01'],
    website: 'tax.gov.ae',
  },
]

export const TIER_META: Record<RegulatorTier, { label: string; color: string }> = {
  federal: { label: 'Federal', color: '#FF6600' },
  emirate: { label: 'Emirate', color: '#2D9EFF' },
  market: { label: 'Market', color: '#A855F7' },
  sector: { label: 'Sector', color: '#22C55E' },
}
