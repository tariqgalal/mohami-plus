"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetch("/api/notifications", { method: "PUT" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} loading={loading} variant="outline" size="sm">
      <CheckCheck className="size-4" />
      تعليم الكل كمقروء
    </Button>
  );
}
