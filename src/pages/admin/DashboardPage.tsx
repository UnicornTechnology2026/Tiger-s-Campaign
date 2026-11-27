import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { StatCard } from "../../components/admin/StatCard";
import { RewardCharts } from "../../components/admin/RewardCharts";
import { Spinner } from "../../components/common/Spinner";
import { fetchDashboard } from "../../services/adminService";
import { toMessage } from "../../lib/errors";
import type { DashboardStats } from "../../types";
import { rewardLabel } from "../../lib/wheel";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await fetchDashboard());
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Dashboard</h1>
          <p className="text-sm text-slate-500">Live campaign overview</p>
        </div>
        <button
          type="button"
          className="admin-btn"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? <Spinner className="h-4 w-4" /> : <RefreshCw size={16} />}{" "}
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {!stats && loading && (
        <div className="flex justify-center py-20 text-slate-500">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total registrations"
              value={stats.total_registrations}
              icon={Users}
              accent="bg-sky-100 text-sky-600"
            />
            <StatCard
              label="OTP verified"
              value={stats.verified_customers}
              hint={`${stats.total_registrations - stats.verified_customers} not verified`}
              icon={ShieldCheck}
              accent="bg-violet-100 text-violet-600"
            />
            <StatCard
              label="Total spins"
              value={stats.total_spins}
              icon={Trophy}
              accent="bg-amber-100 text-amber-600"
            />
            <StatCard
              label="Redeemed"
              value={stats.redeemed}
              hint={`${stats.pending} pending`}
              icon={CheckCircle2}
              accent="bg-emerald-100 text-emerald-600"
            />
          </div>

          <RewardCharts data={stats.distribution} />

          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="font-display text-base font-bold">
                Recent winners
              </h2>
              <Link
                to="/admin/records"
                className="text-sm font-semibold text-brand-600 hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5">Customer</th>
                    <th className="px-5 py-2.5">Mobile</th>
                    <th className="px-5 py-2.5">Reward</th>
                    <th className="px-5 py-2.5">Won at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recent_winners.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-10 text-center text-slate-400"
                      >
                        <Clock className="mx-auto mb-2" size={20} /> No winners
                        yet
                      </td>
                    </tr>
                  )}
                  {stats.recent_winners.map((w) => (
                    <tr key={w.claim_id}>
                      <td className="px-5 py-3 font-medium">{w.full_name}</td>
                      <td className="px-5 py-3 tabular-nums">{w.mobile}</td>
                      <td className="px-5 py-3 font-semibold">
                        {rewardLabel(w.reward)}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(w.spun_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
