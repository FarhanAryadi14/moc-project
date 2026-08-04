import React from 'react';
import { Clock } from 'lucide-react';
import { useExactTimer } from '../hooks/useExactTimer';

export default function LiveTimer({ targetTimestampMs, onExpire }) {
  const { formatted, remainingSec, isExpired } = useExactTimer(targetTimestampMs, onExpire);

  const isEndingSoon = remainingSec > 0 && remainingSec <= 300; // <= 5 mins

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-colors ${
        isExpired
          ? 'bg-rose-950/80 text-rose-300 border-rose-700/50 animate-pulse'
          : isEndingSoon
          ? 'bg-rose-950/60 text-rose-400 border-rose-800/40 animate-pulse'
          : 'bg-slate-900/80 text-amber-300 border-amber-500/30'
      }`}
      data-testid="live-timer"
    >
      <Clock className={`w-3.5 h-3.5 ${isEndingSoon ? 'text-rose-400' : 'text-amber-400'}`} />
      <span>{isExpired ? 'Waktu Habis' : formatted}</span>
    </div>
  );
}
