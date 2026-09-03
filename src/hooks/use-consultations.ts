"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  CreateConsultationInput,
  UpdateConsultationInput,
  ConsultationFiltersInput,
} from "@/lib/validations/consultation";
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

function buildQuery(filters: Partial<ConsultationFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  });
  return params.toString();
}

export interface Assignee {
  id: string;
  name: string;
}

export interface ConsultationItem {
  id: string;
  number: number;
  title: string;
  type: string;
  clientId: string | null;
  clientName: string | null;
  assignedTo: Assignee[] | null;
  date: string;
  dateHijri: string | null;
  description: string | null;
  status: string;
  attachments: unknown[] | null;
  createdAt: string;
}

export interface ConsultationListResult {
  items: ConsultationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts?: Record<string, number>;
}

export function useConsultations(filters: Partial<ConsultationFiltersInput>) {
  return useQuery({
    queryKey: ["consultations", filters],
    queryFn: () =>
      fetchJson<ConsultationListResult>(
        `/api/consultations?${buildQuery(filters)}`,
      ),
    placeholderData: keepPreviousData,
  });
}

export function useConsultation(id: string | undefined) {
  return useQuery({
    queryKey: ["consultations", id],
    queryFn: () => fetchJson<ConsultationItem>(`/api/consultations/${id}`),
    enabled: !!id,
  });
}

export function useCreateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateConsultationInput) =>
      fetchJson<{ id: string }>(`/api/consultations`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}

export function useUpdateConsultation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateConsultationInput) =>
      fetchJson<{ id: string }>(`/api/consultations/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultations"] });
      qc.invalidateQueries({ queryKey: ["consultations", id] });
    },
  });
}

export function useDeleteConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/consultations/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}
