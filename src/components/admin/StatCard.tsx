import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  accent: string; // tailwind classes for the icon bubble
}

export function StatCard({ label, value, hint, icon: Icon, accent }: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
          <Icon size={22} />
        </span>
      </div>
    </div>
  );
}
