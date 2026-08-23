import type { Metadata } from "next";
import { TransactionsView } from "@/components/transactions/transactions-view";

export const metadata: Metadata = { title: "الصادر" };

export default function OutgoingTransactionsPage() {
  return <TransactionsView direction="OUTGOING" />;
}
