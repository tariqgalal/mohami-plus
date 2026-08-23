import { notFound } from "next/navigation";
import { getCorrespondence } from "@/services/correspondence-service";
import { getTenantId } from "@/lib/tenant";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CorrespondenceForm } from "@/components/correspondence/correspondence-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReplyCorrespondencePage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const parent = await getCorrespondence(tenantId, id);
  if (!parent) notFound();

  const listHref =
    parent.type === "EMPLOYEE"
      ? "/dashboard/correspondence/employees"
      : "/dashboard/correspondence/clients";
  const listLabel =
    parent.type === "EMPLOYEE" ? "مراسلات الموظفين" : "مراسلات العملاء";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: listLabel, href: listHref },
          {
            label: `مراسلة #${parent.serialNumber}`,
            href: `/dashboard/correspondence/${parent.id}`,
          },
          { label: "رد" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">إضافة رد</h1>
        <p className="text-sm text-slate-500 mt-1">
          رد على المراسلة: {parent.subject}
        </p>
      </div>

      <CorrespondenceForm
        reply={{
          parentId: parent.id,
          type: parent.type as "CLIENT" | "EMPLOYEE",
          category: parent.category,
          subject: parent.subject,
        }}
      />
    </div>
  );
}
