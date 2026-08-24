import { Badge } from "@/components/ui/badge";
import { TASK_PRIORITY } from "@/lib/constants";

const PRIORITY_VARIANT: Record<
  string,
  "default" | "success" | "secondary" | "warning" | "destructive" | "outline"
> = {
  URGENT: "destructive",
  NORMAL: "secondary",
  IMPORTANT: "warning",
  URGENT_IMPORTANT: "destructive",
};

export function TaskPriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority] ?? "secondary"}>
      {(TASK_PRIORITY as Record<string, string>)[priority] ?? priority}
    </Badge>
  );
}
