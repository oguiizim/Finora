import {
  clearSession,
  getSession,
  saveSession,
  type AuthSession,
} from "#/lib/auth.ts";
import { resolvePeriodRange } from "./calculations.ts";

export interface TransactionWithCategory {
  id: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  amountInCents: number;
  date: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface ListTransactionsResult {
  items: TransactionWithCategory[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    incomeInCents: number;
    expenseInCents: number;
    balanceInCents: number;
    balanceStatus: "POSITIVE" | "NEGATIVE" | "ZERO";
  };
  periodRange: ReturnType<typeof resolvePeriodRange>;
}
export const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

async function request(path: string, init: RequestInit = {}, token?: string) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API}${path}`, { ...init, headers });
}
async function refreshSession(
  session: AuthSession,
): Promise<AuthSession | null> {
  const response = await request("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!response.ok) return null;
  const next = (await response.json()) as AuthSession;
  saveSession(next);
  return next;
}
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let session = getSession();
  let response = await request(path, init, session?.access_token);
  if (response.status === 401 && session && !path.startsWith("/auth/")) {
    session = await refreshSession(session);
    if (session) response = await request(path, init, session.access_token);
    else clearSession();
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Não foi possível comunicar com a API.");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

const colors = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];
export function mapTransaction(t: any): TransactionWithCategory {
  return {
    id: String(t.id),
    type: t.type,
    description: t.name,
    amountInCents: t.amount,
    date: String(t.date).slice(0, 10),
    categoryId: t.category_id ? String(t.category_id) : null,
    categoryName: t.category_name ?? null,
    categoryColor:
      colors[(Number(t.category_id) || 0) % colors.length] ?? "#22c55e",
    categoryIcon: "tag",
    createdAt: new Date(t.created_at),
    updatedAt: new Date(t.updated_at),
  };
}
export async function getAllTransactions() {
  const data = await apiFetch<{ transactions: any[] }>("/transaction/all");
  return data.transactions.map(mapTransaction);
}
export async function listTransactions({
  data = {} as any,
}: {
  data?: any;
}): Promise<ListTransactionsResult> {
  const range = resolvePeriodRange(
    data.period ?? "THIS_MONTH",
    data.startDate,
    data.endDate,
  );
  let items = await getAllTransactions();
  items = items
    .filter(
      (transaction) =>
        transaction.date >= range.startDate &&
        transaction.date <= range.endDate,
    )
    .filter(
      (transaction) =>
        !data.type || data.type === "ALL" || transaction.type === data.type,
    )
    .filter(
      (transaction) =>
        !data.categoryId ||
        data.categoryId === "ALL" ||
        transaction.categoryId === String(data.categoryId),
    )
    .filter((transaction) => {
      if (!data.search) return true;
      const search = String(data.search).trim().toLocaleLowerCase("pt-BR");
      return transaction.description
        .toLocaleLowerCase("pt-BR")
        .includes(search);
    });
  items.sort((a, b) => {
    const value =
      data.sortBy === "amount"
        ? a.amountInCents - b.amountInCents
        : a.date.localeCompare(b.date);
    return data.sortOrder === "asc" ? value : -value;
  });
  const incomeInCents = items
    .filter((item) => item.type === "INCOME")
    .reduce((sum, item) => sum + item.amountInCents, 0);
  const expenseInCents = items
    .filter((item) => item.type === "EXPENSE")
    .reduce((sum, item) => sum + item.amountInCents, 0);
  const page = data.page ?? 1;
  const pageSize = data.all ? Math.max(items.length, 1) : (data.pageSize ?? 50);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalCount: items.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    summary: {
      incomeInCents,
      expenseInCents,
      balanceInCents: incomeInCents - expenseInCents,
      balanceStatus:
        incomeInCents === expenseInCents
          ? "ZERO"
          : incomeInCents > expenseInCents
            ? "POSITIVE"
            : "NEGATIVE",
    },
    periodRange: range,
  };
}
