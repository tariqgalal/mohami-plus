"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ExportColumn<T> = {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
};

interface ExportButtonProps<T> {
  filename: string;
  columns: ExportColumn<T>[];
  fetcher: () => Promise<T[]>;
  label?: string;
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function ExportButton<T>({
  filename,
  columns,
  fetcher,
  label = "تصدير CSV",
}: ExportButtonProps<T>) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const rows = await fetcher();
      const header = columns.map((c) => escapeCsv(c.header)).join(",");
      const body = rows
        .map((row) =>
          columns.map((c) => escapeCsv(c.accessor(row))).join(","),
        )
        .join("\n");
      // BOM so Excel reads Arabic correctly
      const csv = `\uFEFF${header}\n${body}`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `${filename}-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("[export]", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {label}
    </Button>
  );
}
