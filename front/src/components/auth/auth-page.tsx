import { Link, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { ArrowRight, Landmark, LoaderCircle } from 'lucide-react'
import { useAuth } from './auth-provider.tsx'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true)
    try { await (isRegister ? signUp({ name, password }) : signIn({ name, password })); await navigate({ to: '/' }) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível continuar.') }
    finally { setLoading(false) }
  }

  return <main className="min-h-screen bg-slate-50 dark:bg-[#0a0b0e] grid place-items-center p-5">
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-950/5 dark:border-zinc-800 dark:bg-[#12141a] sm:p-9">
      <div className="mb-8 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-600 text-white dark:bg-amber-400 dark:text-zinc-950"><Landmark className="size-5" /></span><div><p className="text-lg font-bold tracking-tight">Finora</p><p className="text-xs text-slate-500 dark:text-zinc-400">Sua vida financeira, organizada.</p></div></div>
      <h1 className="text-2xl font-bold tracking-tight">{isRegister ? 'Crie sua conta' : 'Bem-vindo de volta'}</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">{isRegister ? 'Comece a acompanhar suas finanças em poucos passos.' : 'Entre para continuar acompanhando suas finanças.'}</p>
      <form className="mt-7 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-medium">Nome<input required autoComplete="username" value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none ring-emerald-600/30 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-900" placeholder="Como podemos te chamar?" /></label>
        <label className="block text-sm font-medium">Senha<input required minLength={8} type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none ring-emerald-600/30 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-900" placeholder="Mínimo de 8 caracteres" /></label>
        {error && <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
        <button disabled={loading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-400 dark:text-zinc-950 dark:hover:bg-amber-300">{loading ? <LoaderCircle className="size-4 animate-spin" /> : <>{isRegister ? 'Criar conta' : 'Entrar'} <ArrowRight className="size-4" /></>}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-zinc-400">{isRegister ? 'Já tem uma conta?' : 'Ainda não possui uma conta?'} <Link to={isRegister ? '/login' : '/cadastro'} className="font-semibold text-emerald-700 hover:underline dark:text-amber-300">{isRegister ? 'Entrar' : 'Criar conta'}</Link></p>
    </section>
  </main>
}
