import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataTable, Column } from './DataTable';

interface TestItem {
  id: string;
  name: string;
  role: string;
}

const mockColumns: Column<TestItem>[] = [
  { key: 'name', header: 'Name', sortable: true, render: (item) => item.name },
  { key: 'role', header: 'Role', sortable: false, render: (item) => item.role },
];

const mockData: TestItem[] = [
  { id: '1', name: 'Alice Smith', role: 'Doctor' },
  { id: '2', name: 'Bob Jones', role: 'Nurse' },
];

describe('DataTable Component', () => {
  it('renders loading skeleton rows when isLoading is true', () => {
    const { container } = render(
      <DataTable
        columns={mockColumns}
        data={[]}
        keyExtractor={(item) => item.id}
        isLoading={true}
      />
    );
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders empty state when data is empty and not loading', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={[]}
        keyExtractor={(item) => item.id}
        isLoading={false}
        emptyState={<div>No records found</div>}
      />
    );
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('renders data rows and headers correctly', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
        isLoading={false}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('triggers onSort when a sortable column header is clicked', () => {
    const handleSort = vi.fn();
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
        isLoading={false}
        sortBy="name"
        sortOrder="asc"
        onSort={handleSort}
      />
    );

    const sortButton = screen.getByRole('button', { name: 'Name' });
    fireEvent.click(sortButton);

    expect(handleSort).toHaveBeenCalledWith('name');
  });
});
