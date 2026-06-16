"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResetPassword } from "@/hooks/use-team-list";
import { toast } from "@/store/toast-store";

interface ResetPasswordDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: ResetPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useResetPassword(userId);

  async function handleSubmit() {
    setError(null);
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("كلمة المرور يجب أن تحتوي على حرف ورقم");
      return;
    }
    try {
      await mutation.mutateAsync(password);
      toast.success(`تم تعيين كلمة مرور جديدة لـ ${userName}`);
      setPassword("");
      onOpenChange(false);
    } catch (e: any) {
      setError(e.message || "فشل تغيير كلمة المرور");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
        <DialogDescription>
          تعيين كلمة مرور جديدة لـ {userName}. سيستخدمها العضو في الدخول مرة أخرى.
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-2">
          <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
          <Input
            id="newPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 أحرف على الأقل، حرف ورقم"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          إلغاء
        </Button>
        <Button onClick={handleSubmit} loading={mutation.isPending}>
          تعيين كلمة المرور
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
