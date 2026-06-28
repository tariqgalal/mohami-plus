"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "@/store/toast-store";

interface Props {
  invoiceId: string;
  defaultEmail: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendInvoiceEmailDialog({
  invoiceId,
  defaultEmail,
  open,
  onOpenChange,
}: Props) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!email.trim()) {
      toast.error("أدخل بريد المستلم");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email.trim(), note }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "فشل الإرسال");
      toast.success("تم إرسال الفاتورة بالبريد بنجاح");
      onOpenChange(false);
      setNote("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "فشل إرسال الفاتورة";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إرسال الفاتورة بالبريد</DialogTitle>
          <DialogDescription>
            سيتم إرسال رابط الفاتورة للعميل عبر البريد الإلكتروني.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="to-email">بريد المستلم</Label>
            <Input
              id="to-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">ملاحظة إضافية (اختياري)</Label>
            <Textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="نص ملاحظة يضاف لرسالة البريد"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button onClick={onSubmit} loading={submitting}>
            إرسال
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
