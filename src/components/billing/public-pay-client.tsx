"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PublicInvoice {
  id: string;
  invoiceNumber: string;
  tenantName: string;
  plan: string;
  baseAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
}

// Window.Moyasar مُعرّف عالمياً في moyasar-form.tsx

const MOYASAR_SCRIPT = "https://cdn.moyasar.com/mpf/1.15.0/moyasar.js";
const MOYASAR_STYLE = "https://cdn.moyasar.com/mpf/1.15.0/moyasar.css";

const sar = (h: number) => (h / 100).toFixed(2);

export function PublicPayClient({
  invoice,
  publishableKey,
  callbackUrl,
}: {
  invoice: PublicInvoice;
  publishableKey: string;
  callbackUrl: string;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (
      invoice.status !== "PENDING" ||
      !scriptReady ||
      initializedRef.current ||
      !window.Moyasar
    ) {
      return;
    }
    try {
      window.Moyasar.init({
        element: "#moyasar-public-form",
        language: "ar",
        amount: invoice.totalAmount,
        currency: invoice.currency,
        description: `فاتورة محامي بلس ${invoice.invoiceNumber}`,
        publishable_api_key: publishableKey,
        callback_url: callbackUrl,
        methods: ["creditcard", "applepay", "stcpay", "samsungpay"],
        save_card: false,
        metadata: { invoiceId: invoice.id },
        supported_networks: ["mada", "visa", "mastercard"],
      });
      initializedRef.current = true;
    } catch (err) {
      console.error("[Moyasar.public.init] error:", err);
    }
  }, [scriptReady, invoice, publishableKey, callbackUrl]);

  if (invoice.status === "PAID") {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <div className="mx-auto size-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="size-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            هذه الفاتورة مدفوعة بالفعل
          </h2>
          <p className="text-sm text-slate-600">
            فاتورة رقم{" "}
            <strong className="tabular-nums">{invoice.invoiceNumber}</strong>{" "}
            تم سدادها. شكراً لك.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (invoice.status === "CANCELED") {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-600">
          هذه الفاتورة ملغاة.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>دفع فاتورة الاشتراك</CardTitle>
          <Badge className="bg-amber-50 text-amber-700 ring-amber-200 ring-1">
            مستحقة
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm">
          <Row label="المكتب" value={invoice.tenantName} />
          <Row label="رقم الفاتورة" value={invoice.invoiceNumber} mono />
          <Row label="الباقة" value={invoice.plan} />
        </div>

        <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
          <Row
            label="المبلغ قبل الضريبة"
            value={`${sar(invoice.baseAmount)} ر.س`}
          />
          <Row
            label="ضريبة القيمة المضافة (15%)"
            value={`${sar(invoice.vatAmount)} ر.س`}
          />
          <div className="border-t border-slate-200 pt-1 mt-1">
            <Row
              label="الإجمالي"
              value={`${sar(invoice.totalAmount)} ر.س`}
              bold
            />
          </div>
        </div>

        <link rel="stylesheet" href={MOYASAR_STYLE} />
        <Script
          src={MOYASAR_SCRIPT}
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          {!scriptReady && (
            <div className="text-sm text-slate-500 flex items-center gap-2 py-8 justify-center">
              <Loader2 className="size-4 animate-spin" />
              جاري تحميل بوابة الدفع...
            </div>
          )}
          <div id="moyasar-public-form" />
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          مدفوعاتك مؤمّنة عبر بوابة Moyasar السعودية. ندعم مدى، فيزا،
          ماستركارد، Apple Pay، STC Pay، و Samsung Pay.
        </p>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  bold = false,
  mono = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-semibold text-slate-900" : "text-slate-600"}>
        {label}
      </span>
      <span
        className={`${mono ? "tabular-nums" : ""} ${
          bold ? "font-semibold text-slate-900" : "text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
