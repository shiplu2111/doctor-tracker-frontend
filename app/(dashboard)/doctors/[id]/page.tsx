'use client';

import React, { useState, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Plus,
  Users,
  Pencil,
  Trash2,
  Activity,
  Calendar,
} from 'lucide-react';
import { type Doctor, type Patient, PERMISSIONS } from '@doctor-tracker/shared';
import { apiClient } from '@/lib/api/api-client';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useAuthStore } from '@/store/auth-store';
import { hasPermission } from '@/lib/auth-utils';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableActionMenu } from '@/components/ui/TableActionMenu';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterBar, type FilterConfig, type ActiveChip } from '@/components/ui/FilterBar';
import { DoctorFormDrawer } from '@/features/doctors/components/DoctorFormDrawer';
import { DeleteDoctorDialog } from '@/features/doctors/components/DeleteDoctorDialog';
import { PatientFormDrawer } from '@/features/patients/components/PatientFormDrawer';
import { DeletePatientDialog } from '@/features/patients/components/DeletePatientDialog';

interface PageProps {
  params: Promise<{ id: string }>;
}

function DoctorDetailContent({ doctorId }: { doctorId: string }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { params: queryParams, setParams, clearParams } = useQueryParams();

  // Modals & Drawers state
  const [editDoctorOpen, setEditDoctorOpen] = useState(false);
  const [deleteDoctorOpen, setDeleteDoctorOpen] = useState(false);
  const [patientDrawerOpen, setPatientDrawerOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletePatientOpen, setDeletePatientOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Parse patient query params
  const page = parseInt(queryParams.page || '1', 10);
  const limit = parseInt(queryParams.limit || '10', 10);
  const search = queryParams.search || '';
  const status = queryParams.status || '';
  const condition = queryParams.condition || '';

  // 1. Fetch Doctor details
  const {
    data: doctorResponse,
    isLoading: isDoctorLoading,
    refetch: refetchDoctor,
  } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: async () => {
      return apiClient<Doctor>(`/doctors/${doctorId}`);
    },
  });
  const doctor = doctorResponse?.data;

  // 2. Fetch distinct patient conditions
  const { data: conditions = [] } = useQuery({
    queryKey: ['patient-conditions'],
    queryFn: async () => {
      const res = await apiClient<string[]>('/patients/conditions');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // 3. Fetch Doctor's Patients
  const patientApiParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search && { search }),
    ...(status && { status }),
    ...(condition && { condition }),
  }).toString();

  const {
    data: patientsResponse,
    isLoading: isPatientsLoading,
    refetch: refetchPatients,
  } = useQuery({
    queryKey: ['doctor-patients', doctorId, patientApiParams],
    queryFn: async () => {
      return apiClient<Patient[]>(`/doctors/${doctorId}/patients?${patientApiParams}`);
    },
    enabled: Boolean(doctorId),
  });

  const patients = patientsResponse?.data || [];
  const meta = patientsResponse?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  // Permissions
  const canUpdateDoctor = hasPermission(user, PERMISSIONS.DOCTOR_UPDATE);
  const canDeleteDoctor = hasPermission(user, PERMISSIONS.DOCTOR_DELETE);
  const canCreatePatient = hasPermission(user, PERMISSIONS.PATIENT_CREATE);
  const canUpdatePatient = hasPermission(user, PERMISSIONS.PATIENT_UPDATE);
  const canDeletePatient = hasPermission(user, PERMISSIONS.PATIENT_DELETE);

  // Filters
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
  ];

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

  const handleRemoveChip = (key: string) => {
    setParams({ [key]: null });
  };

  const handleClearAll = () => {
    clearParams(['page', 'limit']);
  };

  const openCreatePatient = () => {
    setEditingPatient(null);
    setPatientDrawerOpen(true);
  };

  const openEditPatient = (p: Patient) => {
    setEditingPatient(p);
    setActiveMenuId(null);
    setPatientDrawerOpen(true);
  };

  const openDeletePatient = (p: Patient) => {
    setPatientToDelete(p);
    setActiveMenuId(null);
    setDeletePatientOpen(true);
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
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
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
            {canUpdatePatient && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  openEditPatient(p);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5 text-slate-400" />
                <span>Edit Record</span>
              </button>
            )}
            {canDeletePatient && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  openDeletePatient(p);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                <span>Delete</span>
              </button>
            )}
          </TableActionMenu>
        );
      },
    },
  ];

  if (isDoctorLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-40 bg-white rounded-xl border border-slate-200 p-6" />
        <div className="h-64 bg-white rounded-xl border border-slate-200 p-6" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-base font-semibold text-slate-800">Doctor Not Found</h3>
        <p className="text-xs text-slate-400 mt-1">The requested doctor profile does not exist.</p>
        <Link
          href="/doctors"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/doctors"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Doctors Directory</span>
      </Link>

      {/* Doctor Profile Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-lg text-teal-800 shrink-0 shadow-xs">
              {doctor.name.replace(/^Dr\.\s*/i, '').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{doctor.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
                  {doctor.specialization}
                </span>
                {doctor.status === 'active' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Inactive
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>{doctor.hospital}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <a href={`tel:${doctor.phone}`} className="text-teal-600 hover:underline">
                    {doctor.phone}
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{doctor.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Member since{' '}
                    {new Date(doctor.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {canUpdateDoctor && (
              <button
                type="button"
                onClick={() => setEditDoctorOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Pencil className="h-3.5 w-3.5 text-slate-500" />
                <span>Edit Profile</span>
              </button>
            )}

            {canDeleteDoctor && (
              <button
                type="button"
                onClick={() => setDeleteDoctorOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                <span>Delete</span>
              </button>
            )}

            {canCreatePatient && (
              <button
                type="button"
                onClick={openCreatePatient}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Patient</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats banner */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              Assigned Patients
            </span>
            <p className="text-lg font-bold text-slate-900 mt-1">{doctor.patientCount}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-slate-400" />
              Practice Status
            </span>
            <p className="text-sm font-semibold text-slate-800 mt-1 capitalize">{doctor.status}</p>
          </div>
        </div>
      </div>

      {/* Patient Roster Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Patient Roster</h2>
            <p className="text-xs text-slate-500">
              Active medical cases and consultation history under Dr. {doctor.name}
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <SearchInput
              defaultValue={search}
              onDebounce={(val) => setParams({ search: val || null })}
              placeholder="Search patients by name..."
              className="w-full sm:max-w-md"
            />
          </div>

          <FilterBar
            filters={filters}
            activeChips={activeChips}
            onFilterChange={(key, val) => setParams({ [key]: val || null })}
            onRemoveChip={handleRemoveChip}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={patients}
            keyExtractor={(p) => p.id}
            isLoading={isPatientsLoading}
            emptyState={
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-8 w-8 text-slate-300 mb-2" />
                <h3 className="text-sm font-semibold text-slate-800">No patients found</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  {search || activeChips.length > 0
                    ? 'No patient records match the applied filters.'
                    : `No patients have been assigned to Dr. ${doctor.name} yet.`}
                </p>
                {canCreatePatient && !search && activeChips.length === 0 && (
                  <button
                    type="button"
                    onClick={openCreatePatient}
                    className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
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
          {isPatientsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`p-skel-${i}`}
                className="p-4 bg-white rounded-xl border border-slate-200 animate-pulse space-y-3"
              >
                <div className="h-5 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
              </div>
            ))
          ) : patients.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">No patients assigned</p>
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
                    {canUpdatePatient && (
                      <button
                        type="button"
                        onClick={() => openEditPatient(p)}
                        aria-label="Edit patient"
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canDeletePatient && (
                      <button
                        type="button"
                        onClick={() => openDeletePatient(p)}
                        aria-label="Delete patient"
                        className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {p.condition}
                  </span>
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="text-teal-600 hover:underline">
                      {p.phone}
                    </a>
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
      </div>

      {/* Edit Doctor Drawer */}
      <DoctorFormDrawer
        isOpen={editDoctorOpen}
        onClose={() => setEditDoctorOpen(false)}
        doctor={doctor}
        onSuccess={() => refetchDoctor()}
      />

      {/* Delete Doctor Dialog */}
      <DeleteDoctorDialog
        isOpen={deleteDoctorOpen}
        onClose={() => setDeleteDoctorOpen(false)}
        doctor={doctor}
        onSuccess={() => {
          router.push('/doctors');
        }}
      />

      {/* Add / Edit Patient Drawer */}
      <PatientFormDrawer
        isOpen={patientDrawerOpen}
        onClose={() => setPatientDrawerOpen(false)}
        patient={editingPatient}
        lockedDoctorId={doctorId}
        onSuccess={() => {
          refetchPatients();
          refetchDoctor();
        }}
      />

      {/* Delete Patient Dialog */}
      <DeletePatientDialog
        isOpen={deletePatientOpen}
        onClose={() => setDeletePatientOpen(false)}
        patient={patientToDelete}
        onSuccess={() => {
          refetchPatients();
          refetchDoctor();
        }}
      />
    </div>
  );
}

export default function DoctorDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);

  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-40 bg-slate-100 rounded-xl" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      }
    >
      <DoctorDetailContent doctorId={resolvedParams.id} />
    </Suspense>
  );
}
