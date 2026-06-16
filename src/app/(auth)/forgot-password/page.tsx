import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "استعادة كلمة المرور",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md mx-auto">
    <Card>
      <CardHeader className="text-center">
        <CardTitle>استعادة كلمة المرور</CardTitle>
        <CardDescription>سيتم إضافة هذه الميزة قريباً</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-sm">
          <Link href="/login" className="text-brand-600 font-medium hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
