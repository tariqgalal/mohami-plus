"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  CreatePowerOfAttorneyInput,
  UpdatePowerOfAttorneyInput,
  PowerOfAttorneyFiltersInput,
} from "@/lib/validations/power-of-attorney";
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

function buildQuery(filters: Partial<PowerOfAttorneyFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  });
  return params.toString();
}

export interface PoaListItem {
  id: string;
  number: string;
  startDate: string;
  startDateHijri: string;
  endDate: string;
  endDateHijri: string;
  status: string;
  notes: string | null;
  createdAt: string;
  client: { id: string; name: string; clientType: string; phone: string };
}

export interface PoaListResult {
  items: PoaListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts: Record<string, number>;
}

export function usePowersOfAttorney(
  filters: Partial<PowerOfAttorneyFiltersInput>,
) {
  return useQuery({
    queryKey: ["powers-of-attorney", filters],
    queryFn: () =>
      fetchJson<PoaListResult>(`/api/powers-of-attorney?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function usePowerOfAttorney(id: string | undefined) {
  return useQuery({
    queryKey: ["powers-of-attorney", id],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryFn: () => fetchJson<any>(`/api/powers-of-attorney/${id}`),
    enabled: !!id,
  });
}

export function useCreatePowerOfAttorney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePowerOfAttorneyInput) =>
      fetchJson<{ id: string }>(`/api/powers-of-attorney`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["powers-of-attorney"] });
    },
  });
}

export function useUpdatePowerOfAttorney(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePowerOfAttorneyInput) =>
      fetchJson<{ id: string }>(`/api/powers-of-attorney/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["powers-of-attorney"] });
      qc.invalidateQueries({ queryKey: ["powers-of-attorney", id] });
    },
  });
}

export function useDeletePowerOfAttorney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/powers-of-attorney/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["powers-of-attorney"] });
    },
  });
}
