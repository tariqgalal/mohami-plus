"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFiltersInput,
} from "@/lib/validations/task";
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

function buildQuery(filters: Partial<TaskFiltersInput>) {
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

export interface TaskItem {
  id: string;
  number: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  projectType: string;
  caseId: string | null;
  clientId: string | null;
  clientName: string | null;
  assignedTo: Assignee[] | null;
  dueDate: string | null;
  dueDateHijri: string | null;
  timeSpent: number;
  timerStartedAt: string | null;
  isConfidential: boolean;
  completedWithoutAssignment: boolean;
  reply: string | null;
  attachments: unknown[] | null;
  createdAt: string;
}

export interface TaskListResult {
  items: TaskItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts?: Record<string, number>;
}

export function useTasks(filters: Partial<TaskFiltersInput>) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () =>
      fetchJson<TaskListResult>(`/api/tasks?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => fetchJson<TaskItem>(`/api/tasks/${id}`),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      fetchJson<{ id: string }>(`/api/tasks`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTaskInput) =>
      fetchJson<{ id: string }>(`/api/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", id] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/tasks/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useTaskTimer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: "start" | "stop") =>
      fetchJson<TaskItem>(`/api/tasks/${id}/timer`, {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", id] });
    },
  });
}
