import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DoctorImportModal } from './DoctorImportModal';

const mockApiClient = vi.fn();
vi.mock('@/lib/api/api-client', () => ({
  apiClient: (...args: unknown[]) => mockApiClient(...args),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('DoctorImportModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload dropzone when opened', () => {
    const handleClose = vi.fn();
    renderWithClient(<DoctorImportModal isOpen={true} onClose={handleClose} />);

    expect(screen.getByText('Bulk Import Doctors')).toBeDefined();
    expect(screen.getByText(/Click to select CSV file or drag and drop/i)).toBeDefined();
    expect(screen.getByText(/Download Sample CSV Template/i)).toBeDefined();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const handleClose = vi.fn();
    renderWithClient(<DoctorImportModal isOpen={true} onClose={handleClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('parses uploaded CSV and renders preview rows', async () => {
    const handleClose = vi.fn();
    renderWithClient(<DoctorImportModal isOpen={true} onClose={handleClose} />);

    const csvContent =
      'name,specialization,hospital,phone,email\n' +
      'Dr. Test Valid,Cardiology,Square Hospital,01712345678,test.valid@example.com\n';

    const file = new File([csvContent], 'doctors.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('doctors.csv')).toBeDefined();
      expect(screen.getByText('Dr. Test Valid')).toBeDefined();
      expect(screen.getByText('Cardiology')).toBeDefined();
      expect(screen.getByText('Valid & Ready')).toBeDefined();
      expect(screen.getByRole('button', { name: /Import 1 Doctors/i })).toBeDefined();
    });
  });
});
