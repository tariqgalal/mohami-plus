"use client";

import { useState } from "react";
import { Wallet, Printer, Download, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordPaymentDialog } from "@/components/finance/record-payment-dialog";
import { SendInvoiceEmailDialog } from "@/components/finance/send-invoice-email-dialog";
import { ShareInvoiceWhatsAppDialog } from "@/components/finance/share-invoice-whatsapp-dialog";

interface InvoiceActionsClientProps {
  invoiceId: string;
  outstanding: number;
  canRecordPayment: boolean;
  clientEmail: string | null;
  clientPhone: string;
}

export function InvoiceActionsClient({
  invoiceId,
  outstanding,
  canRecordPayment,
  clientEmail,
  clientPhone,
}: InvoiceActionsClientProps) {
  const [payOpen, setPayOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [waOpen, setWaOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() =>
          window.open(`/print/invoices/${invoiceId}`, "_blank", "noopener")
        }
      >
        <Printer className="size-4" />
        طباعة
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          window.open(
            `/print/invoices/${invoiceId}?download=1`,
            "_blank",
            "noopener",
          )
        }
      >
        <Download className="size-4" />
        تحميل PDF
      </Button>
      <Button variant="outline" onClick={() => setEmailOpen(true)}>
        <Mail className="size-4" />
        إرسال بالبريد
      </Button>
      <Button variant="outline" onClick={() => setWaOpen(true)}>
        <MessageCircle className="size-4" />
        واتساب
      </Button>
      {canRecordPayment && (
        <Button variant="outline" onClick={() => setPayOpen(true)}>
          <Wallet className="size-4" />
          تسجيل دفعة
        </Button>
      )}

      <RecordPaymentDialog
        invoiceId={invoiceId}
        outstanding={outstanding}
        open={payOpen}
        onOpenChange={setPayOpen}
      />
      <SendInvoiceEmailDialog
        invoiceId={invoiceId}
        defaultEmail={clientEmail}
        open={emailOpen}
        onOpenChange={setEmailOpen}
      />
      <ShareInvoiceWhatsAppDialog
        invoiceId={invoiceId}
        defaultPhone={clientPhone}
        open={waOpen}
        onOpenChange={setWaOpen}
      />
    </>
  );
}
