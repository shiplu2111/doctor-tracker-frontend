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

interface DoctorStat {
  doctorId: string;
  name: string;
  specialization: string;
  hospital: string;
  count: number;
}

interface TopDoctorsChartProps {
  data?: DoctorStat[];
  isLoading?: boolean;
}

export function TopDoctorsChart({ data = [], isLoading }: TopDoctorsChartProps) {
  // Take top 6 for clean visual display
  const chartData = data.slice(0, 6).map((d) => ({
    ...d,
    shortName: d.name.replace(/^Dr\.\s*/i, ''),
  }));

  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Top Doctors by Caseload</h3>
        <p className="text-xs text-slate-500 mt-0.5">Physicians with the highest active patient assignments</p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-28" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
          <p className="text-xs">No doctor caseload data available</p>
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as DoctorStat;
                    return (
                      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs space-y-0.5">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-slate-300 text-[11px]">
                          {item.specialization} • {item.hospital}
                        </p>
                        <p className="text-teal-300 font-semibold pt-1">
                          {item.count} Assigned Patients
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="count"
                fill="#0A2540"
                radius={[0, 6, 6, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
