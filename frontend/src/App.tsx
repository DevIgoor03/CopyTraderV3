import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster }            from 'react-hot-toast';
import { tokenStore }         from './services/api';
import LoginPage              from './pages/LoginPage.js';
import AdminLoginPage         from './pages/AdminLoginPage.js';
import DashboardPage          from './pages/DashboardPage.js';
import SuperAdminDashboardPage from './pages/SuperAdminDashboardPage.js';
import FollowerPortalPage     from './pages/FollowerPortalPage.js';
import TradersMarketplacePage from './pages/TradersMarketplacePage.js';
import { MARKETPLACE_TRADERS_ENABLED } from './config/features.js';

function MasterProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = tokenStore.getAccess();
  const user  = tokenStore.getUser();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = tokenStore.getAccess();
  const user  = tokenStore.getUser();
  if (!token) return <Navigate to="/admin/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const token = tokenStore.getAccess();
  const user  = tokenStore.getUser();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/dashboard"  element={<MasterProtectedRoute><DashboardPage /></MasterProtectedRoute>} />
        <Route path="/admin"       element={<AdminProtectedRoute><SuperAdminDashboardPage /></AdminProtectedRoute>} />
        <Route
          path="/traders"
          element={
            MARKETPLACE_TRADERS_ENABLED ? (
              <TradersMarketplacePage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/portal/:masterId" element={<FollowerPortalPage />} />
        <Route path="/portal" element={<Navigate to="/login" replace />} />
        <Route path="/"            element={<RootRedirect />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background:   'var(--surface)',
            color:        'var(--text-1)',
            border:       '1px solid var(--border)',
            borderRadius: '12px',
            fontSize:     '13px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  );
}
