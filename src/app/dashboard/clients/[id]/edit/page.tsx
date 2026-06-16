import { notFound } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { getClient } from "@/services/client-service";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ClientForm } from "@/components/clients/client-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const c = await getClient(tenantId, id);
  if (!c) notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "العملاء", href: "/dashboard/clients" },
          { label: c.name, href: `/dashboard/clients/${id}` },
          { label: "تعديل" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل العميل</h1>
        <p className="text-sm text-slate-500 mt-1">{c.name}</p>
      </div>
      <ClientForm
        mode="edit"
        initial={{
          id: c.id,
          name: c.name,
          clientType: c.clientType,
          contactPerson: c.contactPerson,
          nationalId: c.nationalId,
          email: c.email,
          phone: c.phone,
          secondaryPhone: c.secondaryPhone,
          city: c.city,
          address: c.address,
          notes: c.notes,
          status: c.status,
          idDocumentUrl: c.idDocumentUrl,
          idDocumentName: c.idDocumentName,
        }}
      />
    </div>
  );
}
