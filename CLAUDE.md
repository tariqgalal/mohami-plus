# CLAUDE.md — محامي بلس (Mohami Plus) SaaS ERP System

## 🎯 نظرة عامة على المشروع

**محامي بلس** هو نظام ERP متكامل يعمل كمنصة SaaS موجهة لمكاتب المحاماة في المملكة العربية السعودية. كل مكتب محاماة يشترك في المنصة ويحصل على نظام متكامل معزول تماماً عن المكاتب الأخرى.

### الأطراف الرئيسية:
1. **Super Admin (مدير المنصة)** — أنت، تدير المكاتب المشتركة والاشتراكات والإيرادات
2. **Firm Admin (مدير المكتب)** — مالك مكتب المحاماة، يدير كل شيء داخل مكتبه
3. **Lawyer (محامي)** — عضو في فريق المكتب، يدير قضاياه وجلساته
4. **Staff (موظف)** — سكرتارية أو مساعد، صلاحيات محدودة

---

## 🛠️ Tech Stack

```
Frontend:       Next.js 14 (App Router) + TypeScript
Styling:        Tailwind CSS + shadcn/ui
State:          Zustand (client state) + React Query/TanStack Query (server state)
Backend:        Next.js API Routes (Route Handlers)
Database:       PostgreSQL (Neon or Supabase)
ORM:            Prisma
Auth:           NextAuth.js v5 (Auth.js)
File Storage:   AWS S3 or Cloudflare R2
Email:          Resend
Payments:       Moyasar (Saudi payment gateway — Mada, Visa, Apple Pay)
Deployment:     Vercel
Monitoring:     Sentry
Analytics:      PostHog (optional)
```

---

## 📁 بنية المشروع (Project Structure)

