import { Badge } from "@/components/ui/badge";
import { CONSULTATION_STATUS } from "@/lib/constants";

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "secondary" | "warning" | "destructive" | "outline"
> = {
  ACTIVE: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export function ConsultationStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "secondary"}>
      {(CONSULTATION_STATUS as Record<string, string>)[status] ?? status}
    </Badge>
  );
}
