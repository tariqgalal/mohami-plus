// ثوابت التطبيق - محامي بلس

export const APP_NAME = "محامي بلس";
export const APP_DESCRIPTION =
  "نظام ERP متكامل لإدارة مكاتب المحاماة في المملكة العربية السعودية";

export const VAT_RATE = 0.15; // ضريبة القيمة المضافة 15%

export const SAUDI_CITIES = [
  "الرياض",
  "جدة",
  "مكة المكرمة",
  "المدينة المنورة",
  "الدمام",
  "الخبر",
  "الطائف",
  "تبوك",
  "بريدة",
  "خميس مشيط",
  "حائل",
  "نجران",
  "جازان",
  "أبها",
  "الجبيل",
  "ينبع",
  "الأحساء",
  "عرعر",
  "سكاكا",
  "الباحة",
] as const;

export const COURTS = [
  "المحكمة العامة",
  "المحكمة الجزائية",
  "المحكمة التجارية",
  "المحكمة العمالية",
  "محكمة الأحوال الشخصية",
  "محكمة التنفيذ",
  "المحكمة الإدارية (ديوان المظالم)",
  "محكمة الاستئناف",
] as const;

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
} as const;

export const CASE_STATUS = {
  OPEN: "مفتوحة",
  IN_PROGRESS: "جارية",
  ON_HOLD: "معلقة",
  WON: "مكسوبة",
  LOST: "خاسرة",
  SETTLED: "تسوية",
  CLOSED: "مغلقة",
  APPEALED: "مستأنفة",
} as const;

export const PRIORITY_LABELS = {
  HIGH: "عالية",
  MEDIUM: "متوسطة",
  LOW: "منخفضة",
} as const;

export const SESSION_TYPES = {
  HEARING: "استماع",
  PLEADING: "مرافعة",
  PRONOUNCEMENT: "نطق بالحكم",
  RECONCILIATION: "صلح",
  EXPERT: "خبير",
  FIRST: "أولى",
  OTHER: "أخرى",
} as const;

export const SESSION_STATUS = {
  SCHEDULED: "مجدولة",
  COMPLETED: "منتهية",
  POSTPONED: "مؤجلة",
  CANCELLED: "ملغاة",
} as const;

export const CLIENT_TYPES = {
  INDIVIDUAL: "فرد",
  COMPANY: "شركة",
  INSTITUTION: "مؤسسة",
  GOVERNMENT: "جهة حكومية",
} as const;

export const CLIENT_STATUS = {
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  BLOCKED: "محظور",
} as const;

export const USER_ROLES = {
  FIRM_ADMIN: "مدير المكتب",
  SENIOR_LAWYER: "محامي أول",
  LAWYER: "محامي",
  TRAINEE: "محامي متدرب",
  SECRETARY: "سكرتارية",
  ACCOUNTANT: "محاسب",
} as const;

export const MEETING_TYPES = {
  CLIENT: "موكل",
  INTERNAL: "داخلي",
  COURT: "محكمة",
  EXTERNAL: "خارجي",
} as const;

export const MEETING_STATUS = {
  SCHEDULED: "مجدول",
  COMPLETED: "منتهي",
  CANCELLED: "ملغي",
} as const;

export const INVOICE_STATUS = {
  DRAFT: "مسودة",
  SENT: "مرسلة",
  PAID: "مدفوعة",
  PARTIAL: "جزئية",
  OVERDUE: "متأخرة",
  CANCELLED: "ملغاة",
} as const;

export const PAYMENT_METHODS = {
  CASH: "نقدي",
  BANK_TRANSFER: "تحويل بنكي",
  MADA: "مدى",
  CREDIT_CARD: "بطاقة ائتمان",
  CHECK: "شيك",
} as const;

export const DOC_CATEGORIES = {
  POWER_OF_ATTORNEY: "توكيل",
  CONTRACT: "عقد",
  COURT_DOCUMENT: "مستند محكمة",
  EVIDENCE: "دليل",
  CORRESPONDENCE: "مراسلات",
  ID_DOCUMENT: "وثيقة هوية",
  FINANCIAL: "مالي",
  OTHER: "أخرى",
} as const;