```
mohami-plus/
├── CLAUDE.md                          # هذا الملف
├── .env.example                       # متغيرات البيئة
├── .env.local                         # متغيرات البيئة المحلية (لا يُرفع)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── prisma/
│   ├── schema.prisma                  # Database schema
│   ├── seed.ts                        # Seed data
│   └── migrations/
├── public/
│   ├── logo.svg
│   └── images/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout (Arabic, RTL)
│   │   ├── page.tsx                   # Landing page
│   │   ├── globals.css
│   │   │
│   │   ├── (marketing)/               # Marketing pages group
│   │   │   ├── pricing/page.tsx
│   │   │   ├── features/page.tsx
│   │   │   └── contact/page.tsx
│   │   │
│   │   ├── (auth)/                    # Auth pages group
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── dashboard/                 # Firm ERP Dashboard
│   │   │   ├── layout.tsx             # Sidebar + Header layout
│   │   │   ├── page.tsx               # Overview dashboard
│   │   │   ├── cases/
│   │   │   │   ├── page.tsx           # Cases list
│   │   │   │   ├── new/page.tsx       # Add new case
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # Case detail
│   │   │   │       └── edit/page.tsx  # Edit case
│   │   │   ├── sessions/
│   │   │   │   ├── page.tsx           # Sessions calendar/list
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── team/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── meetings/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── finance/
│   │   │   │   ├── page.tsx           # Finance overview
│   │   │   │   ├── invoices/page.tsx
│   │   │   │   └── invoices/new/page.tsx
│   │   │   ├── documents/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   ├── admin/                     # Super Admin Dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Admin overview
│   │   │   ├── tenants/
│   │   │   │   ├── page.tsx           # All tenants list
│   │   │   │   └── [id]/page.tsx      # Tenant detail
│   │   │   ├── subscriptions/
│   │   │   │   └── page.tsx
│   │   │   ├── revenue/
│   │   │   │   └── page.tsx
│   │   │   ├── support/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                       # API Routes
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── cases/
│   │       │   ├── route.ts           # GET (list), POST (create)
│   │       │   └── [id]/route.ts      # GET, PUT, DELETE
│   │       ├── sessions/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── clients/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── team/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── meetings/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── invoices/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── documents/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── admin/
│   │       │   ├── tenants/route.ts
│   │       │   ├── tenants/[id]/route.ts
│   │       │   ├── subscriptions/route.ts
│   │       │   ├── revenue/route.ts
│   │       │   └── stats/route.ts
│   │       ├── upload/route.ts        # File upload
│   │       └── webhooks/
│   │           └── payment/route.ts   # Moyasar webhook
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── admin-sidebar.tsx
│   │   │   └── mobile-nav.tsx
│   │   ├── dashboard/
│   │   │   ├── stat-card.tsx
│   │   │   ├── recent-cases.tsx
│   │   │   ├── upcoming-sessions.tsx
│   │   │   └── team-performance.tsx
│   │   ├── cases/
│   │   │   ├── case-card.tsx
│   │   │   ├── case-form.tsx
│   │   │   ├── case-filters.tsx
│   │   │   └── case-timeline.tsx
│   │   ├── sessions/
│   │   │   ├── session-card.tsx
│   │   │   ├── session-calendar.tsx
│   │   │   └── session-form.tsx
│   │   ├── clients/
│   │   │   ├── client-card.tsx
│   │   │   └── client-form.tsx
│   │   ├── finance/
│   │   │   ├── invoice-table.tsx
│   │   │   └── invoice-form.tsx
│   │   └── shared/
│   │       ├── data-table.tsx
│   │       ├── empty-state.tsx
│   │       ├── loading-skeleton.tsx
│   │       ├── search-input.tsx
│   │       ├── file-upload.tsx
│   │       ├── confirm-dialog.tsx
│   │       └── pagination.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts                  # Prisma client singleton
│   │   ├── auth.ts                    # NextAuth config
│   │   ├── auth-options.ts            # Auth providers & callbacks
│   │   ├── utils.ts                   # Utility functions
│   │   ├── validations/               # Zod schemas
│   │   │   ├── case.ts
│   │   │   ├── client.ts
│   │   │   ├── session.ts
│   │   │   ├── invoice.ts
│   │   │   ├── team.ts
│   │   │   └── auth.ts
│   │   ├── constants.ts               # App constants (cities, case types, etc.)
│   │   └── format.ts                  # Formatters (currency, date, etc.)
│   │
│   ├── hooks/
│   │   ├── use-cases.ts               # Cases CRUD hooks
│   │   ├── use-clients.ts
│   │   ├── use-sessions.ts
│   │   ├── use-team.ts
│   │   ├── use-invoices.ts
│   │   ├── use-meetings.ts
│   │   ├── use-tenants.ts             # Admin hooks
│   │   └── use-current-user.ts
│   │
│   ├── services/
│   │   ├── case-service.ts
│   │   ├── client-service.ts
│   │   ├── session-service.ts
│   │   ├── team-service.ts
│   │   ├── invoice-service.ts
│   │   ├── meeting-service.ts
│   │   ├── document-service.ts
│   │   ├── notification-service.ts
│   │   ├── subscription-service.ts
│   │   └── email-service.ts
│   │
│   ├── store/
│   │   ├── sidebar-store.ts
│   │   └── notification-store.ts
│   │
│   ├── types/
│   │   ├── index.ts                   # Main type definitions
│   │   ├── case.ts
│   │   ├── client.ts
│   │   ├── session.ts
│   │   ├── invoice.ts
│   │   └── tenant.ts
│   │
│   └── middleware.ts                  # Auth + tenant middleware
```

---

## 🗄️ Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ MULTI-TENANCY ============

model Tenant {
  id              String         @id @default(cuid())
  name            String         // اسم المكتب
  slug            String         @unique // URL-friendly identifier
  licenseNumber   String?        // رقم الترخيص
  email           String
  phone           String?
  city            String
  address         String?
  logo            String?        // URL
  plan            Plan           @default(BASIC)
  status          TenantStatus   @default(TRIAL)
  trialEndsAt     DateTime?
  subscriptionStart DateTime?
  subscriptionEnd   DateTime?
  maxUsers        Int            @default(3)
  maxCases        Int            @default(25)
  monthlyPrice    Decimal        @default(0)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  users           User[]
  cases           Case[]
  clients         Client[]
  sessions        CourtSession[]
  meetings        Meeting[]
  invoices        Invoice[]
  documents       Document[]
  activities      Activity[]
  payments        Payment[]
}

