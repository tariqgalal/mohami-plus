"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  CreateInvoiceInput,
  InvoiceFiltersInput,
  RecordPaymentInput,
  UpdateInvoiceInput,
} from "@/lib/validations/invoice";
import { apiErrorMessage } from "@/lib/api-error-message";

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
  if (!res.ok || !json.success) throw new Error(apiErrorMessage(json));
  return json.data;
}

function buildQuery(filters: Partial<InvoiceFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (v instanceof Date) params.set(k, v.toISOString());
    else params.set(k, String(v));
  });
  return params.toString();
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: string;
  tax: string;
  totalAmount: string;
  paidAmount: string;
  status: string;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  client: { id: string; name: string; phone: string };
  case: { id: string; caseNumber: string; title: string } | null;
}

export interface InvoiceListResult {
  items: InvoiceListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FinanceStats {
  total: number;
  paid: number;
  outstanding: number;
  overdueCount: number;
  invoiceCount: number;
  byStatus: Array<{
    status: string;
    _count: number;
    _sum: { totalAmount: string | null };
  }>;
}

export function useInvoices(filters: Partial<InvoiceFiltersInput>) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: () =>
      fetchJson<InvoiceListResult>(`/api/invoices?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ["invoice", id],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryFn: () => fetchJson<any>(`/api/invoices/${id}`),
    enabled: !!id,
  });
}

export function useFinanceStats() {
  return useQuery({
    queryKey: ["finance-stats"],
    queryFn: () => fetchJson<FinanceStats>(`/api/finance/stats`),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) =>
      fetchJson<{ id: string }>(`/api/invoices`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["finance-stats"] });
    },
  });
}

export function useUpdateInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInvoiceInput) =>
      fetchJson<{ id: string }>(`/api/invoices/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["finance-stats"] });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/invoices/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["finance-stats"] });
    },
  });
}

export function useRecordPayment(invoiceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPaymentInput) =>
      fetchJson<{ id: string }>(`/api/invoices/${invoiceId}/payments`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      qc.invalidateQueries({ queryKey: ["finance-stats"] });
    },
  });
}
