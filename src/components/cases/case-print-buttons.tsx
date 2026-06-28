"use client";

import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CasePrintButtons({ caseId }: { caseId: string }) {
  return (
    <>
      <Button
        variant="outline"
        onClick={() =>
          window.open(`/print/cases/${caseId}`, "_blank", "noopener")
        }
      >
        <Printer className="size-4" />
        طباعة
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          window.open(`/print/cases/${caseId}?download=1`, "_blank", "noopener")
        }
      >
        <Download className="size-4" />
        تحميل PDF
      </Button>
    </>
  );
}
