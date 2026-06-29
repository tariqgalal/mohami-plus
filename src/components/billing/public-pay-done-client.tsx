"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type State =
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "failure"; message: string };

export function PublicPayDoneClient({
  invoiceId,
  invoiceNumber,
}: {
  invoiceId: string;
  invoiceNumber: string;
}) {
  const params = useSearchParams();
  const paymentId = params.get("id");

  const [state, setState] = useState<State>(() =>
    paymentId
      ? { kind: "loading" }
      : { kind: "failure", message: "بيانات الدفع غير مكتملة" },
  );

  useEffect(() => {
    if (!paymentId) return;
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
          setState({ kind: "success" });
        } else {
          setState({ kind: "failure", message: json.error ?? "فشل تأكيد الدفع" });
        }
      } catch (e) {
        if (cancelled) return;
        setState({
          kind: "failure",
          message: e instanceof Error ? e.message : "تعذّر الاتصال",
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
            <h2 className="text-lg font-semibold">جاري تأكيد الدفع...</h2>
          </>
        )}
        {state.kind === "success" && (
          <>
            <div className="mx-auto size-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">تم الدفع بنجاح</h2>
            <p className="text-sm text-slate-600">
              فاتورتك رقم{" "}
              <strong className="tabular-nums">{invoiceNumber}</strong> مدفوعة.
              شكراً لك.
            </p>
          </>
        )}
        {state.kind === "failure" && (
          <>
            <div className="mx-auto size-14 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="size-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold">فشل الدفع</h2>
            <p className="text-sm text-slate-600">{state.message}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
