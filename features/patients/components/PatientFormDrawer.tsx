'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  createPatientSchema,
  type CreatePatientInput,
  type Patient,
  type Doctor,
} from '@doctor-tracker/shared';
import { apiClient, ApiError } from '@/lib/api/api-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface PatientFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  lockedDoctorId?: string;
  onSuccess?: () => void;
}

export function PatientFormDrawer({
  isOpen,
  onClose,
  patient,
  lockedDoctorId,
  onSuccess,
}: PatientFormDrawerProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(patient);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fetch active doctors for assignment
  const { data: doctors = [] } = useQuery({
    queryKey: ['active-doctors-list'],
    queryFn: async () => {
      const res = await apiClient<Doctor[]>('/doctors?limit=100&status=active');
      return res.data;
    },
    staleTime: 60 * 1000,
    enabled: isOpen,
  });

  // Fetch condition suggestions
  const { data: conditionSuggestions = [] } = useQuery({
    queryKey: ['patient-conditions'],
    queryFn: async () => {
      const res = await apiClient<string[]>('/patients/conditions');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreatePatientInput>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      name: '',
      age: 30,
      gender: 'male',
      condition: '',
      status: 'active',
      phone: '',
      email: '',
      notes: '',
      doctorId: lockedDoctorId || '',
    },
  });

  const handleClose = useCallback(() => {
    setServerError(null);
    setSuccessToast(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      if (patient) {
        reset({
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          condition: patient.condition,
          status: patient.status,
          phone: patient.phone || '',
          email: patient.email || '',
          notes: patient.notes || '',
          doctorId: patient.doctorId,
        });
      } else {
        reset({
          name: '',
          age: 30,
          gender: 'male',
          condition: '',
          status: 'active',
          phone: '',
          email: '',
          notes: '',
          doctorId: lockedDoctorId || '',
        });
      }
    }
  }, [isOpen, patient, lockedDoctorId, reset]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, handleClose]);

  const onSubmit = async (values: CreatePatientInput) => {
    setServerError(null);
    const targetDoctorId = lockedDoctorId || values.doctorId;

    if (!targetDoctorId) {
      setError('doctorId', { type: 'manual', message: 'Assigned doctor is required' });
      return;
    }

    try {
      if (isEdit && patient) {
        await apiClient<Patient>(`/patients/${patient.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...values,
            doctorId: targetDoctorId,
          }),
        });
        setSuccessToast('Patient record updated successfully');
      } else {
        await apiClient<Patient>('/patients', {
          method: 'POST',
          body: JSON.stringify({
            ...values,
            doctorId: targetDoctorId,
          }),
        });
        setSuccessToast('Patient admitted successfully');
      }

      await queryClient.invalidateQueries({ queryKey: ['patients'] });
      await queryClient.invalidateQueries({ queryKey: ['doctors'] });
      await queryClient.invalidateQueries({ queryKey: ['doctor-patients'] });
      await queryClient.invalidateQueries({ queryKey: ['patient-conditions'] });

      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 500);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'DOCTOR_INACTIVE') {
          setError('doctorId', {
            type: 'manual',
            message: 'Selected doctor is currently inactive. Please choose an active doctor.',
          });
          return;
        }
        if (err.details && Array.isArray(err.details)) {
          err.details.forEach((detail) => {
            const field = detail.path.split('.')[0] as keyof CreatePatientInput;
            if (field) {
              setError(field, { type: 'server', message: detail.message });
            }
          });
          return;
        }
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-patient-title"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 id="drawer-patient-title" className="text-lg font-semibold text-slate-900">
                {isEdit ? 'Edit Patient Record' : 'Admit New Patient'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit
                  ? 'Update medical status and doctor assignment.'
                  : 'Register a patient under an attending specialist.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Close drawer"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            {serverError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {successToast && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-start gap-2.5 text-xs text-teal-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
                <span>{successToast}</span>
              </div>
            )}

            {/* Doctor Assignment */}
            <div>
              <label htmlFor="doctorId" className="block text-xs font-semibold text-slate-700 mb-1">
                Attending Doctor <span className="text-rose-500">*</span>
              </label>
              {lockedDoctorId ? (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium">
                  Assigned to Current Doctor
                </div>
              ) : (
                <select
                  id="doctorId"
                  {...register('doctorId')}
                  className={cn(
                    'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 transition-colors',
                    errors.doctorId
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20',
                  )}
                >
                  <option value="">-- Select Active Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization} - {d.hospital})
                    </option>
                  ))}
                </select>
              )}
              {errors.doctorId && (
                <p className="text-xs text-rose-600 mt-1">{errors.doctorId.message}</p>
              )}
            </div>

            {/* Patient Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="e.g. Rahim Uddin"
                {...register('name')}
                className={cn(
                  'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors',
                  errors.name
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20',
                )}
              />
              {errors.name && (
                <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="age" className="block text-xs font-semibold text-slate-700 mb-1">
                  Age <span className="text-rose-500">*</span>
                </label>
                <input
                  id="age"
                  type="number"
                  min="0"
                  max="130"
                  {...register('age')}
                  className={cn(
                    'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors',
                    errors.age
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20',
                  )}
                />
                {errors.age && (
                  <p className="text-xs text-rose-600 mt-1">{errors.age.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  id="gender"
                  {...register('gender')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="text-xs text-rose-600 mt-1">{errors.gender.message}</p>
                )}
              </div>
            </div>

            {/* Medical Condition */}
            <div>
              <label htmlFor="condition" className="block text-xs font-semibold text-slate-700 mb-1">
                Condition / Diagnosis <span className="text-rose-500">*</span>
              </label>
              <input
                id="condition"
                type="text"
                list="condition-list"
                placeholder="e.g. Hypertension, Diabetes, Asthma"
                {...register('condition')}
                className={cn(
                  'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors',
                  errors.condition
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20',
                )}
              />
              {conditionSuggestions.length > 0 && (
                <datalist id="condition-list">
                  {conditionSuggestions.map((cond) => (
                    <option key={cond} value={cond} />
                  ))}
                </datalist>
              )}
              {errors.condition && (
                <p className="text-xs text-rose-600 mt-1">{errors.condition.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="status"
                {...register('status')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="active">Active (Under Treatment)</option>
                <option value="critical">Critical (Intensive Care)</option>
                <option value="recovered">Recovered</option>
                <option value="discharged">Discharged</option>
              </select>
              {errors.status && (
                <p className="text-xs text-rose-600 mt-1">{errors.status.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                id="phone"
                type="text"
                placeholder="+88017XXXXXXXX"
                {...register('phone')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="patient@example.com"
                {...register('email')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              {errors.email && (
                <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Notes / Allergies
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Medical history, prescriptions, allergy notes..."
                {...register('notes')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              {errors.notes && (
                <p className="text-xs text-rose-600 mt-1">{errors.notes.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs disabled:opacity-50 transition-colors focus:ring-2 focus:ring-slate-900/20"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Admit Patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
