import { prisma } from "@/lib/prisma";
import type {
  AttachmentFilter,
  CreateLinkAttachmentInput,
} from "@/lib/validations/attachment";

const OWNER_FIELDS = [
  "caseId",
  "clientId",
  "invoiceId",
  "sessionId",
  "meetingId",
] as const;

function validateOwner(filter: AttachmentFilter): void {
  const set = OWNER_FIELDS.filter((f) => filter[f]);
  if (set.length !== 1) {
    throw new Error("لا بد من تحديد مالك واحد بالضبط (قضية أو عميل أو ...)");
  }
}

async function assertOwnerBelongsToTenant(
  tenantId: string,
  filter: AttachmentFilter,
): Promise<void> {
  if (filter.caseId) {
    const c = await prisma.case.findFirst({
      where: { id: filter.caseId, tenantId },
      select: { id: true },
    });
    if (!c) throw new Error("القضية غير موجودة");
  }
  if (filter.clientId) {
    const c = await prisma.client.findFirst({
      where: { id: filter.clientId, tenantId },
      select: { id: true },
    });
    if (!c) throw new Error("العميل غير موجود");
  }
  if (filter.invoiceId) {
    const c = await prisma.invoice.findFirst({
      where: { id: filter.invoiceId, tenantId },
      select: { id: true },
    });
    if (!c) throw new Error("الفاتورة غير موجودة");
  }
  if (filter.sessionId) {
    const c = await prisma.courtSession.findFirst({
      where: { id: filter.sessionId, tenantId },
      select: { id: true },
    });
    if (!c) throw new Error("الجلسة غير موجودة");
  }
  if (filter.meetingId) {
    const c = await prisma.meeting.findFirst({
      where: { id: filter.meetingId, tenantId },
      select: { id: true },
    });
    if (!c) throw new Error("الاجتماع غير موجود");
  }
}

export async function listAttachments(
  tenantId: string,
  filter: AttachmentFilter,
) {
  validateOwner(filter);
  return prisma.attachment.findMany({
    where: {
      tenantId,
      caseId: filter.caseId ?? undefined,
      clientId: filter.clientId ?? undefined,
      invoiceId: filter.invoiceId ?? undefined,
      sessionId: filter.sessionId ?? undefined,
      meetingId: filter.meetingId ?? undefined,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createLinkAttachment(
  tenantId: string,
  uploadedBy: string,
  input: CreateLinkAttachmentInput,
) {
  validateOwner(input);
  await assertOwnerBelongsToTenant(tenantId, input);
  return prisma.attachment.create({
    data: {
      tenantId,
      uploadedBy,
      type: "LINK",
      url: input.url.trim(),
      label: input.label?.trim() || null,
      caseId: input.caseId ?? null,
      clientId: input.clientId ?? null,
      invoiceId: input.invoiceId ?? null,
      sessionId: input.sessionId ?? null,
      meetingId: input.meetingId ?? null,
    },
  });
}

export async function deleteAttachment(tenantId: string, id: string) {
  const existing = await prisma.attachment.findFirst({
    where: { id, tenantId },
  });
  if (!existing) return null;
  await prisma.attachment.delete({ where: { id } });
  return existing;
}
