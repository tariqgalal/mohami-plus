"use client";

import { useState } from "react";
import { Wallet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordPaymentDialog } from "@/components/finance/record-payment-dialog";

interface InvoiceActionsClientProps {
  invoiceId: string;
  outstanding: number;
  canRecordPayment: boolean;
}

export function InvoiceActionsClient({
  invoiceId,
  outstanding,
  canRecordPayment,
}: InvoiceActionsClientProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => window.print()}>
        <Printer className="size-4" />
        طباعة
      </Button>
      {canRecordPayment && (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Wallet className="size-4" />
          تسجيل دفعة
        </Button>
      )}
      <RecordPaymentDialog
        invoiceId={invoiceId}
        outstanding={outstanding}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
