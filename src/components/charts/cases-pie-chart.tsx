"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CasesPieChartProps {
  data: { name: string; value: number }[];
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
  "#84cc16",
  "#6366f1",
  "#14b8a6",
];

export function CasesPieChart({ data, height = 280 }: CasesPieChartProps) {
  return (
    <div style={{ width: "100%", height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
              direction: "rtl",
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, direction: "rtl" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
