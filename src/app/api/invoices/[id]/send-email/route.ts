import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { emailSchema } from "@/lib/validators";
import {
  buildPublicInvoiceUrl,
  ensureInvoicePublicToken,
} from "@/lib/invoice-share";
import { buildInvoiceEmail } from "@/lib/emails/invoice-email";
import { isEmailConfigured, sendEmail } from "@/lib/email";

const bodySchema = z.object({
  to: emailSchema,
  note: z.string().optional().nullable(),
});

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    await requirePermission("INVOICE_MANAGE");
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    const inv = await prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        client: { select: { name: true } },
        tenant: { select: { name: true, phone: true } },
      },
    });
    if (!inv) return apiError("الفاتورة غير موجودة", 404);

    const token = await ensureInvoicePublicToken(tenantId, id);
    const publicUrl = buildPublicInvoiceUrl(token, req.nextUrl.origin);

    const { subject, html, text } = buildInvoiceEmail({
      clientName: inv.client.name,
      firmName: inv.tenant.name,
      firmPhone: inv.tenant.phone,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(inv.totalAmount),
      dueDate: inv.dueDate,
      publicUrl,
      note: body.note ?? undefined,
    });

    const result = await sendEmail({
      to: body.to,
      subject,
      html,
      text,
    });

    if (!result.delivered && result.provider === "resend") {
      return apiError(
        `فشل إرسال البريد: ${result.error || "خطأ غير معروف"}`,
        502,
      );
    }
    if (!result.delivered && result.provider === "dev-log") {
      // Stored as not-sent server-side; but UX-wise we surface a warning
      return apiSuccess({
        delivered: false,
        message:
          "البريد لم يُرسل فعلياً — مفتاح Resend غير مكوَّن. تم تسجيل الطلب في سجل التطوير.",
      });
    }

    await prisma.invoice.update({
      where: { id },
      data: { sentAt: new Date(), sentTo: body.to },
    });

    return apiSuccess({
      delivered: true,
      providerId: result.providerId,
      publicUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    await requirePermission("INVOICE_MANAGE");
    return apiSuccess({ configured: isEmailConfigured() });
  } catch (error) {
    return handleApiError(error);
  }
}
