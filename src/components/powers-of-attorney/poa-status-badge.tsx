import { Badge } from "@/components/ui/badge";
import { POA_STATUS } from "@/lib/constants";

const VARIANT: Record<
  string,
  "success" | "secondary" | "warning" | "destructive"
> = {
  ACTIVE: "success",
  EXPIRED: "secondary",
  PARTIALLY_REVOKED: "warning",
  FULLY_REVOKED: "destructive",
};

export function PoaStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANT[status] ?? "secondary"}>
      {(POA_STATUS as Record<string, string>)[status] ?? status}
    </Badge>
  );
}

/** الأيام المتبقية حتى الانتهاء (سالبة = منتهية) */
export function daysRemaining(endDate: string | Date): number {
  const end = new Date(endDate);
  const today = new Date();
  const endUtc = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  );
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return Math.round((endUtc - todayUtc) / 86_400_000);
}

export function DaysRemainingCell({ endDate }: { endDate: string | Date }) {
  const days = daysRemaining(endDate);
  if (days < 0)
    return <span className="text-red-600 font-medium">منتهية</span>;
  if (days === 0)
    return <span className="text-amber-600 font-medium">تنتهي اليوم</span>;
  const color =
    days <= 30 ? "text-amber-600" : "text-slate-700";
  return (
    <span className={`${color} tabular-nums`}>{days} يوم</span>
  );
}
