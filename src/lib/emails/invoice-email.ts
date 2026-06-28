interface InvoiceEmailParams {
  clientName: string;
  firmName: string;
  firmPhone: string | null;
  invoiceNumber: string;
  amount: number;
  dueDate: Date | string;
  publicUrl: string;
  note?: string;
}

export function buildInvoiceEmail(params: InvoiceEmailParams) {
  const due = new Date(params.dueDate).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    calendar: "gregory",
    numberingSystem: "latn",
  });
  const amountFmt = params.amount.toLocaleString("ar-SA");

  const noteBlock = params.note
    ? `<p style="margin:16px 0;padding:12px;background:#fef3c7;border-right:4px solid #f59e0b;color:#78350f;border-radius:4px;">${escapeHtml(params.note)}</p>`
    : "";

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<body style="margin:0;padding:0;font-family:Tahoma,Arial,sans-serif;background:#f8fafc;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center" style="padding:24px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#1e3a8a;color:#fff;padding:20px 24px;">
          <h1 style="margin:0;font-size:18px;">فاتورة من ${escapeHtml(params.firmName)}</h1>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 12px 0;">السلام عليكم ${escapeHtml(params.clientName)}،</p>
          <p style="margin:0 0 12px 0;">تم إصدار فاتورة جديدة من مكتب ${escapeHtml(params.firmName)}.</p>
          ${noteBlock}
          <table role="presentation" cellspacing="0" cellpadding="8" border="0" style="width:100%;margin:16px 0;border:1px solid #e2e8f0;border-radius:6px;">
            <tr><td style="color:#64748b;">رقم الفاتورة</td><td style="font-family:monospace;direction:ltr;text-align:left;">${escapeHtml(params.invoiceNumber)}</td></tr>
            <tr><td style="color:#64748b;">المبلغ</td><td style="font-weight:bold;">${amountFmt} ر.س</td></tr>
            <tr><td style="color:#64748b;">تاريخ الاستحقاق</td><td>${due}</td></tr>
          </table>
          <p style="text-align:center;margin:24px 0;">
            <a href="${params.publicUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">عرض الفاتورة</a>
          </p>
          ${params.firmPhone ? `<p style="margin:0 0 8px 0;color:#64748b;font-size:13px;">لأي استفسار يرجى التواصل معنا على <span dir="ltr">${escapeHtml(params.firmPhone)}</span>.</p>` : ""}
          <p style="margin:24px 0 0 0;color:#64748b;font-size:13px;">مع التحية،<br/>${escapeHtml(params.firmName)}</p>
        </td></tr>
        <tr><td style="background:#f1f5f9;padding:16px 24px;text-align:center;font-size:11px;color:#94a3b8;">
          أُرسلت تلقائياً من منصة محامي بلس.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `السلام عليكم ${params.clientName}،

تم إصدار فاتورة جديدة من مكتب ${params.firmName}.

رقم الفاتورة: ${params.invoiceNumber}
المبلغ: ${amountFmt} ر.س
تاريخ الاستحقاق: ${due}

عرض الفاتورة: ${params.publicUrl}
${params.note ? `\nملاحظة: ${params.note}\n` : ""}
${params.firmPhone ? `\nللتواصل: ${params.firmPhone}\n` : ""}
مع التحية،
${params.firmName}`;

  const subject = `فاتورة ${params.invoiceNumber} من ${params.firmName}`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
