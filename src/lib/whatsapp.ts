import { normalizeSaudiMobile } from "@/lib/validators";

interface InvoiceShareParams {
  clientPhone: string;
  firmName: string;
  invoiceNumber: string;
  amount: number;
  publicUrl: string;
}

/**
 * Build a wa.me deep link for sharing an invoice.
 * Returns null if the phone number is not a valid Saudi mobile.
 */
export function buildInvoiceWhatsAppLink(
  params: InvoiceShareParams,
): { url: string; message: string } | null {
  const normalized = normalizeSaudiMobile(params.clientPhone);
  if (!normalized) return null;
  // wa.me expects digits only, with country code, no +
  const phoneDigits = normalized.replace(/\D/g, "");
  const message = buildInvoiceShareMessage(params);
  const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
  return { url, message };
}

export function buildInvoiceShareMessage(params: InvoiceShareParams): string {
  return (
    `السلام عليكم،\n\n` +
    `هذه فاتورة من مكتب ${params.firmName}.\n\n` +
    `رقم الفاتورة: ${params.invoiceNumber}\n` +
    `المبلغ: ${params.amount.toLocaleString("ar-SA")} ر.س\n\n` +
    `رابط الفاتورة: ${params.publicUrl}\n\n` +
    `لأي استفسار يرجى التواصل معنا.`
  );
}
