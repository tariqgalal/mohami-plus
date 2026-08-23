import type { Metadata } from "next";
import { CorrespondenceListView } from "@/components/correspondence/correspondence-list-view";

export const metadata: Metadata = { title: "مراسلات الموظفين" };

export default function EmployeeCorrespondencePage() {
  return (
    <CorrespondenceListView
      type="EMPLOYEE"
      title="مراسلات الموظفين"
      subtitle="إدارة المراسلات الداخلية الواردة والمرسلة بين الموظفين"
    />
  );
}
