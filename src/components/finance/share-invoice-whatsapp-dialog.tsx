"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Paperclip } from "lucide-react";
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
  defaultPhone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShareData {
  whatsappUrl: string;
  publicUrl: string;
  message: string;
}

export function ShareInvoiceWhatsAppDialog({
  invoiceId,
  defaultPhone,
  open,
  onOpenChange,
}: Props) {
  const [phone, setPhone] = useState(defaultPhone);
  const [share, setShare] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShare(null);
  }, [open]);

  async function buildLink() {
    if (!phone.trim()) {
      toast.error("أدخل رقم جوال المستلم");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/share-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "فشل توليد الرابط");
      setShare(json.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "فشل توليد الرابط";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إرسال الفاتورة على واتساب</DialogTitle>
          <DialogDescription>
            سيتم فتح واتساب برسالة جاهزة فيها رابط الفاتورة. يمكنك أيضاً إرفاق
            ملف PDF يدوياً من زر المرفقات داخل واتساب.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="wa-phone">رقم جوال المستلم</Label>
            <Input
              id="wa-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+9665XXXXXXXX"
            />
          </div>

          {share && (
            <>
              <div className="space-y-2">
                <Label>معاينة الرسالة</Label>
                <Textarea readOnly rows={6} value={share.message} />
              </div>
              <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
                <Paperclip className="size-4 shrink-0 mt-0.5" />
                <span>
                  بعد فتح واتساب، يمكنك إرفاق ملف الفاتورة من زر المرفقات (📎)
                  داخل التطبيق إن أردت.
                </span>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            إغلاق
          </Button>
          {share ? (
            <a href={share.whatsappUrl} target="_blank" rel="noreferrer">
              <Button>
                <ExternalLink className="size-4" />
                فتح واتساب
              </Button>
            </a>
          ) : (
            <Button onClick={buildLink} loading={loading}>
              توليد الرابط
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
