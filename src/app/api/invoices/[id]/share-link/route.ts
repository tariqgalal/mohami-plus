import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import {
  buildPublicInvoiceUrl,
  ensureInvoicePublicToken,
} from "@/lib/invoice-share";
import { buildInvoiceWhatsAppLink } from "@/lib/whatsapp";

const bodySchema = z.object({
  phone: z.string().min(1, "رقم الجوال مطلوب"),
});

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    const inv = await prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        tenant: { select: { name: true } },
      },
    });
    if (!inv) return apiError("الفاتورة غير موجودة", 404);

    const token = await ensureInvoicePublicToken(tenantId, id);
    const origin = req.nextUrl.origin;
    const publicUrl = buildPublicInvoiceUrl(token, origin);

    const link = buildInvoiceWhatsAppLink({
      clientPhone: body.phone,
      firmName: inv.tenant.name,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(inv.totalAmount),
      publicUrl,
    });
    if (!link) return apiError("رقم الجوال غير صحيح", 400);

    return apiSuccess({
      whatsappUrl: link.url,
      publicUrl,
      message: link.message,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
