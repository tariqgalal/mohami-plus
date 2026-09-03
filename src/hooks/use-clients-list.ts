"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ClientFiltersInput,
  CreateClientInput,
  UpdateClientInput,
} from "@/lib/validations/client";
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

function buildQuery(filters: Partial<ClientFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  return params.toString();
}

export interface ClientListItem {
  id: string;
  name: string;
  clientType: string;
  phone: string;
  email: string | null;
  city: string;
  status: string;
  nationalId: string | null;
  createdAt: string;
  _count: { cases: number; invoices: number };
}

export interface ClientListResult {
  items: ClientListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useClientsList(filters: Partial<ClientFiltersInput>) {
  return useQuery({
    queryKey: ["clients-list", filters],
    queryFn: () =>
      fetchJson<ClientListResult>(`/api/clients?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => fetchJson<any>(`/api/clients/${id}`),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClientInput) =>
      fetchJson<{ id: string }>(`/api/clients`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateClientInput) =>
      fetchJson<{ id: string }>(`/api/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      qc.invalidateQueries({ queryKey: ["clients", id] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/clients/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients-list"] }),
  });
}
