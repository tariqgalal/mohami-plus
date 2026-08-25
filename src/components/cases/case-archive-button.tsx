"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useArchiveCase } from "@/hooks/use-cases";
import { toast } from "@/store/toast-store";

export function CaseArchiveButton({
  caseId,
  archived,
}: {
  caseId: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const mutation = useArchiveCase();

  async function handleConfirm() {
    try {
      await mutation.mutateAsync({ id: caseId, archived: !archived });
      toast.success(
        archived ? "تمت استعادة القضية من الأرشيف" : "تم نقل القضية إلى الأرشيف",
      );
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر تنفيذ العملية");
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {archived ? (
          <>
            <ArchiveRestore className="size-4" />
            استعادة
          </>
        ) : (
          <>
            <Archive className="size-4" />
            أرشفة
          </>
        )}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={archived ? "استعادة القضية" : "أرشفة القضية"}
        description={
          archived
            ? "سيتم إرجاع القضية إلى القائمة الرئيسية."
            : "سيتم نقل القضية إلى الأرشيف وإخفاؤها من القائمة الرئيسية. يمكنك استعادتها لاحقاً."
        }
        confirmText={archived ? "استعادة" : "أرشفة"}
        loading={mutation.isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
