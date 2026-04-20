"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function BudgetChart({
  data,
}: {
  data: { name: string; budget: number; spent: number }[];
}) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
          <Legend />
          <Bar dataKey="budget" name="Budget" fill="#064162" />
          <Bar dataKey="spent" name="Spent" fill="#e69b40" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
