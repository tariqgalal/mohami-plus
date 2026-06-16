import { notFound } from "next/navigation";
import { getCase } from "@/services/case-service";
import { getTenantId } from "@/lib/tenant";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CaseForm } from "@/components/cases/case-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCasePage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const caseItem = await getCase(tenantId, id);
  if (!caseItem) notFound();

  const primary = caseItem.lawyers.find((l) => l.isPrimary);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "القضايا", href: "/dashboard/cases" },
          { label: caseItem.title, href: `/dashboard/cases/${id}` },
          { label: "تعديل" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل القضية</h1>
        <p className="text-sm text-slate-500 mt-1 font-mono">
          {caseItem.caseNumber}
        </p>
      </div>

      <CaseForm
        mode="edit"
        initial={{
          id: caseItem.id,
          title: caseItem.title,
          description: caseItem.description,
          caseType: caseItem.caseType,
          court: caseItem.court,
          courtCity: caseItem.courtCity,
          status: caseItem.status,
          priority: caseItem.priority,
          value: caseItem.value ? Number(caseItem.value) : undefined,
          filingDate: caseItem.filingDate
            ? (caseItem.filingDate.toISOString().slice(0, 10) as never)
            : undefined,
          notes: caseItem.notes,
          clientId: caseItem.clientId,
          primaryLawyerId: primary?.userId ?? "",
          assistantLawyerIds: caseItem.lawyers
            .filter((l) => !l.isPrimary)
            .map((l) => l.userId),
          opponents: caseItem.opponents.map((o) => ({
            name: o.name,
            type: o.type,
            lawyer: o.lawyer,
            phone: o.phone,
            notes: o.notes,
          })),
        }}
      />
    </div>
  );
}
