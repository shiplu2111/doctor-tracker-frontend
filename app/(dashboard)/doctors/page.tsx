'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Stethoscope,
  Phone,
  Mail,
  Building2,
  Users,
  Pencil,
  Trash2,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { type Doctor, PERMISSIONS } from '@doctor-tracker/shared';
import { apiClient } from '@/lib/api/api-client';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useAuthStore } from '@/store/auth-store';
import { hasPermission } from '@/lib/auth-utils';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterBar, type FilterConfig, type ActiveChip } from '@/components/ui/FilterBar';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { DoctorFormDrawer } from '@/features/doctors/components/DoctorFormDrawer';
import { DeleteDoctorDialog } from '@/features/doctors/components/DeleteDoctorDialog';
import { DoctorImportModal } from '@/features/doctors/components/DoctorImportModal';
import { TableActionMenu } from '@/components/ui/TableActionMenu';

function DoctorsPageContent() {
  const { user } = useAuthStore();
  const { params, setParams, clearParams } = useQueryParams();

  // Dialog and drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Parse query parameters
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '10', 10);
  const search = params.search || '';
  const specialization = params.specialization || '';
  const hospital = params.hospital || '';
  const status = params.status || '';
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = (params.sortOrder as 'asc' | 'desc') || 'desc';
  const from = params.from || '';
  const to = params.to || '';

  // Fetch unique specializations for filter dropdown
  const { data: specializations = [] } = useQuery({
    queryKey: ['doctor-specializations'],
    queryFn: async () => {
      const res = await apiClient<string[]>('/doctors/specializations');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch doctors list
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
    ...(search && { search, q: search }),
    ...(specialization && { specialization }),
    ...(hospital && { hospital }),
    ...(status && { status }),
    ...(from && { from }),
    ...(to && { to }),
  }).toString();

  const {
    data: doctorsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['doctors', queryParams],
    queryFn: async () => {
      return apiClient<Doctor[]>(`/doctors?${queryParams}`);
    },
  });

  const doctors = doctorsResponse?.data || [];
  const meta = doctorsResponse?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  // Permissions
  const canCreate = hasPermission(user, PERMISSIONS.DOCTOR_CREATE);
  const canUpdate = hasPermission(user, PERMISSIONS.DOCTOR_UPDATE);
  const canDelete = hasPermission(user, PERMISSIONS.DOCTOR_DELETE);

  // Sorting
  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setParams({
        sortBy: columnKey,
        sortOrder: sortOrder === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setParams({
        sortBy: columnKey,
        sortOrder: 'desc',
      });
    }
  };

  // Filter configurations
  const filters: FilterConfig[] = [
    {
      key: 'specialization',
      label: 'Specialization',
      value: specialization,
      options: specializations.map((spec) => ({ label: spec, value: spec })),
    },
    {
      key: 'status',
      label: 'Status',
      value: status,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  // Active filter chips
  const activeChips: ActiveChip[] = [];
  if (specialization) {
    activeChips.push({
      key: 'specialization',
      label: 'Specialization',
      valueLabel: specialization,
    });
  }
  if (status) {
    activeChips.push({
      key: 'status',
      label: 'Status',
      valueLabel: status === 'active' ? 'Active' : 'Inactive',
    });
  }
  if (from || to) {
    activeChips.push({
      key: 'dateRange',
      label: 'Registered',
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
    setEditingDoctor(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (doc: Doctor) => {
    setEditingDoctor(doc);
    setActiveMenuId(null);
    setDrawerOpen(true);
  };

  const openDeleteModal = (doc: Doctor) => {
    setDoctorToDelete(doc);
    setActiveMenuId(null);
    setDeleteDialogOpen(true);
  };

  // Table Columns Definition
  const columns: Column<Doctor>[] = [
    {
      key: 'name',
      header: 'Doctor Name',
      sortable: true,
      render: (doc) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-xs text-slate-700 shrink-0">
            {doc.name
              .replace(/^Dr\.\s*/i, '')
              .substring(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <Link
              href={`/doctors/${doc.id}`}
              className="font-medium text-slate-900 hover:text-teal-600 transition-colors"
            >
              {doc.name}
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <Mail className="h-3 w-3" />
              <span>{doc.email}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'specialization',
      header: 'Specialization',
      sortable: true,
      render: (doc) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
          {doc.specialization}
        </span>
      ),
    },
    {
      key: 'hospital',
      header: 'Hospital',
      sortable: true,
      render: (doc) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[180px]">{doc.hospital}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (doc) => (
        <a
          href={`tel:${doc.phone}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-teal-600 transition-colors"
        >
          <Phone className="h-3 w-3 text-slate-400" />
          <span>{doc.phone}</span>
        </a>
      ),
    },
    {
      key: 'patientCount',
      header: 'Patients',
      sortable: true,
      render: (doc) => (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
            <Users className="h-3 w-3 text-slate-400" />
            {doc.patientCount}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (doc) =>
        doc.status === 'active' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Inactive
          </span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Registered',
      sortable: true,
      render: (doc) => (
        <span className="text-xs text-slate-500">
          {new Date(doc.createdAt).toLocaleDateString('en-US', {
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
      render: (doc) => {
        const isMenuOpen = activeMenuId === doc.id;
        return (
          <TableActionMenu
            isOpen={isMenuOpen}
            onToggle={() => setActiveMenuId(isMenuOpen ? null : doc.id)}
            onClose={() => setActiveMenuId(null)}
            ariaLabel="Doctor actions"
          >
            <Link
              href={`/doctors/${doc.id}`}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setActiveMenuId(null)}
            >
              <Eye className="h-3.5 w-3.5 text-slate-400" />
              <span>View Details</span>
            </Link>

            {canUpdate && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  openEditDrawer(doc);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5 text-slate-400" />
                <span>Edit Profile</span>
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  openDeleteModal(doc);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                <span>Delete Doctor</span>
              </button>
            )}
          </TableActionMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Doctors Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage directory of certified medical practitioners and their patient rosters.
          </p>
        </div>

        {canCreate && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors focus:ring-2 focus:ring-slate-900/20"
            >
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              <span>Import CSV</span>
            </button>
            <button
              type="button"
              onClick={openCreateDrawer}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors focus:ring-2 focus:ring-slate-900/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add Doctor</span>
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <SearchInput
            defaultValue={search}
            onDebounce={(val) => setParams({ search: val || null })}
            placeholder="Search by doctor name, hospital..."
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

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={doctors}
          keyExtractor={(doc) => doc.id}
          isLoading={isLoading}
          isError={isError}
          error={(error as Error)?.message}
          onRetry={() => refetch()}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyState={
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 bg-slate-100 rounded-full mb-3 text-slate-400">
                <Stethoscope className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No doctors found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {activeChips.length > 0 || search
                  ? 'No doctors match your search filters. Try clearing some filters.'
                  : 'Start by registering doctors into the hospital management directory.'}
              </p>
              {canCreate && !search && activeChips.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateDrawer}
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add First Doctor
                </button>
              )}
            </div>
          }
        />
      </div>

      {/* Mobile Card View (Visible only on mobile < 768px) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`m-skel-${i}`}
              className="p-4 bg-white rounded-xl border border-slate-200 animate-pulse space-y-3"
            >
              <div className="h-5 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/3" />
            </div>
          ))
        ) : doctors.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <Stethoscope className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No doctors found</p>
            <p className="text-xs text-slate-400 mt-1">Adjust search or filters</p>
          </div>
        ) : (
          doctors.map((doc) => (
            <div
              key={doc.id}
              className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/doctors/${doc.id}`}
                    className="font-semibold text-sm text-slate-900 hover:text-teal-600 transition-colors"
                  >
                    {doc.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
                      {doc.specialization}
                    </span>
                    {doc.status === 'active' ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => openEditDrawer(doc)}
                      aria-label="Edit doctor"
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => openDeleteModal(doc)}
                      aria-label="Delete doctor"
                      className="p-2 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{doc.hospital}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{doc.patientCount} Patients</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <a href={`tel:${doc.phone}`} className="text-teal-600 hover:underline">
                    {doc.phone}
                  </a>
                </div>
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

      {/* Create / Edit Drawer */}
      <DoctorFormDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        doctor={editingDoctor}
        specializationSuggestions={specializations}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDoctorDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        doctor={doctorToDelete}
        onSuccess={() => refetch()}
      />

      {/* CSV Bulk Import Modal */}
      <DoctorImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default function DoctorsPage() {
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
      <DoctorsPageContent />
    </Suspense>
  );
}
