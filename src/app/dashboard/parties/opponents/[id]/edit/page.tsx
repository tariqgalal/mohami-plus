import { OpponentEdit } from "@/components/parties/opponent-edit";

export default async function EditOpponentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OpponentEdit id={id} />;
}
