import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    system: 'Project Management System',
    module: 'Oracle Primavera P6 EPPM',
    status: 'pending',
    lastSync: null,
    connectionNote: 'API integration in configuration — go-live scheduled Q3 2026',
    data: {
      activeProjects: 23,
      totalPortfolioValue: 'AED 14.8Bn',
      onTrack: 17,
      delayed: 6,
      criticalPathDelays: 1,
      delayedProjects: [
        { name: 'Saadiyat Lagoons Ph.2', delayDays: 45, criticalPath: true,  cause: 'MEP subcontractor performance + crane availability', revisedCompletion: 'Q3 2027' },
        { name: 'Yas Residences Block C', delayDays: 28, criticalPath: false, cause: 'Labour shortage — specialist MEP trades', revisedCompletion: 'Q2 2027' },
        { name: 'Nurai Island Villas Ph.3', delayDays: 19, criticalPath: false, cause: 'Marine access window restriction', revisedCompletion: 'Q4 2026' },
        { name: 'Al Raha Lofts — Tower 2', delayDays: 12, criticalPath: false, cause: 'Structural steel lead time overrun', revisedCompletion: 'Q1 2027' },
        { name: 'Jubail Mangroves Ph.1', delayDays: 8,  criticalPath: false, cause: 'EAD environmental permit extension required', revisedCompletion: 'Q3 2026' },
        { name: 'Aldar HQ Tower Fit-Out', delayDays: 6,  criticalPath: false, cause: 'Bespoke furniture lead time', revisedCompletion: 'Q2 2026' },
      ],
      milestonesThisMonth: 18,
      milestonesAchieved: 14,
      milestonesAtRisk: 4,
      pendingPermits: 7,
    },
    kpis: {
      schedulePerformanceIndex: 0.87,
      costPerformanceIndex: 0.96,
      onTimeDeliveryRate: '73.9%',
      safetyLTIFR: 0.42,
    },
    note: 'Live integration requires Primavera Cloud API key + network peering to Aldar data centre. Mock data reflects latest manual report input.',
  })
}
