'use client';

import React, { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { type Doctor } from '@doctor-tracker/shared';
import { apiClient, ApiError } from '@/lib/api/api-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, UserCheck } from 'lucide-react';

interface DeleteDoctorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  onSuccess?: () => void;
}

export function DeleteDoctorDialog({
  isOpen,
  onClose,
  doctor,
  onSuccess,
}: DeleteDoctorDialogProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [reassignTo, setReassignTo] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasPatients = Boolean(doctor && doctor.patientCount > 0);

  // Fetch candidate doctors for reassignment if this doctor has patients
  const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ['active-doctors-for-reassign', doctor?.id],
    queryFn: async () => {
      const res = await apiClient<Doctor[]>('/doctors?limit=100&status=active');
      // Filter out current doctor
      return res.data.filter((d) => d.id !== doctor?.id);
    },
    enabled: isOpen && hasPatients,
  });

  const handleDelete = async () => {
    if (!doctor) return;
    setErrorMessage(null);

    if (hasPatients && !reassignTo) {
      setErrorMessage('Please select a doctor to reassign patients to.');
      return;
    }

    setIsDeleting(true);
    try {
      const endpoint = hasPatients
        ? `/doctors/${doctor.id}?reassignTo=${reassignTo}`
        : `/doctors/${doctor.id}`;

      await apiClient(endpoint, {
        method: 'DELETE',
      });

      await queryClient.invalidateQueries({ queryKey: ['doctors'] });
      await queryClient.invalidateQueries({ queryKey: ['patients'] });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to delete doctor. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!doctor) return null;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={hasPatients ? 'Reassign Patients & Delete Doctor' : 'Delete Doctor Profile'}
      description={
        hasPatients ? (
          <span>
            <strong className="text-slate-900">{doctor.name}</strong> currently has{' '}
            <span className="font-semibold text-rose-600">{doctor.patientCount} patient(s)</span>.
            Before deleting, all patients must be reassigned to another active doctor.
          </span>
        ) : (
          <span>
            Are you sure you want to permanently delete{' '}
            <strong className="text-slate-900">{doctor.name}</strong>? This action cannot be
            undone.
          </span>
        )
      }
      confirmText={hasPatients ? 'Reassign & Delete' : 'Delete Doctor'}
      cancelText="Cancel"
      variant="danger"
      isLoading={isDeleting}
      onConfirm={handleDelete}
      onCancel={() => {
        setErrorMessage(null);
        setReassignTo('');
        onClose();
      }}
    >
      {errorMessage && (
        <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {hasPatients && (
        <div className="space-y-3 pt-2">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
            <UserCheck className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-800">
              Select an active doctor to inherit all {doctor.patientCount} assigned patient records.
            </p>
          </div>

          <div>
            <label
              htmlFor="reassign-select"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Reassign Patients To: <span className="text-rose-500">*</span>
            </label>
            <select
              id="reassign-select"
              value={reassignTo}
              onChange={(e) => setReassignTo(e.target.value)}
              disabled={isLoadingCandidates || isDeleting}
              className="w-full text-xs font-medium py-2 px-3 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
            >
              <option value="">-- Choose replacement doctor --</option>
              {candidates?.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} ({candidate.specialization} - {candidate.hospital})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}
