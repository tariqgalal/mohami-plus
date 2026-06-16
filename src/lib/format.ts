// دوال التنسيق للعرض - عملة، تاريخ، أرقام

export function formatCurrency(
  amount: number | string | bigint | { toString(): string } | null | undefined,
  currency = "SAR",
): string {
  if (amount === null || amount === undefined) return "—";
  const num = Number(
    typeof amount === "object" ? amount.toString() : amount,
  );
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(num: number | string): string {
  return new Intl.NumberFormat("ar-SA").format(Number(num));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    calendar: "gregory",
    numberingSystem: "latn",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    calendar: "gregory",
    numberingSystem: "latn",
  }).format(d);
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  const rtf = new Intl.RelativeTimeFormat("ar-SA", { numeric: "auto" });

  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  if (diffHour < 24) return rtf.format(-diffHour, "hour");
  if (diffDay < 30) return rtf.format(-diffDay, "day");
  return formatDate(d);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 بايت";
  const k = 1024;
  const sizes = ["بايت", "ك.ب", "م.ب", "ج.ب"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function generateCaseNumber(year: number, sequence: number): string {
  return `QD-${year}-${String(sequence).padStart(3, "0")}`;
}

export function generateInvoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${String(sequence).padStart(3, "0")}`;
}
