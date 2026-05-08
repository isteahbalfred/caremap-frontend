import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch } from './store/hooks';
import { loadUser } from './store/slices/authSlice';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Spinner } from './components/ui/Spinner';

// Lazy loading des pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const HomePage = lazy(() => import('./pages/public/HomePage'));
const SearchPage = lazy(() => import('./pages/public/SearchPage'));
const PharmacyDashboard = lazy(() => import('./pages/pharmacy/PharmacyDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) dispatch(loadUser());
  }, [dispatch]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Pages publiques */}
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard Pharmacien */}
        <Route element={<ProtectedRoute role="PHARMACY_ADMIN" />}>
          <Route path="/pharmacy" element={<PharmacyDashboard />} />
        </Route>

        {/* Dashboard Admin */}
        <Route element={<ProtectedRoute role="SUPER_ADMIN" />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;