enum Plan {
  BASIC        // أساسي - 199 ر.س
  PROFESSIONAL // احترافي - 499 ر.س
  ENTERPRISE   // مؤسسي - 999 ر.س
}

enum TenantStatus {
  TRIAL      // فترة تجريبية
  ACTIVE     // نشط
  SUSPENDED  // معلق
  EXPIRED    // منتهي
  CANCELLED  // ملغي
}

// ============ USERS & AUTH ============

model User {
  id              String       @id @default(cuid())
  email           String       @unique
  password        String       // hashed
  name            String
  phone           String?
  avatar          String?
  role            UserRole     @default(LAWYER)
  specialization  String?
  isActive        Boolean      @default(true)
  lastLoginAt     DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  tenantId        String?
  tenant          Tenant?      @relation(fields: [tenantId], references: [id])

  // Relations
  assignedCases   CaseLawyer[]
  sessions        CourtSession[] @relation("SessionLawyer")
  meetings        MeetingAttendee[]
  activities      Activity[]
  createdCases    Case[]       @relation("CaseCreator")
  createdInvoices Invoice[]    @relation("InvoiceCreator")

  isSuperAdmin    Boolean      @default(false)

  @@index([tenantId])
  @@index([email])
}

enum UserRole {
  FIRM_ADMIN   // مدير المكتب
  SENIOR_LAWYER // محامي أول
  LAWYER       // محامي
  TRAINEE      // محامي متدرب
  SECRETARY    // سكرتارية
  ACCOUNTANT   // محاسب
}

// ============ CASES (القضايا) ============

model Case {
  id              String       @id @default(cuid())
  caseNumber      String       // QD-2026-001
  title           String
  description     String?      @db.Text
  caseType        CaseType
  court           String       // اسم المحكمة
  courtCity       String?
  status          CaseStatus   @default(OPEN)
  priority        Priority     @default(MEDIUM)
  value           Decimal?     // قيمة القضية
  filingDate      DateTime?    // تاريخ رفع الدعوى
  closingDate     DateTime?
  result          String?      // نتيجة القضية
  notes           String?      @db.Text
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  tenantId        String
  tenant          Tenant       @relation(fields: [tenantId], references: [id])

  clientId        String
  client          Client       @relation(fields: [clientId], references: [id])

  createdById     String
  createdBy       User         @relation("CaseCreator", fields: [createdById], references: [id])

  // Relations
  lawyers         CaseLawyer[]
  sessions        CourtSession[]
  documents       Document[]
  invoices        Invoice[]
  activities      Activity[]
  opponents       Opponent[]

  @@unique([tenantId, caseNumber])
  @@index([tenantId])
  @@index([clientId])
  @@index([status])
}

