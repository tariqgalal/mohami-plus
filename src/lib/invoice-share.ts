import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Returns (and lazily mints) the publicToken for a given invoice.
 * Token is opaque random — not derivable from the invoice id.
 */
export async function ensureInvoicePublicToken(
  tenantId: string,
  invoiceId: string,
): Promise<string> {
  const inv = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    select: { id: true, publicToken: true },
  });
  if (!inv) throw new Error("الفاتورة غير موجودة");
  if (inv.publicToken) return inv.publicToken;

  const token = randomBytes(24).toString("hex");
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { publicToken: token },
  });
  return token;
}

export function buildPublicInvoiceUrl(token: string, origin?: string): string {
  const base =
    origin || process.env.NEXT_PUBLIC_APP_URL || "https://mohamiplus.sa";
  return `${base.replace(/\/$/, "")}/share/invoices/${token}`;
}
