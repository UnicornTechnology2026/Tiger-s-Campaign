import { useCallback, useEffect, useState } from "react";
import { Download, Search, Trash2, X } from "lucide-react";
import { Pagination } from "../../components/admin/Pagination";
import { Spinner } from "../../components/common/Spinner";
import { useDebounce } from "../../hooks/useDebounce";
import {
  deleteCustomers,
  fetchAllRecords,
  fetchRecords,
} from "../../services/adminService";
import { downloadCsv, recordsToCsv } from "../../lib/csv";
import { toMessage } from "../../lib/errors";
import { rewardLabel, REWARD_KEYS } from "../../lib/wheel";
import type { RecordFilters, RecordRow } from "../../types";

const EMPTY_FILTERS: RecordFilters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  reward: "",
  redemption: "",
};
const REWARD_OPTIONS = REWARD_KEYS;

export default function RecordsPage() {
  const [filters, setFilters] = useState<RecordFilters>(EMPTY_FILTERS);
  const debouncedSearch = useDebounce(filters.search);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [rows, setRows] = useState<RecordRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // selection + delete confirmation
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const effective: RecordFilters = { ...filters, search: debouncedSearch };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRecords(effective, page, pageSize);
      if (res.rows.length === 0 && page > 1) {
        setPage(1); // filters narrowed below the current page
        return;
      }
      setRows(res.rows);
      setTotal(res.total);
      setSelected(new Set()); // clear selection whenever the list reloads
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    filters.dateFrom,
    filters.dateTo,
    filters.reward,
    filters.redemption,
    page,
    pageSize,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (patch: Partial<RecordFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const exportCsv = async () => {
    setExporting(true);
    setError(null);
    try {
      const all = await fetchAllRecords(effective);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`campaign-records-${stamp}.csv`, recordsToCsv(all));
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setExporting(false);
    }
  };

  // ---- selection helpers ----
  const allSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.customer_id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(
      allSelected ? new Set() : new Set(rows.map((r) => r.customer_id)),
    );

  const selectedRows = rows.filter((r) => selected.has(r.customer_id));

  const confirmDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteCustomers(selectedRows.map((r) => r.customer_id));
      setConfirmOpen(false);
      await load();
    } catch (e) {
      setConfirmOpen(false);
      setError(toMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            Customers &amp; Winners
          </h1>
          <p className="text-sm text-slate-500">
            Search, filter and manage reward redemption
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 size={16} /> Delete ({selected.size})
            </button>
          )}
          <button
            type="button"
            className="admin-btn"
            onClick={() => void exportCsv()}
            disabled={exporting}
          >
            {exporting ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Download size={16} />
            )}{" "}
            Export CSV
          </button>
        </div>
      </div>

      {/* filters */}
      <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="admin-input !pl-9"
            placeholder="Search name or mobile…"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            aria-label="Search by name or mobile"
          />
        </div>
        <input
          type="date"
          className="admin-input"
          value={filters.dateFrom}
          max={filters.dateTo || undefined}
          onChange={(e) => update({ dateFrom: e.target.value })}
          aria-label="Registered from"
        />
        <input
          type="date"
          className="admin-input"
          value={filters.dateTo}
          min={filters.dateFrom || undefined}
          onChange={(e) => update({ dateTo: e.target.value })}
          aria-label="Registered to"
        />
        <select
          className="admin-input"
          value={filters.reward}
          onChange={(e) =>
            update({ reward: e.target.value as RecordFilters["reward"] })
          }
          aria-label="Reward filter"
        >
          <option value="">All rewards</option>
          {REWARD_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {rewardLabel(r)}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline sm:col-span-2 lg:col-span-6"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setPage(1);
            }}
          >
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {/* table */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {loading && (
          <div
            className="absolute inset-x-0 top-0 z-10 h-1 animate-pulse bg-brand-500"
            aria-hidden="true"
          />
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-red-600"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    disabled={rows.length === 0}
                    aria-label="Select all rows on this page"
                  />
                </th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">OTP</th>
                <th className="px-4 py-3">Reward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-14 text-center text-slate-400"
                  >
                    No records found
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const isSelected = selected.has(r.customer_id);
                return (
                  <tr
                    key={r.spin_id ?? r.customer_id}
                    className={
                      isSelected ? "bg-red-50/60" : "hover:bg-slate-50"
                    }
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-red-600"
                        checked={isSelected}
                        onChange={() => toggleOne(r.customer_id)}
                        aria-label={`Select ${r.full_name}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{r.full_name}</td>
                    <td className="px-4 py-3 tabular-nums">{r.mobile}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(r.registered_at).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          r.otp_verified
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.otp_verified ? "Verified" : "Not verified"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {r.reward ? (
                        rewardLabel(r.reward)
                      ) : (
                        <span className="font-normal text-slate-400">
                          Not spin
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPage={setPage}
          onPageSize={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      </div>

      {/* delete confirmation dialog */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => !deleting && setConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-100 p-2 text-red-600">
                <Trash2 size={20} />
              </div>
              <div className="min-w-0">
                <h2 id="delete-title" className="text-lg font-bold">
                  Delete {selectedRows.length}{" "}
                  {selectedRows.length === 1 ? "customer" : "customers"}?
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  This permanently removes the customer
                  {selectedRows.length === 1 ? "" : "s"} and their spin result
                  from the database. This cannot be undone.
                </p>
                <ul className="mt-3 max-h-32 space-y-1 overflow-y-auto rounded-lg bg-slate-50 p-3 text-sm">
                  {selectedRows.map((r) => (
                    <li key={r.customer_id} className="truncate">
                      <span className="font-medium">{r.full_name}</span>{" "}
                      <span className="text-slate-500">· {r.mobile}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                onClick={() => void confirmDelete()}
                disabled={deleting}
              >
                {deleting && <Spinner className="h-4 w-4" />} Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
