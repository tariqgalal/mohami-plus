"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { FileUpload, type UploadedFileInfo } from "@/components/shared/file-upload";
import { DOC_CATEGORIES } from "@/lib/constants";
import { useCreateDocument } from "@/hooks/use-documents";
import { toast } from "@/store/toast-store";
import type { DocCategory } from "@prisma/client";

interface CaseOption {
  id: string;
  caseNumber: string;
  title: string;
}

function useCaseOptions() {
  return useQuery({
    queryKey: ["cases-options-all"],
    queryFn: async () => {
      const res = await fetch(`/api/cases?limit=100`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      return json.data.items as CaseOption[];
    },
  });
}

interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetCaseId?: string;
}

export function AddDocumentDialog({
  open,
  onOpenChange,
  presetCaseId,
}: AddDocumentDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<UploadedFileInfo | null>(null);
  const [category, setCategory] = useState<DocCategory>("OTHER");
  const [caseId, setCaseId] = useState(presetCaseId ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: cases } = useCaseOptions();
  const mutation = useCreateDocument();

  function reset() {
    setName("");
    setDescription("");
    setFile(null);
    setCategory("OTHER");
    setCaseId(presetCaseId ?? "");
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) {
      setError("اسم المستند مطلوب");
      return;
    }
    if (!file) {
      setError("ارفع ملفاً قبل الحفظ");
      return;
    }
    try {
      await mutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        fileUrl: file.url,
        fileType: file.type,
        fileSize: file.size,
        category,
        caseId: caseId || null,
      });
      toast.success("تم إضافة المستند");
      reset();
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "فشل الإضافة";
      setError(msg);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>إضافة مستند</DialogTitle>
        <DialogDescription>
          ارفع ملفاً وصنّفه. الحد الأقصى 10MB.
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">اسم المستند *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: توكيل عام"
          />
        </div>
        <div className="space-y-2">
          <Label>الملف *</Label>
          <FileUpload value={file} onChange={setFile} label="اختر ملفاً للرفع" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="category">التصنيف</Label>
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as DocCategory)}
            >
              {Object.entries(DOC_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="caseId">قضية (اختياري)</Label>
            <Select
              id="caseId"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              disabled={!!presetCaseId}
            >
              <option value="">— بدون قضية —</option>
              {cases?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">وصف</Label>
          <Textarea
            id="description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          إلغاء
        </Button>
        <Button onClick={handleSubmit} loading={mutation.isPending}>
          إضافة
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
