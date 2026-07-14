import type { ReactNode } from 'react';

export function StatCell({ label, value, colorClass = 'text-game-amber-700' }: {
  label: string; value: string | number; colorClass?: string;
}) {
  return (
    <div className="bg-white/90 rounded-btn p-2.5 text-center border border-logic-indigo-100">
      <div className="text-[10px] text-logic-indigo-500">{label}</div>
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}

export function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/80 rounded-lg p-2 border border-logic-indigo-100">
      <div className="text-logic-indigo-500 text-xs">{label}</div>
      <div className="font-mono font-semibold text-logic-indigo-800">{value}</div>
    </div>
  );
}

/** Status card shell — matches KnowledgeCard / search-tree viz indigo in Live Analysis. */
export function GameCard({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div className="rounded-card border border-logic-indigo-200/60 bg-logic-indigo-50/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-semibold text-logic-indigo-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}
