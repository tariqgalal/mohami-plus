import { Badge } from "@/components/ui/badge";
import {
  OBJECTION_STATUS_ALL,
  JUDGMENT_RESULT,
  JUDGMENT_LEVEL,
} from "@/lib/constants";

const OBJECTION_VARIANT: Record<
  string,
  "default" | "success" | "secondary" | "warning" | "destructive" | "outline"
> = {
  PRE_FILING: "secondary",
  PENDING: "warning",
  NO_OBJECTION: "success",
  OBJECTED: "default",
  FINAL: "secondary",
};

const RESULT_VARIANT: Record<
  string,
  "default" | "success" | "secondary" | "warning" | "destructive" | "outline"
> = {
  IN_FAVOR: "success",
  AGAINST: "destructive",
  PARTIAL: "warning",
};

export function ObjectionStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={OBJECTION_VARIANT[status] ?? "secondary"}>
      {(OBJECTION_STATUS_ALL as Record<string, string>)[status] ?? status}
    </Badge>
  );
}

export function JudgmentResultBadge({ result }: { result: string }) {
  return (
    <Badge variant={RESULT_VARIANT[result] ?? "secondary"}>
      {(JUDGMENT_RESULT as Record<string, string>)[result] ?? result}
    </Badge>
  );
}

export function JudgmentLevelBadge({ level }: { level: string }) {
  return (
    <Badge variant="outline">
      {(JUDGMENT_LEVEL as Record<string, string>)[level] ?? level}
    </Badge>
  );
}
