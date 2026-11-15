'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SpecStat {
  specialization: string;
  count: number;
}

interface SpecializationsChartProps {
  data?: SpecStat[];
  isLoading?: boolean;
}

export function SpecializationsChart({ data = [], isLoading }: SpecializationsChartProps) {
  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Doctors by Specialty</h3>
        <p className="text-xs text-slate-500 mt-0.5">Faculty distribution across clinical disciplines</p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-28" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
          <p className="text-xs">No specialization distribution recorded</p>
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="specialization"
                tick={{ fontSize: 10, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as SpecStat;
                    return (
                      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs">
                        <p className="font-semibold">{item.specialization}</p>
                        <p className="text-teal-300 font-medium mt-0.5">{item.count} Doctors</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="count"
                fill="#00D4B2"
                radius={[6, 6, 0, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
