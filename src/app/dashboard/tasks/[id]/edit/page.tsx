import { TaskEdit } from "@/components/tasks/task-edit";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TaskEdit id={id} />;
}
