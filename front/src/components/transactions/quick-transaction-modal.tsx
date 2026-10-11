import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useAppUI } from '#/components/ui/theme-provider.tsx';
import { TransactionForm } from './transaction-form.tsx';

export function QuickTransactionModal() {
  const { quickModal, closeQuickTransaction } = useAppUI();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && quickModal.isOpen) {
        closeQuickTransaction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickModal.isOpen, closeQuickTransaction]);

  if (!quickModal.isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-modal-title"
    >
      {/* Backdrop click target */}
      <div
        className="fixed inset-0"
        onClick={closeQuickTransaction}
        aria-hidden="true"
      />

      {/* Mobile Bottom Sheet / Desktop Dialog */}
      <div className="relative z-10 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#12141a] border-t sm:border border-slate-200 dark:border-zinc-800 p-5 sm:p-6 shadow-2xl">
        {/* Mobile grab handle */}
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between mb-4">
          <h2
            id="quick-modal-title"
            className="text-lg font-bold text-slate-900 dark:text-white"
          >
            {quickModal.editingTransaction
              ? 'Editar lançamento'
              : quickModal.defaultType === 'EXPENSE'
                ? 'Novo gasto rápido'
                : 'Nova receita'}
          </h2>
          <button
            type="button"
            onClick={closeQuickTransaction}
            className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/70 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <TransactionForm
          key={
            quickModal.editingTransaction
              ? quickModal.editingTransaction.id
              : `new-${quickModal.defaultType}`
          }
          defaultType={quickModal.defaultType}
          editingTransaction={quickModal.editingTransaction}
          onSuccess={closeQuickTransaction}
          onCancel={closeQuickTransaction}
        />
      </div>
    </div>
  );
}
