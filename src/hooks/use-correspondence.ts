"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  CreateCorrespondenceInput,
  UpdateCorrespondenceInput,
  CorrespondenceFiltersInput,
} from "@/lib/validations/correspondence";

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
    throw new Error(json.error || "حدث خطأ");
  }
  return json.data;
}

function buildQuery(filters: Partial<CorrespondenceFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  });
  return params.toString();
}

export interface Attachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
  mime?: string | null;
}

export interface ViewedByEntry {
  id: string;
  name: string;
  at: string;
}

export interface CorrespondenceItem {
  id: string;
  serialNumber: number;
  subject: string;
  body: string;
  category: string;
  type: string;
  direction: string;
  senderId: string;
  senderName: string;
  recipientIds: string[];
  recipientNames: string[];
  viewedBy: ViewedByEntry[] | null;
  attachmentCount: number;
  attachments: Attachment[] | null;
  dateHijri: string | null;
  date: string;
  parentId: string | null;
  createdAt: string;
}

export interface CorrespondenceWithReplies extends CorrespondenceItem {
  replies: CorrespondenceItem[];
}

export interface CorrespondenceListResult {
  items: CorrespondenceItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  directionCounts: Record<string, number>;
}

export function useCorrespondenceList(
  filters: Partial<CorrespondenceFiltersInput>,
) {
  return useQuery({
    queryKey: ["correspondence", filters],
    queryFn: () =>
      fetchJson<CorrespondenceListResult>(
        `/api/correspondence?${buildQuery(filters)}`,
      ),
    placeholderData: keepPreviousData,
  });
}

export function useCorrespondence(id: string | undefined) {
  return useQuery({
    queryKey: ["correspondence", id],
    queryFn: () =>
      fetchJson<CorrespondenceWithReplies>(`/api/correspondence/${id}`),
    enabled: !!id,
  });
}

export function useCreateCorrespondence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCorrespondenceInput) =>
      fetchJson<{ id: string }>(`/api/correspondence`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["correspondence"] });
    },
  });
}

export function useUpdateCorrespondence(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCorrespondenceInput) =>
      fetchJson<{ id: string }>(`/api/correspondence/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["correspondence"] });
      qc.invalidateQueries({ queryKey: ["correspondence", id] });
    },
  });
}

export function useDeleteCorrespondence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/correspondence/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["correspondence"] });
    },
  });
}
