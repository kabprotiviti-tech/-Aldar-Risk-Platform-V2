/**
 * Three Lines of Defense — ABC adaptation
 * ------------------------------------------
 * The IIA's 2020 Three Lines Model adapted to a UAE listed real estate
 * group with Group ERM at the centre. Roles are illustrative and
 * pre-pilot — pilot will replace these names with the actual ABC
 * operating model after stakeholder workshops.
 *
 * Convention used here:
 *   Governing Body — Board / ARC (oversight, accountability)
 *   Line 1 — Operational management (own + manage risk in BAU)
 *   Line 2 — Group ERM, Compliance, Treasury risk (frame, monitor, advise)
 *   Line 3 — Internal Audit (independent assurance to the ARC)
 *
 * Each role lists illustrative responsibilities and the platform
 * surfaces the user touches for that line of work.
 */

export type LineId = 'governing' | 'line1' | 'line2' | 'line3'

export interface DefenseRole {
  /** Display name. */
  title: string
  /** Owning entity / subsidiary or 'Group'. */
  scope: string
  /** 3-5 illustrative responsibilities. */
  responsibilities: string[]
  /** App routes this role uses day-to-day. */
  platformSurfaces: string[]
}

export interface DefenseLine {
  id: LineId
  /** Short label e.g. "Line 1 — Operational Management". */
  label: string
  /** One-paragraph description of the line's purpose. */
  purpose: string
  /** Color band for the swimlane. */
  color: string
  /** Illustrative roles assigned to this line. */
  roles: DefenseRole[]
}

