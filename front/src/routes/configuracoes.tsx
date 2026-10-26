import { createFileRoute } from "@tanstack/react-router";
import { useAppUI } from "#/components/ui/theme-provider.tsx";
export const Route = createFileRoute("/configuracoes")({
  component: () => {
    const { theme, setTheme } = useAppUI();
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Configurações</h1>
          <p className="text-xs text-slate-500 mt-1">Preferências visuais</p>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-zinc-800">
          <h2 className="font-semibold">Aparência e tema</h2>
          <div className="flex gap-3 mt-4">
            {(["light", "dark", "system"] as const).map((x) => (
              <button
                key={x}
                onClick={() => setTheme(x)}
                className={
                  theme === x
                    ? "px-4 py-2 rounded-xl bg-emerald-600 dark:bg-amber-400 text-white dark:text-zinc-950 text-xs font-semibold"
                    : "px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-xs"
                }
              >
                {{ light: "Claro", dark: "Escuro", system: "Sistema" }[x]}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  },
});
