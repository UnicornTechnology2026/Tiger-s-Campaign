import { adminSupabase as sb } from "../lib/supabase";
import type {
  DashboardStats,
  RecordFilters,
  RecordRow,
  RedemptionStatus,
} from "../types";

export async function adminSignIn(email: string, password: string) {
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const ok = await checkIsAdmin();
  if (!ok) {
    await sb.auth.signOut();
    throw new Error("NOT_ADMIN");
  }
}

export async function adminSignOut() {
  await sb.auth.signOut();
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await sb.rpc("is_admin");
  return !error && data === true;
}

export async function fetchDashboard(): Promise<DashboardStats> {
  const { data, error } = await sb.rpc("admin_dashboard_stats");
  if (error) throw error;
  return data as DashboardStats;
}

function toParams(f: RecordFilters, limit: number, offset: number) {
  const from = f.dateFrom ? new Date(`${f.dateFrom}T00:00:00`) : null;
  let to: Date | null = null;
  if (f.dateTo) {
    to = new Date(`${f.dateTo}T00:00:00`);
    to.setDate(to.getDate() + 1); // inclusive end date
  }
  return {
    p_search: f.search.trim() || null,
    p_from: from ? from.toISOString() : null,
    p_to: to ? to.toISOString() : null,
    p_reward: f.reward || null,
    p_redemption: f.redemption || null,
    p_limit: limit,
    p_offset: offset,
  };
}

export async function fetchRecords(
  filters: RecordFilters,
  page: number,
  pageSize: number,
): Promise<{ rows: RecordRow[]; total: number }> {
  const { data, error } = await sb.rpc(
    "admin_list_records",
    toParams(filters, pageSize, (page - 1) * pageSize),
  );
  if (error) throw error;
  const rows = (data ?? []) as RecordRow[];
  return { rows, total: rows.length ? Number(rows[0].total_count) : 0 };
}

/** Pages through every record matching the filters (for CSV export). */
export async function fetchAllRecords(
  filters: RecordFilters,
  hardLimit = 50000,
): Promise<RecordRow[]> {
  const pageSize = 1000;
  const all: RecordRow[] = [];
  for (let offset = 0; offset < hardLimit; offset += pageSize) {
    const { data, error } = await sb.rpc(
      "admin_list_records",
      toParams(filters, pageSize, offset),
    );
    if (error) throw error;
    const rows = (data ?? []) as RecordRow[];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}

export async function setRedemption(spinId: string, status: RedemptionStatus) {
  const { error } = await sb.rpc("admin_set_redemption", {
    p_spin_id: spinId,
    p_status: status,
  });
  if (error) throw error;
}

export async function deleteCustomers(customerIds: string[]): Promise<number> {
  const { data, error } = await sb.rpc("admin_delete_customers", {
    p_customer_ids: customerIds,
  });
  if (error) throw error;
  return Number(data ?? 0);
}
