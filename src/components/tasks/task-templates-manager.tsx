"use client";

import { useState } from "react";
import { Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MessageSquareText } from "lucide-react";
import {
  useTaskTemplates,
  useCreateTaskTemplate,
  useUpdateTaskTemplate,
  useDeleteTaskTemplate,
} from "@/hooks/use-task-templates";
import { toast } from "@/store/toast-store";

export function TaskTemplatesManager() {
  const { data: templates, isLoading } = useTaskTemplates();
  const createMut = useCreateTaskTemplate();
  const updateMut = useUpdateTaskTemplate();
  const deleteMut = useDeleteTaskTemplate();

  const [newText, setNewText] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleAdd() {
    const text = newText.trim();
    if (!text) return;
    try {
      await createMut.mutateAsync({ text });
      setNewText("");
      toast.success("تمت إضافة الرد الجاهز");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل الإضافة");
    }
  }

  async function handleSaveEdit() {
    if (!editId) return;
    const text = editText.trim();
    if (!text) return;
    try {
      await updateMut.mutateAsync({ id: editId, input: { text } });
      setEditId(null);
      toast.success("تم حفظ التعديل");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل الحفظ");
    }
  }

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMut.mutateAsync(confirmId);
      setConfirmId(null);
      toast.success("تم حذف الرد الجاهز");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      {/* إضافة رد جديد */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <label className="text-sm font-medium text-slate-700">
            إضافة رد جاهز جديد
          </label>
          <Textarea
            rows={2}
            placeholder="مثال: تم تنفيذ المهمة بنجاح"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleAdd}
              loading={createMut.isPending}
              disabled={!newText.trim()}
            >
              <Plus className="size-4" />
              إضافة
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <p className="text-sm text-slate-500 text-center py-4">
          جارٍ التحميل...
        </p>
      )}

      {!isLoading && (templates?.length ?? 0) === 0 && (
        <EmptyState
          icon={MessageSquareText}
          title="لا توجد ردود جاهزة"
          description="أضف أول رد جاهز ليظهر عند تعبئة المهام"
        />
      )}

      {!isLoading && (templates?.length ?? 0) > 0 && (
        <Card>
          <CardContent className="p-0 divide-y divide-slate-100">
            {templates!.map((t) => (
              <div key={t.id} className="flex items-start gap-3 p-4">
                <MessageSquareText className="size-4 shrink-0 mt-1 text-brand-500" />
                {editId === t.id ? (
                  <div className="flex-1 space-y-2">
                    <Textarea
                      rows={2}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditId(null)}
                      >
                        <X className="size-4" />
                        إلغاء
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        loading={updateMut.isPending}
                      >
                        <Check className="size-4" />
                        حفظ
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="flex-1 text-sm text-slate-700">{t.text}</p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="تعديل"
                        onClick={() => {
                          setEditId(t.id);
                          setEditText(t.text);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="حذف"
                        onClick={() => setConfirmId(t.id)}
                      >
                        <Trash2 className="size-4 text-red-500" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
        title="حذف الرد الجاهز"
        description="سيتم حذف هذا الرد الجاهز نهائياً."
        confirmText="حذف"
        variant="destructive"
        loading={deleteMut.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
