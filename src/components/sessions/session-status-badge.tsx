import { Badge } from "@/components/ui/badge";
import { SESSION_STATUS, SESSION_TYPES } from "@/lib/constants";

const STATUS_VARIANTS: Record<
  string,
  "default" | "success" | "secondary" | "warning" | "destructive"
> = {
  SCHEDULED: "default",
  COMPLETED: "success",
  POSTPONED: "warning",
  CANCELLED: "destructive",
};

export function SessionStatusBadge({ status }: { status: string }) {
  const label = (SESSION_STATUS as Record<string, string>)[status] ?? status;
  return <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>{label}</Badge>;
}

export function SessionTypeBadge({ type }: { type: string }) {
  const label = (SESSION_TYPES as Record<string, string>)[type] ?? type;
  return <Badge variant="outline">{label}</Badge>;
}
