import type { Metadata } from "next";
import { OpponentsView } from "@/components/parties/opponents-view";

export const metadata: Metadata = { title: "سجل الخصوم" };

export default function OpponentsPage() {
  return <OpponentsView />;
}