model CaseLawyer {
  id        String   @id @default(cuid())
  caseId    String
  case      Case     @relation(fields: [caseId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  isPrimary Boolean  @default(false) // المحامي الرئيسي
  assignedAt DateTime @default(now())

  @@unique([caseId, userId])
}

model Opponent {
  id        String  @id @default(cuid())
  name      String
  type      String? // فرد، شركة، جهة حكومية
  lawyer    String? // محامي الخصم
  phone     String?
  notes     String?
  caseId    String
  case      Case    @relation(fields: [caseId], references: [id], onDelete: Cascade)
}

enum CaseType {
  COMMERCIAL       // تجاري
  LABOR            // عمالي
  PERSONAL_STATUS  // أحوال شخصية
  CRIMINAL         // جنائي
  ADMINISTRATIVE   // إداري
  REAL_ESTATE      // عقاري
  INTELLECTUAL_PROP // ملكية فكرية
  INSURANCE        // تأمين
  BANKING          // مصرفي
  EXECUTION        // تنفيذ
  OTHER            // أخرى
}

enum CaseStatus {
  OPEN         // مفتوحة
  IN_PROGRESS  // جارية
  ON_HOLD      // معلقة
  WON          // مكسوبة
  LOST         // خاسرة
  SETTLED      // تسوية
  CLOSED       // مغلقة
  APPEALED     // مستأنفة
}

enum Priority {
  HIGH    // عالية
  MEDIUM  // متوسطة
  LOW     // منخفضة
}

// ============ COURT SESSIONS (الجلسات) ============

model CourtSession {
  id          String        @id @default(cuid())
  date        DateTime
  time        String        // "09:00"
  court       String
  hall        String?       // القاعة
  judge       String?       // القاضي
  sessionType SessionType   @default(HEARING)
  status      SessionStatus @default(SCHEDULED)
  result      String?       // نتيجة الجلسة
  nextAction  String?       // الإجراء التالي
  notes       String?       @db.Text
  reminder    Boolean       @default(true)
  reminderSent Boolean      @default(false)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  tenantId    String
  tenant      Tenant        @relation(fields: [tenantId], references: [id])

  caseId      String
  case        Case          @relation(fields: [caseId], references: [id])

  lawyerId    String
  lawyer      User          @relation("SessionLawyer", fields: [lawyerId], references: [id])

  @@index([tenantId])
  @@index([caseId])
  @@index([date])
}

enum SessionType {
  HEARING        // استماع
  PLEADING       // مرافعة
  PRONOUNCEMENT  // نطق بالحكم
  RECONCILIATION // صلح
  EXPERT         // خبير
  FIRST          // أولى
  OTHER          // أخرى
}

enum SessionStatus {
  SCHEDULED   // مجدولة
  COMPLETED   // منتهية
  POSTPONED   // مؤجلة
  CANCELLED   // ملغاة
}

// ============ CLIENTS (العملاء) ============

model Client {
  id            String       @id @default(cuid())
  name          String
  clientType    ClientType
  contactPerson String?      // جهة التواصل
  nationalId    String?      // رقم الهوية / السجل التجاري
  email         String?
  phone         String
  secondaryPhone String?
  city          String
  address       String?
  notes         String?      @db.Text
  status        ClientStatus @default(ACTIVE)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  tenantId      String
  tenant        Tenant       @relation(fields: [tenantId], references: [id])

  cases         Case[]
  invoices      Invoice[]

  @@index([tenantId])
  @@index([phone])
}

enum ClientType {
  INDIVIDUAL   // فرد
  COMPANY      // شركة
  INSTITUTION  // مؤسسة
  GOVERNMENT   // جهة حكومية
}

enum ClientStatus {
  ACTIVE    // نشط
  INACTIVE  // غير نشط
  BLOCKED   // محظور
}

// ============ MEETINGS (الاجتماعات) ============

model Meeting {
  id          String        @id @default(cuid())
  title       String
  date        DateTime
  time        String
  duration    Int           // بالدقائق
  meetingType MeetingType
  location    String?
  isVirtual   Boolean       @default(false)
  meetingLink String?       // رابط الاجتماع الافتراضي
  notes       String?       @db.Text
  status      MeetingStatus @default(SCHEDULED)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  tenantId    String
  tenant      Tenant        @relation(fields: [tenantId], references: [id])

  attendees   MeetingAttendee[]

  @@index([tenantId])
  @@index([date])
}

model MeetingAttendee {
  id          String   @id @default(cuid())
  meetingId   String
  meeting     Meeting  @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  externalName String? // حضور خارجيين
  externalEmail String?

  @@unique([meetingId, userId])
}

enum MeetingType {
  CLIENT     // موكل
  INTERNAL   // داخلي
  COURT      // محكمة
  EXTERNAL   // خارجي
}

enum MeetingStatus {
  SCHEDULED  // مجدول
  COMPLETED  // منتهي
  CANCELLED  // ملغي
}

// ============ FINANCE (المالية) ============

model Invoice {
  id            String        @id @default(cuid())
  invoiceNumber String        // INV-2026-001
  description   String
  amount        Decimal
  tax           Decimal       @default(0) // ضريبة القيمة المضافة 15%
  totalAmount   Decimal
  paidAmount    Decimal       @default(0)
  status        InvoiceStatus @default(DRAFT)
  issueDate     DateTime      @default(now())
  dueDate       DateTime
  paidDate      DateTime?
  notes         String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  tenantId      String
  tenant        Tenant        @relation(fields: [tenantId], references: [id])

  clientId      String
  client        Client        @relation(fields: [clientId], references: [id])

  caseId        String?
  case          Case?         @relation(fields: [caseId], references: [id])

  createdById   String
  createdBy     User          @relation("InvoiceCreator", fields: [createdById], references: [id])

  payments      PaymentRecord[]

  @@unique([tenantId, invoiceNumber])
  @@index([tenantId])
  @@index([clientId])
  @@index([status])
}

model PaymentRecord {
  id          String        @id @default(cuid())
  amount      Decimal
  method      PaymentMethod
  reference   String?       // رقم مرجعي
  notes       String?
  paidAt      DateTime      @default(now())
  invoiceId   String
  invoice     Invoice       @relation(fields: [invoiceId], references: [id])
}

enum InvoiceStatus {
  DRAFT      // مسودة
  SENT       // مرسلة
  PAID       // مدفوعة
  PARTIAL    // جزئية
  OVERDUE    // متأخرة
  CANCELLED  // ملغاة
}

enum PaymentMethod {
  CASH         // نقدي
  BANK_TRANSFER // تحويل بنكي
  MADA         // مدى
  CREDIT_CARD  // بطاقة ائتمان
  CHECK        // شيك
}

// ============ DOCUMENTS (المستندات) ============

model Document {
  id          String       @id @default(cuid())
  name        String
  description String?
  fileUrl     String
  fileType    String       // pdf, docx, jpg, etc.
  fileSize    Int          // bytes
  category    DocCategory  @default(OTHER)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  tenantId    String
  tenant      Tenant       @relation(fields: [tenantId], references: [id])

  caseId      String?
  case        Case?        @relation(fields: [caseId], references: [id])

  @@index([tenantId])
  @@index([caseId])
}

enum DocCategory {
  POWER_OF_ATTORNEY  // توكيل
  CONTRACT           // عقد
  COURT_DOCUMENT     // مستند محكمة
  EVIDENCE           // دليل
  CORRESPONDENCE     // مراسلات
  ID_DOCUMENT        // وثيقة هوية
  FINANCIAL          // مالي
  OTHER              // أخرى
}

// ============ ACTIVITY LOG ============

model Activity {
  id          String   @id @default(cuid())
  action      String   // created, updated, deleted, viewed
  entity      String   // case, client, session, etc.
  entityId    String
  details     String?  @db.Text // JSON details
  createdAt   DateTime @default(now())

  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  caseId      String?
  case        Case?    @relation(fields: [caseId], references: [id])

  @@index([tenantId])
  @@index([entityId])
  @@index([createdAt])
}

// ============ PLATFORM PAYMENTS (مدفوعات المنصة) ============

model Payment {
  id            String        @id @default(cuid())
  amount        Decimal
  currency      String        @default("SAR")
  status        String        // paid, failed, pending
  provider      String        @default("moyasar") // بوابة الدفع
  providerRef   String?       // مرجع البوابة
  plan          Plan
  period        String        // monthly, yearly
  createdAt     DateTime      @default(now())

  tenantId      String
  tenant        Tenant        @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
}

// ============ NOTIFICATIONS ============

model Notification {
  id          String   @id @default(cuid())
  title       String
  body        String
  type        String   // session_reminder, payment_due, case_update
  isRead      Boolean  @default(false)
  data        String?  @db.Text // JSON
  createdAt   DateTime @default(now())

  userId      String
  // No direct relation to avoid circular — query by userId

  @@index([userId])
  @@index([isRead])
}
```

---

## 🔐 Multi-Tenancy Strategy

### كيف يعمل العزل بين المكاتب:

1. **كل جدول فيه `tenantId`** — كل query لازم يتفلتر بـ tenantId
2. **Middleware** — يتحقق من الـ tenant في كل request
3. **Row-Level Security** — كل بيانات المكتب معزولة

### التطبيق في الكود:

```typescript
// src/lib/tenant.ts
export async function getTenantId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session.user.tenantId;
}

// استخدام في كل API route:
export async function GET() {
  const tenantId = await getTenantId();
  const cases = await prisma.case.findMany({
    where: { tenantId }, // ← دايماً فلتر بالـ tenant
  });
  return NextResponse.json(cases);
}
```

### Middleware للحماية:

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // حماية صفحات الداشبورد
  if (pathname.startsWith('/dashboard')) {
    // تحقق من الجلسة والـ tenant
  }

  // حماية صفحات الأدمن
  if (pathname.startsWith('/admin')) {
    // تحقق من صلاحية Super Admin
  }
}
```

---

## 📋 خطة التنفيذ (Development Plan)

### المرحلة 1: الأساسيات (الأسبوع 1-2)
```
☐ إعداد المشروع (Next.js + TypeScript + Tailwind + shadcn/ui)
☐ إعداد Prisma + PostgreSQL + كتابة الـ Schema
☐ تشغيل أول migration
☐ إعداد NextAuth.js (تسجيل + دخول + تسجيل خروج)
☐ بناء الـ Middleware (حماية الصفحات + tenant isolation)
☐ بناء Layout الرئيسي (Sidebar + Header + RTL)
☐ إعداد shadcn/ui components الأساسية
☐ Seed data للتطوير
```

### المرحلة 2: الصفحة التسويقية (الأسبوع 2)
```
☐ Landing page (Hero + Features + Pricing + Footer)
☐ صفحة التسعير التفصيلية
☐ صفحة التواصل
☐ صفحة تسجيل مكتب جديد مع اختيار الباقة
☐ Responsive design للموبايل
```

### المرحلة 3: إدارة القضايا — الموديول الأهم (الأسبوع 3-4)
```
☐ قائمة القضايا مع بحث وفلاتر وترتيب
☐ إضافة قضية جديدة (form validation مع Zod)
☐ صفحة تفاصيل القضية الشاملة
☐ تعديل القضية
☐ حذف القضية (soft delete)
☐ ربط القضية بالعميل والمحامين
☐ إضافة الخصوم
☐ Timeline للقضية (سجل الأحداث)
☐ تغيير حالة القضية
☐ API routes كاملة مع validation
```

### المرحلة 4: الجلسات والعملاء (الأسبوع 5-6)
```
☐ قائمة الجلسات + تقويم
☐ إضافة جلسة مرتبطة بقضية
☐ تسجيل نتيجة الجلسة
☐ تذكيرات الجلسات (email)
☐ إدارة العملاء — CRUD كامل
☐ صفحة تفاصيل العميل مع قضاياه وفواتيره
☐ بحث وفلاتر العملاء
```

### المرحلة 5: الفريق والاجتماعات (الأسبوع 7)
```
☐ إدارة أعضاء الفريق
☐ دعوة أعضاء جدد بالبريد الإلكتروني
☐ صلاحيات حسب الدور (RBAC)
☐ جدول الاجتماعات
☐ إضافة اجتماع مع حضور
☐ ربط الاجتماعات بالقضايا (اختياري)
```

### المرحلة 6: المالية والمستندات (الأسبوع 8-9)
```
☐ إنشاء فواتير مع ضريبة القيمة المضافة 15%
☐ تسجيل مدفوعات
☐ تقرير مالي شهري
☐ رفع مستندات (S3/R2)
☐ ربط المستندات بالقضايا
☐ تصنيف المستندات
☐ عرض/تحميل المستندات
```

### المرحلة 7: لوحة التحكم والتقارير (الأسبوع 10)
```
☐ Dashboard الرئيسي — إحصائيات + مخططات
☐ تقارير القضايا (حسب النوع، الحالة، المحامي)
☐ تقارير مالية (إيرادات، مستحقات، مدفوعات)
☐ تقارير أداء المحامين
☐ تصدير التقارير PDF
```

### المرحلة 8: لوحة Super Admin (الأسبوع 11-12)
```
☐ Dashboard إحصائيات المنصة
☐ إدارة المكاتب (عرض، تعليق، تفعيل)
☐ تفاصيل كل مكتب (مستخدمين، قضايا، استخدام)
☐ إدارة الاشتراكات (تجديد، تمديد مجاني، إلغاء)
☐ تقارير الإيرادات
☐ تذاكر الدعم الفني
☐ إعدادات المنصة (مدة التجربة، إلخ)
```

### المرحلة 9: بوابة الدفع والاشتراكات (الأسبوع 13)
```
☐ ربط Moyasar للدفع (مدى + Visa + Apple Pay)
☐ صفحة الدفع عند التسجيل
☐ التجديد التلقائي
☐ Webhooks لتأكيد الدفع
☐ إشعارات قبل انتهاء الاشتراك
☐ فواتير اشتراك تلقائية
```

### المرحلة 10: التحسينات والإطلاق (الأسبوع 14-16)
```
☐ الإشعارات (in-app + email)
☐ بحث شامل في كل المنصة
☐ Audit log لكل العمليات
☐ تحسين الأداء (caching, pagination)
☐ اختبارات (unit + integration)
☐ SEO للصفحة التسويقية
☐ Error handling شامل
☐ Loading states + skeletons
☐ Responsive على كل الشاشات
☐ نشر على Vercel + ربط الدومين
☐ SSL + security headers
☐ Sentry للـ error monitoring
```

---

## 🔑 متغيرات البيئة (.env.example)

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/mohami_plus"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# File Storage (Cloudflare R2 or AWS S3)
S3_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_BUCKET="mohami-plus-documents"

# Email (Resend)
RESEND_API_KEY="re_xxxxx"
EMAIL_FROM="noreply@mohamiplus.sa"

# Payment (Moyasar)
MOYASAR_API_KEY="sk_test_xxxxx"
MOYASAR_PUBLISHABLE_KEY="pk_test_xxxxx"
MOYASAR_WEBHOOK_SECRET="whsec_xxxxx"

# App
NEXT_PUBLIC_APP_URL="https://mohamiplus.sa"
NEXT_PUBLIC_APP_NAME="محامي بلس"
```

---

## 📐 قواعد التطوير (Development Rules)

### عام:
- **كل الواجهة بالعربية** — لا يوجد أي نص إنجليزي يظهر للمستخدم
- **RTL دائماً** — `dir="rtl"` على الـ html element
- **TypeScript strict** — لا `any` إلا في حالات نادرة جداً
- **Zod validation** — كل form وكل API route لازم يتحقق من البيانات

### API Routes:
- كل route يبدأ بـ `getTenantId()` — لا استثناءات
- كل route يرجع `NextResponse.json()` مع status codes مناسبة
- Error handling موحد — `try/catch` مع رسائل عربية
- Pagination لكل list endpoint — `?page=1&limit=20`

### Components:
- كل component في ملف منفصل
- Props typed بـ TypeScript interface
- Loading states لكل data fetch
- Empty states لكل قائمة فاضية
- Confirm dialog قبل أي حذف

### Security:
- **لا تخزن كلمات المرور بشكل plain** — استخدم bcrypt
- **CSRF protection** — NextAuth يوفرها
- **Rate limiting** على API routes الحساسة
- **Input sanitization** — Zod يتكفل بهذا
- **File upload validation** — نوع وحجم الملف

---

## 🌍 الثوابت (Constants)

```typescript
// src/lib/constants.ts

export const SAUDI_CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام",
  "الخبر", "الطائف", "تبوك", "بريدة", "خميس مشيط",
  "حائل", "نجران", "جازان", "أبها", "الجبيل",
  "ينبع", "الأحساء", "عرعر", "سكاكا", "الباحة"
];

