import React, { useState } from 'react';
import { Users, Clock, CheckCircle2, Power, UserCheck } from 'lucide-react';
import LiveTimer from './LiveTimer';

export default function TableCard({ table, onDropParty, onForceComplete }) {
  const [dragOverState, setDragOverState] = useState(null); // 'valid' | 'invalid' | null

  const isOccupied = table.status === 'occupied';
  const session = table.active_session;

  const getStatusBadge = () => {
    switch (table.color_status) {
      case 'hijau':
        return {
          label: 'Tersedia',
          style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
      case 'biru':
        return {
          label: 'Baru Seated',
          style: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          dot: 'bg-blue-500',
        };
      case 'kuning':
        return {
          label: 'Terisi',
          style: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
        };
      case 'merah':
        return {
          label: 'Hampir Selesai',
          style: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500 animate-ping',
        };
      default:
        return {
          label: table.status,
          style: 'bg-slate-800 text-slate-400 border-slate-700',
          dot: 'bg-slate-500',
        };
    }
  };

  const statusBadge = getStatusBadge();

  // Drag & Drop Handlers with Capacity Validation
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    const partyData = e.dataTransfer.getData('application/json');
    if (partyData) {
      try {
        const party = JSON.parse(partyData);
        if (!isOccupied && party.party_size <= table.capacity) {
          setDragOverState('valid');
        } else {
          setDragOverState('invalid');
        }
      } catch (err) {
        setDragOverState('invalid');
      }
    } else {
      setDragOverState(isOccupied ? 'invalid' : 'valid');
    }
  };

  const handleDragLeave = () => {
    setDragOverState(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOverState(null);

    const partyData = e.dataTransfer.getData('application/json');
    if (!partyData) return;

    try {
      const party = JSON.parse(partyData);
      onDropParty(party, table);
    } catch (err) {
      console.error('Failed to parse drag drop party data:', err);
    }
  };

  // Render Visual Chair Seats
  const renderSeats = () => {
    const seats = [];
    const seatedCount = isOccupied && session ? session.party_size : 0;

    for (let i = 0; i < table.capacity; i++) {
      const isTaken = i < seatedCount;
      seats.push(
        <span
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            isTaken
              ? 'bg-amber-400 border border-amber-300'
              : 'bg-slate-700 border border-slate-600'
          }`}
          title={isTaken ? `Kursi Terisi` : `Kursi Kosong`}
        />
      );
    }
    return seats;
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`pos-card pos-card-hover p-4 flex flex-col justify-between min-h-[210px] relative transition-all ${
        dragOverState === 'valid'
          ? 'border-emerald-500 bg-emerald-950/20 ring-2 ring-emerald-500/40'
          : dragOverState === 'invalid'
          ? 'border-rose-500 bg-rose-950/20 ring-2 ring-rose-500/40'
          : 'border-slate-800'
      }`}
      data-testid={`table-card-${table.code}`}
    >
      {/* Table Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white tracking-tight">
              Meja {table.code}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
              {table.capacity} Pax
            </span>
          </div>

          <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${statusBadge.style}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
            {statusBadge.label}
          </span>
        </div>

        {/* Chair Seat Visualizer */}
        <div className="flex items-center gap-1.5 mt-2">
          {renderSeats()}
        </div>
      </div>

      {/* Table Body Content */}
      <div className="my-3">
        {isOccupied && session ? (
          <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white flex items-center gap-1.5 truncate">
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                {session.customer_name}
              </span>
              <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                {session.party_size} Orang
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-slate-800/80">
              <span>Sisa Waktu:</span>
              <LiveTimer targetTimestampMs={session.estimated_end_timestamp} />
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-slate-800 rounded-lg p-3 text-center bg-slate-900/30">
            <p className="text-xs font-medium text-slate-400">Meja Siap Ditempati</p>            <p className="text-[10px] text-slate-500 mt-0.5">Drag antrean ke meja ini</p>
          </div>
        )}
      </div>

      {/* Table Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <span className="text-[11px] text-slate-500">
          {dragOverState === 'valid'
            ? 'Lepas untuk mendudukkan'
            : dragOverState === 'invalid'
            ? 'Kapasitas tidak cukup'
            : isOccupied
            ? 'Sesi Makan'
            : 'Kosong'}
        </span>

        {isOccupied && (
          <button
            onClick={() => onForceComplete(table)}
            className="px-2 py-1 rounded text-xs font-medium bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/20 transition-colors flex items-center gap-1"
            title="Selesaikan Sesi & Kosongkan Meja"
            data-testid={`force-complete-${table.code}`}
          >
            <Power className="w-3 h-3" />
            Selesaikan
          </button>
        )}
      </div>
    </div>
  );
}
