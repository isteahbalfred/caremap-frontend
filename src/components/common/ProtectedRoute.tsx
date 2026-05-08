import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { Spinner } from '../ui/Spinner';

interface Props { role?: string; }

export function ProtectedRoute({ role }: Props) {
  const { user, isAuthenticated, loading } = useAppSelector(s => s.auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;

  return <Outlet />;
}