export const THREE_LINES: DefenseLine[] = [
  {
    id: 'governing',
    label: 'Governing Body — Board & ARC',
    purpose:
      'Sets the risk appetite framework, reviews the consolidated risk profile, and challenges executive on residual exposure. Receives quarterly ARC packs and annual risk attestations. Approves material risk-acceptance decisions above appetite.',
    color: '#A855F7',
    roles: [
      {
        title: 'Board of Directors',
        scope: 'Group',
        responsibilities: [
          'Approve enterprise risk appetite framework and material amendments',
          'Receive annual risk profile attestation from Group CEO',
          'Sanction risk-acceptance decisions above appetite',
          'Confirm 3LoD operating model annually',
        ],
        platformSurfaces: ['/risk-appetite', '/arc-pack'],
      },
      {
        title: 'Audit & Risk Committee (ARC)',
        scope: 'Group',
        responsibilities: [
          'Approve risk appetite statements at category level',
          'Review quarterly ARC pack covering top risks, KRIs, mitigation status',
          'Sanction escalations from subsidiary ERM Heads',
          'Receive Internal Audit independent assurance reports',
        ],
        platformSurfaces: ['/arc-pack', '/portfolio-tower', '/risk-appetite', '/audit-trail'],
      },
    ],
  },
  {
    id: 'line1',
    label: 'Line 1 — Operational Management',
    purpose:
      'Owns and manages risk in business-as-usual. Risk Champions sit inside each subsidiary and execute the day-to-day controls (project gating, contract review, escrow compliance, occupancy management, customer onboarding). They identify emerging risks, run mitigation actions, and report status to Group ERM.',
    color: '#FF6600',
    roles: [
      {
        title: 'Subsidiary CEO / MD',
        scope: 'ABC Development / Investment / Education / Hospitality',
        responsibilities: [
          'Accountable for risk profile within the subsidiary',
          'Approve subsidiary risk register and key mitigation programmes',
          'Escalate residual risk above subsidiary appetite to Group',
        ],
        platformSurfaces: ['/risk-register', '/portfolio-tower'],
      },
      {
        title: 'Risk Champion',
        scope: 'Each subsidiary',
        responsibilities: [
          'Maintain subsidiary risk register, drafts and updates',
          'Monitor key controls and report effectiveness monthly',
          'Submit KRI values monthly with supporting evidence',
          'Coordinate mitigation action ownership and due dates',
        ],
        platformSurfaces: ['/risk-register', '/kri'],
      },
      {
        title: 'Project Director / Construction',
        scope: 'ABC Development',
        responsibilities: [
          'Own project-phase delay and handover delay KRIs (KRI-11, KRI-12)',
          'Run cost-overrun controls and supplier-stability monitoring',
          'Escalate site safety, contractor default, materials-cost incidents',
        ],
        platformSurfaces: ['/risk-register', '/kri'],
      },
      {
        title: 'Asset Manager',
        scope: 'ABC Investment',
        responsibilities: [
          'Own residential and commercial occupancy KRIs (KRI-09, KRI-10)',
          'Maintain re-pricing and tenant-mix actions',
          'Monitor commercial rent index (KRI-15)',
        ],
        platformSurfaces: ['/risk-register', '/kri'],
      },
      {
        title: 'Sales & Customer Onboarding',
        scope: 'Group',
        responsibilities: [
          'Own buyer-default KRIs (KRI-13 domestic, KRI-16 international)',
          'Run KYC / source-of-funds checks at customer onboarding',
          'Escalate cluster defaults to Group Treasury',
        ],
        platformSurfaces: ['/risk-register', '/kri'],
      },
    ],
  },
  {
    id: 'line2',
    label: 'Line 2 — Risk, Compliance & Treasury',
    purpose:
      'Frames the risk and compliance environment, monitors performance against appetite, advises Line 1 on control design, and challenges residual-risk acceptance. Group ERM Head consolidates the Group risk profile and runs the ARC pack process. Compliance owns regulatory horizon scanning. Treasury owns financial risk policy and credit-risk thresholds.',
    color: '#2D9EFF',
    roles: [
      {
        title: 'Group ERM Head',
        scope: 'Group',
        responsibilities: [
          'Maintain Group risk register and consolidate subsidiary registers',
          'Frame the risk appetite statements with ARC',
          'Run quarterly ARC pack process and Board reporting',
          'Challenge subsidiary residual-risk acceptance',
          'Calibrate KRI thresholds with Risk Champions',
        ],
        platformSurfaces: [
          '/portfolio-tower',
          '/risk-appetite',
          '/arc-pack',
          '/audit-trail',
        ],
      },
      {
        title: 'Group Compliance Officer',
        scope: 'Group',
        responsibilities: [
          'Regulatory horizon scanning (ADX, SCA, RERA, DLD, ADREC)',
          'Maintain compliance obligations register',
          'Run anti-money-laundering and sanctions screening programme',
          'Report compliance breaches to ARC',
        ],
        platformSurfaces: ['/risk-register', '/audit-trail'],
      },
      {
        title: 'Group Treasury Risk',
        scope: 'Group',
        responsibilities: [
          'Set credit-risk policy and counterparty limits',
          'Own buyer-default appetite (GA-FIN-02) and escalation criteria',
          'Manage FX and interest-rate exposure',
          'Maintain liquidity headroom against the GA-FIN-01 statement',
        ],
        platformSurfaces: ['/risk-register', '/risk-appetite', '/kri'],
      },
      {
        title: 'Information Security Officer',
        scope: 'Group',
        responsibilities: [
          'Own technology and cyber risk register',
          'Run controls assurance over critical systems (Yardi, SAP, escrow)',
          'Coordinate incident response with Internal Audit',
        ],
        platformSurfaces: ['/risk-register', '/control-command-center'],
      },
    ],
  },
  {
    id: 'line3',
    label: 'Line 3 — Internal Audit',
    purpose:
      'Independent and objective assurance reporting directly to the Audit & Risk Committee. Tests the design and operating effectiveness of Line 1 and Line 2 controls, validates the Group risk register and KRI assertions, and reports control failures with remediation tracking. Independence preserved through dual reporting line to the ARC.',
    color: '#22C55E',
    roles: [
      {
        title: 'Chief Internal Auditor',
        scope: 'Group',
        responsibilities: [
          'Plan and execute risk-based annual audit plan',
          'Provide independent assurance to the ARC',
          'Validate Group ERM consolidation and KRI integrity',
          'Track remediation of audit findings to closure',
        ],
        platformSurfaces: ['/audit-trail', '/portfolio-tower', '/arc-pack'],
      },
      {
        title: 'IA Manager — Operational',
        scope: 'Group',
        responsibilities: [
          'Test project gating and handover controls (ABC Development)',
          'Test occupancy reconciliation controls (ABC Investment)',
          'Test KRI source-data integrity in PMS / Yardi feeds',
        ],
        platformSurfaces: ['/audit-trail', '/risk-register'],
      },
      {
        title: 'IA Manager — Financial & IT',
        scope: 'Group',
        responsibilities: [
          'Test escrow account reconciliations and DLD compliance',
          'Test ICOFR scope controls in SAP',
          'Test access management on critical systems',
        ],
        platformSurfaces: ['/control-command-center', '/audit-trail'],
      },
    ],
  },
]
