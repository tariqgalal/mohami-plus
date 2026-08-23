"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  CreateEmployeeLeaveInput,
  UpdateEmployeeLeaveInput,
  EmployeeLeaveFiltersInput,
} from "@/lib/validations/employee-leave";

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

function buildQuery(filters: Partial<EmployeeLeaveFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, v instanceof Date ? v.toISOString() : String(v));
    }
  });
  return params.toString();
}

export interface EmployeeLeaveItem {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  startDateHijri: string;
  endDate: string;
  endDateHijri: string;
  daysCount: number;
  status: string;
  notes: string | null;
  createdAt: string;
}

export interface EmployeeLeaveListResult {
  items: EmployeeLeaveItem[];
  total: number;
  totalDays: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useEmployeeLeaves(
  filters: Partial<EmployeeLeaveFiltersInput>,
) {
  return useQuery({
    queryKey: ["employee-leaves", filters],
    queryFn: () =>
      fetchJson<EmployeeLeaveListResult>(
        `/api/hr/leaves?${buildQuery(filters)}`,
      ),
    placeholderData: keepPreviousData,
  });
}

export function useEmployeeLeave(id: string | undefined) {
  return useQuery({
    queryKey: ["employee-leaves", id],
    queryFn: () => fetchJson<EmployeeLeaveItem>(`/api/hr/leaves/${id}`),
    enabled: !!id,
  });
}

export function useCreateEmployeeLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeLeaveInput) =>
      fetchJson<{ id: string }>(`/api/hr/leaves`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-leaves"] });
    },
  });
}

export function useUpdateEmployeeLeave(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateEmployeeLeaveInput) =>
      fetchJson<{ id: string }>(`/api/hr/leaves/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-leaves"] });
      qc.invalidateQueries({ queryKey: ["employee-leaves", id] });
    },
  });
}

export function useDeleteEmployeeLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/hr/leaves/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-leaves"] });
    },
  });
}
