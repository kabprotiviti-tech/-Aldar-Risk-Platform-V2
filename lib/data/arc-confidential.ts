/**
 * ARC Executive-Session Confidential Content — Block 2 P5b
 * ---------------------------------------------------------
 * Field-level RBAC bucket: ARC Chair sees these surfaces; ERM Head does
 * not. SCA Corporate Governance Code Art. 31 mandates independence of
 * ARC oversight from executive management for items including:
 *
 *   - Whistleblower / fraud case summary
 *   - Draft IA findings under management review
 *   - Confidential litigation exposure
 *   - External auditor's open management-letter points
 *
 * All numbers below are illustrative pre-pilot. Pilot wires:
 *   - Whistleblower system (e.g. NAVEX, Convercent)
 *   - IA workpapers system
 *   - Legal matters register
 *   - External auditor's management letter feed
 */

export type ConfidentialCategory =
  | 'whistleblower'
  | 'ia_draft'
  | 'litigation'
  | 'auditor_letter'

export interface ConfidentialItem {
  id: string
  category: ConfidentialCategory
  title: string
  /** 1-2 line summary visible in board view. No deep detail (board prep only). */
  summary: string
  /** Severity proxy: high / medium / low. */
  severity: 'high' | 'medium' | 'low'
  /** ISO date opened / received. */
  openedAt: string
  /** Owning function (illustrative). */
  owner: string
}

export const CATEGORY_META: Record<
  ConfidentialCategory,
  { label: string; color: string }
> = {
  whistleblower: { label: 'Whistleblower', color: '#A855F7' },
  ia_draft: { label: 'IA Draft Finding', color: '#FF6600' },
  litigation: { label: 'Litigation', color: '#FF3B3B' },
  auditor_letter: { label: 'Auditor Management Letter', color: '#2D9EFF' },
}

/**
 * Sample executive-session items. Counts and content are illustrative
 * (CLAUDE.md tag). Pilot replaces this with live integrations.
 */
export const CONFIDENTIAL_ITEMS: ConfidentialItem[] = [
  {
    id: 'WB-2026-014',
    category: 'whistleblower',
    title: 'Procurement irregularity allegation — Site 7',
    summary:
      'Anonymous report alleging vendor bid-rotation on Site 7 fit-out package. Under IA investigation; preliminary report due Q2.',
    severity: 'high',
    openedAt: '2026-04-12',
    owner: 'Chief Internal Auditor',
  },
  {
    id: 'WB-2026-008',
    category: 'whistleblower',
    title: 'Conflict-of-interest disclosure — supplier',
    summary:
      'Self-report by junior procurement officer of family relationship with sub-contractor. Mitigation: recused, transferred. Closed-pending-review.',
    severity: 'low',
    openedAt: '2026-02-28',
    owner: 'Group HR',
  },
  {
    id: 'IA-D-2026-003',
    category: 'ia_draft',
    title: 'Escrow reconciliation control gap — preliminary',
    summary:
      'Draft IA finding: 2 of 14 escrow reconciliation control points lack documented sign-off. Management response pending; not yet ARC-tabled.',
    severity: 'medium',
    openedAt: '2026-04-25',
    owner: 'Chief Internal Auditor',
  },
  {
    id: 'IA-D-2026-005',
    category: 'ia_draft',
    title: 'Project gating control — design phase',
    summary:
      'Draft finding on Stage-Gate-2 sign-off completeness for two FY25 projects. Likely Low-Medium severity; remediation already in flight.',
    severity: 'low',
    openedAt: '2026-05-02',
    owner: 'Chief Internal Auditor',
  },
  {
    id: 'LIT-2026-002',
    category: 'litigation',
    title: 'Buyer contract dispute — international cohort',
    summary:
      'Cluster of 4 international buyers contesting handover-date enforcement. AED 22 mn aggregate claim. Group Legal preparing response.',
    severity: 'medium',
    openedAt: '2026-03-10',
    owner: 'Group General Counsel',
  },
  {
    id: 'LIT-2026-006',
    category: 'litigation',
    title: 'Contractor termination — counter-claim risk',
    summary:
      'Termination of underperforming MEP contractor on flagship project; counter-claim threatened. Exposure cap AED 35 mn per LD clause.',
    severity: 'medium',
    openedAt: '2026-04-18',
    owner: 'Group General Counsel',
  },
  {
    id: 'AML-2026-001',
    category: 'auditor_letter',
    title: 'External auditor management letter — open points',
    summary:
      '3 open management-letter items from FY25 external audit: IT general controls, segregation of duties (Treasury), and AR aging policy alignment.',
    severity: 'medium',
    openedAt: '2026-02-15',
    owner: 'Group CFO',
  },
]

export function countsBySeverity() {
  return CONFIDENTIAL_ITEMS.reduce(
    (acc, item) => {
      acc[item.severity]++
      acc.total++
      return acc
    },
    { high: 0, medium: 0, low: 0, total: 0 },
  )
}

export function countsByCategory() {
  return CONFIDENTIAL_ITEMS.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1
      return acc
    },
    {} as Record<ConfidentialCategory, number>,
  )
}
