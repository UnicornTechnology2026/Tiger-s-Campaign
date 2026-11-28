import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, Table2, X } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { config } from "../../lib/config";
import tigerBarrelLogo from "../../assest/logo-text.webp";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  {
    to: "/admin/records",
    label: "Customers & Winners",
    icon: Table2,
    end: false,
  },
];

export function AdminLayout() {
  const { signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  const sidebar = (
    <div className="admin-sidebar-bg flex h-full flex-col text-white">
      <div className="flex flex-col items-center px-5 py-5 text-center">
        <img
          src={tigerBarrelLogo}
          alt="Tiger's Barrel"
          className="h-14 w-auto max-w-full object-contain"
        />
        <p className="mt-1 text-xs text-white/60">Admin panel</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        {sidebar}
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="rounded-lg p-1.5 hover:bg-slate-100"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="font-display font-bold">
            {config.campaignName} · Admin
          </span>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
