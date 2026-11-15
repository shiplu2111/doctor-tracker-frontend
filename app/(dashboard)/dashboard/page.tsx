'use client';

import React, { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useQueryParams } from '@/hooks/useQueryParams';
import { SummaryCards } from '@/features/dashboard/components/SummaryCards';
import { PatientsTrendChart } from '@/features/dashboard/components/PatientsTrendChart';
import { ConditionPieChart } from '@/features/dashboard/components/ConditionPieChart';
import { TopDoctorsChart } from '@/features/dashboard/components/TopDoctorsChart';
import { SpecializationsChart } from '@/features/dashboard/components/SpecializationsChart';
import { RefreshCw } from 'lucide-react';

interface SummaryData {
  totalDoctors: number;
  totalPatients: number;
  newPatientsThisMonth: number;
  newDoctorsThisMonth: number;
  avgPatientsPerDoctor: number;
}

interface TimePoint {
  date: string;
  count: number;
}

interface ConditionStat {
  condition: string;
  count: number;
  percentage?: number;
}

interface DoctorStat {
  doctorId: string;
  name: string;
  specialization: string;
  hospital: string;
  count: number;
}

interface SpecStat {
  specialization: string;
  count: number;
}

function DashboardContent() {
  const user = useAuthStore((state) => state.user);
  const { params, setParams } = useQueryParams();

  // Timeframe state: 7d, 30d, 90d
  const timeframe = (params.tf as '7d' | '30d' | '90d') || '30d';

  const handleTimeframeChange = (newTf: '7d' | '30d' | '90d') => {
    setParams({ tf: newTf }, false);
  };

  // 1. Summary KPIs
  const {
    data: summaryRes,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiClient<SummaryData>('/dashboard/summary'),
    staleTime: 30 * 1000,
  });

  // 2. Timeseries
  const {
    data: timeseriesRes,
    isLoading: isTimeseriesLoading,
    refetch: refetchTimeseries,
  } = useQuery({
    queryKey: ['dashboard-timeseries', timeframe],
    queryFn: () => {
      const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30;
      const fromDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
        .toISOString()
        .substring(0, 10);
      const toDate = new Date().toISOString().substring(0, 10);
      return apiClient<TimePoint[]>(
        `/dashboard/timeseries?metric=patients&interval=day&from=${fromDate}&to=${toDate}`,
      );
    },
    staleTime: 30 * 1000,
  });

  // 3. Conditions breakdown
  const {
    data: conditionsRes,
    isLoading: isConditionsLoading,
    refetch: refetchConditions,
  } = useQuery({
    queryKey: ['dashboard-conditions'],
    queryFn: () => apiClient<ConditionStat[]>('/dashboard/conditions?limit=8'),
    staleTime: 30 * 1000,
  });

  // 4. Top doctors
  const {
    data: doctorsRes,
    isLoading: isDoctorsLoading,
    refetch: refetchDoctors,
  } = useQuery({
    queryKey: ['dashboard-patients-per-doctor'],
    queryFn: () => apiClient<DoctorStat[]>('/dashboard/patients-per-doctor?limit=8'),
    staleTime: 30 * 1000,
  });

  // 5. Specializations
  const {
    data: specsRes,
    isLoading: isSpecsLoading,
    refetch: refetchSpecs,
  } = useQuery({
    queryKey: ['dashboard-specializations'],
    queryFn: () => apiClient<SpecStat[]>('/dashboard/specializations'),
    staleTime: 30 * 1000,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchSummary(),
      refetchTimeseries(),
      refetchConditions(),
      refetchDoctors(),
      refetchSpecs(),
    ]);
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Clinical operations and patient intake metrics across all hospital units.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* 4 KPI Summary Cards */}
      <SummaryCards data={summaryRes?.data} isLoading={isSummaryLoading} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Patients Admissions Trend */}
        <PatientsTrendChart
          data={timeseriesRes?.data}
          isLoading={isTimeseriesLoading}
          timeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
        />

        {/* Chart 2: Conditions / Diagnoses Pie */}
        <ConditionPieChart
          data={conditionsRes?.data}
          isLoading={isConditionsLoading}
        />

        {/* Chart 3: Top Doctors by Caseload */}
        <TopDoctorsChart
          data={doctorsRes?.data}
          isLoading={isDoctorsLoading}
        />

        {/* Chart 4: Doctors by Specialty */}
        <SpecializationsChart
          data={specsRes?.data}
          isLoading={isSpecsLoading}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 bg-slate-100 rounded-2xl" />
            <div className="h-72 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
