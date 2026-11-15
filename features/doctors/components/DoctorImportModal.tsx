'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/lib/api/api-client';
import {
  createDoctorSchema,
  DoctorImportRow,
  DoctorImportSummary,
} from '@doctor-tracker/shared';

interface DoctorImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedRow {
  rowNumber: number;
  data: DoctorImportRow;
  isValid: boolean;
  error?: string;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map((h) =>
    h.trim().toLowerCase().replace(/['"]/g, ''),
  );

  const seenEmails = new Set<string>();
  const parsedRows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    if (values.length === 0 || values.every((v) => !v.trim())) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] ? values[idx].trim().replace(/^["']|["']$/g, '') : '';
    });

    const doctorData: DoctorImportRow = {
      name: rowObj.name || '',
      specialization: rowObj.specialization || '',
      hospital: rowObj.hospital || '',
      phone: rowObj.phone || '',
      email: (rowObj.email || '').toLowerCase(),
    };

    // Client-side Zod validation
    const parseResult = createDoctorSchema.safeParse(doctorData);
    let isValid = parseResult.success;
    let error = parseResult.success
      ? undefined
      : parseResult.error.issues.map((issue) => issue.message).join(', ');

    // Duplicate email within file check
    if (isValid) {
      if (seenEmails.has(doctorData.email)) {
        isValid = false;
        error = 'Duplicate email within this CSV file';
      } else {
        seenEmails.add(doctorData.email);
      }
    }

    parsedRows.push({
      rowNumber: i,
      data: doctorData,
      isValid,
      error,
    });
  }

  return parsedRows;
}

export function DoctorImportModal({
  isOpen,
  onClose,
  onSuccess,
}: DoctorImportModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importSummary, setImportSummary] = useState<DoctorImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setFileName(null);
    setRows([]);
    setIsSubmitting(false);
    setImportSummary(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const validRows = rows.filter((r) => r.isValid);
  const invalidRows = rows.filter((r) => !r.isValid);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setErrorMsg('Please select a valid .csv file.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseCSV(content);
      if (parsed.length === 0) {
        setErrorMsg('The selected CSV file contains no data rows or missing headers.');
        setRows([]);
      } else {
        setRows(parsed);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the file.');
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const csvContent =
      'name,specialization,hospital,phone,email\n' +
      'Dr. Ayesha Rahman,Cardiology,Square Hospital,01711223344,ayesha.rahman@example.com\n' +
      'Dr. Rafiqul Islam,Neurology,Dhaka Medical College,01822334455,rafiqul.islam@example.com\n' +
      'Dr. Fatima Begum,Pediatrics,United Hospital,01933445566,fatima.begum@example.com\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'doctors_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = async () => {
    if (validRows.length === 0) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        doctors: validRows.map((r) => r.data),
      };

      const res = await apiClient<DoctorImportSummary>('/doctors/import', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setImportSummary(res.data);

      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ['doctors'] });
      await queryClient.invalidateQueries({ queryKey: ['doctor-specializations'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to import doctors.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 id="import-modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Bulk Import Doctors
              </h2>
              <p className="text-xs text-slate-500">
                Upload a CSV file to add multiple doctors in a single batch.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success summary view */}
          {importSummary ? (
            <div className="space-y-4 py-4 text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-slate-900">Import Completed</h3>
                <p className="text-sm text-slate-500">
                  Successfully imported{' '}
                  <span className="font-semibold text-emerald-600">{importSummary.imported}</span> of{' '}
                  <span className="font-semibold text-slate-700">{importSummary.totalRows}</span> doctors.
                </p>
              </div>

              {importSummary.skipped > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-800 space-y-2">
                  <p className="font-semibold">
                    {importSummary.skipped} doctor{importSummary.skipped > 1 ? 's were' : ' was'} skipped due to errors:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 max-h-36 overflow-y-auto">
                    {importSummary.errors.map((err, idx) => (
                      <li key={idx}>
                        {err.row > 0 && <span className="font-mono font-medium">Row {err.row}: </span>}
                        {err.email && <span className="text-amber-900 font-medium">[{err.email}] </span>}
                        {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* File Upload Zone */}
              {!fileName ? (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-3"
                  >
                    <div className="p-3 bg-white rounded-full shadow-xs border border-slate-200 text-blue-600">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Click to select CSV file or drag and drop
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Must contain headers: name, specialization, hospital, phone, email
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleDownloadSample}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Sample CSV Template</span>
                    </button>
                    <span className="text-[11px] text-slate-400">Max 500 records per batch</span>
                  </div>
                </div>
              ) : (
                /* Preview Section */
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-slate-900">{fileName}</span>
                      <span className="text-xs text-slate-400">({rows.length} total rows)</span>
                    </div>
                    <button
                      type="button"
                      onClick={resetState}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Choose another file</span>
                    </button>
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs text-slate-500">Total Rows</span>
                      <p className="text-lg font-bold text-slate-900">{rows.length}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-xs text-emerald-600 font-medium">Valid & Ready</span>
                      <p className="text-lg font-bold text-emerald-700">{validRows.length}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 col-span-2 sm:col-span-1">
                      <span className="text-xs text-amber-600 font-medium">Invalid (Will be skipped)</span>
                      <p className="text-lg font-bold text-amber-700">{invalidRows.length}</p>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
                        <tr>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-3">Specialization</th>
                          <th className="py-2.5 px-3">Hospital</th>
                          <th className="py-2.5 px-3">Phone</th>
                          <th className="py-2.5 px-3">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((row) => (
                          <tr
                            key={row.rowNumber}
                            className={row.isValid ? 'hover:bg-slate-50/60' : 'bg-red-50/40'}
                          >
                            <td className="py-2.5 px-3">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Valid</span>
                                </span>
                              ) : (
                                <div className="inline-flex flex-col">
                                  <span className="inline-flex items-center gap-1 text-[11px] text-red-600 font-medium">
                                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                    <span>Error</span>
                                  </span>
                                  <span className="text-[10px] text-red-500 mt-0.5 max-w-[140px] truncate" title={row.error}>
                                    {row.error}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">{row.data.name || '—'}</td>
                            <td className="py-2.5 px-3 text-slate-600">{row.data.specialization || '—'}</td>
                            <td className="py-2.5 px-3 text-slate-600">{row.data.hospital || '—'}</td>
                            <td className="py-2.5 px-3 text-slate-600">{row.data.phone || '—'}</td>
                            <td className="py-2.5 px-3 text-slate-600">{row.data.email || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          {importSummary ? (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-200/50 transition-colors"
              >
                Cancel
              </button>
              {rows.length > 0 && (
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={validRows.length === 0 || isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs"
                >
                  {isSubmitting ? (
                    <span>Importing...</span>
                  ) : (
                    <>
                      <span>Import {validRows.length} Doctors</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
