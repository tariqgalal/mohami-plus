"use client";

import { useEffect, useState } from "react";
import { Play, Pause, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import { useTaskTimer } from "@/hooks/use-tasks";
import { toast } from "@/store/toast-store";

interface TaskTimerProps {
  taskId: string;
  timeSpent: number;
  timerStartedAt: string | null;
  /** هل يملك المستخدم صلاحية التعديل (تشغيل/إيقاف) */
  canControl?: boolean;
}

/**
 * عدّاد الوقت للمهمة: يعرض الزمن المسجّل + الزمن الجاري حياً،
 * مع زر تشغيل/إيقاف. الزمن الجاري = timeSpent + (الآن − timerStartedAt).
 */
export function TaskTimer({
  taskId,
  timeSpent,
  timerStartedAt,
  canControl = true,
}: TaskTimerProps) {
  const timer = useTaskTimer(taskId);
  const running = !!timerStartedAt;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const liveExtra = running
    ? Math.max(0, Math.floor((now - new Date(timerStartedAt).getTime()) / 1000))
    : 0;
  const total = timeSpent + liveExtra;

  async function handleToggle() {
    try {
      await timer.mutateAsync(running ? "stop" : "start");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "تعذّر تحديث العدّاد");
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div
        className={`grid size-10 place-items-center rounded-full ${
          running ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-500"
        }`}
      >
        <Timer className="size-5" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-500">الوقت المستغرق</p>
        <p className="text-xl font-bold tabular-nums text-slate-900">
          {formatDuration(total)}
        </p>
      </div>
      {canControl && (
        <Button
          type="button"
          variant={running ? "outline" : "default"}
          onClick={handleToggle}
          loading={timer.isPending}
        >
          {running ? (
            <>
              <Pause className="size-4" />
              إيقاف
            </>
          ) : (
            <>
              <Play className="size-4" />
              تشغيل
            </>
          )}
        </Button>
      )}
    </div>
  );
}

/** عرض مختصر للوقت (للجدول) — نصيّ فقط مع مؤشر التشغيل. */
export function TaskTimeDisplay({
  timeSpent,
  timerStartedAt,
}: {
  timeSpent: number;
  timerStartedAt: string | null;
}) {
  const running = !!timerStartedAt;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const liveExtra = running
    ? Math.max(0, Math.floor((now - new Date(timerStartedAt).getTime()) / 1000))
    : 0;

  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums text-slate-700">
      {running && (
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
      )}
      {formatDuration(timeSpent + liveExtra)}
    </span>
  );
}
