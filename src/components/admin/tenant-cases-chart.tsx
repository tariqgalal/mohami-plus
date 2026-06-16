"use client";

import {
  BarChart,
  Bar,
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

function formatMonth(key: string): string {
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

export function TenantCasesChart({ data, height = 240 }: Props) {
  const chartData = data.map((d) => ({
    label: formatMonth(d.month),
    قضايا: d.count,
  }));

  return (
    <div style={{ width: "100%", height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
            allowDecimals={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
              direction: "rtl",
            }}
          />
          <Bar dataKey="قضايا" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
