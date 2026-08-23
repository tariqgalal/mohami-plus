import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CorrespondenceForm } from "@/components/correspondence/correspondence-form";

export const metadata: Metadata = { title: "مراسلة جديدة" };

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function NewCorrespondencePage({ searchParams }: PageProps) {
  const { type } = await searchParams;
  const defaultType = type === "EMPLOYEE" ? "EMPLOYEE" : "CLIENT";
  const backHref =
    defaultType === "EMPLOYEE"
      ? "/dashboard/correspondence/employees"
      : "/dashboard/correspondence/clients";
  const backLabel =
    defaultType === "EMPLOYEE" ? "مراسلات الموظفين" : "مراسلات العملاء";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: backLabel, href: backHref },
          { label: "مراسلة جديدة" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">مراسلة جديدة</h1>
        <p className="text-sm text-slate-500 mt-1">
          أنشئ مراسلة جديدة. الحقول المعلمة بنجمة * إلزامية.
        </p>
      </div>

      <CorrespondenceForm defaultType={defaultType} />
    </div>
  );
}
