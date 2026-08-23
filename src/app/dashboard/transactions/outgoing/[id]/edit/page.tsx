import { TransactionEdit } from "@/components/transactions/transaction-edit";

export default async function EditOutgoingTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TransactionEdit id={id} direction="OUTGOING" />;
}
