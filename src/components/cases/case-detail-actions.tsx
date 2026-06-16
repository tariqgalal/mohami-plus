"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddDocumentDialog } from "@/components/documents/add-document-dialog";

interface CaseDetailActionsProps {
  caseId: string;
  variant: "session" | "document";
}

export function CaseDetailActions({ caseId, variant }: CaseDetailActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (variant === "session") {
    return (
      <Link href={`/dashboard/sessions/new?caseId=${caseId}`}>
        <Button>
          <Plus className="size-4" />
          إضافة جلسة
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <Upload className="size-4" />
        رفع مستند
      </Button>
      <AddDocumentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        presetCaseId={caseId}
      />
    </>
  );
}
