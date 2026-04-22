"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Sky, teal, gold — plus soft variants for extra series
const COLORS = ["#61a5c2", "#52b69a", "#ffbf69", "#8ec7dc", "#7bc9b1", "#ffd095", "#4a8fae", "#3f9c82"];

export function ProjectDonut({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={64}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((d, i) => (
            <Cell
              key={d.name}
              fill={COLORS[i % COLORS.length]}
              stroke="var(--surface)"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--foreground)",
          }}
          formatter={(v, _seriesName, item) => {
            const n = Number(v);
            const label =
              (item as { payload?: { name?: string }; name?: string })?.payload?.name ||
              (item as { name?: string })?.name ||
              "—";
            return [`${n} (${((n / total) * 100).toFixed(1)}%)`, label];
          }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: "var(--muted-strong)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ClassificationBars({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--foreground)",
          }}
          cursor={{ fill: "rgba(97,165,194,0.08)" }}
        />
        <Bar dataKey="value" fill="#61a5c2" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WorkflowBars({
  data,
}: {
  data: { name: string; success: number; error: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4} stackOffset="sign" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--foreground)",
          }}
          cursor={{ fill: "rgba(97,165,194,0.08)" }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "var(--muted-strong)" }} />
        <Bar dataKey="success" name="Success" stackId="a" fill="#52b69a" radius={[0, 0, 0, 0]} />
        <Bar dataKey="error" name="Errors" stackId="a" fill="#ef4444" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
