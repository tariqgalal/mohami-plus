import {
  PrismaClient,
  Plan,
  TenantStatus,
  UserRole,
  CaseType,
  CaseStatus,
  Priority,
  ClientType,
  ClientStatus,
  SessionType,
  SessionStatus,
  InvoiceStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const VAT = 0.15;

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function main() {
  console.log("🌱 بدء إضافة البيانات التجريبية...");

  const now = new Date();
  const adminHash = await bcrypt.hash("Admin@12345", 10);
  const lawyerHash = await bcrypt.hash("Lawyer@12345", 10);

  // ============ SUPER ADMIN ============
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@mohamiplus.sa" },
    update: { password: adminHash, isActive: true, isSuperAdmin: true },
    create: {
      email: "admin@mohamiplus.sa",
      password: adminHash,
      name: "مدير المنصة",
      role: UserRole.FIRM_ADMIN,
      isSuperAdmin: true,
      isActive: true,
    },
  });
  console.log("✓ Super Admin:", superAdmin.email);

  // ============ TENANT 1: Demo Firm (Trial) ============
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: "demo-firm" },
    update: {},
    create: {
      name: "مكتب المحاماة التجريبي",
      slug: "demo-firm",
      licenseNumber: "12345",
      email: "info@demo-firm.sa",
      phone: "0501234567",
      city: "الرياض",
      address: "حي العليا، شارع الملك فهد",
      plan: Plan.PROFESSIONAL,
      status: TenantStatus.TRIAL,
      trialEndsAt: addDays(now, 14),
      maxUsers: 10,
      maxCases: 100,
      monthlyPrice: 499,
    },
  });
  console.log("✓ المكتب:", tenant1.name);

  const firmAdmin1 = await prisma.user.upsert({
    where: { email: "admin@demo-firm.sa" },
    update: { password: adminHash, isActive: true },
    create: {
      email: "admin@demo-firm.sa",
      password: adminHash,
      name: "أحمد العنزي",
      phone: "0501234567",
      role: UserRole.FIRM_ADMIN,
      specialization: "قانون تجاري",
      isActive: true,
      tenantId: tenant1.id,
      lastLoginAt: addDays(now, -1),
    },
  });

  const lawyer1 = await prisma.user.upsert({
    where: { email: "lawyer@demo-firm.sa" },
    update: { password: lawyerHash, isActive: true },
    create: {
      email: "lawyer@demo-firm.sa",
      password: lawyerHash,
      name: "سارة المطيري",
      phone: "0507654321",
      role: UserRole.LAWYER,
      specialization: "أحوال شخصية",
      isActive: true,
      tenantId: tenant1.id,
      lastLoginAt: addDays(now, -2),
    },
  });

  const lawyer2 = await prisma.user.upsert({
    where: { email: "khaled@demo-firm.sa" },
    update: { password: lawyerHash, isActive: true },
    create: {
      email: "khaled@demo-firm.sa",
      password: lawyerHash,
      name: "خالد الشمري",
      phone: "0509998877",
      role: UserRole.SENIOR_LAWYER,
      specialization: "قانون عمالي",
      isActive: true,
      tenantId: tenant1.id,
      lastLoginAt: addDays(now, -3),
    },
  });

  // ============ TENANT 2: Al-Adala (Active) ============
  const tenant2 = await prisma.tenant.upsert({
    where: { slug: "al-adala" },
    update: {},
    create: {
      name: "مكتب العدالة للمحاماة",
      slug: "al-adala",
      licenseNumber: "23456",
      email: "info@aladala.sa",
      phone: "0114445566",
      city: "جدة",
      address: "حي الروضة، طريق الأمير سلطان",
      plan: Plan.ENTERPRISE,
      status: TenantStatus.ACTIVE,
      subscriptionStart: addMonths(now, -3),
      subscriptionEnd: addMonths(now, 9),
      maxUsers: 999,
      maxCases: 999,
      monthlyPrice: 999,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@aladala.sa" },
    update: { password: adminHash, isActive: true },
    create: {
      email: "admin@aladala.sa",
      password: adminHash,
      name: "محمد الحربي",
      phone: "0501112233",
      role: UserRole.FIRM_ADMIN,
      specialization: "تجاري",
      isActive: true,
      tenantId: tenant2.id,
      lastLoginAt: addDays(now, -1),
    },
  });

  // ============ TENANT 3: Al-Mizan (Active Basic) ============
  const tenant3 = await prisma.tenant.upsert({
    where: { slug: "al-mizan" },
    update: {},
    create: {
      name: "مكتب الميزان القانوني",
      slug: "al-mizan",
      licenseNumber: "34567",
      email: "info@almizan.sa",
      phone: "0138889900",
      city: "الدمام",
      address: "حي الشاطئ، شارع الخليج",
      plan: Plan.BASIC,
      status: TenantStatus.ACTIVE,
      subscriptionStart: addMonths(now, -1),
      subscriptionEnd: addMonths(now, 11),
      maxUsers: 3,
      maxCases: 25,
      monthlyPrice: 199,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@almizan.sa" },
    update: { password: adminHash, isActive: true },
    create: {
      email: "admin@almizan.sa",
      password: adminHash,
      name: "عبدالله القحطاني",
      phone: "0507778899",
      role: UserRole.FIRM_ADMIN,
      specialization: "عقاري",
      isActive: true,
      tenantId: tenant3.id,
      lastLoginAt: addDays(now, -5),
    },
  });

  // ============ CLEANUP transient demo data (idempotent re-seed) ============
  // المستخدمون والمكاتب مُحدَّثون عبر upsert. هنا نمسح البيانات المتداولة
  // ثم نعيد إنشاءها كي يبقى الـ seed قابلاً للتشغيل عدة مرات بدون تعارضات.
  const tenantIds = [tenant1.id, tenant2.id, tenant3.id];
  await prisma.activity.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.paymentRecord.deleteMany({
    where: { invoice: { tenantId: { in: tenantIds } } },
  });
  await prisma.invoice.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.document.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.courtSession.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.meetingAttendee.deleteMany({
    where: { meeting: { tenantId: { in: tenantIds } } },
  });
  await prisma.meeting.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.case.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.client.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.payment.deleteMany({ where: { tenantId: { in: tenantIds } } });
  console.log("✓ تنظيف البيانات السابقة");

  // ============ PLATFORM PAYMENTS (for revenue charts) ============
  // Tenant 2: 3 paid months
  for (let i = 0; i < 3; i++) {
    const created = addMonths(now, -i);
    await prisma.payment.create({
      data: {
        amount: 999,
        currency: "SAR",
        status: "paid",
        provider: "moyasar",
        providerRef: `pay_t2_${i}_${created.getTime()}`,
        plan: Plan.ENTERPRISE,
        period: "monthly",
        tenantId: tenant2.id,
        createdAt: created,
      },
    });
  }
  // Tenant 3: 1 paid month
  await prisma.payment.create({
    data: {
      amount: 199,
      currency: "SAR",
      status: "paid",
      provider: "moyasar",
      providerRef: `pay_t3_${now.getTime()}`,
      plan: Plan.BASIC,
      period: "monthly",
      tenantId: tenant3.id,
      createdAt: addMonths(now, -1),
    },
  });

  // ============ CLIENTS (in tenant1) ============
  const clientsData = [
    {
      name: "شركة الأفق للتجارة",
      clientType: ClientType.COMPANY,
      contactPerson: "نواف الدوسري",
      nationalId: "1010100100",
      email: "info@al-ofoq.sa",
      phone: "0114445555",
      city: "الرياض",
      address: "حي العليا",
    },
    {
      name: "فيصل بن ناصر العتيبي",
      clientType: ClientType.INDIVIDUAL,
      nationalId: "1099887766",
      email: "f.alotaibi@example.com",
      phone: "0501239876",
      city: "الرياض",
    },
    {
      name: "مؤسسة البناء الحديث",
      clientType: ClientType.INSTITUTION,
      contactPerson: "سعد الغامدي",
      nationalId: "1020030040",
      phone: "0114567890",
      city: "جدة",
    },
    {
      name: "هند بنت عبدالعزيز",
      clientType: ClientType.INDIVIDUAL,
      nationalId: "1077665544",
      phone: "0556677889",
      city: "الرياض",
    },
    {
      name: "وزارة الموارد البشرية",
      clientType: ClientType.GOVERNMENT,
      contactPerson: "ممثل قانوني",
      phone: "0112223344",
      city: "الرياض",
    },
  ];

  const clients: { id: string; name: string }[] = [];
  for (const c of clientsData) {
    const created = await prisma.client.create({
      data: {
        ...c,
        status: ClientStatus.ACTIVE,
        tenantId: tenant1.id,
      },
    });
    clients.push({ id: created.id, name: created.name });
  }
  console.log(`✓ ${clients.length} عملاء`);

  // ============ CASES ============
  const casesData = [
    {
      title: "نزاع تجاري على تسليم بضاعة",
      caseType: CaseType.COMMERCIAL,
      court: "المحكمة التجارية",
      status: CaseStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      value: 350000,
      clientIndex: 0,
      lawyer: firmAdmin1.id,
    },
    {
      title: "مطالبة عمالية بمستحقات نهاية الخدمة",
      caseType: CaseType.LABOR,
      court: "المحكمة العمالية",
      status: CaseStatus.OPEN,
      priority: Priority.MEDIUM,
      value: 85000,
      clientIndex: 1,
      lawyer: lawyer2.id,
    },
    {
      title: "قضية طلاق وحضانة",
      caseType: CaseType.PERSONAL_STATUS,
      court: "محكمة الأحوال الشخصية",
      status: CaseStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      clientIndex: 3,
      lawyer: lawyer1.id,
    },
    {
      title: "نزاع على ملكية عقار",
      caseType: CaseType.REAL_ESTATE,
      court: "المحكمة العامة",
      status: CaseStatus.OPEN,
      priority: Priority.MEDIUM,
      value: 1200000,
      clientIndex: 2,
      lawyer: firmAdmin1.id,
    },
    {
      title: "مطالبة بسداد دين تجاري",
      caseType: CaseType.COMMERCIAL,
      court: "المحكمة التجارية",
      status: CaseStatus.WON,
      priority: Priority.MEDIUM,
      value: 220000,
      clientIndex: 0,
      lawyer: firmAdmin1.id,
      closingDate: addDays(now, -10),
      result: "حُكم لصالح الموكل بالسداد الكامل",
    },
    {
      title: "استئناف حكم تجاري",
      caseType: CaseType.COMMERCIAL,
      court: "محكمة الاستئناف",
      status: CaseStatus.APPEALED,
      priority: Priority.HIGH,
      value: 450000,
      clientIndex: 2,
      lawyer: lawyer2.id,
    },
    {
      title: "قضية تنفيذ حكم",
      caseType: CaseType.EXECUTION,
      court: "محكمة التنفيذ",
      status: CaseStatus.IN_PROGRESS,
      priority: Priority.LOW,
      value: 60000,
      clientIndex: 1,
      lawyer: lawyer1.id,
    },
    {
      title: "نزاع مع جهة حكومية على ترخيص",
      caseType: CaseType.ADMINISTRATIVE,
      court: "المحكمة الإدارية (ديوان المظالم)",
      status: CaseStatus.ON_HOLD,
      priority: Priority.MEDIUM,
      clientIndex: 4,
      lawyer: firmAdmin1.id,
    },
    {
      title: "قضية مطالبة بتعويض تأميني",
      caseType: CaseType.INSURANCE,
      court: "المحكمة التجارية",
      status: CaseStatus.SETTLED,
      priority: Priority.LOW,
      value: 95000,
      clientIndex: 1,
      lawyer: lawyer2.id,
      closingDate: addDays(now, -30),
      result: "تسوية ودية بنسبة 80%",
    },
    {
      title: "نزاع على علامة تجارية",
      caseType: CaseType.INTELLECTUAL_PROP,
      court: "المحكمة التجارية",
      status: CaseStatus.OPEN,
      priority: Priority.MEDIUM,
      value: 180000,
      clientIndex: 0,
      lawyer: firmAdmin1.id,
    },
    {
      title: "مطالبة بنكية بسداد قرض",
      caseType: CaseType.BANKING,
      court: "المحكمة التجارية",
      status: CaseStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      value: 800000,
      clientIndex: 2,
      lawyer: firmAdmin1.id,
    },
  ];

  let caseCounter = 1;
  const cases: { id: string; title: string }[] = [];
  for (const c of casesData) {
    const caseNumber = `QD-2026-${String(caseCounter).padStart(3, "0")}`;
    caseCounter++;
    const created = await prisma.case.create({
      data: {
        caseNumber,
        title: c.title,
        caseType: c.caseType,
        court: c.court,
        courtCity: "الرياض",
        status: c.status,
        priority: c.priority,
        value: c.value,
        filingDate: addDays(now, -Math.floor(Math.random() * 90) - 5),
        closingDate: c.closingDate,
        result: c.result,
        tenantId: tenant1.id,
        clientId: clients[c.clientIndex].id,
        createdById: firmAdmin1.id,
        lawyers: {
          create: { userId: c.lawyer, isPrimary: true },
        },
      },
    });
    cases.push({ id: created.id, title: created.title });
  }
  console.log(`✓ ${cases.length} قضايا`);

  // ============ UPCOMING SESSIONS ============
  const sessionsData = [
    {
      caseIndex: 0,
      lawyer: firmAdmin1.id,
      daysAhead: 3,
      time: "09:00",
      court: "المحكمة التجارية",
      sessionType: SessionType.HEARING,
    },
    {
      caseIndex: 2,
      lawyer: lawyer1.id,
      daysAhead: 5,
      time: "10:30",
      court: "محكمة الأحوال الشخصية",
      sessionType: SessionType.PLEADING,
    },
    {
      caseIndex: 3,
      lawyer: firmAdmin1.id,
      daysAhead: 7,
      time: "11:00",
      court: "المحكمة العامة",
      sessionType: SessionType.FIRST,
    },
    {
      caseIndex: 5,
      lawyer: lawyer2.id,
      daysAhead: 10,
      time: "13:00",
      court: "محكمة الاستئناف",
      sessionType: SessionType.PLEADING,
    },
    {
      caseIndex: 10,
      lawyer: firmAdmin1.id,
      daysAhead: 14,
      time: "09:30",
      court: "المحكمة التجارية",
      sessionType: SessionType.HEARING,
    },
  ];

  for (const s of sessionsData) {
    await prisma.courtSession.create({
      data: {
        date: addDays(now, s.daysAhead),
        time: s.time,
        court: s.court,
        hall: `قاعة ${Math.floor(Math.random() * 5) + 1}`,
        sessionType: s.sessionType,
        status: SessionStatus.SCHEDULED,
        tenantId: tenant1.id,
        caseId: cases[s.caseIndex].id,
        lawyerId: s.lawyer,
      },
    });
  }
  // One completed session for history
  await prisma.courtSession.create({
    data: {
      date: addDays(now, -7),
      time: "10:00",
      court: "المحكمة التجارية",
      sessionType: SessionType.HEARING,
      status: SessionStatus.COMPLETED,
      result: "تم تأجيل الجلسة لاستكمال المستندات",
      tenantId: tenant1.id,
      caseId: cases[0].id,
      lawyerId: firmAdmin1.id,
    },
  });
  console.log(`✓ ${sessionsData.length + 1} جلسة`);

  // ============ INVOICES ============
  const invoicesData = [
    {
      clientIndex: 0,
      caseIndex: 0,
      amount: 25000,
      status: InvoiceStatus.PAID,
      issueOffset: -45,
      dueOffset: -15,
      paidOffset: -10,
    },
    {
      clientIndex: 0,
      caseIndex: 4,
      amount: 18000,
      status: InvoiceStatus.PAID,
      issueOffset: -30,
      dueOffset: 0,
      paidOffset: -5,
    },
    {
      clientIndex: 2,
      caseIndex: 3,
      amount: 40000,
      status: InvoiceStatus.SENT,
      issueOffset: -10,
      dueOffset: 20,
    },
    {
      clientIndex: 1,
      caseIndex: 1,
      amount: 12000,
      status: InvoiceStatus.OVERDUE,
      issueOffset: -60,
      dueOffset: -15,
    },
    {
      clientIndex: 2,
      caseIndex: 10,
      amount: 35000,
      status: InvoiceStatus.PARTIAL,
      issueOffset: -20,
      dueOffset: 10,
      paidPortion: 15000,
    },
  ];

  let invoiceCounter = 1;
  for (const inv of invoicesData) {
    const invoiceNumber = `INV-2026-${String(invoiceCounter).padStart(3, "0")}`;
    invoiceCounter++;
    const tax = Math.round(inv.amount * VAT);
    const total = inv.amount + tax;
    const paidAmount =
      inv.status === InvoiceStatus.PAID
        ? total
        : inv.status === InvoiceStatus.PARTIAL
          ? (inv.paidPortion ?? 0)
          : 0;
    await prisma.invoice.create({
      data: {
        invoiceNumber,
        description: `أتعاب محاماة عن قضية ${cases[inv.caseIndex].title}`,
        amount: inv.amount,
        tax,
        totalAmount: total,
        paidAmount,
        status: inv.status,
        issueDate: addDays(now, inv.issueOffset),
        dueDate: addDays(now, inv.dueOffset),
        paidDate:
          inv.paidOffset !== undefined ? addDays(now, inv.paidOffset) : null,
        tenantId: tenant1.id,
        clientId: clients[inv.clientIndex].id,
        caseId: cases[inv.caseIndex].id,
        createdById: firmAdmin1.id,
      },
    });
  }
  console.log(`✓ ${invoicesData.length} فواتير`);

  console.log("\n📋 بيانات الدخول التجريبية:");
  console.log("─────────────────────────────────");
  console.log("Super Admin:");
  console.log("  admin@mohamiplus.sa / Admin@12345");
  console.log("");
  console.log("مدير المكتب التجريبي:");
  console.log("  admin@demo-firm.sa / Admin@12345");
  console.log("");
  console.log("محامي:");
  console.log("  lawyer@demo-firm.sa / Lawyer@12345");
  console.log("");
  console.log("مدير مكتب العدالة:");
  console.log("  admin@aladala.sa / Admin@12345");
  console.log("");
  console.log("مدير مكتب الميزان:");
  console.log("  admin@almizan.sa / Admin@12345");
  console.log("─────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ خطأ في الـ Seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
