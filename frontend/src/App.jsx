import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, ToastProvider } from './context/AppContext';
import { Zap } from 'lucide-react';

// Seller pages
import SellerLayout   from './components/Layout';
import ComparePage    from './pages/ComparePage';
import DashboardPage  from './pages/DashboardPage';
import ShipmentsPage  from './pages/ShipmentsPage';
import CouriersPage   from './pages/CouriersPage';
import SettingsPage   from './pages/SettingsPage';

// Courier pages
import CourierLayout        from './components/CourierLayout';
import CourierDashboard     from './pages/courier/CourierDashboard';
import CourierBookingsPage  from './pages/courier/CourierBookingsPage';
import CourierAgentsPage    from './pages/courier/CourierAgentsPage';

// Auth pages (shared)
import AuthPage from './pages/AuthPage';

function Splash() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'var(--bg-base)' }}>
      <div style={{ width:48, height:48, borderRadius:14, background:'#4361ee', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Zap style={{ width:24, height:24, color:'white' }} fill="currentColor" />
      </div>
      <div style={{ width:20, height:20, border:'2px solid rgba(255,255,255,0.15)', borderTopColor:'#4361ee', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function AppRoutes() {
  const { user, company, loading } = useAuth();
  if (loading) return <Splash />;

  // Not logged in at all → auth page
  if (!user && !company) {
    return (
      <Routes>
        <Route path="/login"    element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="*"         element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Company logged in → courier portal
  if (company) {
    return (
      <Routes>
        <Route path="/" element={<CourierLayout />}>
          <Route index                  element={<CourierDashboard />} />
          <Route path="courier/bookings" element={<CourierBookingsPage />} />
          <Route path="courier/agents"   element={<CourierAgentsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // User (seller) logged in → ShipFast portal
  return (
    <Routes>
      <Route path="/" element={<SellerLayout />}>
        <Route index                  element={<Navigate to="/compare" replace />} />
        <Route path="compare"         element={<ComparePage />} />
        <Route path="dashboard"       element={<DashboardPage />} />
        <Route path="shipments"       element={<ShipmentsPage />} />
        <Route path="couriers"        element={<CouriersPage />} />
        <Route path="settings"        element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/compare" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
