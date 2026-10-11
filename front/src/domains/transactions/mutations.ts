import { apiFetch, mapTransaction } from './queries.ts'
const payload = (d:any) => ({ type:d.type, name:d.description, category_id:Number(d.categoryId), amount:d.amountInCents, date:`${d.date}T12:00:00Z`, status:d.status ?? 'PAID' })
export async function createTransaction({data}:{data:any}) { const r=await apiFetch<any>('/transaction/',{method:'POST',body:JSON.stringify(payload(data))}); return mapTransaction(r.transaction) }
export async function updateTransaction({data}:{data:any}) { const r=await apiFetch<any>(`/transaction/${data.id}`,{method:'PUT',body:JSON.stringify(payload(data))}); return mapTransaction(r.transaction) }
export async function deleteTransaction({data}:{data:{id:string}}) { return apiFetch<void>(`/transaction/${data.id}`,{method:'DELETE'}) }
