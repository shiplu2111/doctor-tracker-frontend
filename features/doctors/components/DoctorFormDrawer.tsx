'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createDoctorSchema, type CreateDoctorInput, type Doctor } from '@doctor-tracker/shared';
import { apiClient, ApiError } from '@/lib/api/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface DoctorFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  doctor?: Doctor | null;
  onSuccess?: () => void;
  specializationSuggestions?: string[];
}

export function DoctorFormDrawer({
  isOpen,
  onClose,
  doctor,
  onSuccess,
  specializationSuggestions = [],
}: DoctorFormDrawerProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(doctor);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateDoctorInput>({
    resolver: zodResolver(createDoctorSchema),
    defaultValues: {
      name: '',
      specialization: '',
      hospital: '',
      phone: '',
      email: '',
      status: 'active',
    },
  });

  const handleClose = () => {
    setServerError(null);
    setSuccessToast(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      if (doctor) {
        reset({
          name: doctor.name,
          specialization: doctor.specialization,
          hospital: doctor.hospital,
          phone: doctor.phone,
          email: doctor.email,
          status: doctor.status,
        });
      } else {
        reset({
          name: '',
          specialization: '',
          hospital: '',
          phone: '',
          email: '',
          status: 'active',
        });
      }
    }
  }, [isOpen, doctor, reset]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const onSubmit = async (values: CreateDoctorInput) => {
    setServerError(null);
    try {
      if (isEdit && doctor) {
        await apiClient<Doctor>(`/doctors/${doctor.id}`, {
          method: 'PATCH',
          body: JSON.stringify(values),
        });
        setSuccessToast('Doctor profile updated successfully');
      } else {
        await apiClient<Doctor>('/doctors', {
          method: 'POST',
          body: JSON.stringify(values),
        });
        setSuccessToast('Doctor onboarded successfully');
      }

      await queryClient.invalidateQueries({ queryKey: ['doctors'] });
      await queryClient.invalidateQueries({ queryKey: ['doctor-specializations'] });

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'DUPLICATE_EMAIL') {
          setError('email', {
            type: 'manual',
            message: 'A doctor with this email address already exists',
          });
          return;
        }
        if (err.details && Array.isArray(err.details)) {
          err.details.forEach((detail) => {
            const field = detail.path.split('.')[0] as keyof CreateDoctorInput;
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
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 id="drawer-title" className="text-lg font-semibold text-slate-900">
                {isEdit ? 'Edit Doctor Profile' : 'Add New Doctor'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit
                  ? 'Update doctor credentials and affiliations.'
                  : 'Enter professional details to register a doctor in the directory.'}
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

            {/* Doctor Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="e.g. Dr. Ayesha Rahman"
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

            {/* Specialization */}
            <div>
              <label
                htmlFor="specialization"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Specialization <span className="text-rose-500">*</span>
              </label>
              <input
                id="specialization"
                type="text"
                list="specialization-list"
                placeholder="e.g. Cardiology, Neurology"
                {...register('specialization')}
                className={cn(
                  'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors',
                  errors.specialization
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20',
                )}
              />
              {specializationSuggestions.length > 0 && (
                <datalist id="specialization-list">
                  {specializationSuggestions.map((spec) => (
                    <option key={spec} value={spec} />
                  ))}
                </datalist>
              )}
              {errors.specialization && (
                <p className="text-xs text-rose-600 mt-1">{errors.specialization.message}</p>
              )}
            </div>

            {/* Hospital */}
            <div>
              <label htmlFor="hospital" className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital / Clinic Affiliation <span className="text-rose-500">*</span>
              </label>
              <input
                id="hospital"
                type="text"
                placeholder="e.g. Square Hospital, Dhaka"
                {...register('hospital')}
                className={cn(
                  'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors',
                  errors.hospital
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20',
                )}
              />
              {errors.hospital && (
                <p className="text-xs text-rose-600 mt-1">{errors.hospital.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number (BD) <span className="text-rose-500">*</span>
              </label>
              <input
                id="phone"
                type="text"
                placeholder="+8801712345678 or 01712345678"
                {...register('phone')}
                className={cn(
                  'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors',
                  errors.phone
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20',
                )}
              />
              {errors.phone && (
                <p className="text-xs text-rose-600 mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="doctor@hospital.com"
                {...register('email')}
                className={cn(
                  'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors',
                  errors.email
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20',
                )}
              />
              {errors.email && (
                <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-xs font-semibold text-slate-700 mb-1">
                Active Status
              </label>
              <select
                id="status"
                {...register('status')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="active">Active (Accepting Patients)</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="text-xs text-rose-600 mt-1">{errors.status.message}</p>
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
                {isEdit ? 'Save Changes' : 'Create Doctor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
