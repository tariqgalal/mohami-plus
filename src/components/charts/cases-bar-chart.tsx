"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CasesBarChartProps {
  data: { name: string; value: number }[];
  color?: string;
  height?: number;
}

const COLORS = [
  "#2563eb",
  "#d97706",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#f59e0b",
  "#ec4899",
];

export function CasesBarChart({
  data,
  color = "#2563eb",
  height = 280,
}: CasesBarChartProps) {
  return (
    <div style={{ width: "100%", height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={50}
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
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={color}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
