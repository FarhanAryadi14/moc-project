import React from 'react';
import { History, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

export default function HistoryTable({
  historyItems,
  pagination,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  partySizeFilter,
  setPartySizeFilter,
  sortBy,
  sortDir,
  onSort,
  onPageChange,
}) {
  const columns = [
    { key: 'customer_name', label: 'Nama Pelanggan' },
    { key: 'party_size', label: 'Party Size' },
    { key: 'table_code', label: 'Meja' },
    { key: 'started_at', label: 'Waktu Duduk' },
    { key: 'duration', label: 'Durasi Makan' },
    { key: 'status', label: 'Status' },
  ];

  const getSortIcon = (colKey) => {
    if (sortBy !== colKey) return <ArrowUpDown className="w-3 h-3 text-slate-600" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-400 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-400 font-bold" />
    );
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="pos-card p-4 space-y-3">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Riwayat Sesi Makan
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari pelanggan / meja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-44 placeholder:text-slate-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Semua Status</option>
            <option value="completed">Completed</option>
            <option value="force_completed">Force Completed</option>
            <option value="active">Active</option>
          </select>

          <select
            value={partySizeFilter}
            onChange={(e) => setPartySizeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Semua Party</option>
            <option value="1">1 Orang</option>
            <option value="2">2 Orang</option>
            <option value="3">3 Orang</option>
            <option value="4">4 Orang</option>
            <option value="5">5 Orang</option>
            <option value="6">6 Orang</option>
            <option value="7">7 Orang</option>
            <option value="8">8 Orang</option>
          </select>
        </div>
      </div>

      {/* Table Grid */}
      <div className="overflow-x-auto rounded border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300" data-testid="history-table">
          <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSort(col.key)}
                  className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-800/80 transition-colors select-none"
                  data-testid={`sort-${col.key}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {getSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/20">
            {historyItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500 font-medium">
                  Tidak ada data riwayat yang ditemukan.
                </td>
              </tr>
            ) : (
              historyItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-bold text-white">
                    {item.customer_name}
                  </td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-300">
                    {item.party_size} Orang
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                      Meja {item.table_code}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-400 font-mono">
                    {formatTimestamp(item.started_at)}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-300 font-mono font-medium">
                    {item.dining_duration_minutes} Menit
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        item.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : item.status === 'force_completed'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-slate-400">
            Halaman {pagination.current_page} dari {pagination.last_page} ({pagination.total} data)
          </span>
          <div className="flex gap-1.5">
            <button
              disabled={pagination.current_page === 1}
              onClick={() => onPageChange(pagination.current_page - 1)}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              Sebelumnya
            </button>
            <button
              disabled={pagination.current_page === pagination.last_page}
              onClick={() => onPageChange(pagination.current_page + 1)}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
