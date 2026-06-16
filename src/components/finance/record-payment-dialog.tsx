"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PAYMENT_METHODS } from "@/lib/constants";
import { useRecordPayment } from "@/hooks/use-invoices";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/store/toast-store";
import {
  FileUpload,
  type UploadedFileInfo,
} from "@/components/shared/file-upload";
import type { PaymentMethod } from "@prisma/client";

interface RecordPaymentDialogProps {
  invoiceId: string;
  outstanding: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordPaymentDialog({
  invoiceId,
  outstanding,
  open,
  onOpenChange,
}: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState<number>(outstanding);
  const [method, setMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<UploadedFileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mutation = useRecordPayment(invoiceId);

  async function handleSubmit() {
    setError(null);
    if (!amount || amount <= 0) {
      setError("المبلغ مطلوب");
      return;
    }
    try {
      await mutation.mutateAsync({
        amount,
        method,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        receiptUrl: receipt?.url ?? null,
        receiptName: receipt?.name ?? null,
      });
      toast.success("تم تسجيل الدفعة");
      setAmount(0);
      setReference("");
      setNotes("");
      setReceipt(null);
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "فشل التسجيل";
      setError(msg);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>تسجيل دفعة</DialogTitle>
        <DialogDescription>
          المتبقي على الفاتورة: {formatCurrency(outstanding)}
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">المبلغ المدفوع (ر.س) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min={0}
            max={outstanding}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="method">طريقة الدفع *</Label>
          <Select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reference">رقم مرجعي</Label>
          <Input
            id="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="رقم العملية أو الشيك"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">ملاحظات</Label>
          <Textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>إيصال الدفع (اختياري)</Label>
          <FileUpload
            value={receipt}
            onChange={setReceipt}
            label="ارفع إيصال الدفع"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          إلغاء
        </Button>
        <Button onClick={handleSubmit} loading={mutation.isPending}>
          تسجيل الدفعة
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
