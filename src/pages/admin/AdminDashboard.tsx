import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { adminService } from '../../services/adminService';
import { Link } from 'react-router-dom';
import { Spinner } from '../../components/ui/Spinner';

export default function AdminDashboard() {
  const { user } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboard()
      .then(res => setStats(res.data.data.stats))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary-700">🗺️ CareMap</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            👑 {user?.firstName} — Super Admin
          </span>
          <button onClick={() => dispatch(logout())} className="text-sm text-red-500">
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Dashboard Administrateur
        </h2>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Utilisateurs', value: stats?.totalUsers, icon: '👥' },
              { label: 'Pharmacies totales', value: stats?.totalPharmacies, icon: '🏪' },
              { label: 'Pharmacies validées', value: stats?.validatedPharmacies, icon: '✅' },
              { label: 'En attente', value: stats?.pendingPharmacies, icon: '⏳' },
              { label: 'Cliniques', value: stats?.totalClinics, icon: '🏥' },
              { label: 'Médicaments', value: stats?.totalMedications, icon: '💊' },
            ].map(stat => (
              <div key={stat.label} className="card text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-primary-600">{stat.value ?? '—'}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}