import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { Link } from 'react-router-dom';

export default function PharmacyDashboard() {
  const { user } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary-700">🗺️ CareMap</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            💊 {user?.firstName} {user?.lastName}
          </span>
          <button onClick={() => dispatch(logout())} className="text-sm text-red-500">
            Déconnexion
          </button>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Dashboard Pharmacien
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Médicaments', value: '—', icon: '💊' },
            { label: 'Stock faible', value: '—', icon: '⚠️' },
            { label: 'Ruptures', value: '—', icon: '❌' },
            { label: 'Visites', value: '—', icon: '👁️' },
          ].map(stat => (
            <div key={stat.label} className="card text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-primary-600">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <p className="text-gray-500 text-center py-8">
            Module de gestion de stock — En cours de développement 🚧
          </p>
        </div>
      </div>
    </div>
  );
}