import { BorrowingEdit } from "@/components/borrowings/borrowing-edit";

export default async function EditBorrowingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BorrowingEdit id={id} />;
}
