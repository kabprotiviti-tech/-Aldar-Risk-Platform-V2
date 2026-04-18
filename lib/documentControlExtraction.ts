// ─── Document Control Extraction — Simulated Keyword Matching ─────────────────
// Integration Pending — replace with NLP/AI extraction pipeline when available.
// Simulates control extraction by matching document keywords against a rule set
// derived from the 20 controls defined in lib/controlData.ts.
// No NLP — pure deterministic keyword matching with confidence scoring.

import { controls, type ControlProcess } from '@/lib/controlData'

// ─── Output type ──────────────────────────────────────────────────────────────

export interface ExtractedControl {
  controlId: string           // C-00x from controlData.ts
  controlName: string
  linkedRisk: string          // R-00x
  linkedRiskTitle: string
  process: ControlProcess
  confidence: number          // 0–1 based on keyword hit count
  matchedKeywords: string[]
  integrationPending: true
  source: 'Simulated Extraction'
  extractionNote: string      // what triggered this match
}

// ─── Keyword rule definitions ──────────────────────────────────────────────────
// Each rule maps to one control and contains a set of trigger keywords.
// Confidence = matched keyword count / total keywords (capped at 1.0).

interface ExtractionRule {
  controlId: string
  keywords: string[]
}

const EXTRACTION_RULES: ExtractionRule[] = [
  {
    controlId: 'C-001',
    keywords: [
      'bank reconciliation', 'reconciliation', 'cash position', 'bank accounts',
      'general ledger', 'GL', 'treasury', 'cash balance', 'CFO', 'month-end',
    ],
  },
  {
    controlId: 'C-002',
    keywords: [
      'trade receivables', 'receivables', 'aging', 'IFRS 9', 'ECL',
      'provision', 'overdue', 'debt aging', '90 days', 'bad debt', 'collection',
    ],
  },
  {
    controlId: 'C-003',
    keywords: [
      'revenue recognition', 'lease commencement', 'IFRS 16', 'handover',
      'inspection sign-off', 'lease start', 'revenue journal', 'tenant handover',
    ],
  },
  {
    controlId: 'C-004',
    keywords: [
      'budget variance', 'forecast variance', 'actuals vs budget', 'reforecast',
      'financial forecast', 'budget overrun', 'variance analysis', 'off-plan sales shortfall',
    ],
  },
  {
    controlId: 'C-005',
    keywords: [
      'Scope 3', 'emissions', 'ESG', 'sustainability reporting', 'ADX',
      'IFRS S1', 'IFRS S2', 'supply chain emissions', 'carbon', 'net zero',
    ],
  },
  {
    controlId: 'C-006',
    keywords: [
      'variation order', 'change order', 'budget approval', 'Board approval',
      'contract variation', 'development approval', 'procurement approval',
      'AED 25M', 'AED 5M', 'change order authorization',
    ],
  },
  {
    controlId: 'C-007',
    keywords: [
      'WIP', 'work in progress', 'cost-to-complete', 'construction cost',
      'cost overrun', 'overrun', 'contractor claims', 'project cost', 'budget overrun',
      'cost forecast', 'Saadiyat', 'construction budget',
    ],
  },
  {
    controlId: 'C-008',
    keywords: [
      'milestone', 'project milestone', 'delivery schedule', 'project delay',
      'schedule review', 'critical path', 'programme', 'handover date',
      'delay', 'Tower A', 'Tower B', 'schedule adherence',
    ],
  },
  {
    controlId: 'C-009',
    keywords: [
      'supplier concentration', 'single source', 'steel', 'cement',
      'procurement concentration', 'supply chain disruption', 'Red Sea',
      'single-source', 'diversification', 'steel procurement',
    ],
  },
  {
    controlId: 'C-010',
    keywords: [
      'fixed-price', 'price escalation', 'commodity price', 'contract clause',
      'fixed price provisions', 'steel cost', 'cost inflation', 'commodity index',
      'material cost', 'MEP contractor',
    ],
  },
  {
    controlId: 'C-011',
    keywords: [
      'contractor pre-qualification', 'due diligence', 'financial distress',
      'contractor assessment', 'HSE', 'pre-qualification', 'contractor health',
      'sub-contractor', 'Electra', 'contractor payment',
    ],
  },
  {
    controlId: 'C-012',
    keywords: [
      'OT', 'IT/OT', 'network segregation', 'BMS', 'building management system',
      'VLAN', 'OT protocol', 'Modbus', 'BACnet', 'smart building',
      'network segmentation', 'IT security',
    ],
  },
  {
    controlId: 'C-013',
    keywords: [
      'penetration test', 'pen test', 'cybersecurity', 'incident response',
      'CISA', 'cyber advisory', 'tabletop simulation', 'cyber resilience',
      'BMS security', 'nation-state', 'NCA advisory',
    ],
  },
  {
    controlId: 'C-014',
    keywords: [
      'access control', 'privileged access', 'BMS access', 'dormant account',
      'user provisioning', 'access review', 'privileged user',
      'deprovisioning', 'FM staff',
    ],
  },
  {
    controlId: 'C-015',
    keywords: [
      'lease expiry', 'anchor tenant', 'lease renewal', 'tenant retention',
      'lease pipeline', 'tenant search', 'Yas Mall', 'renewal risk',
      'lease expiration', 'tenant covenant',
    ],
  },
  {
    controlId: 'C-016',
    keywords: [
      'hotel occupancy', 'RevPAR', 'occupancy rate', 'hospitality revenue',
      'revenue recovery', 'Yas Island', 'hospitality KPI',
      'occupancy below', 'hotel performance',
    ],
  },
  {
    controlId: 'C-017',
    keywords: [
      'vacancy rate', 'retail vacancy', 'footfall', 'repositioning',
      'void rate', 'community retail', 'tenant mix', 'vacancy above',
      'footfall index', 'vacancy threshold',
    ],
  },
  {
    controlId: 'C-018',
    keywords: [
      'risk register', 'Board Risk Committee', 'risk report', 'risk score',
      'risk action plan', 'risk escalation', 'emerging risk', 'risk update',
      'Risk Committee', 'risk appetite',
    ],
  },
  {
    controlId: 'C-019',
    keywords: [
      'ADEK', 'regulatory compliance', 'curriculum', 'education compliance',
      'IB schools', 'teacher training', 'CPD', 'school rating',
      'ADEK submission', 'UAE Social Studies',
    ],
  },
  {
    controlId: 'C-020',
    keywords: [
      'FM outsourcing', 'facilities management', 'CSAT', 'SLA performance',
      'performance improvement', 'FM partner', 'outsourcing review',
      'PIN', 'contract renewal', 'FM contract',
    ],
  },
]

