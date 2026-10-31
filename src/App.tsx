import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './admin/AdminAuth';
import { AdminStoreProvider } from './admin/AdminStore';
import { Shell } from './admin/ui/Shell';
import { Logo } from './components/Logo';
import { ToastProvider } from './state/ToastContext';
import { theme } from './theme/theme';

// Every page is its own chunk.
const LoginPage = lazy(() => import('./admin/pages/LoginPage'));
const BriefPage = lazy(() => import('./admin/pages/BriefPage'));
const ReportsPage = lazy(() => import('./admin/pages/ReportsPage'));
const MembersPage = lazy(() => import('./admin/pages/MembersPage'));
const MemberPage = lazy(() => import('./admin/pages/MemberPage'));
const HealthPage = lazy(() => import('./admin/pages/HealthPage'));
const AIPage = lazy(() => import('./admin/pages/AIPage'));
const AuditPage = lazy(() => import('./admin/pages/AuditPage'));

function Splash() {
  return (
    <Box
      role="status"
      aria-label="Loading"
      sx={{ minHeight: '60dvh', display: 'grid', placeItems: 'center' }}
    >
      <Logo size={40} />
    </Box>
  );
}

/** Everything but /login needs an admin session; a deep link survives sign-in. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { session } = useAdminAuth();
  const location = useLocation();
  if (!session)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAdmin>
              <AdminStoreProvider>
                <Shell>
                  <Suspense fallback={<Splash />}>
                    <Routes>
                      <Route index element={<BriefPage />} />
                      <Route path="reports" element={<ReportsPage />} />
                      <Route path="reports/:id" element={<ReportsPage />} />
                      <Route path="members" element={<MembersPage />} />
                      <Route path="members/:id" element={<MemberPage />} />
                      <Route path="health" element={<HealthPage />} />
                      <Route path="ai" element={<AIPage />} />
                      <Route path="audit" element={<AuditPage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </Shell>
              </AdminStoreProvider>
            </RequireAdmin>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <AdminAuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AdminAuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
