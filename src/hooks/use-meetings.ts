"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  CreateMeetingInput,
  MeetingFiltersInput,
  UpdateMeetingInput,
  RecordMinutesInput,
} from "@/lib/validations/meeting";

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

function buildQuery(filters: Partial<MeetingFiltersInput>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (v instanceof Date) params.set(k, v.toISOString());
    else params.set(k, String(v));
  });
  return params.toString();
}

export interface MeetingAttendeeItem {
  id: string;
  userId: string | null;
  externalName: string | null;
  externalEmail: string | null;
  user: { id: string; name: string; avatar: string | null } | null;
}

export interface MeetingListItem {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  meetingType: string;
  location: string | null;
  isVirtual: boolean;
  meetingLink: string | null;
  notes: string | null;
  status: string;
  attendees: MeetingAttendeeItem[];
}

export interface MeetingListResult {
  items: MeetingListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useMeetings(filters: Partial<MeetingFiltersInput>) {
  return useQuery({
    queryKey: ["meetings", filters],
    queryFn: () =>
      fetchJson<MeetingListResult>(`/api/meetings?${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useMeeting(id: string | undefined) {
  return useQuery({
    queryKey: ["meeting", id],
    queryFn: () => fetchJson<MeetingListItem>(`/api/meetings/${id}`),
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMeetingInput) =>
      fetchJson<{ id: string }>(`/api/meetings`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useUpdateMeeting(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMeetingInput) =>
      fetchJson<{ id: string }>(`/api/meetings/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      qc.invalidateQueries({ queryKey: ["meeting", id] });
    },
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ id: string }>(`/api/meetings/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useRecordMeetingMinutes(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordMinutesInput) =>
      fetchJson<{ id: string }>(`/api/meetings/${id}/minutes`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      qc.invalidateQueries({ queryKey: ["meeting", id] });
    },
  });
}