export const POA_STATUS = {
  ACTIVE: "سارية",
  EXPIRED: "منتهية",
  PARTIALLY_REVOKED: "مفسوخة جزئياً",
  FULLY_REVOKED: "مفسوخة كلياً",
} as const;

// طلبات خدمات العملاء (CRM)
export const REQUEST_SOURCE = {
  CLIENT: "العميل",
  LAWYER: "من طرف محامي",
  PHONE: "اتصال",
  WHATSAPP: "الواتساب",
} as const;

export const SERVICE_REQUEST_STATUS = {
  NEW: "جديد",
  UNDER_REVIEW: "قيد الدراسة",
  IN_STUDY: "تحت الدراسة",
  INITIAL_APPROVAL: "قبول مبدئي",
  FINAL_APPROVAL: "قبول نهائي",
  REJECTED: "مرفوض",
} as const;

// أنواع الطلبات وأنواعها الفرعية (تُخزّن كنص عربي مباشرة)
export const SERVICE_REQUEST_TYPES = [
  "استشارة",
  "قضايا",
  "عقود",
  "أخرى",
] as const;

export const SERVICE_REQUEST_SUBTYPES: Record<string, readonly string[]> = {
  استشارة: ["لقاء حضوري", "استشارة كتابية", "استشارة شفوية", "لقاء عن بعد"],
  قضايا: ["دراسة قضية"],
  عقود: [],
  أخرى: [],
};

// المراسلات الداخلية
export const CORRESPONDENCE_CATEGORY = {
  DISCUSSIONS: "مناقشات واستفسارات",
  TASKS: "المهام",
  CASES_PROJECTS: "القضايا والمشاريع",
} as const;

export const CORRESPONDENCE_TYPE = {
  CLIENT: "مراسلات العملاء",
  EMPLOYEE: "مراسلات الموظفين",
} as const;

export const CORRESPONDENCE_DIRECTION = {
  INCOMING: "الواردة",
  OUTGOING: "المرسلة",
} as const;

// المعاملات الرسمية (وارد/صادر)
export const TRANSACTION_DIRECTION = {
  INCOMING: "وارد",
  OUTGOING: "صادر",
} as const;

export const TRANSACTION_STATUS = {
  ACTIVE: "نشطة",
  ARCHIVED: "مؤرشفة",
} as const;

// سجل الخصوم — حالة الخصم
export const OPPONENT_STATUS = {
  ACTIVE: "نشط",
  ARCHIVED: "مؤرشف",
} as const;

// الاستعارات — حالة الاستعارة
export const BORROWING_STATUS = {
  PENDING: "قيد الطلب",
  DELIVERED: "تم التسليم",
  RETURNED: "تم الإرجاع",
  REJECTED: "مرفوض",
} as const;

// الاستشارات القانونية — نوع الاستشارة
export const CONSULTATION_TYPE = {
  LEGAL_CONSULTATION: "استشارة قانونية",
  REGULATIONS_REVIEW: "مراجعة أنظمة ولوائح",
  CONTRACT_REVIEW: "مراجعة عقود",
  OTHER: "أخرى",
} as const;

// الاستشارات القانونية — حالة الاستشارة
export const CONSULTATION_STATUS = {
  ACTIVE: "قائمة",
  COMPLETED: "منتهية",
  CANCELLED: "ملغاة",
} as const;

// الأحكام — درجة الترافع
export const JUDGMENT_LEVEL = {
  FIRST_INSTANCE: "ابتدائية",
  APPEAL: "استئناف",
  SUPREME: "عليا",
} as const;

// الأحكام — نتيجة الحكم
export const JUDGMENT_RESULT = {
  IN_FAVOR: "لصالحنا",
  AGAINST: "ضدنا",
  PARTIAL: "جزئي",
} as const;

// الأحكام — حالة الاعتراض
export const OBJECTION_STATUS = {
  PRE_FILING: "ما قبل قيد الدعوى",
  PENDING: "قيد المهلة",
  NO_OBJECTION: "بدون اعتراض",
  OBJECTED: "تم الاعتراض",
} as const;

