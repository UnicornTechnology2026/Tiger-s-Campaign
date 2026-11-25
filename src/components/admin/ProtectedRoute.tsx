import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { FullPageSpinner } from '../common/Spinner';

/** Guards every /admin route except /admin/login. */
export function ProtectedRoute() {
  const { session, isAdmin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner label="Checking access…" />;
  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
