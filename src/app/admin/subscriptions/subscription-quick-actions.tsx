"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CalendarPlus, Gift, Play } from "lucide-react";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";

interface Props {
  tenantId: string;
  status: string;
}

async function callAction(
  tenantId: string,
  action: string,
  data: Record<string, unknown>,
) {
  const res = await fetch(`/api/admin/tenants/${tenantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "فشل الإجراء");
  return json.data;
}

const PILL_BASE =
  "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold ring-1 transition-all duration-200 hover:scale-105 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

export function SubscriptionQuickActions({ tenantId, status }: Props) {
  const router = useRouter();

  const extend = useMutation({
    mutationFn: (days: number) =>
      callAction(tenantId, "extend_trial", { days }),
    onSuccess: (_d, days) => {
      toast.success(`تم تمديد التجربة ${days} يوم`);
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const gift = useMutation({
    mutationFn: (months: number) =>
      callAction(tenantId, "grant_free_months", { months }),
    onSuccess: (_d, months) => {
      toast.success(`تم منح ${months} شهر`);
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const activate = useMutation({
    mutationFn: () => callAction(tenantId, "status", { status: "ACTIVE" }),
    onSuccess: () => {
      toast.success("تم التفعيل");
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = extend.isPending || gift.isPending || activate.isPending;
  const trial = status === "TRIAL";

  return (
    <div className="inline-flex items-center gap-1.5 justify-center flex-wrap">
      {trial ? (
        <>
          <button
            onClick={() => extend.mutate(7)}
            disabled={pending}
            className={cn(
              PILL_BASE,
              "bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100",
            )}
            title="تمديد 7 أيام"
          >
            <CalendarPlus className="size-3.5" />
            +7 ي
          </button>
          <button
            onClick={() => extend.mutate(14)}
            disabled={pending}
            className={cn(
              PILL_BASE,
              "bg-orange-50 text-orange-700 ring-orange-200 hover:bg-orange-100",
            )}
          >
            +14 ي
          </button>
          <button
            onClick={() => extend.mutate(30)}
            disabled={pending}
            className={cn(
              PILL_BASE,
              "bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100",
            )}
          >
            +30 ي
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => gift.mutate(1)}
            disabled={pending}
            className={cn(
              PILL_BASE,
              "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100",
            )}
            title="منح شهر"
          >
            <Gift className="size-3.5" />
            +1 شهر
          </button>
          <button
            onClick={() => gift.mutate(3)}
            disabled={pending}
            className={cn(
              PILL_BASE,
              "bg-teal-50 text-teal-700 ring-teal-200 hover:bg-teal-100",
            )}
          >
            +3 أشهر
          </button>
          <button
            onClick={() => gift.mutate(12)}
            disabled={pending}
            className={cn(
              PILL_BASE,
              "bg-cyan-50 text-cyan-700 ring-cyan-200 hover:bg-cyan-100",
            )}
          >
            +سنة
          </button>
        </>
      )}
      {(status === "EXPIRED" || status === "SUSPENDED") && (
        <button
          onClick={() => activate.mutate()}
          disabled={pending}
          className={cn(
            PILL_BASE,
            "bg-blue-50 text-blue-700 ring-blue-200 hover:bg-blue-100",
          )}
        >
          <Play className="size-3.5" /> تفعيل
        </button>
      )}
    </div>
  );
}
