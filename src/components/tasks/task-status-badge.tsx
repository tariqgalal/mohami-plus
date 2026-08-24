import { Badge } from "@/components/ui/badge";
import { TASK_STATUS } from "@/lib/constants";

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "secondary" | "warning" | "destructive" | "outline"
> = {
  PENDING: "default",
  AWAITING_APPROVAL: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export function TaskStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "secondary"}>
      {(TASK_STATUS as Record<string, string>)[status] ?? status}
    </Badge>
  );
}
