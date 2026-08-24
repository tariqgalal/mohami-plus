export type AppRole =
  | "FIRM_ADMIN"
  | "SENIOR_LAWYER"
  | "LAWYER"
  | "TRAINEE"
  | "SECRETARY"
  | "ACCOUNTANT";

export type Permission =
  | "CASE_READ" | "CASE_CREATE" | "CASE_UPDATE"
  | "CLIENT_READ" | "CLIENT_CREATE" | "CLIENT_UPDATE"
  | "SESSION_READ" | "SESSION_CREATE" | "SESSION_UPDATE" | "SESSION_RECORD_RESULT"
  | "DOCUMENT_READ" | "DOCUMENT_UPLOAD" | "DOCUMENT_UPDATE"
  | "MEETING_READ" | "MEETING_CREATE" | "MEETING_UPDATE" | "MEETING_RECORD_MINUTES"
  | "INVOICE_READ" | "INVOICE_MANAGE" | "FINANCE_READ"
  | "TEAM_READ" | "TEAM_MANAGE" | "TENANT_MANAGE" | "BILLING_MANAGE" | "REPORTS_READ"
  | "POA_READ" | "POA_CREATE" | "POA_UPDATE" | "POA_DELETE"
  | "SERVICE_REQUEST_READ" | "SERVICE_REQUEST_CREATE" | "SERVICE_REQUEST_UPDATE" | "SERVICE_REQUEST_DELETE"
  | "CORRESPONDENCE_READ" | "CORRESPONDENCE_CREATE" | "CORRESPONDENCE_UPDATE" | "CORRESPONDENCE_DELETE"
  | "TRANSACTION_READ" | "TRANSACTION_CREATE" | "TRANSACTION_UPDATE" | "TRANSACTION_DELETE"
  | "OPPONENT_READ" | "OPPONENT_CREATE" | "OPPONENT_UPDATE" | "OPPONENT_DELETE"
  | "BORROWING_READ" | "BORROWING_CREATE" | "BORROWING_UPDATE" | "BORROWING_DELETE"
  | "CONSULTATION_READ" | "CONSULTATION_CREATE" | "CONSULTATION_UPDATE" | "CONSULTATION_DELETE"
  | "JUDGMENT_READ" | "JUDGMENT_CREATE" | "JUDGMENT_UPDATE" | "JUDGMENT_DELETE"
  | "TASK_READ" | "TASK_CREATE" | "TASK_UPDATE" | "TASK_DELETE" | "TASK_TEMPLATE_MANAGE"
  | "HR_READ" | "HR_MANAGE";

const legalManagers: AppRole[] = ["FIRM_ADMIN", "SENIOR_LAWYER", "LAWYER"];
const legalReaders: AppRole[] = [...legalManagers, "TRAINEE", "SECRETARY", "ACCOUNTANT"];
const officeOperators: AppRole[] = [...legalManagers, "SECRETARY"];

const permissions: Record<Permission, readonly AppRole[]> = {
  CASE_READ: legalReaders, CASE_CREATE: legalManagers, CASE_UPDATE: legalManagers,
  CLIENT_READ: legalReaders, CLIENT_CREATE: officeOperators, CLIENT_UPDATE: officeOperators,
  SESSION_READ: legalReaders, SESSION_CREATE: officeOperators, SESSION_UPDATE: officeOperators,
  SESSION_RECORD_RESULT: legalManagers,
  DOCUMENT_READ: ["FIRM_ADMIN", "SENIOR_LAWYER", "LAWYER", "TRAINEE", "SECRETARY"],
  DOCUMENT_UPLOAD: [...officeOperators, "TRAINEE"], DOCUMENT_UPDATE: legalManagers,
  MEETING_READ: legalReaders, MEETING_CREATE: officeOperators, MEETING_UPDATE: officeOperators,
  MEETING_RECORD_MINUTES: legalManagers,
  INVOICE_READ: ["FIRM_ADMIN", "SENIOR_LAWYER", "LAWYER", "ACCOUNTANT"],
  INVOICE_MANAGE: ["FIRM_ADMIN", "ACCOUNTANT"],
  FINANCE_READ: ["FIRM_ADMIN", "SENIOR_LAWYER", "ACCOUNTANT"],
  TEAM_READ: ["FIRM_ADMIN", "SENIOR_LAWYER", "LAWYER"], TEAM_MANAGE: ["FIRM_ADMIN"],
  TENANT_MANAGE: ["FIRM_ADMIN"], BILLING_MANAGE: ["FIRM_ADMIN"],
  REPORTS_READ: ["FIRM_ADMIN", "ACCOUNTANT"],
  POA_READ: legalReaders, POA_CREATE: officeOperators, POA_UPDATE: officeOperators,
  POA_DELETE: legalManagers,
  SERVICE_REQUEST_READ: legalReaders, SERVICE_REQUEST_CREATE: officeOperators,
  SERVICE_REQUEST_UPDATE: officeOperators, SERVICE_REQUEST_DELETE: legalManagers,
  CORRESPONDENCE_READ: legalReaders, CORRESPONDENCE_CREATE: officeOperators,
  CORRESPONDENCE_UPDATE: officeOperators, CORRESPONDENCE_DELETE: legalManagers,
  TRANSACTION_READ: legalReaders, TRANSACTION_CREATE: officeOperators,
  TRANSACTION_UPDATE: officeOperators, TRANSACTION_DELETE: legalManagers,
  OPPONENT_READ: legalReaders, OPPONENT_CREATE: officeOperators,
  OPPONENT_UPDATE: officeOperators, OPPONENT_DELETE: legalManagers,
  BORROWING_READ: legalReaders, BORROWING_CREATE: officeOperators,
  BORROWING_UPDATE: officeOperators, BORROWING_DELETE: legalManagers,
  CONSULTATION_READ: legalReaders, CONSULTATION_CREATE: legalManagers,
  CONSULTATION_UPDATE: legalManagers, CONSULTATION_DELETE: legalManagers,
  JUDGMENT_READ: legalReaders, JUDGMENT_CREATE: legalManagers,
  JUDGMENT_UPDATE: legalManagers, JUDGMENT_DELETE: legalManagers,
  TASK_READ: legalReaders, TASK_CREATE: officeOperators,
  TASK_UPDATE: officeOperators, TASK_DELETE: legalManagers,
  TASK_TEMPLATE_MANAGE: legalManagers,
  HR_READ: ["FIRM_ADMIN", "SENIOR_LAWYER"], HR_MANAGE: ["FIRM_ADMIN"],
};

export class PermissionDeniedError extends Error {
  readonly status = 403;
  constructor() {
    super("لا تملك الصلاحية اللازمة لتنفيذ هذا الإجراء");
    this.name = "PermissionDeniedError";
  }
}

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return permissions[permission].includes(role);
}

export function assertRolePermission(role: AppRole, permission: Permission): void {
  if (!hasPermission(role, permission)) throw new PermissionDeniedError();
}
