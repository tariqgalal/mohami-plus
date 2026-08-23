import { Badge } from "@/components/ui/badge";
import { BORROWING_STATUS } from "@/lib/constants";

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "secondary" | "warning" | "destructive" | "outline"
> = {
  PENDING: "warning",
  DELIVERED: "default",
  RETURNED: "success",
  REJECTED: "destructive",
};

export function BorrowingStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "secondary"}>
      {(BORROWING_STATUS as Record<string, string>)[status] ?? status}
    </Badge>
  );
}
