/**
 * Audit existing users / clients for invalid Saudi mobile numbers or invalid emails.
 *
 * Run: npx tsx scripts/audit-invalid-contacts.ts
 *
 * Writes a markdown report to INVALID_CONTACTS_REPORT.md at repo root.
 * Does NOT mutate any data — owner reviews and decides.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  isValidSaudiMobile,
  isValidEmail,
  normalizeSaudiMobile,
} from "../src/lib/validators";

const prisma = new PrismaClient();

interface Issue {
  table: string;
  id: string;
  tenantSlug: string | null;
  display: string;
  field: string;
  rawValue: string | null;
  suggestion: string | null;
}

function suggestFix(raw: string | null | undefined, kind: "mobile" | "email"): string | null {
  if (!raw) return null;
  if (kind === "mobile") {
    // Try common owner-side fixes
    const cleaned = raw.replace(/[\s\-()]/g, "");
    // missing leading 5
    if (/^0\d{8}$/.test(cleaned) && !cleaned.startsWith("05")) {
      const trial = "0" + "5" + cleaned.slice(1);
      const norm = normalizeSaudiMobile(trial);
      if (norm) return `يبدو أن الرقم ناقص ٥ في البداية؟ المحاولة: ${trial} → ${norm}`;
    }
    // already valid after normalization
    const norm = normalizeSaudiMobile(cleaned);
    if (norm) return `صالح بعد التطبيع: ${norm}`;
    return "يحتاج مراجعة يدوية";
  }
  if (kind === "email") {
    const trimmed = raw.trim().toLowerCase();
    if (isValidEmail(trimmed)) return `صالح بعد إزالة المسافات: ${trimmed}`;
    return "يحتاج مراجعة يدوية";
  }
  return null;
}

async function main() {
  const issues: Issue[] = [];

  // Tenants (firms)
  const tenants = await prisma.tenant.findMany({
    select: { id: true, slug: true, name: true, email: true, phone: true },
  });
  for (const t of tenants) {
    if (!isValidEmail(t.email)) {
      issues.push({
        table: "Tenant",
        id: t.id,
        tenantSlug: t.slug,
        display: t.name,
        field: "email",
        rawValue: t.email,
        suggestion: suggestFix(t.email, "email"),
      });
    }
    if (t.phone && !isValidSaudiMobile(t.phone)) {
      issues.push({
        table: "Tenant",
        id: t.id,
        tenantSlug: t.slug,
        display: t.name,
        field: "phone",
        rawValue: t.phone,
        suggestion: suggestFix(t.phone, "mobile"),
      });
    }
  }

  // Users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      tenant: { select: { slug: true } },
    },
  });
  for (const u of users) {
    if (!isValidEmail(u.email)) {
      issues.push({
        table: "User",
        id: u.id,
        tenantSlug: u.tenant?.slug ?? null,
        display: u.name,
        field: "email",
        rawValue: u.email,
        suggestion: suggestFix(u.email, "email"),
      });
    }
    if (u.phone && !isValidSaudiMobile(u.phone)) {
      issues.push({
        table: "User",
        id: u.id,
        tenantSlug: u.tenant?.slug ?? null,
        display: u.name,
        field: "phone",
        rawValue: u.phone,
        suggestion: suggestFix(u.phone, "mobile"),
      });
    }
  }

  // Clients
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      secondaryPhone: true,
      tenant: { select: { slug: true } },
    },
  });
  for (const c of clients) {
    if (c.email && !isValidEmail(c.email)) {
      issues.push({
        table: "Client",
        id: c.id,
        tenantSlug: c.tenant?.slug ?? null,
        display: c.name,
        field: "email",
        rawValue: c.email,
        suggestion: suggestFix(c.email, "email"),
      });
    }
    if (c.phone && !isValidSaudiMobile(c.phone)) {
      issues.push({
        table: "Client",
        id: c.id,
        tenantSlug: c.tenant?.slug ?? null,
        display: c.name,
        field: "phone",
        rawValue: c.phone,
        suggestion: suggestFix(c.phone, "mobile"),
      });
    }
    if (c.secondaryPhone && !isValidSaudiMobile(c.secondaryPhone)) {
      issues.push({
        table: "Client",
        id: c.id,
        tenantSlug: c.tenant?.slug ?? null,
        display: c.name,
        field: "secondaryPhone",
        rawValue: c.secondaryPhone,
        suggestion: suggestFix(c.secondaryPhone, "mobile"),
      });
    }
  }

  // Opponents
  const opponents = await prisma.opponent.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      case: { select: { tenant: { select: { slug: true } } } },
    },
  });
  for (const o of opponents) {
    if (o.phone && !isValidSaudiMobile(o.phone)) {
      issues.push({
        table: "Opponent",
        id: o.id,
        tenantSlug: o.case?.tenant?.slug ?? null,
        display: o.name,
        field: "phone",
        rawValue: o.phone,
        suggestion: suggestFix(o.phone, "mobile"),
      });
    }
  }

  // Build markdown report
  const now = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `# تقرير جهات الاتصال غير الصالحة — ${now}`,
    "",
    `**إجمالي المشاكل:** ${issues.length}`,
    "",
    "هذا التقرير يستعرض كل الحقول التي لا تطابق التحقق الجديد (جوال سعودي صالح / إيميل صالح). **لم يتم تعديل أي بيانات.**",
    "",
    "## كيفية التصحيح",
    "1. راجع كل صف وقرّر الإجراء.",
    "2. يمكنك تعديل البيانات يدوياً من واجهة الإدارة أو SQL.",
    "3. أعد تشغيل هذا السكريبت بعد التصحيح للتأكد من أنه لم يعد هناك مشاكل.",
    "",
  ];

  if (issues.length === 0) {
    lines.push("✅ **مفيش بيانات غير صالحة. كل شيء تمام.**");
  } else {
    const groups = new Map<string, Issue[]>();
    for (const i of issues) {
      const k = i.table;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(i);
    }
    for (const [table, group] of groups) {
      lines.push(`## ${table} (${group.length})`);
      lines.push("");
      lines.push("| ID | المكتب | الاسم | الحقل | القيمة الحالية | اقتراح |");
      lines.push("|---|---|---|---|---|---|");
      for (const i of group) {
        lines.push(
          `| \`${i.id}\` | ${i.tenantSlug ?? "—"} | ${i.display} | ${i.field} | \`${i.rawValue ?? ""}\` | ${i.suggestion ?? "—"} |`,
        );
      }
      lines.push("");
    }
  }

  const out = lines.join("\n") + "\n";
  const target = join(process.cwd(), "INVALID_CONTACTS_REPORT.md");
  writeFileSync(target, out, "utf-8");
  console.log(`Wrote report → ${target}`);
  console.log(`Found ${issues.length} invalid contacts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
