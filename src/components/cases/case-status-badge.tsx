import { Badge } from "@/components/ui/badge";
import { CASE_STATUS, PRIORITY_LABELS } from "@/lib/constants";

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  OPEN: "default",
  IN_PROGRESS: "default",
  ON_HOLD: "warning",
  WON: "success",
  LOST: "destructive",
  SETTLED: "secondary",
  CLOSED: "secondary",
  APPEALED: "warning",
};

export function CaseStatusBadge({ status }: { status: string }) {
  const label = (CASE_STATUS as Record<string, string>)[status] ?? status;
  return <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>{label}</Badge>;
}

const PRIORITY_VARIANTS: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
};

export function PriorityBadge({ priority }: { priority: string }) {
  const label = (PRIORITY_LABELS as Record<string, string>)[priority] ?? priority;
  return (
    <Badge variant={PRIORITY_VARIANTS[priority] ?? "secondary"}>{label}</Badge>
  );
}
