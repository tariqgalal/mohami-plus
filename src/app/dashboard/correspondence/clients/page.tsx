import type { Metadata } from "next";
import { CorrespondenceListView } from "@/components/correspondence/correspondence-list-view";

export const metadata: Metadata = { title: "مراسلات العملاء" };

export default function ClientCorrespondencePage() {
  return (
    <CorrespondenceListView
      type="CLIENT"
      title="مراسلات العملاء"
      subtitle="إدارة المراسلات الواردة والمرسلة مع العملاء"
    />
  );
}
