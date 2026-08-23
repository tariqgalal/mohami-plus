import { Badge } from "@/components/ui/badge";
import { LEAVE_STATUS, LEAVE_TYPE } from "@/lib/constants";

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "secondary" | "warning" | "destructive" | "outline"
> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export function LeaveStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "secondary"}>
      {(LEAVE_STATUS as Record<string, string>)[status] ?? status}
    </Badge>
  );
}

export function LeaveTypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="secondary">
      {(LEAVE_TYPE as Record<string, string>)[type] ?? type}
    </Badge>
  );
}
