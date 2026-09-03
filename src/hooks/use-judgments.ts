"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  CreateJudgmentInput,
  UpdateJudgmentInput,
  JudgmentFiltersInput,
} from "@/lib/validations/judgment";
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

function buildQuery(filters: Partial<JudgmentFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  });
  return params.toString();
}

export interface JudgmentItem {
  id: string;
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  judgmentLevel: string;
  judgmentResult: string;
  judgmentSummary: string | null;
  receiveDate: string | null;
  receiveDateHijri: string | null;
  objectionStatus: string;
  objectionDeadline: string | null;
  notes: string | null;
  attachments: unknown[] | null;
  createdAt: string;
}

export interface JudgmentListResult {
  items: JudgmentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  objectionCounts?: Record<string, number>;
}

export function useJudgments(filters: Partial<JudgmentFiltersInput>) {
  return useQuery({
    queryKey: ["judgments", filters],
    queryFn: () =>
      fetchJson<JudgmentListResult>(`/api/judgments?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useJudgment(id: string | undefined) {
  return useQuery({
    queryKey: ["judgments", id],
    queryFn: () => fetchJson<JudgmentItem>(`/api/judgments/${id}`),
    enabled: !!id,
  });
}

export function useCreateJudgment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateJudgmentInput) =>
      fetchJson<{ id: string }>(`/api/judgments`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["judgments"] });
    },
  });
}

export function useUpdateJudgment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateJudgmentInput) =>
      fetchJson<{ id: string }>(`/api/judgments/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["judgments"] });
      qc.invalidateQueries({ queryKey: ["judgments", id] });
    },
  });
}

export function useDeleteJudgment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/judgments/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["judgments"] });
    },
  });
}
