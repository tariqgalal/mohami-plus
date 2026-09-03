"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  CreateCaseInput,
  UpdateCaseInput,
  CaseFiltersInput,
} from "@/lib/validations/case";
import { apiErrorMessage } from "@/lib/api-error-message";

interface ApiResult<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: unknown;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json: ApiResult<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(apiErrorMessage(json));
  }
  return json.data;
}

function buildQuery(filters: Partial<CaseFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  });
  return params.toString();
}

export interface CaseListItem {
  id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  court: string;
  status: string;
  priority: string;
  value: string | null;
  filingDate: string | null;
  createdAt: string;
  client: { id: string; name: string; clientType: string };
  lawyers: {
    isPrimary: boolean;
    user: { id: string; name: string; avatar: string | null };
  }[];
  _count: { sessions: number; documents: number };
}

export interface CaseListResult {
  items: CaseListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useCases(filters: Partial<CaseFiltersInput>) {
  return useQuery({
    queryKey: ["cases", filters],
    queryFn: () => fetchJson<CaseListResult>(`/api/cases?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useCase(id: string | undefined) {
  return useQuery({
    queryKey: ["cases", id],
    queryFn: () => fetchJson<any>(`/api/cases/${id}`),
    enabled: !!id,
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCaseInput) =>
      fetchJson<{ id: string }>(`/api/cases`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useUpdateCase(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCaseInput) =>
      fetchJson<{ id: string }>(`/api/cases/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases"] });
      qc.invalidateQueries({ queryKey: ["cases", id] });
    },
  });
}

export function useDeleteCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/cases/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export interface CaseCounts {
  counts: Record<string, number>;
  total: number;
}

export function useCaseCounts() {
  return useQuery({
    queryKey: ["cases", "counts"],
    queryFn: () => fetchJson<CaseCounts>(`/api/cases/counts`),
    staleTime: 30 * 1000,
  });
}

export function useArchiveCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      fetchJson<{ id: string }>(`/api/cases/${id}/archive`, {
        method: "PATCH",
        body: JSON.stringify({ archived }),
      }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["cases"] });
      qc.invalidateQueries({ queryKey: ["cases", id] });
    },
  });
}
