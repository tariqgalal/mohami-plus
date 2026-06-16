"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileUpload,
  type UploadedFileInfo,
} from "@/components/shared/file-upload";
import { useRecordMeetingMinutes } from "@/hooks/use-meetings";
import { toast } from "@/store/toast-store";

interface RecordMinutesDialogProps {
  meetingId: string;
  initialNotes?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordMinutesDialog({
  meetingId,
  initialNotes,
  open,
  onOpenChange,
}: RecordMinutesDialogProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [file, setFile] = useState<UploadedFileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mutation = useRecordMeetingMinutes(meetingId);

  async function handleSubmit() {
    setError(null);
    if (!notes.trim()) {
      setError("اكتب محضر الاجتماع");
      return;
    }
    try {
      await mutation.mutateAsync({
        notes: notes.trim(),
        minutesUrl: file?.url ?? null,
        minutesName: file?.name ?? null,
      });
      toast.success("تم حفظ محضر الاجتماع");
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الحفظ");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>تسجيل محضر الاجتماع</DialogTitle>
        <DialogDescription>
          اكتب ما تمت مناقشته والقرارات المتخذة، وأرفق ملف المحضر إن وجد.
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">المحضر *</Label>
          <Textarea
            id="notes"
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ما تمت مناقشته، القرارات، الإجراءات التالية..."
          />
        </div>
        <div className="space-y-2">
          <Label>ملف المحضر (اختياري)</Label>
          <FileUpload value={file} onChange={setFile} />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          إلغاء
        </Button>
        <Button onClick={handleSubmit} loading={mutation.isPending}>
          حفظ المحضر
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
