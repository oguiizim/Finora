import { AlertTriangle } from "lucide-react";

type Props = {
  title: string;
  itemName: string;
  description?: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmationModal({
  title,
  itemName,
  description,
  isPending = false,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-confirmation-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        onClick={() => !isPending && onCancel()}
        aria-label="Cancelar exclusão"
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-[#12141a]">
        <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
          <AlertTriangle className="size-5" />
        </div>
        <h2
          id="delete-confirmation-title"
          className="mt-4 text-lg font-bold text-slate-900 dark:text-white"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-zinc-400">
          Você está prestes a excluir{" "}
          <span className="font-semibold text-slate-700 dark:text-zinc-200">
            “{itemName}”
          </span>
          . {description ?? "Esta ação não pode ser desfeita."}
        </p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="min-h-11 rounded-xl px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="min-h-11 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:opacity-50"
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
