import { OpponentDetail } from "@/components/parties/opponent-detail";

export default async function OpponentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OpponentDetail id={id} />;
}
