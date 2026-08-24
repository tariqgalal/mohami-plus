import { ConsultationEdit } from "@/components/consultations/consultation-edit";

export default async function EditConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConsultationEdit id={id} />;
}
