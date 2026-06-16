"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordResultDialog } from "@/components/sessions/record-result-dialog";

export function SessionActionsClient({
  sessionId,
  status,
}: {
  sessionId: string;
  status: string;
}) {
  const [open, setOpen] = useState(false);

  if (status !== "SCHEDULED") return null;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <CheckCircle2 className="size-4 text-emerald-600" />
        تسجيل نتيجة
      </Button>
      <RecordResultDialog
        sessionId={sessionId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
