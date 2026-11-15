'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Users,
  Phone,
  Mail,
  Stethoscope,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { type Patient, type Doctor, PERMISSIONS } from '@doctor-tracker/shared';
import { apiClient } from '@/lib/api/api-client';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useAuthStore } from '@/store/auth-store';
import { hasPermission } from '@/lib/auth-utils';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterBar, type FilterConfig, type ActiveChip } from '@/components/ui/FilterBar';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { PatientFormDrawer } from '@/features/patients/components/PatientFormDrawer';
import { DeletePatientDialog } from '@/features/patients/components/DeletePatientDialog';
import { TableActionMenu } from '@/components/ui/TableActionMenu';

function PatientsPageContent() {
  const { user } = useAuthStore();
  const { params, setParams, clearParams } = useQueryParams();

  // Dialog and drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Parse query parameters
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '10', 10);
  const search = params.search || '';
  const status = params.status || '';
  const condition = params.condition || '';
  const doctorId = params.doctorId || '';
  const from = params.from || '';
  const to = params.to || '';

  // Fetch active doctors for filter
  const { data: doctors = [] } = useQuery({
    queryKey: ['active-doctors-list'],
    queryFn: async () => {
      const res = await apiClient<Doctor[]>('/doctors?limit=100');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch distinct conditions
  const { data: conditions = [] } = useQuery({
    queryKey: ['patient-conditions'],
    queryFn: async () => {
      const res = await apiClient<string[]>('/patients/conditions');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Query parameters string
  const queryParamsString = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search && { search }),
    ...(status && { status }),
    ...(condition && { condition }),
    ...(doctorId && { doctorId }),
    ...(from && { from }),
    ...(to && { to }),
  }).toString();

  // Fetch patients
  const {
    data: patientsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['patients', queryParamsString],
    queryFn: async () => {
      return apiClient<Patient[]>(`/patients?${queryParamsString}`);
    },
  });

  const patients = patientsResponse?.data || [];
  const meta = patientsResponse?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  // Permissions
  const canCreate = hasPermission(user, PERMISSIONS.PATIENT_CREATE);
  const canUpdate = hasPermission(user, PERMISSIONS.PATIENT_UPDATE);
  const canDelete = hasPermission(user, PERMISSIONS.PATIENT_DELETE);

  // Filter configurations
  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      value: status,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Critical', value: 'critical' },
        { label: 'Recovered', value: 'recovered' },
        { label: 'Discharged', value: 'discharged' },
      ],
    },
    {
      key: 'condition',
      label: 'Condition',
      value: condition,
      options: conditions.map((c) => ({ label: c, value: c })),
    },
    {
      key: 'doctorId',
      label: 'Attending Doctor',
      value: doctorId,
      options: doctors.map((d) => ({ label: d.name, value: d.id })),
    },
  ];

  // Active filter chips
  const activeChips: ActiveChip[] = [];
  if (status) {
    activeChips.push({
      key: 'status',
      label: 'Status',
      valueLabel: status.charAt(0).toUpperCase() + status.slice(1),
    });
  }
  if (condition) {
    activeChips.push({
      key: 'condition',
      label: 'Condition',
      valueLabel: condition,
    });
  }
  if (doctorId) {
    const doc = doctors.find((d) => d.id === doctorId);
    activeChips.push({
      key: 'doctorId',
      label: 'Doctor',
      valueLabel: doc?.name || doctorId,
    });
  }
  if (from || to) {
    activeChips.push({
      key: 'dateRange',
      label: 'Admitted',
      valueLabel: `${from || 'start'} → ${to || 'today'}`,
    });
  }

  const handleRemoveChip = (key: string) => {
    if (key === 'dateRange') {
      setParams({ from: null, to: null });
    } else {
      setParams({ [key]: null });
    }
  };

  const handleClearAll = () => {
    clearParams(['page', 'limit']);
  };

  const openCreateDrawer = () => {
    setEditingPatient(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (patient: Patient) => {
    setEditingPatient(patient);
    setActiveMenuId(null);
    setDrawerOpen(true);
  };

  const openDeleteModal = (patient: Patient) => {
    setPatientToDelete(patient);
    setActiveMenuId(null);
    setDeleteDialogOpen(true);
  };

  const getStatusBadge = (s: Patient['status']) => {
    switch (s) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            Critical
          </span>
        );
      case 'recovered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Recovered
          </span>
        );
      case 'discharged':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Discharged
          </span>
        );
      case 'active':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
            Active
          </span>
        );
    }
  };

  const columns: Column<Patient>[] = [
    {
      key: 'name',
      header: 'Patient Name',
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-semibold text-slate-900">{p.name}</span>
          {p.email && (
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span>{p.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'demographics',
      header: 'Age / Gender',
      render: (p) => (
        <span className="text-xs text-slate-600 font-medium">
          {p.age} yrs • {p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}
        </span>
      ),
    },
    {
      key: 'condition',
      header: 'Condition',
      sortable: true,
      render: (p) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
          {p.condition}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (p) => getStatusBadge(p.status),
    },
    {
      key: 'doctor',
      header: 'Attending Doctor',
      render: (p) =>
        p.doctor ? (
          <Link
            href={`/doctors/${p.doctorId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline transition-colors"
          >
            <Stethoscope className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span>{p.doctor.name}</span>
          </Link>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (p) =>
        p.phone ? (
          <a
            href={`tel:${p.phone}`}
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-teal-600"
          >
            <Phone className="h-3 w-3 text-slate-400" />
            <span>{p.phone}</span>
          </a>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Admitted',
      sortable: true,
      render: (p) => (
        <span className="text-xs text-slate-500">
          {new Date(p.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) => {
        const isMenuOpen = activeMenuId === p.id;
        return (
          <TableActionMenu
            isOpen={isMenuOpen}
            onToggle={() => setActiveMenuId(isMenuOpen ? null : p.id)}
            onClose={() => setActiveMenuId(null)}
            ariaLabel="Patient actions"
          >
            {p.doctorId && (
              <Link
                href={`/doctors/${p.doctorId}`}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => setActiveMenuId(null)}
              >
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                <span>View Doctor</span>
              </Link>
            )}

            {canUpdate && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  openEditDrawer(p);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5 text-slate-400" />
                <span>Edit Record</span>
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  openDeleteModal(p);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                <span>Delete Patient</span>
              </button>
            )}
          </TableActionMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patients Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Global patient roster and diagnostic records across all medical departments.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={openCreateDrawer}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors self-start sm:self-auto focus:ring-2 focus:ring-slate-900/20"
          >
            <Plus className="h-4 w-4" />
            <span>Admit Patient</span>
          </button>
        )}
      </div>

      {/* Search and Filters Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <SearchInput
            defaultValue={search}
            onDebounce={(val) => setParams({ search: val || null })}
            placeholder="Search patients by name..."
            className="w-full md:max-w-md"
          />

          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker
              from={from}
              to={to}
              onChange={({ from: newFrom, to: newTo }) =>
                setParams({ from: newFrom || null, to: newTo || null })
              }
            />
          </div>
        </div>

        <FilterBar
          filters={filters}
          activeChips={activeChips}
          onFilterChange={(key, val) => setParams({ [key]: val || null })}
          onRemoveChip={handleRemoveChip}
          onClearAll={handleClearAll}
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={patients}
          keyExtractor={(p) => p.id}
          isLoading={isLoading}
          isError={isError}
          error={(error as Error)?.message}
          onRetry={() => refetch()}
          emptyState={
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 bg-slate-100 rounded-full mb-3 text-slate-400">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No patients found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {activeChips.length > 0 || search
                  ? 'No patient records match the selected filters. Try clearing some filters.'
                  : 'Get started by admitting the first patient into the registry.'}
              </p>
              {canCreate && !search && activeChips.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateDrawer}
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Admit First Patient
                </button>
              )}
            </div>
          }
        />
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`mp-skel-${i}`}
              className="p-4 bg-white rounded-xl border border-slate-200 animate-pulse space-y-3"
            >
              <div className="h-5 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
            </div>
          ))
        ) : patients.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No patients found</p>
          </div>
        ) : (
          patients.map((p) => (
            <div
              key={p.id}
              className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900">{p.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">
                      {p.age}y • {p.gender}
                    </span>
                    {getStatusBadge(p.status)}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => openEditDrawer(p)}
                      aria-label="Edit patient"
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => openDeleteModal(p)}
                      aria-label="Delete patient"
                      className="p-2 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Diagnosis:</span>
                  <span className="font-medium text-slate-800 truncate">{p.condition}</span>
                </div>
                {p.doctor && (
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-slate-400">Doctor:</span>
                    <Link
                      href={`/doctors/${p.doctorId}`}
                      className="text-teal-600 font-medium hover:underline truncate"
                    >
                      {p.doctor.name}
                    </Link>
                  </div>
                )}
                {p.phone && (
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <a href={`tel:${p.phone}`} className="text-teal-600 hover:underline">
                      {p.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta.total > 0 && (
        <Pagination
          page={page}
          limit={limit}
          total={meta.total}
          onPageChange={(p) => setParams({ page: p }, false)}
          onLimitChange={(l) => setParams({ limit: l, page: 1 })}
          className="bg-white rounded-xl shadow-xs"
        />
      )}

      {/* Patient Form Drawer */}
      <PatientFormDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        patient={editingPatient}
        onSuccess={() => refetch()}
      />

      {/* Delete Patient Dialog */}
      <DeletePatientDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        patient={patientToDelete}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default function PatientsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-20 bg-slate-100 rounded-xl" />
          <div className="h-80 bg-slate-100 rounded-xl" />
        </div>
      }
    >
      <PatientsPageContent />
    </Suspense>
  );
}
