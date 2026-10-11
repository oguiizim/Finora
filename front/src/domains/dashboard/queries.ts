import { getAllTransactions } from '#/domains/transactions/queries.ts'
import { resolvePeriodRange } from '#/domains/transactions/calculations.ts'
import { buildDashboardAnalytics } from './calculations.ts'

export async function getDashboardData({data={}}:{data?:any}={}) { return buildDashboardAnalytics({allTransactions:await getAllTransactions(),periodRange:resolvePeriodRange(data.period ?? 'THIS_MONTH',data.startDate,data.endDate),monthsIntervalCount:data.monthsInterval ?? 6}) }
export async function getSystemConfigInfo() { return { engineLabel: 'API Go + SQLite', environment: import.meta.env.MODE } }
export async function triggerDevelopmentSeed() { throw new Error('O seed é administrado pelo backend.') }
