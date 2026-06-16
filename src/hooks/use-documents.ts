"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  CreateDocumentInput,
  DocumentFiltersInput,
  UpdateDocumentInput,
} from "@/lib/validations/document";

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

function buildQuery(filters: Partial<DocumentFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    params.set(k, String(v));
  });
  return params.toString();
}

export interface DocumentListItem {
  id: string;
  name: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  createdAt: string;
  case: { id: string; caseNumber: string; title: string } | null;
}

export interface DocumentListResult {
  items: DocumentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useDocuments(filters: Partial<DocumentFiltersInput>) {
  return useQuery({
    queryKey: ["documents", filters],
    queryFn: () =>
      fetchJson<DocumentListResult>(`/api/documents?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDocumentInput) =>
      fetchJson<{ id: string }>(`/api/documents`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useUpdateDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDocumentInput) =>
      fetchJson<{ id: string }>(`/api/documents/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/documents/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}