// الموارد البشرية — أنواع الإجازات
export const LEAVE_TYPE = {
  ANNUAL: "سنوية",
  SICK: "مرضية",
  EMERGENCY: "اضطرارية",
  UNPAID: "بدون راتب",
  OTHER: "أخرى",
} as const;

export const LEAVE_STATUS = {
  PENDING: "قيد الانتظار",
  APPROVED: "موافق عليها",
  REJECTED: "مرفوضة",
} as const;

// المهام — الأولوية
export const TASK_PRIORITY = {
  URGENT: "عاجل",
  NORMAL: "عادي",
  IMPORTANT: "مهم",
  URGENT_IMPORTANT: "عاجل مهم",
} as const;

// المهام — الحالة
export const TASK_STATUS = {
  PENDING: "قيد التنفيذ",
  AWAITING_APPROVAL: "بانتظار الاعتماد",
  COMPLETED: "منجزة",
  CANCELLED: "ملغاة",
} as const;

// المهام — نوع المشروع المرتبط
export const TASK_PROJECT_TYPE = {
  NONE: "بدون",
  CASE: "قضية",
  EXECUTION: "تنفيذ",
  CONSULTATION: "استشارة",
  OTHER_PROJECT: "مشروع آخر",
} as const;

// المهام — الردود الجاهزة الافتراضية
export const DEFAULT_TASK_TEMPLATES = [
  "تم تنفيذ المهمة بنجاح",
  "تم اضافة المرفقات المطلوبة",
  "تم حضور الاجتماع مع المعنيين",
  "تم ارسال المذكرة للجهة المعنية",
] as const;

export const TENANT_STATUS = {
  TRIAL: "فترة تجريبية",
  ACTIVE: "نشط",
  SUSPENDED: "معلق",
  EXPIRED: "منتهي",
  CANCELLED: "ملغي",
} as const;

export const GB = 1024 * 1024 * 1024;

export const PLANS = {
  BASIC: {
    name: "أساسي",
    price: 199,
    maxUsers: 3,
    maxCases: 25,
    maxStorage: 5 * GB,
    maxStorageLabel: "5 GB",
    features: [
      "حتى 3 مستخدمين",
      "حتى 25 قضية نشطة",
      "إدارة العملاء والجلسات",
      "تخزين 5 GB للمستندات",
      "دعم فني عبر البريد الإلكتروني",
    ],
  },
  PROFESSIONAL: {
    name: "احترافي",
    price: 499,
    maxUsers: 10,
    maxCases: 100,
    maxStorage: 25 * GB,
    maxStorageLabel: "25 GB",
    features: [
      "حتى 10 مستخدمين",
      "حتى 100 قضية نشطة",
      "كل ميزات الأساسي",
      "تخزين 25 GB للمستندات",
      "تقارير متقدمة",
      "دعم فني عبر الهاتف",
    ],
  },
  ENTERPRISE: {
    name: "مؤسسي",
    price: 999,
    maxUsers: 999,
    maxCases: 999,
    maxStorage: 100 * GB,
    maxStorageLabel: "100 GB",
    features: [
      "مستخدمون غير محدودين",
      "قضايا غير محدودة",
      "كل ميزات الاحترافي",
      "تخزين 100 GB للمستندات",
      "API مخصص",
      "مدير حساب مخصص",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const TRIAL_DAYS = 14;

// مفاتيح إعدادات المنصة (تُحفظ في PlatformSetting)
export const PLATFORM_SETTING_KEYS = {
  TRIAL_DAYS: "trial_days",
  VAT_RATE: "vat_rate",
  WELCOME_MESSAGE: "welcome_message",
  PLAN_BASIC_PRICE: "plan_basic_price",
  PLAN_PROFESSIONAL_PRICE: "plan_professional_price",
  PLAN_ENTERPRISE_PRICE: "plan_enterprise_price",
  PLAN_BASIC_STORAGE_GB: "plan_basic_storage_gb",
  PLAN_PROFESSIONAL_STORAGE_GB: "plan_professional_storage_gb",
  PLAN_ENTERPRISE_STORAGE_GB: "plan_enterprise_storage_gb",
} as const;
