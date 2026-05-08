import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

export default function HomePage() {
  const { user, isAuthenticated } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-700">🗺️ CareMap</h1>
        <div className="flex items-center gap-4">
          <Link to="/search" className="text-gray-600 hover:text-primary-500">
            Rechercher
          </Link>
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-500">
                {user?.firstName} ({user?.role})
              </span>
              {user?.role === 'SUPER_ADMIN' && (
                <Link to="/admin" className="btn-primary text-sm px-3 py-1.5">
                  Admin
                </Link>
              )}
              {user?.role === 'PHARMACY_ADMIN' && (
                <Link to="/pharmacy" className="btn-primary text-sm px-3 py-1.5">
                  Dashboard
                </Link>
              )}
              <button
                onClick={() => dispatch(logout())}
                className="text-sm text-red-500 hover:underline"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary text-sm px-3 py-1.5">
              Connexion
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-bold text-primary-700 mb-4">
          Trouvez vos médicaments
        </h2>
        <p className="text-xl text-gray-500 mb-8">
          Près de vous, en un clic — Haïti
        </p>
        <Link
          to="/search"
          className="inline-block bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
        >
          🔍 Rechercher un médicament
        </Link>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-6 pb-20 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { icon: '📍', title: 'Localiser', desc: 'Pharmacies proches' },
          { icon: '💊', title: 'Disponibilité', desc: 'Stock en temps réel' },
          { icon: '💰', title: 'Comparer', desc: 'Prix transparents' },
          { icon: '✅', title: 'Fiable', desc: 'Données vérifiées' },
        ].map(f => (
          <div key={f.title} className="card text-center">
            <div className="text-3xl mb-2">{f.icon}</div>
            <h3 className="font-semibold text-gray-800">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}