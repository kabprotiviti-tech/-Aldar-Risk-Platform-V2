/**
 * Peer Benchmark — UAE listed real-estate disclosure comparison
 * --------------------------------------------------------------
 * Cross-tab of Aldar vs the peer set on disclosure depth across the
 * standard ERM categories. Each cell is a coverage band:
 *   full:    The peer's annual disclosures explicitly address this
 *            category with quantified KPIs / KRIs and named appetite.
 *   partial: Category is mentioned narratively but without quantified
 *            metrics or named tolerance.
 *   none:    No public disclosure on this category.
 *
 * All bands are illustrative pre-pilot — pilot will replace with the
 * Compliance team's structured peer-disclosure benchmark using the
 * actual 2024/2025 annual report content. Peer entities listed are the
 * standard UAE real-estate comparable set for ADX / DFM-listed Aldar.
 */

export type DisclosureBand = 'full' | 'partial' | 'none'

export interface PeerProfile {
  id: string
  name: string
  ticker: string
  exchange: 'ADX' | 'DFM'
  /** One-line positioning. */
  positioning: string
}

export const PEERS: PeerProfile[] = [
  {
    id: 'aldar',
    name: 'Aldar Properties',
    ticker: 'ALDAR',
    exchange: 'ADX',
    positioning: 'Diversified Abu Dhabi developer + investment + education + hospitality',
  },
  {
    id: 'emaar',
    name: 'Emaar Properties',
    ticker: 'EMAAR',
    exchange: 'DFM',
    positioning: 'Dubai master-developer with hospitality + retail tail',
  },
  {
    id: 'damac',
    name: 'DAMAC Properties',
    ticker: 'DAMAC',
    exchange: 'DFM (delisted 2022, private)',
    positioning: 'Dubai luxury developer; private since 2022 take-private',
  },
  {
    id: 'sobha',
    name: 'Sobha Realty',
    ticker: 'private',
    exchange: 'DFM',
    positioning: 'Dubai high-end developer (Sobha Hartland), private group',
  },
  {
    id: 'arabtec',
    name: 'Arabtec Holding',
    ticker: 'ARTC',
    exchange: 'DFM (delisted 2020)',
    positioning: 'Construction prime — historical; entered liquidation 2020',
  },
]

export interface BenchmarkCategory {
  id: string
  label: string
  description: string
  /** Peer disclosure bands by peer.id. */
  coverage: Record<string, DisclosureBand>
}

export const BENCHMARK_CATEGORIES: BenchmarkCategory[] = [
  {
    id: 'risk_appetite',
    label: 'Risk Appetite Statements',
    description:
      'Quantified appetite per category, named approving body, and review cadence.',
    coverage: {
      aldar: 'partial',
      emaar: 'partial',
      damac: 'none',
      sobha: 'none',
      arabtec: 'none',
    },
  },
  {
    id: 'kri_framework',
    label: 'KRI Framework',
    description:
      'Disclosed Key Risk Indicators with thresholds and trend reporting in the AR.',
    coverage: {
      aldar: 'partial',
      emaar: 'partial',
      damac: 'none',
      sobha: 'none',
      arabtec: 'none',
    },
  },
  {
    id: 'top_risks',
    label: 'Top-Risk Schedule (Annual)',
    description:
      'Plain-English top-N risks with rating + mitigation status in the AR.',
    coverage: {
      aldar: 'full',
      emaar: 'full',
      damac: 'partial',
      sobha: 'none',
      arabtec: 'partial',
    },
  },
  {
    id: 'three_lines',
    label: '3 Lines of Defense Operating Model',
    description: 'Named roles across Lines 1/2/3 + IA independence statement.',
    coverage: {
      aldar: 'partial',
      emaar: 'partial',
      damac: 'none',
      sobha: 'none',
      arabtec: 'partial',
    },
  },
  {
    id: 'climate_esg',
    label: 'Climate & ESG Risk',
    description:
      'TCFD-aligned climate scenario disclosure, net-zero pathway and progress.',
    coverage: {
      aldar: 'full',
      emaar: 'partial',
      damac: 'none',
      sobha: 'none',
      arabtec: 'none',
    },
  },
  {
    id: 'cyber_tech',
    label: 'Cyber & Technology Risk',
    description: 'Disclosure of cyber incidents, controls, and BCP posture.',
    coverage: {
      aldar: 'partial',
      emaar: 'partial',
      damac: 'none',
      sobha: 'none',
      arabtec: 'none',
    },
  },
  {
    id: 'regulator_map',
    label: 'Regulator & Obligations Register',
    description:
      'Disclosed list of regulators with mandate touch-points and material obligations.',
    coverage: {
      aldar: 'partial',
      emaar: 'none',
      damac: 'none',
      sobha: 'none',
      arabtec: 'none',
    },
  },
  {
    id: 'audit_trail',
    label: 'Audit Trail / Governance Forensics',
    description:
      'Tamper-evident change log on risk decisions discoverable to external auditor.',
    coverage: {
      aldar: 'none',
      emaar: 'none',
      damac: 'none',
      sobha: 'none',
      arabtec: 'none',
    },
  },
]

export const BAND_META: Record<
  DisclosureBand,
  { label: string; color: string; symbol: string }
> = {
  full: { label: 'Full', color: '#22C55E', symbol: '●' },
  partial: { label: 'Partial', color: '#F5C518', symbol: '◐' },
  none: { label: 'None', color: '#888888', symbol: '○' },
}
