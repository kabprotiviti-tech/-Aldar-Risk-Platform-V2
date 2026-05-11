/**
 * Standards Reference — ISO 31000:2018 + COSO ERM 2017
 * -----------------------------------------------------
 * Patch F8. Static reference content + a mapping column showing which
 * platform surface implements each clause / principle.
 *
 * Sources: ISO 31000:2018 (Risk Management — Guidelines) and
 *          COSO Enterprise Risk Management — Integrating with Strategy
 *          and Performance (2017).
 *
 * Mapping is illustrative pre-pilot — pilot will lock the mapping after
 * stakeholder workshops + external audit walkthrough.
 */

export interface StandardClause {
  id: string
  title: string
  description: string
  /** Aldar platform surfaces that implement this clause. */
  implementedBy: string[]
  status: 'live' | 'partial' | 'roadmap'
}

// ============================================================
// ISO 31000:2018 — Risk Management Guidelines
// ============================================================

export const ISO_31000_PRINCIPLES: StandardClause[] = [
  {
    id: 'iso.5.1',
    title: 'Integrated',
    description:
      'Risk management is an integral part of all organizational activities.',
    implementedBy: ['/risk-register', '/portfolio-tower'],
    status: 'live',
  },
  {
    id: 'iso.5.2',
    title: 'Structured & Comprehensive',
    description:
      'A structured and comprehensive approach contributes to consistent and comparable results.',
    implementedBy: ['/risk-register', '/risk-library'],
    status: 'live',
  },
  {
    id: 'iso.5.3',
    title: 'Customized',
    description:
      'Framework and process customized and proportionate to context and objectives.',
    implementedBy: ['/risk-appetite', '/regulator-map'],
    status: 'live',
  },
  {
    id: 'iso.5.4',
    title: 'Inclusive',
    description:
      'Appropriate involvement of stakeholders enables their knowledge to be considered.',
    implementedBy: ['/three-lines-of-defense'],
    status: 'partial',
  },
  {
    id: 'iso.5.5',
    title: 'Dynamic',
    description:
      'Risk management anticipates, detects, acknowledges and responds to changes.',
    implementedBy: ['/kri', '/scenarios'],
    status: 'live',
  },
  {
    id: 'iso.5.6',
    title: 'Best Available Information',
    description:
      'Inputs are based on the best available information from past, present and future considerations.',
    implementedBy: ['/scenarios', '/risk-register'],
    status: 'live',
  },
  {
    id: 'iso.5.7',
    title: 'Human & Cultural Factors',
    description:
      'Human behaviour and culture significantly influence all aspects of risk management.',
    implementedBy: ['/three-lines-of-defense'],
    status: 'partial',
  },
  {
    id: 'iso.5.8',
    title: 'Continual Improvement',
    description:
      'Risk management is continually improved through learning and experience.',
    implementedBy: ['/audit-trail'],
    status: 'live',
  },
]

export const ISO_31000_FRAMEWORK: StandardClause[] = [
  {
    id: 'iso.6.2',
    title: 'Leadership & Commitment',
    description:
      'Top management and oversight bodies ensure risk management is integrated and aligned with strategy.',
    implementedBy: ['/risk-appetite', '/three-lines-of-defense'],
    status: 'live',
  },
  {
    id: 'iso.6.3',
    title: 'Integration',
    description:
      'Risk management is embedded in governance and all organizational activities.',
    implementedBy: ['/risk-register', '/portfolio-tower'],
    status: 'live',
  },
  {
    id: 'iso.6.4',
    title: 'Design',
    description:
      'Design the framework — context, articulation of commitment, roles, resources, communication.',
    implementedBy: ['/three-lines-of-defense', '/risk-appetite'],
    status: 'partial',
  },
  {
    id: 'iso.6.5',
    title: 'Implementation',
    description:
      'Implement framework — plan, mobilize resources, ensure understanding, run the process.',
    implementedBy: ['/risk-register', '/kri'],
    status: 'partial',
  },
  {
    id: 'iso.6.6',
    title: 'Evaluation',
    description:
      'Periodically measure framework performance against indicators.',
    implementedBy: ['/audit-trail', '/arc-pack'],
    status: 'partial',
  },
  {
    id: 'iso.6.7',
    title: 'Improvement',
    description:
      'Continually adapt the framework to internal and external changes.',
    implementedBy: ['/audit-trail'],
    status: 'roadmap',
  },
]

