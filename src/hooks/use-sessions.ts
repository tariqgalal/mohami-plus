"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  CreateSessionInput,
  RecordResultInput,
  SessionFiltersInput,
  UpdateSessionInput,
} from "@/lib/validations/session";

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
  if (!res.ok || !json.success) throw new Error(json.error || "حدث خطأ");
  return json.data;
}

function buildQuery(filters: Partial<SessionFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (v instanceof Date) params.set(k, v.toISOString());
    else params.set(k, String(v));
  });
  return params.toString();
}

export interface SessionListItem {
  id: string;
  date: string;
  time: string;
  court: string;
  hall: string | null;
  judge: string | null;
  sessionType: string;
  status: string;
  reminder: boolean;
  case: {
    id: string;
    caseNumber: string;
    title: string;
    client: { id: string; name: string };
  };
  lawyer: { id: string; name: string; avatar: string | null; role: string };
}

export interface SessionListResult {
  items: SessionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useSessions(filters: Partial<SessionFiltersInput>) {
  return useQuery({
    queryKey: ["sessions", filters],
    queryFn: () =>
      fetchJson<SessionListResult>(`/api/sessions?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => fetchJson<any>(`/api/sessions/${id}`),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSessionInput) =>
      fetchJson<{ id: string }>(`/api/sessions`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useUpdateSession(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSessionInput) =>
      fetchJson<{ id: string }>(`/api/sessions/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["session", id] });
    },
  });
}

export function useRecordResult(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordResultInput) =>
      fetchJson<{ id: string }>(`/api/sessions/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["session", id] });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}
