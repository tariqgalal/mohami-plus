"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type VerifyState =
  | { kind: "loading" }
  | { kind: "success"; invoiceNumber: string }
  | { kind: "failure"; message: string };

export function BillingCallbackClient() {
  const params = useSearchParams();
  const invoiceId = params.get("invoiceId");
  const paymentId = params.get("id");

  const [state, setState] = useState<VerifyState>(() =>
    !invoiceId || !paymentId
      ? {
          kind: "failure",
          message: "بيانات تأكيد الدفع غير مكتملة. حاول مرة أخرى.",
        }
      : { kind: "loading" },
  );

  useEffect(() => {
    if (!invoiceId || !paymentId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/billing/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ invoiceId, moyasarPaymentId: paymentId }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (res.ok && json.success) {
          setState({
            kind: "success",
            invoiceNumber: json.data.invoiceNumber,
          });
        } else {
          setState({
            kind: "failure",
            message: json.error ?? "فشل تأكيد الدفع",
          });
        }
      } catch (e) {
        if (cancelled) return;
        setState({
          kind: "failure",
          message: e instanceof Error ? e.message : "تعذّر الاتصال بالخادم",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [invoiceId, paymentId]);

  return (
    <Card>
      <CardContent className="py-12 text-center space-y-4">
        {state.kind === "loading" && (
          <>
            <Loader2 className="size-10 text-brand-600 animate-spin mx-auto" />
            <h2 className="text-lg font-semibold text-slate-900">
              جاري تأكيد الدفع...
            </h2>
            <p className="text-sm text-slate-500">
              لا تغلق هذه الصفحة. نتحقق من البوابة الآن.
            </p>
          </>
        )}

        {state.kind === "success" && (
          <>
            <div className="mx-auto size-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              تم الدفع بنجاح
            </h2>
            <p className="text-sm text-slate-600">
              فاتورتك رقم{" "}
              <strong className="tabular-nums">{state.invoiceNumber}</strong>{" "}
              مدفوعة بالكامل، واشتراكك مفعّل.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Link href="/dashboard">
                <Button>الذهاب للوحة التحكم</Button>
              </Link>
              <Link href="/dashboard/billing">
                <Button variant="outline">عرض الفواتير</Button>
              </Link>
            </div>
          </>
        )}

        {state.kind === "failure" && (
          <>
            <div className="mx-auto size-14 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="size-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              فشل تأكيد الدفع
            </h2>
            <p className="text-sm text-slate-600">{state.message}</p>
            <div className="flex gap-2 justify-center pt-2">
              <Link href="/dashboard/billing">
                <Button>المحاولة مرة أخرى</Button>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
