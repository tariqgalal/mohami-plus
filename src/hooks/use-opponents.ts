"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  CreateOpponentInput,
  UpdateOpponentInput,
  OpponentFiltersInput,
} from "@/lib/validations/opponent-record";
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
  if (!res.ok || !json.success) {
    throw new Error(apiErrorMessage(json));
  }
  return json.data;
}

function buildQuery(filters: Partial<OpponentFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  });
  return params.toString();
}

export interface OpponentItem {
  id: string;
  number: number;
  name: string;
  idNumber: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  caseIds: string[] | null;
  status: string;
  createdAt: string;
}

export interface OpponentListResult {
  items: OpponentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useOpponents(filters: Partial<OpponentFiltersInput>) {
  return useQuery({
    queryKey: ["opponents", filters],
    queryFn: () =>
      fetchJson<OpponentListResult>(`/api/opponents?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useOpponent(id: string | undefined) {
  return useQuery({
    queryKey: ["opponents", id],
    queryFn: () => fetchJson<OpponentItem>(`/api/opponents/${id}`),
    enabled: !!id,
  });
}

export function useCreateOpponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOpponentInput) =>
      fetchJson<{ id: string }>(`/api/opponents`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opponents"] });
    },
  });
}

export function useUpdateOpponent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOpponentInput) =>
      fetchJson<{ id: string }>(`/api/opponents/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opponents"] });
      qc.invalidateQueries({ queryKey: ["opponents", id] });
    },
  });
}

export function useDeleteOpponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/opponents/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opponents"] });
    },
  });
}
