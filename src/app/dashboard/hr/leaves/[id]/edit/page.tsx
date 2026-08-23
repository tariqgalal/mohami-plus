import { LeaveEdit } from "@/components/hr/leave-edit";

export default async function EditLeavePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LeaveEdit id={id} />;
}