export const ISO_31000_PROCESS: StandardClause[] = [
  {
    id: 'iso.7.2',
    title: 'Communication & Consultation',
    description:
      'Bring together different areas of expertise; ensure stakeholders are involved.',
    implementedBy: ['/three-lines-of-defense', '/arc-pack'],
    status: 'partial',
  },
  {
    id: 'iso.7.3',
    title: 'Scope, Context & Criteria',
    description:
      'Define scope, internal/external context, and risk criteria (likelihood, consequence, appetite).',
    implementedBy: ['/risk-appetite', '/regulator-map'],
    status: 'live',
  },
  {
    id: 'iso.7.4.2',
    title: 'Risk Identification',
    description:
      'Find, recognize and describe risks.',
    implementedBy: ['/risk-register', '/risk-library'],
    status: 'live',
  },
  {
    id: 'iso.7.4.3',
    title: 'Risk Analysis',
    description:
      'Comprehend the nature of the risk — likelihood, consequences, vulnerabilities, controls.',
    implementedBy: ['/risk-register', '/scenarios'],
    status: 'live',
  },
  {
    id: 'iso.7.4.4',
    title: 'Risk Evaluation',
    description:
      'Compare analysis results with risk criteria to determine response.',
    implementedBy: ['/portfolio-tower', '/risk-appetite'],
    status: 'live',
  },
  {
    id: 'iso.7.5',
    title: 'Risk Treatment',
    description:
      'Select and implement options for addressing risk; mitigation, transfer, accept, avoid.',
    implementedBy: ['/risk-register'],
    status: 'live',
  },
  {
    id: 'iso.7.6',
    title: 'Monitoring & Review',
    description:
      'Continually monitor the risk management process and its outcomes.',
    implementedBy: ['/kri', '/audit-trail'],
    status: 'live',
  },
  {
    id: 'iso.7.7',
    title: 'Recording & Reporting',
    description:
      'Document and report the risk management process and outcomes through appropriate mechanisms.',
    implementedBy: ['/arc-pack', '/audit-trail'],
    status: 'live',
  },
]

// ============================================================
// COSO ERM 2017 — 5 Components, 20 Principles
// ============================================================

export interface COSOComponent {
  id: string
  title: string
  description: string
  principles: StandardClause[]
}

