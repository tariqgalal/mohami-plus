import { notFound } from "next/navigation";
import { getPowerOfAttorney } from "@/services/power-of-attorney-service";
import { getTenantId } from "@/lib/tenant";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PoaForm } from "@/components/powers-of-attorney/poa-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPowerOfAttorneyPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const poa = await getPowerOfAttorney(tenantId, id);
  if (!poa) notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الوكالات", href: "/dashboard/powers-of-attorney" },
          {
            label: `وكالة ${poa.number}`,
            href: `/dashboard/powers-of-attorney/${id}`,
          },
          { label: "تعديل" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل الوكالة</h1>
        <p className="text-sm text-slate-500 mt-1 font-mono">{poa.number}</p>
      </div>

      <PoaForm
        mode="edit"
        initial={{
          id: poa.id,
          number: poa.number,
          clientId: poa.clientId,
          startDate: poa.startDate.toISOString().slice(0, 10),
          startDateHijri: poa.startDateHijri,
          endDate: poa.endDate.toISOString().slice(0, 10),
          endDateHijri: poa.endDateHijri,
          status: poa.status,
          notes: poa.notes,
        }}
      />
    </div>
  );
}
