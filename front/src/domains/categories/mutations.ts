import { apiFetch } from '#/domains/transactions/queries.ts'
export async function seedDefaultCategories() { return {ok:true} }
export async function createCategory({data}:{data:any}) { return apiFetch('/category/',{method:'POST',body:JSON.stringify({name:data.name})}) }
export async function updateCategory({data}:{data:any}) { return apiFetch(`/category/${data.id}`,{method:'PUT',body:JSON.stringify({name:data.name})}) }
export async function toggleArchiveCategory() { return {ok:true} }
export async function deleteCategory({data}:{data:{id:string}}) { return apiFetch<void>(`/category/${data.id}`,{method:'DELETE'}) }
