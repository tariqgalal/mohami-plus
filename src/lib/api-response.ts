import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { UnauthorizedError, ForbiddenError } from "@/lib/tenant";
import { PlanLimitError } from "@/lib/plan-limits";
import { AppError } from "@/lib/errors";

function safeStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (typeof val === "bigint") {
      // BigInts are safe to coerce to Number for values < 2^53; storage limits etc fit fine.
      return Number(val);
    }
    return val;
  });
}

export function apiSuccess<T>(data: T, status = 200) {
  return new NextResponse(safeStringify({ success: true, data }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, details },
    { status },
  );
}

export function handleApiError(error: unknown) {
  console.error("[API Error]", error);

  if (error instanceof UnauthorizedError) {
    return apiError(error.message, 401);
  }

  if (error instanceof ForbiddenError) {
    return apiError(error.message, 403);
  }

  if (error instanceof PlanLimitError) {
    return apiError(error.message, error.status);
  }

  // أخطاء تطبيقية برسالة عربية جاهزة — نمرّرها للمستخدم كما هي بدل ما
  // تتحوّل لـ "حدث خطأ غير متوقع".
  if (error instanceof AppError) {
    return apiError(error.message, error.status, error.details);
  }

  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".") || "_root";
      (fieldErrors[path] ??= []).push(issue.message);
    }
    return apiError("بيانات غير صحيحة", 422, fieldErrors);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return apiError("هذا السجل موجود مسبقاً", 409);
    }
    if (error.code === "P2025") {
      return apiError("السجل غير موجود", 404);
    }
    return apiError("خطأ في قاعدة البيانات", 500);
  }

  return apiError("حدث خطأ غير متوقع", 500);
}
