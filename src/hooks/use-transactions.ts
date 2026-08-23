"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFiltersInput,
} from "@/lib/validations/transaction";

interface ApiResult<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json: ApiResult<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "حدث خطأ");
  }
  return json.data;
}

function buildQuery(filters: Partial<TransactionFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  });
  return params.toString();
}

export interface TransactionItem {
  id: string;
  registryNumber: string;
  subject: string;
  direction: string;
  receiveDate: string | null;
  receiveDateHijri: string | null;
  sendDate: string | null;
  sendDateHijri: string | null;
  senderName: string | null;
  recipientName: string | null;
  department: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

export interface TransactionListResult {
  items: TransactionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useTransactions(filters: Partial<TransactionFiltersInput>) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () =>
      fetchJson<TransactionListResult>(
        `/api/transactions?${buildQuery(filters)}`,
      ),
    placeholderData: keepPreviousData,
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: ["transactions", id],
    queryFn: () => fetchJson<TransactionItem>(`/api/transactions/${id}`),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      fetchJson<{ id: string }>(`/api/transactions`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUpdateTransaction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTransactionInput) =>
      fetchJson<{ id: string }>(`/api/transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions", id] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/transactions/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
