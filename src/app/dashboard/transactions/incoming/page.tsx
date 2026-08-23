import type { Metadata } from "next";
import { TransactionsView } from "@/components/transactions/transactions-view";

export const metadata: Metadata = { title: "الوارد" };

export default function IncomingTransactionsPage() {
  return <TransactionsView direction="INCOMING" />;
}
