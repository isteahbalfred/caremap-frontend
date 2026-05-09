import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch } from './store/hooks';
import { loadUser } from './store/slices/authSlice';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Spinner } from './components/ui/Spinner';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const HomePage = lazy(() => import('./pages/public/HomePage'));
const SearchPage = lazy(() => import('./pages/public/SearchPage'));
const MapPage = lazy(() => import('./pages/public/MapPage'));
const PharmacyDashboard = lazy(() => import('./pages/pharmacy/PharmacyDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ClinicsPage = lazy(() => import('./pages/public/ClinicsPage'));

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
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/clinics" element={<ClinicsPage />} />

        <Route element={<ProtectedRoute role="PHARMACY_ADMIN" />}>
          <Route path="/pharmacy" element={<PharmacyDashboard />} />
        </Route>

        <Route element={<ProtectedRoute role="SUPER_ADMIN" />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;