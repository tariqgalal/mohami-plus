"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  CreateServiceRequestInput,
  UpdateServiceRequestInput,
  ServiceRequestFiltersInput,
} from "@/lib/validations/client-service-request";
import { apiErrorMessage } from "@/lib/api-error-message";

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
    throw new Error(apiErrorMessage(json));
  }
  return json.data;
}

function buildQuery(filters: Partial<ServiceRequestFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  });
  return params.toString();
}

export interface ServiceRequestItem {
  id: string;
  source: string;
  requestType: string;
  requestSubType: string | null;
  description: string;
  applicantName: string;
  applicantPhone: string | null;
  applicantEmail: string | null;
  status: string;
  assignedTo: string | null;
  assignedToName: string | null;
  dateHijri: string | null;
  date: string;
  notes: string | null;
  timeSpent: number | null;
  createdAt: string;
}

export interface ServiceRequestListResult {
  items: ServiceRequestItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts: Record<string, number>;
}

export function useServiceRequests(
  filters: Partial<ServiceRequestFiltersInput>,
) {
  return useQuery({
    queryKey: ["service-requests", filters],
    queryFn: () =>
      fetchJson<ServiceRequestListResult>(
        `/api/client-requests?${buildQuery(filters)}`,
      ),
    placeholderData: keepPreviousData,
  });
}

export function useServiceRequest(id: string | undefined) {
  return useQuery({
    queryKey: ["service-requests", id],
    queryFn: () => fetchJson<ServiceRequestItem>(`/api/client-requests/${id}`),
    enabled: !!id,
  });
}

export function useCreateServiceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceRequestInput) =>
      fetchJson<{ id: string }>(`/api/client-requests`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}

export function useUpdateServiceRequest(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateServiceRequestInput) =>
      fetchJson<{ id: string }>(`/api/client-requests/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-requests"] });
      qc.invalidateQueries({ queryKey: ["service-requests", id] });
    },
  });
}

export function useDeleteServiceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/client-requests/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}
