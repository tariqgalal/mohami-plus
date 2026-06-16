import { Badge } from "@/components/ui/badge";
import { MEETING_STATUS, MEETING_TYPES } from "@/lib/constants";
import type { MeetingStatus, MeetingType } from "@prisma/client";

const statusVariants: Record<MeetingStatus, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 ring-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-700 ring-slate-200",
};

const typeVariants: Record<MeetingType, string> = {
  CLIENT: "bg-violet-50 text-violet-700 ring-violet-200",
  INTERNAL: "bg-amber-50 text-amber-700 ring-amber-200",
  COURT: "bg-rose-50 text-rose-700 ring-rose-200",
  EXTERNAL: "bg-cyan-50 text-cyan-700 ring-cyan-200",
};

export function MeetingStatusBadge({ status }: { status: MeetingStatus | string }) {
  const cls = statusVariants[status as MeetingStatus] ?? statusVariants.SCHEDULED;
  return (
    <Badge className={`${cls} ring-1`}>
      {MEETING_STATUS[status as MeetingStatus] ?? status}
    </Badge>
  );
}

export function MeetingTypeBadge({ type }: { type: MeetingType | string }) {
  const cls = typeVariants[type as MeetingType] ?? typeVariants.CLIENT;
  return (
    <Badge className={`${cls} ring-1`}>
      {MEETING_TYPES[type as MeetingType] ?? type}
    </Badge>
  );
}
