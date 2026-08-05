import React, { useState, useEffect, useCallback } from 'react';
import TableGrid from './components/TableGrid';
import QueueList from './components/QueueList';
import HistoryTable from './components/HistoryTable';
import ArriveModal from './components/ArriveModal';
import { UtensilsCrossed, RefreshCw, CheckCircle, AlertCircle, LayoutGrid, Users, Plus, Radio } from 'lucide-react';

export default function Dashboard() {
  const [tables, setTables] = useState([]);
  const [queue, setQueue] = useState([]);
  const [summary, setSummary] = useState({ total_tables: 4, occupied_tables: 0, available_tables: 4, waiting_parties: 0 });
  const [historyItems, setHistoryItems] = useState([]);
  const [pagination, setPagination] = useState(null);

  // Filters & Sorting state
  const [queueSearch, setQueueSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [partySizeFilter, setPartySizeFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal & Toast state
  const [isArriveModalOpen, setIsArriveModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Status Data (/api/status)
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.success) {
        setTables(data.data.tables);
        setQueue(data.data.queue);
        setSummary(data.data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, []);

  // Fetch History Data (/api/history)
  const fetchHistory = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        page: currentPage,
        search: historySearch,
        status: statusFilter,
        party_size: partySizeFilter,
        sort_by: sortBy,
        sort_dir: sortDir,
      });

      const res = await fetch(`/api/history?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setHistoryItems(data.data.items);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, [currentPage, historySearch, statusFilter, partySizeFilter, sortBy, sortDir]);

  // Initial load & Polling interval (3 seconds)
  useEffect(() => {
    fetchStatus();
    fetchHistory();

    const interval = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchStatus, fetchHistory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStatus(), fetchHistory()]);
    setIsRefreshing(false);
  };

  // Arrive Customer (/api/arrive)
  const handleArrive = async (payload) => {
    try {
      const res = await fetch('/api/arrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        setIsArriveModalOpen(false);
        fetchStatus();
        fetchHistory();
      } else {
        showToast(data.message || 'Gagal menyimpan kedatangan', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi server.', 'error');
    }
  };

  // Serve or Drop Party (/api/serve)
  const handleDropParty = async (party, table) => {
    if (party.party_size > table.capacity) {
      showToast(`Party size ${party.party_size} orang melebihi kapasitas Meja ${table.code} (${table.capacity} pax).`, 'error');
      return;
    }

    if (table.status === 'occupied') {
      showToast(`Meja ${table.code} sedang terisi pelanggan lain.`, 'error');
      return;
    }

    try {
      const res = await fetch('/api/serve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          party_id: party.id,
          table_id: table.id,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        fetchStatus();
        fetchHistory();
      } else {
        showToast(data.message || 'Gagal mendudukkan party.', 'error');
      }
    } catch (err) {
      showToast('Gagal menghubungi server.', 'error');
    }
  };

  // Force Complete Table (/api/serve)
  const handleForceComplete = async (table) => {
    try {
      const res = await fetch('/api/serve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          force_complete_table_id: table.id,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        fetchStatus();
        fetchHistory();
      } else {
        showToast(data.message || 'Gagal force complete meja.', 'error');
      }
    } catch (err) {
      showToast('Gagal memproses force complete.', 'error');
    }
  };

  // Auto Serve Highest Priority (/api/serve)
  const handleAutoServe = async () => {
    try {
      const res = await fetch('/api/serve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        fetchStatus();
        fetchHistory();
      } else {
        showToast(data.message || 'Tidak ada meja/queue yang cocok.', 'error');
      }
    } catch (err) {
      showToast('Gagal auto-serve queue.', 'error');
    }
  };

  // Sorting Handler
  const handleSort = (colKey) => {
    if (sortBy === colKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(colKey);
      setSortDir('asc');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-5 max-w-[1500px] mx-auto text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 p-3.5 rounded-lg shadow-xl border flex items-center gap-2.5 transition-all ${
            toast.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-900 text-rose-400 border-rose-500/40'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.text}</span>
        </div>
      )}

      {/* POS Top Navbar */}
      <header className="pos-card p-4 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Resto Queue Control
              </h1>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                Live Sync
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh Data Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsArriveModalOpen(true)}
            className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Check-In Pelanggan
          </button>
        </div>
      </header>

      {/* POS Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="pos-card p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400">Total Meja</p>
            <p className="text-base font-bold text-white mt-0.5">{summary.total_tables} Meja</p>
          </div>
          <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400">
            <LayoutGrid className="w-4 h-4" />
          </div>
        </div>

        <div className="pos-card p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400">Meja Kosong</p>
            <p className="text-base font-bold text-emerald-400 mt-0.5">{summary.available_tables} Meja</p>
          </div>
          <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="pos-card p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400">Meja Terisi</p>
            <p className="text-base font-bold text-amber-400 mt-0.5">{summary.occupied_tables} Meja</p>
          </div>
          <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center text-amber-400">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
        </div>

        <div className="pos-card p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400">Antrean Waiting</p>
            <p className="text-base font-bold text-indigo-300 mt-0.5">{summary.waiting_parties} Party</p>
          </div>
          <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Table Layout (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <TableGrid
            tables={tables}
            onDropParty={handleDropParty}
            onForceComplete={handleForceComplete}
          />
        </div>

        {/* Right Column: Priority Waiting Queue (4 cols) */}
        <div className="lg:col-span-4">
          <QueueList
            queue={queue}
            onAutoServe={handleAutoServe}
            onOpenArriveModal={() => setIsArriveModalOpen(true)}
            queueSearch={queueSearch}
            setQueueSearch={setQueueSearch}
          />
        </div>
      </div>

      {/* Bottom Section: History Data Grid */}
      <div>
        <HistoryTable
          historyItems={historyItems}
          pagination={pagination}
          search={historySearch}
          setSearch={setHistorySearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          partySizeFilter={partySizeFilter}
          setPartySizeFilter={setPartySizeFilter}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Arrive Customer Modal */}
      <ArriveModal
        isOpen={isArriveModalOpen}
        onClose={() => setIsArriveModalOpen(false)}
        onSubmit={handleArrive}
      />
    </div>
  );
}
