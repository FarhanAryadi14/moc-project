import React, { useState } from 'react';
import { X, UserPlus, Users } from 'lucide-react';

export default function ArriveModal({ isOpen, onClose, onSubmit }) {
  const [customerName, setCustomerName] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Nama pelanggan wajib diisi.');
      return;
    }
    if (partySize < 1 || partySize > 8) {
      setError('Jumlah party harus antara 1-8 orang.');
      return;
    }

    setError('');
    onSubmit({ customer_name: customerName, party_size: Number(partySize) });
    setCustomerName('');
    setPartySize(2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            Input Kedatangan Pelanggan
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nama Pelanggan / Party
            </label>
            <input
              type="text"
              placeholder="Contoh: Budi & Keluarga"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Jumlah Orang (Party Size)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPartySize(size)}
                  className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                    partySize === size
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-lg shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {size} Orang
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Sistem akan otomatis memilih meja terbaik (misal 3 orang &rarr; Meja B kapasitas 4).
            </p>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
            >
              Simpan & Check-In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
