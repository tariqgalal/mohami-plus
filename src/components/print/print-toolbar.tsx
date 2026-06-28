"use client";

import { useEffect } from "react";
import { Printer, Download } from "lucide-react";

interface Props {
  invoiceNumber?: string;
  caseNumber?: string;
  autoDownload?: boolean;
}

export function PrintToolbar({
  invoiceNumber,
  caseNumber,
  autoDownload,
}: Props) {
  // Update document title so browser "Save as PDF" defaults to a sensible filename
  useEffect(() => {
    const original = document.title;
    if (invoiceNumber) document.title = `فاتورة-${invoiceNumber}`;
    else if (caseNumber) document.title = `قضية-${caseNumber}`;
    return () => {
      document.title = original;
    };
  }, [invoiceNumber, caseNumber]);

  // Auto-open print dialog if ?download was used
  useEffect(() => {
    if (autoDownload) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [autoDownload]);

  return (
    <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-3">
      <p className="text-sm text-slate-600">
        معاينة للطباعة — اضغط على «طباعة» ثم اختر «حفظ كـ PDF» من خيارات
        الطابعة لتحميل الملف.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm hover:bg-slate-50"
        >
          <Download className="size-4" />
          تحميل PDF
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-brand-600 text-white text-sm hover:brightness-110"
        >
          <Printer className="size-4" />
          طباعة
        </button>
      </div>
    </div>
  );
}
