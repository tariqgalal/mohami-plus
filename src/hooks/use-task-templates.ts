"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTaskTemplateInput,
  UpdateTaskTemplateInput,
} from "@/lib/validations/task";

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

export interface TaskTemplateItem {
  id: string;
  text: string;
  sortOrder: number;
  createdAt: string;
}

export function useTaskTemplates() {
  return useQuery({
    queryKey: ["task-templates"],
    queryFn: () => fetchJson<TaskTemplateItem[]>(`/api/task-templates`),
  });
}

export function useCreateTaskTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskTemplateInput) =>
      fetchJson<TaskTemplateItem>(`/api/task-templates`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-templates"] });
    },
  });
}

export function useUpdateTaskTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateTaskTemplateInput;
    }) =>
      fetchJson<TaskTemplateItem>(`/api/task-templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-templates"] });
    },
  });
}

export function useDeleteTaskTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/task-templates/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-templates"] });
    },
  });
}
