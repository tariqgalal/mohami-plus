"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * نموذج Moyasar.js داخل الصفحة (inline).
 * يدعم: creditcard (Visa/Mada/Mastercard) + Apple Pay + STC Pay + Samsung Pay.
 * 3D Secure مفعّل تلقائياً من البوابة.
 *
 * بعد إتمام الدفع، Moyasar تعمل redirect لـ callback_url مع query params:
 *   ?id=PAYMENT_ID&status=paid|failed|...
 *
 * صفحة الـ callback عندنا تأكّد من السيرفر عبر /api/billing/verify.
 */

export interface CheckoutInit {
  invoiceId: string;
  invoiceNumber: string;
  publishableKey: string;
  amountHalalat: number;
  baseAmount: number;
  vatAmount: number;
  currency: string;
  description: string;
  callbackUrl: string;
  saveCard: boolean;
  metadata: Record<string, string>;
}

// تعريف Moyasar global (يأتي من السكريبت)
declare global {
  interface Window {
    Moyasar?: {
      init: (config: MoyasarConfig) => void;
    };
  }
}

interface MoyasarConfig {
  element: string;
  language?: "ar" | "en";
  amount: number;
  currency: string;
  description: string;
  publishable_api_key: string;
  callback_url: string;
  methods: string[];
  save_card?: boolean;
  manual?: boolean;
  metadata?: Record<string, string>;
  supported_networks?: string[];
  on_completed?: (payment: { id: string; status: string }) => Promise<void> | void;
  on_failure?: (error: unknown) => void;
}

const MOYASAR_SCRIPT = "https://cdn.moyasar.com/mpf/1.15.0/moyasar.js";
const MOYASAR_STYLE = "https://cdn.moyasar.com/mpf/1.15.0/moyasar.css";

export function MoyasarForm({
  init,
  onSuccess,
  onCancel,
}: {
  init: CheckoutInit;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const initializedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scriptReady || initializedRef.current || !window.Moyasar || !containerRef.current) {
      return;
    }
    try {
      window.Moyasar.init({
        element: "#moyasar-form",
        language: "ar",
        amount: init.amountHalalat,
        currency: init.currency,
        description: init.description,
        publishable_api_key: init.publishableKey,
        callback_url: init.callbackUrl,
        methods: ["creditcard", "applepay", "stcpay", "samsungpay"],
        save_card: init.saveCard,
        metadata: init.metadata,
        supported_networks: ["mada", "visa", "mastercard"],
      });
      initializedRef.current = true;
    } catch (err) {
      console.error("[Moyasar.init] error:", err);
    }
  }, [scriptReady, init]);

  return (
    <div className="space-y-3">
      {/* تحميل CSS بتاع Moyasar */}
      <link rel="stylesheet" href={MOYASAR_STYLE} />

      {/* السكريبت — strategy=lazyOnload لأنه ثقيل وغير محتاج قبل ما المستخدم يوصل هنا */}
      <Script
        src={MOYASAR_SCRIPT}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => console.error("[Moyasar.js] script failed to load")}
      />

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {!scriptReady && (
          <div className="text-sm text-slate-500 flex items-center gap-2 py-8 justify-center">
            <Loader2 className="size-4 animate-spin" />
            جاري تحميل بوابة الدفع...
          </div>
        )}
        <div ref={containerRef} id="moyasar-form" />
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        مدفوعاتك مؤمّنة عبر بوابة Moyasar السعودية. ندعم مدى، فيزا، ماستركارد،
        Apple Pay، STC Pay، و Samsung Pay. {init.saveCard ? "سيتم حفظ بطاقتك للتجديد التلقائي." : ""}
      </p>

      {onCancel && (
        <Button variant="ghost" type="button" onClick={onCancel}>
          إلغاء
        </Button>
      )}

      {/* عشان نخفي warning عن onSuccess اللي مش مستخدم لسة */}
      <span className="hidden">{onSuccess ? "" : ""}</span>
    </div>
  );
}
