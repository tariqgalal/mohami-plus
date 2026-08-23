"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  CreateBorrowingInput,
  UpdateBorrowingInput,
  BorrowingFiltersInput,
} from "@/lib/validations/borrowing";

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

function buildQuery(filters: Partial<BorrowingFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  });
  return params.toString();
}

export interface BorrowingItem {
  id: string;
  employeeId: string;
  employeeName: string;
  documentSource: string;
  documentType: string;
  documentName: string;
  description: string | null;
  borrowDate: string;
  borrowDateHijri: string | null;
  returnDate: string | null;
  returnDateHijri: string | null;
  status: string;
  createdAt: string;
}

export interface BorrowingListResult {
  items: BorrowingItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts?: Record<string, number>;
}

export function useBorrowings(filters: Partial<BorrowingFiltersInput>) {
  return useQuery({
    queryKey: ["borrowings", filters],
    queryFn: () =>
      fetchJson<BorrowingListResult>(`/api/borrowings?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useBorrowing(id: string | undefined) {
  return useQuery({
    queryKey: ["borrowings", id],
    queryFn: () => fetchJson<BorrowingItem>(`/api/borrowings/${id}`),
    enabled: !!id,
  });
}

export function useCreateBorrowing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBorrowingInput) =>
      fetchJson<{ id: string }>(`/api/borrowings`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["borrowings"] });
    },
  });
}

export function useUpdateBorrowing(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBorrowingInput) =>
      fetchJson<{ id: string }>(`/api/borrowings/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["borrowings"] });
      qc.invalidateQueries({ queryKey: ["borrowings", id] });
    },
  });
}

export function useDeleteBorrowing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/borrowings/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["borrowings"] });
    },
  });
}
