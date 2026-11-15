'use client';

import React from 'react';
import { Users, Stethoscope, UserPlus, TrendingUp } from 'lucide-react';

interface SummaryData {
  totalDoctors: number;
  totalPatients: number;
  newPatientsThisMonth: number;
  newDoctorsThisMonth: number;
  avgPatientsPerDoctor: number;
}

interface SummaryCardsProps {
  data?: SummaryData;
  isLoading?: boolean;
}

export function SummaryCards({ data, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`sum-skel-${i}`}
            className="p-5 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-8 w-8 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-7 bg-slate-200 rounded w-16" />
            <div className="h-3 bg-slate-100 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Doctors',
      value: data?.totalDoctors ?? 0,
      subtext: `+${data?.newDoctorsThisMonth ?? 0} registered this month`,
      icon: Stethoscope,
      iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
    },
    {
      title: 'Total Patients',
      value: data?.totalPatients ?? 0,
      subtext: 'Cumulative admissions across all units',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'New Patients (30d)',
      value: data?.newPatientsThisMonth ?? 0,
      subtext: 'Recent cases under active care',
      icon: UserPlus,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Avg. Patients / Doctor',
      value: data?.avgPatientsPerDoctor ?? 0,
      subtext: 'Physician clinical caseload average',
      icon: TrendingUp,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-2 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl border ${card.iconBg}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {card.value.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">{card.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}
