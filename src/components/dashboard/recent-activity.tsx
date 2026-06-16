import Link from "next/link";
import {
  Activity as ActivityIcon,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/format";

const ENTITY_LABELS: Record<string, string> = {
  case: "قضية",
  session: "جلسة",
  client: "عميل",
  invoice: "فاتورة",
  meeting: "اجتماع",
  document: "مستند",
  team: "عضو",
};

const ACTION_META: Record<string, { label: string; icon: typeof Plus; color: string }> = {
  created: { label: "أضاف", icon: Plus, color: "bg-emerald-50 text-emerald-600" },
  updated: { label: "حدّث", icon: Pencil, color: "bg-blue-50 text-blue-600" },
  deleted: { label: "حذف", icon: Trash2, color: "bg-red-50 text-red-600" },
  result_recorded: {
    label: "سجّل نتيجة",
    icon: CheckCircle2,
    color: "bg-violet-50 text-violet-600",
  },
};

export interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string | null;
  createdAt: Date | string;
  user: { id: string; name: string } | null;
  case?: { id: string; caseNumber: string; title: string } | null;
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <ActivityIcon className="size-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">لا يوجد نشاط مسجّل بعد</p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((a) => {
        const meta = ACTION_META[a.action] ?? {
          label: a.action,
          icon: Circle,
          color: "bg-slate-100 text-slate-600",
        };
        const Icon = meta.icon;
        const entityLabel = ENTITY_LABELS[a.entity] ?? a.entity;
        return (
          <li key={a.id} className="flex items-start gap-3">
            <div className={`size-8 rounded-md grid place-items-center shrink-0 ${meta.color}`}>
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">
                  {a.user?.name ?? "مستخدم"}
                </span>{" "}
                {meta.label} {entityLabel}
                {a.case && (
                  <>
                    {" — "}
                    <Link
                      href={`/dashboard/cases/${a.case.id}`}
                      className="text-brand-600 hover:underline"
                    >
                      {a.case.caseNumber}
                    </Link>
                  </>
                )}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatRelativeTime(a.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
