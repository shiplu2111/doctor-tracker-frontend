'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ConditionStat {
  condition: string;
  count: number;
  percentage?: number;
}

interface ConditionPieChartProps {
  data?: ConditionStat[];
  isLoading?: boolean;
}

const COLORS = [
  '#00D4B2', // Teal
  '#0A2540', // Deep Navy
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#64748B', // Slate
];

export function ConditionPieChart({ data = [], isLoading }: ConditionPieChartProps) {
  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Diagnosis Distribution</h3>
        <p className="text-xs text-slate-500 mt-0.5">Top reported conditions across all patients</p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-28" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
          <p className="text-xs">No condition breakdown available</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="h-56 w-full sm:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="condition"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as ConditionStat;
                      return (
                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs">
                          <p className="font-semibold">{item.condition}</p>
                          <p className="text-teal-300 font-medium">
                            {item.count} Patients ({item.percentage ?? 0}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom legend */}
          <div className="w-full sm:w-1/2 space-y-1.5 overflow-y-auto max-h-48 text-xs">
            {data.map((item, idx) => (
              <div key={item.condition} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="truncate text-slate-700 font-medium">{item.condition}</span>
                </div>
                <span className="text-slate-500 font-semibold shrink-0">
                  {item.percentage}% ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
