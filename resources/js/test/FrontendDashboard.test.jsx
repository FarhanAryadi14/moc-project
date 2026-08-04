import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TableGrid from '../components/TableGrid';
import QueueList from '../components/QueueList';
import HistoryTable from '../components/HistoryTable';
import LiveTimer from '../components/LiveTimer';

const mockTables = [
  { id: 1, code: 'A', capacity: 2, status: 'available', color_status: 'hijau', active_session: null },
  {
    id: 2,
    code: 'B',
    capacity: 4,
    status: 'occupied',
    color_status: 'kuning',
    active_session: {
      id: 10,
      customer_name: 'Budi Test',
      party_size: 3,
      estimated_end_timestamp: Date.now() + 600000,
    },
  },
  { id: 3, code: 'C', capacity: 6, status: 'available', color_status: 'hijau', active_session: null },
  { id: 4, code: 'D', capacity: 8, status: 'available', color_status: 'hijau', active_session: null },
];

const mockQueue = [
  { priority_rank: 1, id: 101, customer_name: 'Large Party 6', party_size: 6, status: 'waiting', wait_time_minutes: 5 },
  { priority_rank: 2, id: 102, customer_name: 'Small Party 2', party_size: 2, status: 'waiting', wait_time_minutes: 10 },
];

const mockHistory = [
  { id: 1, customer_name: 'Alpha', party_size: 2, table_code: 'A', started_at: '2026-08-04T12:00:00Z', dining_duration_minutes: 20, status: 'completed' },
  { id: 2, customer_name: 'Zebra', party_size: 6, table_code: 'C', started_at: '2026-08-04T11:00:00Z', dining_duration_minutes: 60, status: 'force_completed' },
];

describe('Frontend Unit Tests (8 Fitur Requirement)', () => {
  // Test 1: Render Table Grid
  it('1. renders interactive restaurant table grid A(2), B(4), C(6), D(8)', () => {
    render(<TableGrid tables={mockTables} onDropParty={vi.fn()} onForceComplete={vi.fn()} />);

    expect(screen.getByTestId('table-card-A')).toBeInTheDocument();
    expect(screen.getByTestId('table-card-B')).toBeInTheDocument();
    expect(screen.getByTestId('table-card-C')).toBeInTheDocument();
    expect(screen.getByTestId('table-card-D')).toBeInTheDocument();
    expect(screen.getByText('Budi Test')).toBeInTheDocument();
  });

  // Test 2: Priority Queue Visualization
  it('2. visualizes priority-ordered queue with party size priority ranking', () => {
    render(
      <QueueList
        queue={mockQueue}
        onAutoServe={vi.fn()}
        onOpenArriveModal={vi.fn()}
        queueSearch=""
        setQueueSearch={vi.fn()}
      />
    );

    expect(screen.getByText('Large Party 6')).toBeInTheDocument();
    expect(screen.getByText('Small Party 2')).toBeInTheDocument();
    expect(screen.getByText('RANK #1')).toBeInTheDocument();
    expect(screen.getByText('RANK #2')).toBeInTheDocument();
  });

  // Test 3: Drag & Drop Validation
  it('3. supports drag and drop event handling', () => {
    const onDropParty = vi.fn();
    render(<TableGrid tables={mockTables} onDropParty={onDropParty} onForceComplete={vi.fn()} />);

    const tableA = screen.getByTestId('table-card-A');
    const dragData = JSON.stringify(mockQueue[1]);

    fireEvent.dragOver(tableA, {
      dataTransfer: {
        dropEffect: 'copy',
        getData: () => dragData,
      },
    });

    fireEvent.drop(tableA, {
      dataTransfer: {
        getData: () => dragData,
      },
    });

    expect(onDropParty).toHaveBeenCalledWith(mockQueue[1], mockTables[0]);
  });

  // Test 4: Live Date.now Timer
  it('4. calculates Date.now-based live countdown timer without drift', () => {
    const futureTimestamp = Date.now() + 120000; // 2 minutes from now
    render(<LiveTimer targetTimestampMs={futureTimestamp} />);

    const timerElement = screen.getByTestId('live-timer');
    expect(timerElement.textContent).toMatch(/02:00|01:59/);
  });

  // Test 5: Multi-column Header Sorting
  it('5. triggers multi-column sorting when clicking column headers', () => {
    const onSort = vi.fn();
    render(
      <HistoryTable
        historyItems={mockHistory}
        pagination={{ current_page: 1, last_page: 1, total: 2 }}
        search=""
        setSearch={vi.fn()}
        statusFilter=""
        setStatusFilter={vi.fn()}
        partySizeFilter=""
        setPartySizeFilter={vi.fn()}
        sortBy="created_at"
        sortDir="desc"
        onSort={onSort}
        onPageChange={vi.fn()}
      />
    );

    const nameHeader = screen.getByTestId('sort-customer_name');
    fireEvent.click(nameHeader);
    expect(onSort).toHaveBeenCalledWith('customer_name');
  });

  // Test 6: Search & Filter Controls
  it('6. provides search input & status filter controls', () => {
    const setSearch = vi.fn();
    const setStatusFilter = vi.fn();

    render(
      <HistoryTable
        historyItems={mockHistory}
        pagination={null}
        search="Alpha"
        setSearch={setSearch}
        statusFilter="completed"
        setStatusFilter={setStatusFilter}
        partySizeFilter=""
        setPartySizeFilter={vi.fn()}
        sortBy="created_at"
        sortDir="desc"
        onSort={vi.fn()}
        onPageChange={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText('Cari pelanggan / meja...');
    fireEvent.change(searchInput, { target: { value: 'Zebra' } });
    expect(setSearch).toHaveBeenCalledWith('Zebra');

    const statusSelect = screen.getByDisplayValue('Completed');
    fireEvent.change(statusSelect, { target: { value: 'force_completed' } });
    expect(setStatusFilter).toHaveBeenCalledWith('force_completed');
  });
});
