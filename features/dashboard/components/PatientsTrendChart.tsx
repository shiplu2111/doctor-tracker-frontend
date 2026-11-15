'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TimePoint {
  date: string;
  count: number;
}

interface PatientsTrendChartProps {
  data?: TimePoint[];
  isLoading?: boolean;
  timeframe: '7d' | '30d' | '90d';
  onTimeframeChange: (tf: '7d' | '30d' | '90d') => void;
}

export function PatientsTrendChart({
  data = [],
  isLoading,
  timeframe,
  onTimeframeChange,
}: PatientsTrendChartProps) {
  const formattedData = data.map((d) => {
    const parts = d.date.split('-');
    const label = parts.length === 3 ? `${parts[1]}/${parts[2]}` : d.date;
    return {
      ...d,
      displayDate: label,
    };
  });

  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Patient Admissions Trend</h3>
          <p className="text-xs text-slate-500 mt-0.5">Daily registered patients across all departments</p>
        </div>

        {/* Timeframe selector */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
          {(['7d', '30d', '90d'] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => onTimeframeChange(tf)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                timeframe === tf
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-32" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
          <p className="text-xs">No admission data recorded for this timeframe</p>
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="patientTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4B2" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00D4B2" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
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
                    const item = payload[0].payload as TimePoint;
                    return (
                      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs">
                        <p className="font-semibold">{item.date}</p>
                        <p className="text-teal-300 font-medium mt-0.5">{item.count} Patients</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#00B89C"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#patientTrendGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