export const CASE_TYPES = {
  COMMERCIAL: "تجاري",
  LABOR: "عمالي",
  PERSONAL_STATUS: "أحوال شخصية",
  CRIMINAL: "جنائي",
  ADMINISTRATIVE: "إداري",
  REAL_ESTATE: "عقاري",
  INTELLECTUAL_PROP: "ملكية فكرية",
  INSURANCE: "تأمين",
  BANKING: "مصرفي",
  EXECUTION: "تنفيذ",
  OTHER: "أخرى",
};

export const COURTS = [
  "المحكمة العامة", "المحكمة الجزائية", "المحكمة التجارية",
  "المحكمة العمالية", "محكمة الأحوال الشخصية", "محكمة التنفيذ",
  "المحكمة الإدارية (ديوان المظالم)", "محكمة الاستئناف",
];

export const PLANS = {
  BASIC: { name: "أساسي", price: 199, maxUsers: 3, maxCases: 25 },
  PROFESSIONAL: { name: "احترافي", price: 499, maxUsers: 10, maxCases: 100 },
  ENTERPRISE: { name: "مؤسسي", price: 999, maxUsers: 999, maxCases: 999 },
};

export const VAT_RATE = 0.15; // ضريبة القيمة المضافة 15%
```

---

## 🚀 أوامر البدء

```bash
# 1. إنشاء المشروع
npx create-next-app@latest mohami-plus --typescript --tailwind --eslint --app --src-dir

