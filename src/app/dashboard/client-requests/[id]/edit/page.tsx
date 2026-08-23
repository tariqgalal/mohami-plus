import { notFound } from "next/navigation";
import { getServiceRequest } from "@/services/client-service-request-service";
import { getTenantId } from "@/lib/tenant";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ServiceRequestForm } from "@/components/client-requests/service-request-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientRequestPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const request = await getServiceRequest(tenantId, id);
  if (!request) notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "طلبات خدمات العملاء", href: "/dashboard/client-requests" },
          { label: request.applicantName },
          { label: "تعديل" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل الطلب</h1>
        <p className="text-sm text-slate-500 mt-1">{request.applicantName}</p>
      </div>

      <ServiceRequestForm
        mode="edit"
        initial={{
          id: request.id,
          source: request.source,
          requestType: request.requestType,
          requestSubType: request.requestSubType,
          description: request.description,
          applicantName: request.applicantName,
          applicantPhone: request.applicantPhone,
          applicantEmail: request.applicantEmail,
          status: request.status,
          assignedTo: request.assignedTo,
          notes: request.notes,
        }}
      />
    </div>
  );
}
