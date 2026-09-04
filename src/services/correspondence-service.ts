import { Prisma, CorrespondenceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateCorrespondenceInput,
  UpdateCorrespondenceInput,
  CorrespondenceFiltersInput,
} from "@/lib/validations/correspondence";
import { NotFoundError } from "@/lib/errors";
import { notifyMessageReceived } from "@/services/notification-service";

export interface ViewedByEntry {
  id: string;
  name: string;
  at: string;
}

/** يحوّل معرّفات المستلمين إلى أسماء (موظفون أو عملاء حسب نوع المراسلة) ضمن نفس المكتب */
async function resolveRecipientNames(
  tenantId: string,
  type: CorrespondenceType,
  ids: string[],
): Promise<string[]> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return [];

  if (type === "EMPLOYEE") {
    const users = await prisma.user.findMany({
      where: { id: { in: unique }, tenantId },
      select: { id: true, name: true },
    });
    const map = new Map(users.map((u) => [u.id, u.name]));
    return unique.map((id) => map.get(id) ?? "مستخدم محذوف");
  }

  const clients = await prisma.client.findMany({
    where: { id: { in: unique }, tenantId },
    select: { id: true, name: true },
  });
  const map = new Map(clients.map((c) => [c.id, c.name]));
  return unique.map((id) => map.get(id) ?? "عميل محذوف");
}

