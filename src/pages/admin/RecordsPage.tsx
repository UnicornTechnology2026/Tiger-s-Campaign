import { useCallback, useEffect, useState } from "react";
import { Download, Search, X } from "lucide-react";
import { Pagination } from "../../components/admin/Pagination";
import { Spinner } from "../../components/common/Spinner";
import { useDebounce } from "../../hooks/useDebounce";
import {
  fetchAllRecords,
  fetchRecords,
  setRedemption,
} from "../../services/adminService";
import { downloadCsv, recordsToCsv } from "../../lib/csv";
import { toMessage } from "../../lib/errors";
import { WHEEL_SEGMENTS, rewardLabel } from "../../lib/wheel";
import type { RecordFilters, RecordRow, RedemptionStatus } from "../../types";

const EMPTY_FILTERS: RecordFilters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  reward: "",
  redemption: "",
};
const REWARD_OPTIONS = WHEEL_SEGMENTS.map((s) => s.reward);

export default function RecordsPage() {
  const [filters, setFilters] = useState<RecordFilters>(EMPTY_FILTERS);
  const debouncedSearch = useDebounce(filters.search);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [rows, setRows] = useState<RecordRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

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

  const onStatusChange = async (row: RecordRow, status: RedemptionStatus) => {
    if (!row.spin_id || status === row.redemption_status) return;
    setSavingId(row.spin_id);
    setError(null);
    try {
      await setRedemption(row.spin_id, status);
      await load();
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setSavingId(null);
    }
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
        <button
          type="button"
          className="admin-btn"
          onClick={() => void exportCsv()}
          disabled={exporting}
        >
          {exporting ? <Spinner className="h-4 w-4" /> : <Download size={16} />}{" "}
          Export CSV
        </button>
      </div>

      {/* filters */}
      <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="admin-input !pl-9"
            placeholder="Search name or mobile…"
            value={filters.search}
            onChange={(e) =>
              update({ reward: e.target.value as RecordFilters["reward"] })
            }
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
        <select
          className="admin-input"
          value={filters.redemption}
          onChange={(e) =>
            update({
              redemption: e.target.value as RecordFilters["redemption"],
            })
          }
          aria-label="Redemption filter"
        >
          <option value="">Any status</option>
          <option value="pending">Pending</option>
          <option value="redeemed">Redeemed</option>
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
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">OTP</th>
                <th className="px-4 py-3">Reward</th>
                <th className="px-4 py-3">Claim ID</th>
                <th className="px-4 py-3">Redemption</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-14 text-center text-slate-400"
                  >
                    No records found
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={r.spin_id ?? r.customer_id}
                  className="hover:bg-slate-50"
                >
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
                        Not spun
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.claim_id ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.spin_id && r.redemption_status ? (
                      <div className="flex items-center gap-2">
                        <select
                          className={`rounded-lg border px-2 py-1 text-xs font-semibold outline-none ${
                            r.redemption_status === "redeemed"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-amber-300 bg-amber-50 text-amber-700"
                          }`}
                          value={r.redemption_status}
                          disabled={savingId === r.spin_id}
                          onChange={(e) =>
                            void onStatusChange(
                              r,
                              e.target.value as RedemptionStatus,
                            )
                          }
                          aria-label={`Redemption status for ${r.full_name}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="redeemed">Redeemed</option>
                        </select>
                        {savingId === r.spin_id && (
                          <Spinner className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
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
    </div>
  );
}
