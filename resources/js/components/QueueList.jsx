import React from 'react';
import { Users, GripVertical, Play, Search, Clock, Plus, ArrowUpRight } from 'lucide-react';

export default function QueueList({ queue, onAutoServe, onOpenArriveModal, queueSearch, setQueueSearch }) {
  const filteredQueue = queue.filter((party) =>
    party.customer_name.toLowerCase().includes(queueSearch.toLowerCase()) ||
    party.party_size.toString().includes(queueSearch)
  );

  const handleDragStart = (e, party) => {
    e.dataTransfer.setData('application/json', JSON.stringify(party));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="pos-card p-4 flex flex-col justify-between h-full space-y-3">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Antrean Pelanggan
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {queue.length} Antrean
          </span>
        </div>

        {/* Subtitle Rule */}
        <p className="text-[11px] text-slate-400 mt-2">
          Prioritas: Party Terbesar dulu (Bukan FIFO)
        </p>

        {/* Action Bar */}
        <div className="flex items-center gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama / party..."
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={onOpenArriveModal}
            className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Check-In
          </button>
        </div>

        {/* Auto Serve Button */}
        {queue.length > 0 && (
          <button
            onClick={onAutoServe}
            className="w-full mt-2.5 py-2 px-3 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Play className="w-3 h-3 fill-current" />
            Dudukkan Prioritas Tertinggi ke Meja Kosong
          </button>
        )}

        {/* Queue Items List */}
        <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1" data-testid="queue-list">
          {filteredQueue.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-800 rounded-lg bg-slate-900/40">
              <p className="text-xs text-slate-400 font-medium">Antrean Kosong</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Klik "+ Check-In" untuk menambah antrean
              </p>
            </div>
          ) : (
            filteredQueue.map((party) => {
              const isTopPriority = party.priority_rank === 1;

              return (
                <div
                  key={party.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, party)}
                  className={`p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing flex items-center justify-between ${
                    isTopPriority
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                  data-testid={`queue-item-${party.id}`}
                >
                  <div className="flex items-center gap-2.5">
                    <GripVertical className="w-4 h-4 text-slate-600 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {party.customer_name}
                        </span>
                        {isTopPriority && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                            Prioritas 1
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-300">
                          {party.party_size} Orang
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3" />
                          Wait {party.wait_time_minutes} mnt
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      RANK #{party.priority_rank}
                    </span>
                    <p className="text-[9px] text-slate-500 mt-1">Drag ke Meja</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
