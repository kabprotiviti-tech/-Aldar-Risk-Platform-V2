import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    system: 'CRM — Tenant & Sales Management',
    module: 'Salesforce Real Estate Cloud',
    status: 'connected',
    lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    data: {
      activeLeases: 847,
      expiringIn90Days: 34,
      expiringIn12Months: 112,
      atRiskTenants: [
        { id: 'T-0142', name: 'Tenant A (Retail)', asset: 'Yas Mall', annualRent: 'AED 14.2M', covenantScore: 42, status: 'Active Management', flag: 'Parent company restructuring' },
        { id: 'T-0318', name: 'Tenant B (F&B)', asset: 'Abu Dhabi Mall', annualRent: 'AED 7.4M', covenantScore: 38, status: 'At Risk', flag: '2 months arrears' },
        { id: 'T-0445', name: 'Tenant C (Fashion)', asset: 'Al Jimi Mall', annualRent: 'AED 5.8M', covenantScore: 55, status: 'Monitoring', flag: 'Sales below threshold' },
        { id: 'T-0671', name: 'Tenant D (Electronics)', asset: 'Yas Mall', annualRent: 'AED 4.1M', covenantScore: 61, status: 'Monitoring', flag: 'Lease renewal negotiation' },
      ],
      tenantHealthScoreAvg: 72,
      offPlanPipelineLeads: 1842,
      salesConversionRate: '18.4%',
      avgDealCycleDays: 47,
      reservationsThisMonth: 284,
      cancellationsThisMonth: 31,
    },
    kpis: {
      occupancyRateRetail: '94.2%',
      rentCollectionRate: '97.8%',
      netPromoterScore: 68,
      tenantRetentionRate: '84%',
    },
    note: 'Tenant names anonymised for data privacy. Full covenant data available via authenticated production API.',
  })
}
