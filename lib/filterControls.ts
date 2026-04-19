import { type Control } from '@/lib/controlData'
import { evaluateControlStatus } from '@/lib/controlTestingEngine'
import { type FilterType } from '@/context/ControlFilterContext'

// Pre-compute once — overdue detection requires test records
const _ALL_TESTS = evaluateControlStatus()
const _OVERDUE_IDS = new Set(
  _ALL_TESTS.filter(t => t.testStatus === 'overdue').map(t => t.controlId)
)

export function filterControls(controls: Control[], filter: FilterType): Control[] {
  switch (filter) {
    case 'failed':
      return controls.filter(c => c.status === 'failed')
    case 'partial':
      return controls.filter(c => c.status === 'partial')
    case 'effective':
      return controls.filter(c => c.status === 'effective')
    case 'overdue':
      return controls.filter(c => _OVERDUE_IDS.has(c.id))
    default:
      return controls
  }
}
