import { Navigate, Route, Routes } from 'react-router-dom';
import { isConfigured } from './lib/config';
import { ConfigError } from './components/common/ConfigError';
import { CampaignProvider } from './context/CampaignContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { StageGuard } from './components/customer/StageGuard';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';

import LandingPage from './pages/customer/LandingPage';
import RegisterPage from './pages/customer/RegisterPage';
import VerifyOtpPage from './pages/customer/VerifyOtpPage';
import SpinPage from './pages/customer/SpinPage';
import ResultPage from './pages/customer/ResultPage';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import RecordsPage from './pages/admin/RecordsPage';

export default function App() {
  if (!isConfigured) return <ConfigError />;

  return (
    <Routes>
      {/* Admin area: separate provider, separate Supabase session */}
      <Route
        path="/admin/*"
        element={
          <AdminAuthProvider>
            <Routes>
              <Route path="login" element={<AdminLoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="records" element={<RecordsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </AdminAuthProvider>
        }
      />

      {/* Customer area */}
      <Route
        path="/*"
        element={
          <CampaignProvider>
            <Routes>
              <Route index element={<LandingPage />} />
              <Route
                path="register"
                element={
                  <StageGuard allow={['unregistered', 'registered']}>
                    <RegisterPage />
                  </StageGuard>
                }
              />
              <Route
                path="verify"
                element={
                  <StageGuard allow={['registered']}>
                    <VerifyOtpPage />
                  </StageGuard>
                }
              />
              <Route
                path="spin"
                element={
                  <StageGuard allow={['verified']}>
                    <SpinPage />
                  </StageGuard>
                }
              />
              <Route
                path="result"
                element={
                  <StageGuard allow={['spun']}>
                    <ResultPage />
                  </StageGuard>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CampaignProvider>
        }
      />
    </Routes>
  );
}
