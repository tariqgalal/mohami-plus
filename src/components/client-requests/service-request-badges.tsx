import { Badge } from "@/components/ui/badge";
import { SERVICE_REQUEST_STATUS, REQUEST_SOURCE } from "@/lib/constants";

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "secondary" | "warning" | "destructive" | "outline"
> = {
  NEW: "default",
  UNDER_REVIEW: "warning",
  IN_STUDY: "warning",
  INITIAL_APPROVAL: "outline",
  FINAL_APPROVAL: "success",
  REJECTED: "destructive",
};

export function ServiceRequestStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "secondary"}>
      {(SERVICE_REQUEST_STATUS as Record<string, string>)[status] ?? status}
    </Badge>
  );
}

export function RequestSourceBadge({ source }: { source: string }) {
  return (
    <Badge variant="secondary">
      {(REQUEST_SOURCE as Record<string, string>)[source] ?? source}
    </Badge>
  );
}

/** تنسيق عداد الوقت (بالثواني) إلى صيغة HH:MM:SS */
export function formatTimeSpent(seconds: number | null | undefined): string {
  const s = Math.max(0, Math.floor(seconds ?? 0));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
