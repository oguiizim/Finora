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
  isLeaving?: boolean;
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

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, isLeaving: true } : toast,
      ),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 220);
  }, []);

  const showToast = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        dismissToast(id);
      }, 3500);
    },
    [dismissToast],
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
            className={`toast-notification pointer-events-auto relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-zinc-200 bg-white py-3 pr-3 pl-5 text-sm font-medium text-zinc-950 shadow-xl shadow-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:shadow-black/30 ${toast.isLeaving ? 'toast-notification--leaving' : ''}`}
          >
            <span
              className={`absolute inset-y-0 left-0 w-1 ${
                toast.type === 'error'
                  ? 'bg-red-500'
                  : toast.type === 'info'
                    ? 'bg-sky-500'
                    : 'bg-emerald-500'
              }`}
              aria-hidden="true"
            />
            <span>{toast.text}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="px-1.5 py-0.5 text-xs text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
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