export const COSO_ERM_COMPONENTS: COSOComponent[] = [
  {
    id: 'coso.governance',
    title: 'Governance & Culture',
    description:
      'The board of directors provides oversight of strategy and carries out governance responsibilities to support management.',
    principles: [
      {
        id: 'coso.1',
        title: 'Exercises Board Risk Oversight',
        description:
          'The board oversees the strategy and carries out governance responsibilities to support management.',
        implementedBy: ['/arc-pack', '/three-lines-of-defense'],
        status: 'live',
      },
      {
        id: 'coso.2',
        title: 'Establishes Operating Structures',
        description:
          'Establishes operating structures in the pursuit of strategy and business objectives.',
        implementedBy: ['/three-lines-of-defense'],
        status: 'live',
      },
      {
        id: 'coso.3',
        title: 'Defines Desired Culture',
        description:
          'Defines the desired behaviors that characterize the entity\'s desired culture.',
        implementedBy: ['/risk-appetite'],
        status: 'partial',
      },
      {
        id: 'coso.4',
        title: 'Demonstrates Commitment to Core Values',
        description:
          'Reinforces the importance of core values in pursuit of strategy.',
        implementedBy: ['/risk-appetite', '/audit-trail'],
        status: 'partial',
      },
      {
        id: 'coso.5',
        title: 'Attracts, Develops, Retains Capable Individuals',
        description:
          'Builds human capital aligned with strategy and objectives.',
        implementedBy: ['/three-lines-of-defense'],
        status: 'roadmap',
      },
    ],
  },
  {
    id: 'coso.strategy',
    title: 'Strategy & Objective-Setting',
    description:
      'Risk management is integrated into the strategic planning process. The organization considers the impact of strategy.',
    principles: [
      {
        id: 'coso.6',
        title: 'Analyzes Business Context',
        description:
          'Considers potential effects of business context on risk profile.',
        implementedBy: ['/scenarios', '/regulator-map'],
        status: 'live',
      },
      {
        id: 'coso.7',
        title: 'Defines Risk Appetite',
        description:
          'Defines risk appetite in the context of creating, preserving, and realizing value.',
        implementedBy: ['/risk-appetite'],
        status: 'live',
      },
      {
        id: 'coso.8',
        title: 'Evaluates Alternative Strategies',
        description:
          'Evaluates alternative strategies and impact on risk profile.',
        implementedBy: ['/scenarios'],
        status: 'live',
      },
      {
        id: 'coso.9',
        title: 'Formulates Business Objectives',
        description:
          'Considers risk while establishing the business objectives at various levels.',
        implementedBy: ['/risk-register', '/risk-appetite'],
        status: 'partial',
      },
    ],
  },
  {
    id: 'coso.performance',
    title: 'Performance',
    description:
      'Risks that may impact the achievement of strategy and business objectives are identified and assessed.',
    principles: [
      {
        id: 'coso.10',
        title: 'Identifies Risk',
        description:
          'Identifies risk that impacts the performance of strategy and business objectives.',
        implementedBy: ['/risk-register', '/risk-library'],
        status: 'live',
      },
      {
        id: 'coso.11',
        title: 'Assesses Severity of Risk',
        description:
          'Assesses the severity of risk.',
        implementedBy: ['/risk-register', '/portfolio-tower'],
        status: 'live',
      },
      {
        id: 'coso.12',
        title: 'Prioritizes Risks',
        description:
          'Prioritizes risks as basis for selecting responses to risks.',
        implementedBy: ['/portfolio-tower'],
        status: 'live',
      },
      {
        id: 'coso.13',
        title: 'Implements Risk Responses',
        description:
          'Identifies and selects risk responses.',
        implementedBy: ['/risk-register'],
        status: 'live',
      },
      {
        id: 'coso.14',
        title: 'Develops Portfolio View',
        description:
          'Develops a portfolio view of risk.',
        implementedBy: ['/portfolio-tower'],
        status: 'live',
      },
    ],
  },
  {
    id: 'coso.review',
    title: 'Review & Revision',
    description:
      'By reviewing entity performance, an organization can consider how well the ERM components are functioning over time.',
    principles: [
      {
        id: 'coso.15',
        title: 'Assesses Substantial Change',
        description:
          'Identifies and assesses changes that may substantially affect strategy and business objectives.',
        implementedBy: ['/scenarios', '/regulator-map'],
        status: 'partial',
      },
      {
        id: 'coso.16',
        title: 'Reviews Risk & Performance',
        description:
          'Reviews entity performance and considers risk.',
        implementedBy: ['/arc-pack', '/portfolio-tower'],
        status: 'live',
      },
      {
        id: 'coso.17',
        title: 'Pursues Improvement in ERM',
        description:
          'Pursues improvement of enterprise risk management.',
        implementedBy: ['/audit-trail'],
        status: 'partial',
      },
    ],
  },
  {
    id: 'coso.communication',
    title: 'Information, Communication & Reporting',
    description:
      'Risk reporting communicates risk information at appropriate levels of the organization.',
    principles: [
      {
        id: 'coso.18',
        title: 'Leverages Information & Technology',
        description:
          'Leverages information systems to support enterprise risk management.',
        implementedBy: ['/kri', '/audit-trail'],
        status: 'live',
      },
      {
        id: 'coso.19',
        title: 'Communicates Risk Information',
        description:
          'Uses communication channels to support enterprise risk management.',
        implementedBy: ['/arc-pack', '/audit-trail'],
        status: 'live',
      },
      {
        id: 'coso.20',
        title: 'Reports on Risk, Culture & Performance',
        description:
          'Reports on risk, culture, and performance at multiple levels and across the entity.',
        implementedBy: ['/arc-pack', '/portfolio-tower'],
        status: 'live',
      },
    ],
  },
]
