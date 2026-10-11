import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { TransactionWithCategory } from '#/domains/transactions/queries.ts';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface QuickTransactionModalState {
  isOpen: boolean;
  defaultType: 'EXPENSE' | 'INCOME';
  editingTransaction: TransactionWithCategory | null;
}

interface AppUIContextValue {
  theme: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: ThemeMode) => void;
  quickModal: QuickTransactionModalState;
  openQuickTransaction: (
    defaultType?: 'EXPENSE' | 'INCOME',
    editingTransaction?: TransactionWithCategory | null,
  ) => void;
  closeQuickTransaction: () => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const STORAGE_KEY = 'finora-theme-preference';

const AppUIContext = createContext<AppUIContextValue | null>(null);

export function AppUIProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [quickModal, setQuickModal] = useState<QuickTransactionModalState>({
    isOpen: false,
    defaultType: 'EXPENSE',
    editingTransaction: null,
  });

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const effective: 'dark' | 'light' =
        theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;
      setResolvedTheme(effective);
      if (effective === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // ignore storage errors
    }
  }, []);

  const openQuickTransaction = useCallback(
    (
      defaultType: 'EXPENSE' | 'INCOME' = 'EXPENSE',
      editingTransaction: TransactionWithCategory | null = null,
    ) => {
      setQuickModal({
        isOpen: true,
        defaultType: editingTransaction
          ? editingTransaction.type
          : defaultType,
        editingTransaction,
      });
    },
    [],
  );

  const closeQuickTransaction = useCallback(() => {
    setQuickModal((prev) => ({
      ...prev,
      isOpen: false,
      editingTransaction: null,
    }));
  }, []);

  const showToast = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    [],
  );

  return (
    <AppUIContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        quickModal,
        openQuickTransaction,
        closeQuickTransaction,
        showToast,
      }}
    >
      {children}
      {/* Accessible Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg transition-all duration-150 ${
              toast.type === 'error'
                ? 'bg-red-950/95 border-red-800 text-red-100 dark:bg-red-950/95 dark:border-red-800 dark:text-red-100'
                : toast.type === 'info'
                  ? 'bg-slate-900/95 border-slate-700 text-white dark:bg-zinc-900/95 dark:border-zinc-700'
                  : 'bg-emerald-950/95 border-emerald-800 text-emerald-100 dark:bg-zinc-900/95 dark:border-amber-400/40 dark:text-amber-200'
            }`}
          >
            <span>{toast.text}</span>
            <button
              type="button"
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="text-xs opacity-70 hover:opacity-100 px-1.5 py-0.5"
              aria-label="Fechar notificação"
            >
              Fechar
            </button>
          </div>
        ))}
      </div>
    </AppUIContext.Provider>
  );
}

export function useAppUI() {
  const ctx = useContext(AppUIContext);
  if (!ctx) {
    throw new Error('useAppUI deve ser utilizado dentro de um AppUIProvider.');
  }
  return ctx;
}
