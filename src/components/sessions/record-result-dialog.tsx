"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SESSION_STATUS } from "@/lib/constants";
import { useRecordResult } from "@/hooks/use-sessions";
import { toast } from "@/store/toast-store";
import {
  FileUpload,
  type UploadedFileInfo,
} from "@/components/shared/file-upload";

interface RecordResultDialogProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordResultDialog({
  sessionId,
  open,
  onOpenChange,
}: RecordResultDialogProps) {
  const [result, setResult] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [status, setStatus] = useState<keyof typeof SESSION_STATUS>("COMPLETED");
  const [error, setError] = useState<string | null>(null);
  const [minutesFile, setMinutesFile] = useState<UploadedFileInfo | null>(null);
  const mutation = useRecordResult(sessionId);

  async function handleSubmit() {
    setError(null);
    if (!result.trim()) {
      setError("نتيجة الجلسة مطلوبة");
      return;
    }
    try {
      await mutation.mutateAsync({
        result: result.trim(),
        nextAction: nextAction.trim() || null,
        status,
        attachments: minutesFile
          ? [
              {
                url: minutesFile.url,
                name: minutesFile.name,
                size: minutesFile.size,
                type: minutesFile.type,
              },
            ]
          : undefined,
      });
      toast.success("تم تسجيل نتيجة الجلسة");
      setResult("");
      setNextAction("");
      setMinutesFile(null);
      onOpenChange(false);
    } catch (e: any) {
      setError(e.message || "فشل التسجيل");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>تسجيل نتيجة الجلسة</DialogTitle>
        <DialogDescription>
          سجّل ما حدث في الجلسة والإجراء التالي إن وجد
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="result">نتيجة الجلسة *</Label>
          <Textarea
            id="result"
            rows={4}
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder="ما الذي حدث في الجلسة؟"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextAction">الإجراء التالي</Label>
          <Textarea
            id="nextAction"
            rows={2}
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="ما هي الخطوة التالية؟"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">حالة الجلسة</Label>
          <Select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as never)}
          >
            <option value="COMPLETED">منتهية</option>
            <option value="POSTPONED">مؤجلة</option>
            <option value="CANCELLED">ملغاة</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>محضر الجلسة (اختياري)</Label>
          <FileUpload
            value={minutesFile}
            onChange={setMinutesFile}
            label="ارفق محضر الجلسة"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          إلغاء
        </Button>
        <Button onClick={handleSubmit} loading={mutation.isPending}>
          تسجيل
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
