import { createFileRoute } from '@tanstack/react-router'
import { TransactionForm } from '#/components/transactions/transaction-form.tsx'
export const Route=createFileRoute('/nova-receita')({component:()=> <div className="max-w-2xl space-y-5"><h1 className="text-2xl font-bold">Nova receita</h1><div className="p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-zinc-800"><TransactionForm defaultType="INCOME"/></div></div>})
