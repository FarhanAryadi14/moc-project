import React from 'react';
import TableCard from './TableCard';
import { LayoutGrid } from 'lucide-react';

export default function TableGrid({ tables = [], onDropParty, onForceComplete }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Denah Meja Restoran
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Kosong</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Terisi</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Hampir Selesai</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" data-testid="table-grid">
        {tables.length === 0 ? (
          <div className="col-span-full py-10 text-center pos-card border-dashed">
            <p className="text-xs text-slate-400 font-medium">Memuat data meja...</p>
          </div>
        ) : (
          tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onDropParty={onDropParty}
              onForceComplete={onForceComplete}
            />
          ))
        )}
      </div>
    </div>
  );
}
