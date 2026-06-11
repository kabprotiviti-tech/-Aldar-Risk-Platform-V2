/**
 * KRI Feeds — Phase 4 (4.3 KRI values sourced from external systems)
 * Illustrative mapping of KRIs to the source system that would feed them.
 * Proves the capability (auto-sourced KRI values, no manual entry) without
 * real connectors — the values come from a mock feed endpoint.
 */

export interface KriFeed {
  kriId: string
  name: string
  sourceSystem: string       // the system that would feed it
  sourceField: string        // the field/metric in that system
  unit: string
  baseValue: number
  amberThreshold: number
  redThreshold: number
  /** true = higher is worse (breach above threshold); false = lower is worse. */
  higherIsWorse: boolean
}

export const KRI_FEEDS: KriFeed[] = [
  { kriId: 'KRI-F01', name: 'Cost variance — active projects (CPI)', sourceSystem: 'Oracle Primavera P6', sourceField: 'EAC / BAC cost performance index', unit: 'index', baseValue: 0.94, amberThreshold: 0.95, redThreshold: 0.9, higherIsWorse: false },
  { kriId: 'KRI-F02', name: 'Schedule variance — active projects (SPI)', sourceSystem: 'Oracle Primavera P6', sourceField: 'earned vs planned schedule index', unit: 'index', baseValue: 0.97, amberThreshold: 0.95, redThreshold: 0.9, higherIsWorse: false },
  { kriId: 'KRI-F03', name: 'Rent collection rate', sourceSystem: 'Salesforce CRM', sourceField: 'collected / billed (rolling 30d)', unit: '%', baseValue: 96.2, amberThreshold: 95, redThreshold: 92, higherIsWorse: false },
  { kriId: 'KRI-F04', name: 'Portfolio occupancy', sourceSystem: 'Salesforce CRM', sourceField: 'leased units / total units', unit: '%', baseValue: 93.5, amberThreshold: 92, redThreshold: 88, higherIsWorse: false },
  { kriId: 'KRI-F05', name: 'Debt service coverage ratio', sourceSystem: 'Oracle Fusion ERP', sourceField: 'EBITDA / debt service', unit: 'x', baseValue: 1.78, amberThreshold: 1.5, redThreshold: 1.25, higherIsWorse: false },
  { kriId: 'KRI-F06', name: 'Receivables overdue >90d', sourceSystem: 'Oracle Fusion ERP', sourceField: 'AR ageing > 90 days', unit: 'AED m', baseValue: 42, amberThreshold: 50, redThreshold: 75, higherIsWorse: true },
  { kriId: 'KRI-F07', name: 'Escrow balance vs milestone liability', sourceSystem: 'Bank escrow gateway', sourceField: 'escrow / certified milestone liability', unit: '%', baseValue: 104, amberThreshold: 100, redThreshold: 95, higherIsWorse: false },
]

export type FeedStatus = 'within' | 'amber' | 'red'

export function feedStatus(f: KriFeed, value: number): FeedStatus {
  if (f.higherIsWorse) {
    if (value >= f.redThreshold) return 'red'
    if (value >= f.amberThreshold) return 'amber'
    return 'within'
  }
  if (value <= f.redThreshold) return 'red'
  if (value <= f.amberThreshold) return 'amber'
  return 'within'
}

export const FEED_STATUS_META: Record<FeedStatus, { label: string; color: string }> = {
  within: { label: 'Within limits', color: '#067647' },
  amber: { label: 'Approaching', color: '#B54708' },
  red: { label: 'Breached', color: '#B42318' },
}
