"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  MoreVertical,
  Pause,
  Play,
  CalendarPlus,
  Gift,
  Eye,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/store/toast-store";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TenantRowActionsProps {
  tenantId: string;
  status: string;
  trialExpired?: boolean;
}

type Modal = null | "extend" | "gift";

const DURATION_PRESETS = [7, 14, 30];

export function TenantRowActions({
  tenantId,
  status,
  trialExpired,
}: TenantRowActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [days, setDays] = useState(14);
  const [months, setMonths] = useState(1);
  const [reason, setReason] = useState("");

  async function call(body: Record<string, unknown>, successMsg: string) {
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      toast.success(successMsg);
      setOpen(false);
      setModal(null);
      setReason("");
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "حدث خطأ";
      toast.error(msg);
    }
  }

  const statusMut = useMutation({
    mutationFn: async (newStatus: string) =>
      call({ action: "status", status: newStatus }, "تم تحديث الحالة"),
  });

  const extendMut = useMutation({
    mutationFn: async (d: number) =>
      call(
        { action: "extend_trial", days: d, reason: reason.trim() || undefined },
        `تم تمديد التجربة ${d} يوم`,
      ),
  });

  const giftMut = useMutation({
    mutationFn: async (m: number) =>
      call(
        {
          action: "grant_free_months",
          months: m,
          reason: reason.trim() || undefined,
        },
        `تم منح ${m} شهر`,
      ),
  });

  const isActive = status === "ACTIVE" || status === "TRIAL";
  const showQuickRenew = status === "TRIAL" || trialExpired;

  return (
    <div className="relative inline-flex items-center gap-1">
      {showQuickRenew && (
        <button
          onClick={() => setModal("extend")}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
          title="تجديد التجربة"
        >
          <RefreshCw className="size-3" />
          تجديد
        </button>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center size-8 rounded-md hover:bg-slate-100 text-slate-600"
        aria-label="إجراءات"
      >
        <MoreVertical className="size-4" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute end-0 top-9 z-40 w-56 rounded-lg border border-slate-200 bg-white shadow-lg py-1 text-sm">
            <Link
              href={`/admin/tenants/${tenantId}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50"
            >
              <Eye className="size-4 text-slate-500" />
              عرض التفاصيل
            </Link>
            <button
              onClick={() => setModal("extend")}
              className="w-full text-start flex items-center gap-2 px-3 py-2 hover:bg-slate-50"
            >
              <CalendarPlus className="size-4 text-slate-500" />
              تمديد الفترة التجريبية
            </button>
            <button
              onClick={() => setModal("gift")}
              className="w-full text-start flex items-center gap-2 px-3 py-2 hover:bg-slate-50"
            >
              <Gift className="size-4 text-emerald-600" />
              منح شهر مجاني
            </button>
            <div className="my-1 border-t border-slate-100" />
            {isActive ? (
              <button
                disabled={statusMut.isPending}
                onClick={() => statusMut.mutate("SUSPENDED")}
                className="w-full text-start flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-red-700"
              >
                <Pause className="size-4" />
                تعليق المكتب
              </button>
            ) : (
              <button
                disabled={statusMut.isPending}
                onClick={() => statusMut.mutate("ACTIVE")}
                className="w-full text-start flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-emerald-700"
              >
                <Play className="size-4" />
                تفعيل المكتب
              </button>
            )}
          </div>
        </>
      )}

      <Dialog open={modal === "extend"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogHeader>
          <DialogTitle>تجديد الفترة التجريبية</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          <div className="space-y-2">
            <Label>اختر المدة</Label>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((d) => (
                <Button
                  key={d}
                  variant={days === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDays(d)}
                  type="button"
                >
                  {d} يوم
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="days-row">مدة مخصصة (يوم)</Label>
            <Input
              id="days-row"
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason-row">السبب (اختياري)</Label>
            <textarea
              id="reason-row"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: العميل طلب وقت إضافي"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setModal(null)}>
            إلغاء
          </Button>
          <Button
            onClick={() => extendMut.mutate(days)}
            loading={extendMut.isPending}
            disabled={!days || days < 1}
          >
            تأكيد التجديد
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={modal === "gift"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogHeader>
          <DialogTitle>منح اشتراك مجاني</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          <div className="space-y-2">
            <Label>اختر المدة</Label>
            <div className="flex flex-wrap gap-2">
              {[1, 3, 6].map((m) => (
                <Button
                  key={m}
                  variant={months === m ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMonths(m)}
                  type="button"
                >
                  {m} شهر
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="months-row">مدة مخصصة (أشهر)</Label>
            <Input
              id="months-row"
              type="number"
              min={1}
              max={36}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason-gift-row">السبب (اختياري)</Label>
            <textarea
              id="reason-gift-row"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setModal(null)}>
            إلغاء
          </Button>
          <Button
            onClick={() => giftMut.mutate(months)}
            loading={giftMut.isPending}
            disabled={!months || months < 1}
          >
            منح
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
