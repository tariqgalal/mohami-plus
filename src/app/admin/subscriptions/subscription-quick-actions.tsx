"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CalendarPlus, Gift, Play } from "lucide-react";
import { toast } from "@/store/toast-store";

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
    <div className="inline-flex items-center gap-1 justify-center">
      {trial ? (
        <>
          <button
            onClick={() => extend.mutate(7)}
            disabled={pending}
            className="px-2 py-1 rounded text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50 flex items-center gap-1"
            title="تمديد 7 أيام"
          >
            <CalendarPlus className="size-3" />
            +7 ي
          </button>
          <button
            onClick={() => extend.mutate(14)}
            disabled={pending}
            className="px-2 py-1 rounded text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            +14 ي
          </button>
          <button
            onClick={() => extend.mutate(30)}
            disabled={pending}
            className="px-2 py-1 rounded text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            +30 ي
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => gift.mutate(1)}
            disabled={pending}
            className="px-2 py-1 rounded text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 flex items-center gap-1"
            title="منح شهر"
          >
            <Gift className="size-3" />
            +1 شهر
          </button>
          <button
            onClick={() => gift.mutate(3)}
            disabled={pending}
            className="px-2 py-1 rounded text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          >
            +3 أشهر
          </button>
          <button
            onClick={() => gift.mutate(12)}
            disabled={pending}
            className="px-2 py-1 rounded text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          >
            +سنة
          </button>
        </>
      )}
      {(status === "EXPIRED" || status === "SUSPENDED") && (
        <button
          onClick={() => activate.mutate()}
          disabled={pending}
          className="px-2 py-1 rounded text-xs text-blue-700 hover:bg-blue-50 disabled:opacity-50 flex items-center gap-1"
        >
          <Play className="size-3" /> تفعيل
        </button>
      )}
    </div>
  );
}
