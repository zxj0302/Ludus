import type { ReactNode } from 'react';

export function StatCell({ label, value, colorClass = 'text-game-amber-700' }: {
  label: string; value: string | number; colorClass?: string;
}) {
  return (
    <div className="bg-white rounded-btn p-2.5 text-center border border-warm-stone-200">
      <div className="text-[10px] text-warm-stone-500">{label}</div>
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}

export function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-warm-stone-50 rounded-lg p-2">
      <div className="text-warm-stone-500 text-xs">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  );
}

export function GameCard({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div className="rounded-card border border-warm-stone-200 bg-warm-stone-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-semibold text-warm-stone-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}
