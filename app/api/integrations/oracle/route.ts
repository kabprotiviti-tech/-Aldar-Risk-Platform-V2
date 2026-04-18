import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    system: 'Oracle Fusion ERP',
    module: 'Project Portfolio Management + Finance',
    status: 'connected',
    lastSync: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    data: {
      activeBudgets: 23,
      totalCommittedValue: 'AED 8.24Bn',
      fiscalYearBudget: 'AED 2.8Bn',
      actualSpendYTD: 'AED 1.94Bn',
      costOverruns: [
        { project: 'Saadiyat Lagoons Ph.2', budgeted: 'AED 1.24Bn', forecast: 'AED 1.29Bn', overrun: 'AED 48M', pct: '+4.1%', status: 'Under Review' },
        { project: 'Yas Residences Block C', budgeted: 'AED 748M', forecast: 'AED 769M', overrun: 'AED 21M', pct: '+2.8%', status: 'Approved Variation' },
        { project: 'Al Raha Creek Ph.3', budgeted: 'AED 512M', forecast: 'AED 527M', overrun: 'AED 15M', pct: '+2.9%', status: 'Pending Approval' },
        { project: 'Yas Mall Expansion', budgeted: 'AED 380M', forecast: 'AED 389M', overrun: 'AED 9M', pct: '+2.4%', status: 'Approved Variation' },
      ],
      openPurchaseOrders: 847,
      overduePayables: 'AED 124M',
      contingencyRemaining: 'AED 312M',
      contingencyAtInception: 'AED 485M',
    },
    kpis: {
      costVariance: '+4.8%',
      scheduleAdherence: '73%',
      cashCycleDays: 42,
      debtServiceCoverage: 2.4,
    },
    note: 'Data refreshed every 15 minutes from Oracle Fusion Cloud. Production API requires mTLS certificate.',
  })
}
