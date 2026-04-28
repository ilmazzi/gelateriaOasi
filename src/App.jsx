import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from '@/components/ScrollToTop';
import AppErrorBoundary from '@/components/AppErrorBoundary';

import PublicLayout from '@/components/public/PublicLayout';
import Home from '@/pages/Home';
import MenuGelati from '@/pages/MenuGelati';
import Promozioni from '@/pages/Promozioni';
import Prenota from '@/pages/Prenota';
import Panini from '@/pages/Panini';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminGelati from '@/pages/admin/AdminGelati';
import AdminPromozioni from '@/pages/admin/AdminPromozioni';
import AdminFoto from '@/pages/admin/AdminFoto';
import AdminPrenotazioni from '@/pages/admin/AdminPrenotazioni';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminResetPassword from '@/pages/admin/AdminResetPassword';
import AdminPanini from '@/pages/admin/AdminPanini';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, isAdmin, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<MenuGelati />} />
        <Route path="/promozioni" element={<Promozioni />} />
        <Route path="/prenota" element={<Prenota />} />
        <Route path="/panini" element={<Panini />} />
      </Route>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/reset-password" element={<AdminResetPassword />} />
      <Route
        element={
          isAuthenticated && isAdmin ? (
            <AdminLayout />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/gelati" element={<AdminGelati />} />
        <Route path="/admin/panini" element={<AdminPanini />} />
        <Route path="/admin/promozioni" element={<AdminPromozioni />} />
        <Route path="/admin/foto" element={<AdminFoto />} />
        <Route path="/admin/prenotazioni" element={<AdminPrenotazioni />} />
       
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AppErrorBoundary>
            <AuthenticatedApp />
          </AppErrorBoundary>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App