export async function listCorrespondence(
  tenantId: string,
  filters: CorrespondenceFiltersInput,
) {
  const where: Prisma.CorrespondenceWhereInput = {
    tenantId,
    parentId: null, // القوائم تعرض المراسلات الأصلية فقط (الردود تظهر داخل التفاصيل)
  };

  if (filters.type) where.type = filters.type;
  if (filters.direction) where.direction = filters.direction;
  if (filters.category) where.category = filters.category;
  if (filters.q) {
    where.OR = [
      { subject: { contains: filters.q, mode: "insensitive" } },
      { body: { contains: filters.q, mode: "insensitive" } },
      { senderName: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.CorrespondenceOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [items, total] = await Promise.all([
    prisma.correspondence.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.correspondence.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

/** عدد المراسلات حسب الاتجاه (للتابات: الواردة / المرسلة) ضمن نوع معيّن */
export async function countCorrespondenceByDirection(
  tenantId: string,
  type: CorrespondenceType,
) {
  const rows = await prisma.correspondence.groupBy({
    by: ["direction"],
    where: { tenantId, type, parentId: null },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.direction] = r._count._all;
  return counts;
}

export async function getCorrespondence(tenantId: string, id: string) {
  return prisma.correspondence.findFirst({
    where: { id, tenantId },
    include: {
      replies: {
        orderBy: { date: "asc" },
      },
    },
  });
}

export async function createCorrespondence(
  tenantId: string,
  userId: string,
  input: CreateCorrespondenceInput,
) {
  // اسم المرسل (لقطة وقت الإرسال)
  const sender = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { name: true },
  });
  if (!sender) throw new NotFoundError("المرسل غير موجود");

  // في حالة الرد: تأكد أن المراسلة الأصلية تخص نفس المكتب وورّث النوع والقسم
  let type = input.type;
  let category = input.category;
  if (input.parentId) {
    const parent = await prisma.correspondence.findFirst({
      where: { id: input.parentId, tenantId },
      select: { id: true, type: true, category: true },
    });
    if (!parent) throw new NotFoundError("المراسلة الأصلية غير موجودة");
    type = parent.type;
    category = parent.category;
  }

  const recipientNames = await resolveRecipientNames(
    tenantId,
    type,
    input.recipientIds,
  );
  const attachments = input.attachments ?? [];

  const created = await prisma.$transaction(async (tx) => {
    // رقم مسلسل تلقائي متسلسل لكل مكتب
    const agg = await tx.correspondence.aggregate({
      where: { tenantId },
      _max: { serialNumber: true },
    });
    const serialNumber = (agg._max.serialNumber ?? 0) + 1;

    const created = await tx.correspondence.create({
      data: {
        tenantId,
        serialNumber,
        subject: input.subject,
        body: input.body,
        category,
        type,
        direction: input.direction,
        senderId: userId,
        senderName: sender.name,
        recipientIds: input.recipientIds as unknown as Prisma.InputJsonValue,
        recipientNames: recipientNames as unknown as Prisma.InputJsonValue,
        viewedBy: Prisma.JsonNull,
        attachmentCount: attachments.length,
        attachments: attachments.length
          ? (attachments as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        dateHijri: input.dateHijri ?? null,
        ...(input.date ? { date: input.date } : {}),
        parentId: input.parentId ?? null,
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "correspondence",
        entityId: created.id,
        details: JSON.stringify({ subject: created.subject }),
      },
    });

    return created;
  });

  // مراسلات الموظفين فقط لها مستلمون من مستخدمي النظام
  if (type === "EMPLOYEE") {
    const recipients = [...new Set(input.recipientIds)].filter(
      (rid) => rid && rid !== userId,
    );
    if (recipients.length) {
      await notifyMessageReceived({
        tenantId,
        correspondenceId: created.id,
        senderName: sender.name,
        preview: created.subject
          ? `${created.subject} — ${created.body}`
          : created.body,
        recipientIds: recipients,
      });
    }
  }

  return created;
}

/** يسجّل مشاهدة المستخدم للمراسلة (مرة واحدة) */
export async function markCorrespondenceViewed(
  tenantId: string,
  userId: string,
  userName: string,
  id: string,
) {
  const item = await prisma.correspondence.findFirst({
    where: { id, tenantId },
    select: { id: true, senderId: true, viewedBy: true },
  });
  if (!item) return null;
  if (item.senderId === userId) return item; // المرسل لا يُحتسب مشاهداً

  const viewed = Array.isArray(item.viewedBy)
    ? (item.viewedBy as unknown as ViewedByEntry[])
    : [];
  if (viewed.some((v) => v.id === userId)) return item;

  viewed.push({ id: userId, name: userName, at: new Date().toISOString() });
  return prisma.correspondence.update({
    where: { id },
    data: { viewedBy: viewed as unknown as Prisma.InputJsonValue },
  });
}

export async function updateCorrespondence(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateCorrespondenceInput,
) {
  const existing = await prisma.correspondence.findFirst({
    where: { id, tenantId },
    select: { id: true, type: true },
  });
  if (!existing) return null;

  let recipientNames: string[] | undefined;
  if (input.recipientIds) {
    const type = input.type ?? existing.type;
    recipientNames = await resolveRecipientNames(
      tenantId,
      type,
      input.recipientIds,
    );
  }

  const attachments = input.attachments;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.correspondence.update({
      where: { id },
      data: {
        subject: input.subject,
        body: input.body,
        category: input.category,
        type: input.type,
        direction: input.direction,
        dateHijri: input.dateHijri,
        date: input.date,
        ...(input.recipientIds
          ? {
              recipientIds:
                input.recipientIds as unknown as Prisma.InputJsonValue,
              recipientNames:
                recipientNames as unknown as Prisma.InputJsonValue,
            }
          : {}),
        ...(attachments !== undefined
          ? {
              attachmentCount: attachments.length,
              attachments: attachments.length
                ? (attachments as unknown as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            }
          : {}),
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "updated",
        entity: "correspondence",
        entityId: id,
      },
    });

    return updated;
  });
}

export async function deleteCorrespondence(
  tenantId: string,
  userId: string,
  id: string,
) {
  const existing = await prisma.correspondence.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    // احذف الردود المرتبطة أولاً لتفادي قيد المفتاح الأجنبي
    await tx.correspondence.deleteMany({ where: { parentId: id, tenantId } });
    await tx.correspondence.delete({ where: { id } });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "deleted",
        entity: "correspondence",
        entityId: id,
      },
    });
  });

  return { id };
}
