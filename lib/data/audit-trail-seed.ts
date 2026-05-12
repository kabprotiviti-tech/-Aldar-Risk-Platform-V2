/**
 * Audit Trail demo seed — Block 1.5 polish
 * -----------------------------------------
 * Pre-populates the audit trail with 12 illustrative events spanning
 * the last 7 days so a fresh browser shows a populated `/audit-trail`,
 * `/home` (CRO/IA "recent activity"), and `/my-dashboard` (audit count
 * today) — instead of "0 events captured" which BCG-2 flagged as a
 * credibility hit before the Board.
 *
 * Deterministic IDs + relative timestamps so SSR and client agree.
 * Only seeds when localStorage is empty AND the sentinel hasn't fired.
 */

export interface SeedAuditEvent {
  id: string
  at: string
  category:
    | 'risk'
    | 'mitigation'
    | 'kri_entry'
    | 'kri_threshold'
    | 'escalation'
    | 'system'
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'status_change'
    | 'login'
    | 'export'
  actor: string
  targetId: string | null
  summary: string
}

/**
 * Build seed events relative to "now". We avoid hard-coded ISO strings
 * so SSR + client + later visits stay coherent.
 */
export function buildAuditTrailSeed(now: Date = new Date()): SeedAuditEvent[] {
  const t = (mins: number) =>
    new Date(now.getTime() - mins * 60_000).toISOString()

  return [
    {
      id: 'aud-seed-01',
      at: t(35),
      category: 'kri_entry',
      action: 'create',
      actor: 'Chief Development Officer',
      targetId: 'KRI-12',
      summary: 'KRI-12 2026-04: value 142 entered (handover delay above amber).',
    },
    {
      id: 'aud-seed-02',
      at: t(90),
      category: 'escalation',
      action: 'create',
      actor: 'Risk Champion (demo)',
      targetId: 'R-008',
      summary:
        'Escalated R-008 Cash Flow / Liquidity Stress to Group (residual 4.1, rating Critical).',
    },
    {
      id: 'aud-seed-03',
      at: t(180),
      category: 'mitigation',
      action: 'create',
      actor: 'Group CFO',
      targetId: 'R-008',
      summary:
        'New mitigation "Accelerate collections on top buyers" added on R-008 (due 2026-06-15).',
    },
    {
      id: 'aud-seed-04',
      at: t(240),
      category: 'kri_threshold',
      action: 'update',
      actor: 'KRI Owner (demo)',
      targetId: 'KRI-16',
      summary:
        'KRI-16 thresholds set: amber=130, red=170 (International Default Rate).',
    },
    {
      id: 'aud-seed-05',
      at: t(360),
      category: 'system',
      action: 'update',
      actor: 'Group ERM Head (demo)',
      targetId: 'GA-OP-01',
      summary:
        'Risk Appetite GA-OP-01 updated (statement, level, lastReviewed).',
    },
    {
      id: 'aud-seed-06',
      at: t(720),
      category: 'risk',
      action: 'create',
      actor: 'Risk Champion (demo)',
      targetId: 'DRAFT-001',
      summary: 'New draft risk DRAFT-001 Hospitality demand shock — Yas added.',
    },
    {
      id: 'aud-seed-07',
      at: t(1440),
      category: 'escalation',
      action: 'status_change',
      actor: 'group_erm',
      targetId: 'R-002',
      summary: 'Escalation esc-... for R-002 marked acknowledged.',
    },
    {
      id: 'aud-seed-08',
      at: t(1800),
      category: 'mitigation',
      action: 'status_change',
      actor: 'Head of Procurement',
      targetId: 'R-006',
      summary: 'Mitigation "Diversify suppliers" on R-006 → in_progress.',
    },
    {
      id: 'aud-seed-09',
      at: t(2880),
      category: 'kri_entry',
      action: 'create',
      actor: 'Head of Aldar Investment',
      targetId: 'KRI-10',
      summary: 'KRI-10 2026-04: value 94 entered (commercial occupancy).',
    },
    {
      id: 'aud-seed-10',
      at: t(4320),
      category: 'system',
      action: 'create',
      actor: 'Subsidiary CEO (demo)',
      targetId: 'GA-FIN-02',
      summary:
        'Risk Appetite GA-FIN-02 change proposed (level → cautious). Awaiting approval.',
    },
    {
      id: 'aud-seed-11',
      at: t(5760),
      category: 'risk',
      action: 'update',
      actor: 'Chief Development Officer',
      targetId: 'R-001',
      summary: 'Draft R-001 updated (description, controls).',
    },
    {
      id: 'aud-seed-12',
      at: t(8640),
      category: 'system',
      action: 'export',
      actor: 'Chief Internal Auditor',
      targetId: null,
      summary: 'Audit trail CSV export for FY26 Q1 review.',
    },
  ]
}
