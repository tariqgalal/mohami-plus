import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { VAT_RATE } from "@/lib/constants";
import { generateInvoiceNumber } from "@/lib/format";
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFiltersInput,
  RecordPaymentInput,
} from "@/lib/validations/invoice";

function computeAmounts(amount: number, taxIncluded: boolean) {
  if (taxIncluded) {
    const tax = +(amount * VAT_RATE).toFixed(2);
    return {
      amount,
      tax,
      totalAmount: +(amount + tax).toFixed(2),
    };
  }
  return { amount, tax: 0, totalAmount: amount };
}

export async function listInvoices(
  tenantId: string,
  filters: InvoiceFiltersInput,
) {
  const where: Prisma.InvoiceWhereInput = { tenantId };

  if (filters.q) {
    where.OR = [
      { invoiceNumber: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { client: { name: { contains: filters.q, mode: "insensitive" } } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.caseId) where.caseId = filters.caseId;
  if (filters.from || filters.to) {
    where.issueDate = {};
    if (filters.from) where.issueDate.gte = filters.from;
    if (filters.to) where.issueDate.lte = filters.to;
  }

  const orderBy: Prisma.InvoiceOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        client: { select: { id: true, name: true, phone: true } },
        case: { select: { id: true, caseNumber: true, title: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getInvoice(tenantId: string, id: string) {
  return prisma.invoice.findFirst({
    where: { id, tenantId },
    include: {
      client: true,
      case: {
        select: { id: true, caseNumber: true, title: true, status: true },
      },
      createdBy: { select: { id: true, name: true } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
}

async function nextInvoiceNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      tenantId,
      issueDate: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  });
  return generateInvoiceNumber(year, count + 1);
}

export async function createInvoice(
  tenantId: string,
  userId: string,
  input: CreateInvoiceInput,
) {
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, tenantId },
    select: { id: true },
  });
  if (!client) throw new Error("العميل غير موجود");

  if (input.caseId) {
    const c = await prisma.case.findFirst({
      where: { id: input.caseId, tenantId },
      select: { id: true },
    });
    if (!c) throw new Error("القضية غير موجودة");
  }

  const { amount, tax, totalAmount } = computeAmounts(
    input.amount,
    input.taxIncluded ?? true,
  );
  const invoiceNumber = await nextInvoiceNumber(tenantId);

  return prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        tenantId,
        clientId: input.clientId,
        caseId: input.caseId || null,
        createdById: userId,
        invoiceNumber,
        description: input.description,
        amount,
        tax,
        totalAmount,
        dueDate: input.dueDate,
        notes: input.notes ?? null,
        status: input.status ?? "DRAFT",
      },
    });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "invoice",
        entityId: created.id,
        details: JSON.stringify({
          number: invoiceNumber,
          amount: totalAmount,
        }),
      },
    });
    return created;
  });
}

export async function updateInvoice(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateInvoiceInput,
) {
  const existing = await prisma.invoice.findFirst({
    where: { id, tenantId },
    select: { id: true, paidAmount: true },
  });
  if (!existing) return null;

  const data: Prisma.InvoiceUpdateInput = {
    description: input.description,
    dueDate: input.dueDate,
    notes: input.notes,
    status: input.status,
  };

  if (input.amount !== undefined) {
    const { amount, tax, totalAmount } = computeAmounts(
      input.amount,
      input.taxIncluded ?? true,
    );
    data.amount = amount;
    data.tax = tax;
    data.totalAmount = totalAmount;
  }

  if (input.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: input.clientId, tenantId },
      select: { id: true },
    });
    if (!client) throw new Error("العميل غير موجود");
    data.client = { connect: { id: input.clientId } };
  }

  if (input.caseId !== undefined) {
    if (input.caseId) {
      const c = await prisma.case.findFirst({
        where: { id: input.caseId, tenantId },
        select: { id: true },
      });
      if (!c) throw new Error("القضية غير موجودة");
      data.case = { connect: { id: input.caseId } };
    } else {
      data.case = { disconnect: true };
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({ where: { id }, data });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "updated",
        entity: "invoice",
        entityId: id,
      },
    });
    return updated;
  });
}

export async function deleteInvoice(
  tenantId: string,
  userId: string,
  id: string,
) {
  const existing = await prisma.invoice.findFirst({
    where: { id, tenantId },
    select: { id: true, paidAmount: true },
  });
  if (!existing) return null;
  if (Number(existing.paidAmount) > 0) {
    throw new Error("لا يمكن إلغاء فاتورة بها مدفوعات");
  }

  await prisma.$transaction([
    prisma.invoice.update({ where: { id }, data: { status: "CANCELLED" } }),
    prisma.activity.create({
      data: {
        tenantId,
        userId,
        action: "voided",
        entity: "invoice",
        entityId: id,
      },
    }),
  ]);
  return existing;
}

export async function recordPayment(
  tenantId: string,
  userId: string,
  invoiceId: string,
  input: RecordPaymentInput,
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
  });
  if (!invoice) return null;

  const totalDue = Number(invoice.totalAmount);
  const currentPaid = Number(invoice.paidAmount);
  const newPaid = +(currentPaid + input.amount).toFixed(2);

  if (newPaid > totalDue + 0.01) {
    throw new Error("المبلغ المدفوع يتجاوز إجمالي الفاتورة");
  }

  const newStatus =
    newPaid >= totalDue - 0.01 ? "PAID" : newPaid > 0 ? "PARTIAL" : invoice.status;

  return prisma.$transaction(async (tx) => {
    await tx.paymentRecord.create({
      data: {
        invoiceId,
        amount: input.amount,
        method: input.method,
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        receiptUrl: input.receiptUrl || null,
        receiptName: input.receiptName ?? null,
        paidAt: input.paidAt ?? new Date(),
      },
    });
    const updated = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaid,
        status: newStatus,
        paidDate: newStatus === "PAID" ? new Date() : invoice.paidDate,
      },
    });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "payment_recorded",
        entity: "invoice",
        entityId: invoiceId,
        details: JSON.stringify({
          amount: input.amount,
          method: input.method,
        }),
      },
    });
    return updated;
  });
}

export async function getFinanceStats(tenantId: string) {
  const [totals, overdueCount, byStatus] = await Promise.all([
    prisma.invoice.aggregate({
      where: { tenantId },
      _sum: { totalAmount: true, paidAmount: true },
      _count: true,
    }),
    prisma.invoice.count({
      where: {
        tenantId,
        status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
      _sum: { totalAmount: true },
    }),
  ]);

  const total = Number(totals._sum.totalAmount ?? 0);
  const paid = Number(totals._sum.paidAmount ?? 0);
  const outstanding = +(total - paid).toFixed(2);

  return {
    total,
    paid,
    outstanding,
    overdueCount,
    invoiceCount: totals._count,
    byStatus,
  };
}
