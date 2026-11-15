'use client';

import React, { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { type Patient } from '@doctor-tracker/shared';
import { apiClient, ApiError } from '@/lib/api/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';

interface DeletePatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess?: () => void;
}

export function DeletePatientDialog({
  isOpen,
  onClose,
  patient,
  onSuccess,
}: DeletePatientDialogProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!patient) return;
    setErrorMessage(null);
    setIsDeleting(true);

    try {
      await apiClient(`/patients/${patient.id}`, {
        method: 'DELETE',
      });

      await queryClient.invalidateQueries({ queryKey: ['patients'] });
      await queryClient.invalidateQueries({ queryKey: ['doctors'] });
      await queryClient.invalidateQueries({ queryKey: ['doctor-patients'] });

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to delete patient record. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!patient) return null;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Discharge & Delete Patient"
      description={
        <span>
          Are you sure you want to remove the medical record for{' '}
          <strong className="text-slate-900">{patient.name}</strong>? This action cannot be
          undone.
        </span>
      }
      confirmText="Delete Record"
      cancelText="Cancel"
      variant="danger"
      isLoading={isDeleting}
      onConfirm={handleDelete}
      onCancel={() => {
        setErrorMessage(null);
        onClose();
      }}
    >
      {errorMessage && (
        <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </ConfirmDialog>
  );
}
