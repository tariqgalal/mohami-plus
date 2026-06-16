"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MONTH_NAMES = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

function formatMonthLabel(key: string): string {
  const parts = key.split("-");
  if (parts.length !== 2) return key;
  const m = Number(parts[1]);
  if (Number.isNaN(m) || m < 1 || m > 12) return key;
  return MONTH_NAMES[m - 1];
}

interface Props {
  data: { month: string; count: number }[];
  height?: number;
}

export function TenantGrowthChart({ data, height = 280 }: Props) {
  // Cumulative growth via reduce
  const chartData = data.reduce<
    Array<{ label: string; جديد: number; تراكمي: number }>
  >((acc, d) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].تراكمي : 0;
    acc.push({
      label: formatMonthLabel(d.month),
      جديد: d.count,
      تراكمي: prev + d.count,
    });
    return acc;
  }, []);

  return (
    <div style={{ width: "100%", height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
            allowDecimals={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
              direction: "rtl",
            }}
          />
          <Line
            type="monotone"
            dataKey="تراكمي"
            stroke="#d97706"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#d97706" }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="جديد"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3, fill: "#2563eb" }}
            strokeDasharray="4 4"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
