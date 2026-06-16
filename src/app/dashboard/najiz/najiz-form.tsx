"use client";

import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NajizForm() {
  const [caseNumber, setCaseNumber] = useState("");

  function openNajiz(e: React.FormEvent) {
    e.preventDefault();
    window.open("https://www.najiz.sa", "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={openNajiz} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="najiz-case">رقم القضية في ناجز</Label>
        <div className="flex gap-2">
          <Input
            id="najiz-case"
            placeholder="مثال: 4321567890"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            className="tabular-nums"
            dir="ltr"
          />
          <Button type="submit" variant="outline">
            <Search className="size-4" />
            بحث
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          سيُفتح موقع ناجز في تبويب جديد. لاحقاً سيتم البحث مباشرة من هنا.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
        <a
          href="https://www.najiz.sa"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button type="button">
            <ExternalLink className="size-4" />
            فتح بوابة ناجز
          </Button>
        </a>
        <a
          href="https://www.moj.gov.sa"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button type="button" variant="outline">
            <ExternalLink className="size-4" />
            موقع وزارة العدل
          </Button>
        </a>
      </div>
    </form>
  );
}