// ─── Core extraction function ─────────────────────────────────────────────────

export function extractControlsFromDocument(text: string): ExtractedControl[] {
  const normalizedText = text.toLowerCase()
  const results: ExtractedControl[] = []

  for (const rule of EXTRACTION_RULES) {
    const control = controls.find(c => c.id === rule.controlId)
    if (!control) continue

    // Find which keywords appear in the document
    const matchedKeywords = rule.keywords.filter(kw =>
      normalizedText.includes(kw.toLowerCase())
    )

    // Require at least 2 keyword matches to surface a control
    if (matchedKeywords.length < 2) continue

    const confidence = Math.min(matchedKeywords.length / rule.keywords.length, 1)

    results.push({
      controlId: control.id,
      controlName: control.name,
      linkedRisk: control.linkedRiskId,
      linkedRiskTitle: control.linkedRiskTitle,
      process: control.process,
      confidence: parseFloat(confidence.toFixed(2)),
      matchedKeywords,
      integrationPending: true,
      source: 'Simulated Extraction',
      extractionNote: `${matchedKeywords.length} of ${rule.keywords.length} keywords matched: ${matchedKeywords.slice(0, 3).join(', ')}${matchedKeywords.length > 3 ? ` +${matchedKeywords.length - 3} more` : ''}`,
    })
  }

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence)

  return results
}

// ─── Aggregate helper used by UI ──────────────────────────────────────────────

export function extractionSummary(results: ExtractedControl[]) {
  const processGroups = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.process] = (acc[r.process] || 0) + 1
    return acc
  }, {})

  return {
    total: results.length,
    highConfidence: results.filter(r => r.confidence >= 0.5).length,
    processGroups,
  }
}
