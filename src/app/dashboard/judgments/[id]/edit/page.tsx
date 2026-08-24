import { JudgmentEdit } from "@/components/judgments/judgment-edit";

export default async function EditJudgmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JudgmentEdit id={id} />;
}
