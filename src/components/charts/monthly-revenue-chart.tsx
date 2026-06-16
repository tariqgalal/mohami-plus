"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthlyRevenueChartProps {
  data: { month: string; total: number; paid: number }[];
  color?: string;
  paidColor?: string;
  showLegend?: boolean;
  variant?: "single" | "dual";
  totalLabel?: string;
  paidLabel?: string;
  height?: number;
}

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

function formatCurrencyShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}م`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}ك`;
  return n.toFixed(0);
}

export function MonthlyRevenueChart({
  data,
  color = "#d97706",
  paidColor = "#10b981",
  showLegend = true,
  variant = "single",
  totalLabel = "إجمالي",
  paidLabel = "المحصّل",
  height = 280,
}: MonthlyRevenueChartProps) {
  const chartData = data.map((d) => ({
    label: formatMonthLabel(d.month),
    total: d.total,
    paid: d.paid,
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
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickFormatter={formatCurrencyShort}
            width={50}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
              direction: "rtl",
            }}
            formatter={(value) =>
              new Intl.NumberFormat("ar-SA", {
                style: "currency",
                currency: "SAR",
                maximumFractionDigits: 0,
              }).format(Number(value))
            }
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
          />
          {showLegend && (
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          )}
          {variant === "dual" ? (
            <>
              <Bar
                dataKey="total"
                name={totalLabel}
                fill={color}
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="paid"
                name={paidLabel}
                fill={paidColor}
                radius={[6, 6, 0, 0]}
              />
            </>
          ) : (
            <Bar
              dataKey="total"
              name={totalLabel}
              fill={color}
              radius={[6, 6, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
