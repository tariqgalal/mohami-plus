import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SessionForm } from "@/components/sessions/session-form";

export const metadata: Metadata = { title: "جلسة جديدة" };

export default function NewSessionPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الجلسات", href: "/dashboard/sessions" },
          { label: "جلسة جديدة" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">جلسة جديدة</h1>
        <p className="text-sm text-slate-500 mt-1">
          جدول جلسة جديدة مرتبطة بإحدى القضايا
        </p>
      </div>
      <Suspense fallback={<div className="h-40 animate-pulse bg-slate-50" />}>
        <SessionForm mode="create" />
      </Suspense>
    </div>
  );
}
