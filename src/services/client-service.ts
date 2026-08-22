import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateClientInput,
  UpdateClientInput,
  ClientFiltersInput,
} from "@/lib/validations/client";

export async function listClients(
  tenantId: string,
  filters: ClientFiltersInput,
) {
  const where: Prisma.ClientWhereInput = { tenantId };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { phone: { contains: filters.q } },
      { email: { contains: filters.q, mode: "insensitive" } },
      { nationalId: { contains: filters.q } },
    ];
  }
  if (filters.clientType) where.clientType = filters.clientType;
  if (filters.status) where.status = filters.status;
  if (filters.city) where.city = filters.city;

  const orderBy: Prisma.ClientOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [items, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        _count: { select: { cases: true, invoices: true } },
      },
    }),
    prisma.client.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getClient(tenantId: string, id: string) {
  return prisma.client.findFirst({
    where: { id, tenantId },
    include: {
      cases: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          caseNumber: true,
          title: true,
          caseType: true,
          status: true,
          priority: true,
          value: true,
          createdAt: true,
        },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          paidAmount: true,
          status: true,
          dueDate: true,
          createdAt: true,
        },
      },
      _count: { select: { cases: true, invoices: true } },
    },
  });
}

export async function createClient(
  tenantId: string,
  userId: string,
  input: CreateClientInput,
) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.client.create({
      data: {
        tenantId,
        name: input.name,
        clientType: input.clientType,
        contactPerson: input.contactPerson ?? null,
        nationalId: input.nationalId ?? null,
        email: input.email || null,
        phone: input.phone,
        secondaryPhone: input.secondaryPhone ?? null,
        city: input.city,
        address: input.address ?? null,
        notes: input.notes ?? null,
        status: input.status ?? "ACTIVE",
        idDocumentUrl: input.idDocumentUrl || null,
        idDocumentName: input.idDocumentName ?? null,
      },
    });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "client",
        entityId: created.id,
        details: JSON.stringify({ name: created.name }),
      },
    });
    return created;
  });
}

export async function updateClient(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateClientInput,
) {
  const existing = await prisma.client.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({
      where: { id },
      data: {
        name: input.name,
        clientType: input.clientType,
        contactPerson: input.contactPerson,
        nationalId: input.nationalId,
        email: input.email || null,
        phone: input.phone,
        secondaryPhone: input.secondaryPhone,
        city: input.city,
        address: input.address,
        notes: input.notes,
        status: input.status,
        idDocumentUrl: input.idDocumentUrl !== undefined ? input.idDocumentUrl || null : undefined,
        idDocumentName: input.idDocumentName !== undefined ? input.idDocumentName || null : undefined,
      },
    });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "updated",
        entity: "client",
        entityId: id,
      },
    });
    return updated;
  });
}

export async function deleteClient(
  tenantId: string,
  userId: string,
  id: string,
) {
  const existing = await prisma.client.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { cases: true } } },
  });
  if (!existing) return null;
  await prisma.$transaction([
    prisma.client.update({ where: { id }, data: { status: "INACTIVE" } }),
    prisma.activity.create({
      data: {
        tenantId,
        userId,
        action: "archived",
        entity: "client",
        entityId: id,
        details: JSON.stringify({ previousStatus: existing.status }),
      },
    }),
  ]);
  return existing;
}
