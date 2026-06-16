"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { UserRole } from "@prisma/client";
import type {
  CreateTeamMemberInput,
  TeamFiltersInput,
  UpdateTeamMemberInput,
} from "@/lib/validations/team";

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

function buildQuery(filters: Partial<TeamFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  return params.toString();
}

export interface TeamListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  specialization: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  _count: { assignedCases: number; sessions: number };
}

export interface TeamListResult {
  items: TeamListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useTeamList(filters: Partial<TeamFiltersInput>) {
  return useQuery({
    queryKey: ["team-list", filters],
    queryFn: () =>
      fetchJson<TeamListResult>(`/api/team?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useTeamMember(id: string | undefined) {
  return useQuery({
    queryKey: ["team-member", id],
    queryFn: () => fetchJson<any>(`/api/team/${id}`),
    enabled: !!id,
  });
}

export function useCreateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTeamMemberInput) =>
      fetchJson<{ id: string }>(`/api/team`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-list"] });
      qc.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export function useUpdateTeamMember(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTeamMemberInput) =>
      fetchJson<{ id: string }>(`/api/team/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-list"] });
      qc.invalidateQueries({ queryKey: ["team-member", id] });
    },
  });
}

export function useResetPassword(id: string) {
  return useMutation({
    mutationFn: (password: string) =>
      fetchJson<{ id: string }>(`/api/team/${id}`, {
        method: "PUT",
        body: JSON.stringify({ password }),
      }),
  });
}

export function useDeleteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/team/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-list"] }),
  });
}

export function useToggleTeamMemberActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetchJson<{ id: string }>(`/api/team/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-list"] }),
  });
}