# 2. تثبيت الحزم
cd mohami-plus
npm install prisma @prisma/client next-auth @auth/prisma-adapter
npm install zod react-hook-form @hookform/resolvers
npm install @tanstack/react-query zustand
npm install bcryptjs jsonwebtoken
npm install lucide-react recharts
npm install @aws-sdk/client-s3 resend
npm install date-fns

# 3. تثبيت shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input dialog select table badge card dropdown-menu toast tabs avatar calendar popover command sheet

# 4. إعداد Prisma
npx prisma init
# انسخ الـ schema من فوق إلى prisma/schema.prisma
npx prisma migrate dev --name init
npx prisma generate

# 5. تشغيل المشروع
npm run dev
```

---

## 📝 ملاحظات مهمة لـ Claude Code

1. **ابدأ بالمرحلة 1** — لا تقفز للمراحل المتقدمة قبل ما الأساسيات تشتغل
2. **اختبر كل موديول** قبل ما تنتقل للي بعده
3. **التصميم موجود كـ reference** في ملف `mohami-plus-erp.jsx` — استخدمه كمرجع للألوان والتخطيط
4. **كل شيء بالعربية** — أسماء المتغيرات بالإنجليزي، لكن كل نص يظهر للمستخدم بالعربي
5. **الأمان أولاً** — لا تنسى tenantId في كل query
6. **اسأل قبل ما تفترض** — لو فيه قرار تصميمي مش واضح، اسأل

---

## 🎨 مرجع التصميم

الألوان والتصميم العام موجود في ملف الـ Demo:
- **Primary**: Blue (#2563eb) → للأزرار والعناصر الرئيسية
- **Sidebar**: Dark (#0f172a) → شريط جانبي داكن
- **Background**: Light gray (#f8fafc) → خلفية الصفحات
- **Admin Accent**: Amber (#d97706) → لوحة تحكم المدير
- **Typography**: نظام خط عربي واضح — Tajawal أو IBM Plex Arabic

---

*آخر تحديث: يونيو 2026*
