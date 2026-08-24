"use client";

import Link from "next/link";
import { MessageSquareText, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTaskTemplates } from "@/hooks/use-task-templates";

interface TaskReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (text: string) => void;
}

/** حوار اختيار رد جاهز من قائمة الردود المحفوظة للمكتب. */
export function TaskReplyDialog({
  open,
  onOpenChange,
  onSelect,
}: TaskReplyDialogProps) {
  const { data: templates, isLoading } = useTaskTemplates();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>اختيار رد جاهز</DialogTitle>
        <DialogDescription>
          اختر أحد الردود الجاهزة لإدراجه في حقل الرد.
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        {isLoading && (
          <p className="text-sm text-slate-500 py-4 text-center">
            جارٍ التحميل...
          </p>
        )}
        {!isLoading && (templates?.length ?? 0) === 0 && (
          <p className="text-sm text-slate-500 py-4 text-center">
            لا توجد ردود جاهزة بعد.
          </p>
        )}
        <div className="space-y-2 max-h-[50vh] overflow-auto">
          {templates?.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onSelect(t.text);
                onOpenChange(false);
              }}
              className="flex w-full items-start gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-right text-sm text-slate-700 hover:border-brand-400 hover:bg-brand-50/50 transition-colors"
            >
              <MessageSquareText className="size-4 shrink-0 mt-0.5 text-brand-500" />
              <span>{t.text}</span>
            </button>
          ))}
        </div>
      </DialogContent>
      <DialogFooter>
        <Link href="/dashboard/tasks/templates">
          <Button type="button" variant="outline">
            <Settings2 className="size-4" />
            إدارة الردود
          </Button>
        </Link>
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          إغلاق
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
