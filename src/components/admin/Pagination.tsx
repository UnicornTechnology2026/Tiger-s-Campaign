import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}

export function Pagination({ page, pageSize, total, onPage, onPageSize }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row">
      <p>
        Showing <span className="font-semibold">{from}</span>–<span className="font-semibold">{to}</span> of{' '}
        <span className="font-semibold">{total}</span>
      </p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          Rows
          <select
            className="admin-input !w-auto !py-1"
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg border border-slate-300 p-1.5 hover:bg-slate-50 disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-2 tabular-nums">
            {page} / {pages}
          </span>
          <button
            type="button"
            className="rounded-lg border border-slate-300 p-1.5 hover:bg-slate-50 disabled:opacity-40"
            disabled={page >= pages}
            onClick={() => onPage(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
