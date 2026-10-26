import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  FolderKanban,
  LayoutDashboard,
  ListOrdered,
  Monitor,
  Moon,
  Plus,
  Settings,
  Sun,
} from "lucide-react";
import type React from "react";
import { QuickTransactionModal } from "#/components/transactions/quick-transaction-modal.tsx";
import { useAppUI } from "#/components/ui/theme-provider.tsx";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme, setTheme, openQuickTransaction } = useAppUI();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/lancamentos", label: "Lançamentos", icon: ListOrdered },
    { to: "/novo-gasto", label: "Novo gasto", icon: ArrowDownRight },
    { to: "/nova-receita", label: "Nova receita", icon: ArrowUpRight },
    { to: "/categorias", label: "Categorias", icon: FolderKanban },
    { to: "/configuracoes", label: "Configurações", icon: Settings },
  ] as const;

  const toggleQuickTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0a0b0e] text-slate-900 dark:text-zinc-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-[#101217] border-r border-slate-200/90 dark:border-zinc-800/90 z-30">
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800/80">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5"
          >
            <span className="w-7 h-7 rounded-lg bg-emerald-600 dark:bg-amber-400 text-white dark:text-zinc-950 flex items-center justify-center font-mono-tabular font-bold text-sm">
              R$
            </span>
            <span>Finora</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === "/"
                ? currentPath === "/"
                : currentPath.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`min-h-[42px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-600/10 text-emerald-700 dark:bg-amber-400/15 dark:text-amber-300 font-semibold"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-zinc-900/70"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme Switcher Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-zinc-800/80">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`min-h-[34px] rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors ${
                theme === "light"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Tema Claro"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Claro</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`min-h-[34px] rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors ${
                theme === "dark"
                  ? "bg-zinc-800 text-amber-300 shadow-2xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Tema Escuro"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Escuro</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`min-h-[34px] rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors ${
                theme === "system"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Seguir sistema"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Sistema</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Mobile Top App Bar (compact 54px, obeying 15% sticky cap) */}
        <header className="md:hidden sticky top-0 z-30 h-14 px-4 bg-white/90 dark:bg-[#101217]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <Link
            to="/"
            className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2"
          >
            <span className="w-6 h-6 rounded-lg bg-emerald-600 dark:bg-amber-400 text-white dark:text-zinc-950 flex items-center justify-center font-mono-tabular font-bold text-xs">
              R$
            </span>
            <span>Finora</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleQuickTheme}
              className="min-w-[38px] min-h-[38px] rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300"
              aria-label="Alternar tema claro/escuro"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="min-w-[38px] min-h-[38px] rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-500 hover:text-red-600 dark:text-zinc-300"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Navegação principal mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#101217]/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          <Link
            to="/"
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
              currentPath === "/"
                ? "text-emerald-600 dark:text-amber-400 font-semibold"
                : "text-slate-500 dark:text-zinc-400"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Dashboard</span>
          </Link>

          <Link
            to="/lancamentos"
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
              currentPath.startsWith("/lancamentos")
                ? "text-emerald-600 dark:text-amber-400 font-semibold"
                : "text-slate-500 dark:text-zinc-400"
            }`}
          >
            <ListOrdered className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Extrato</span>
          </Link>

          {/* Central Primary Quick-Add Expense Button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => openQuickTransaction("EXPENSE")}
              className="w-12 h-12 rounded-2xl bg-emerald-600 dark:bg-amber-400 text-white dark:text-zinc-950 shadow-md flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Novo gasto rápido"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          <Link
            to="/categorias"
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
              currentPath.startsWith("/categorias")
                ? "text-emerald-600 dark:text-amber-400 font-semibold"
                : "text-slate-500 dark:text-zinc-400"
            }`}
          >
            <FolderKanban className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Categorias</span>
          </Link>

          <Link
            to="/configuracoes"
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
              currentPath.startsWith("/configuracoes")
                ? "text-emerald-600 dark:text-amber-400 font-semibold"
                : "text-slate-500 dark:text-zinc-400"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Ajustes</span>
          </Link>
        </div>
      </nav>

      {/* Global Quick Transaction Modal / Mobile Bottom Sheet */}
      <QuickTransactionModal />
    </div>
  );
}
