import { Badge } from "@/components/ui/badge";
import {
  CORRESPONDENCE_CATEGORY,
  CORRESPONDENCE_DIRECTION,
} from "@/lib/constants";

const CATEGORY_VARIANT: Record<
  string,
  "default" | "success" | "secondary" | "warning" | "destructive" | "outline"
> = {
  DISCUSSIONS: "secondary",
  TASKS: "warning",
  CASES_PROJECTS: "default",
};

export function CorrespondenceCategoryBadge({ category }: { category: string }) {
  return (
    <Badge variant={CATEGORY_VARIANT[category] ?? "secondary"}>
      {(CORRESPONDENCE_CATEGORY as Record<string, string>)[category] ?? category}
    </Badge>
  );
}

export function CorrespondenceDirectionBadge({
  direction,
}: {
  direction: string;
}) {
  return (
    <Badge variant={direction === "INCOMING" ? "outline" : "success"}>
      {(CORRESPONDENCE_DIRECTION as Record<string, string>)[direction] ??
        direction}
    </Badge>
  );
}
