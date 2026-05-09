import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { Link } from 'react-router-dom';
import { pharmacyService } from '../../services/pharmacyService';
import { stockService } from '../../services/stockService';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import StockManagement from './StockManagement';

export default function PharmacyDashboard() {
  const { user } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  const [dashboard, setDashboard] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'stock'>('overview');

  useEffect(() => {
    Promise.all([
      pharmacyService.getDashboard(),
      stockService.getAlerts(),
    ]).then(([dashRes, alertRes]) => {
      setDashboard(dashRes.data.data);
      setAlerts(alertRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary-700">🗺️ CareMap</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            💊 {user?.firstName} {user?.lastName}
          </span>
          <button onClick={() => dispatch(logout())} className="text-sm text-red-500 hover:underline">
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Pharmacie info */}
            {dashboard?.pharmacy && (
              <div className="card mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      🏪 {dashboard.pharmacy.name}
                    </h2>
                    <p className="text-gray-500">
                      📍 {dashboard.pharmacy.address}, {dashboard.pharmacy.city}
                    </p>
                    <p className="text-gray-500">📞 {dashboard.pharmacy.phone}</p>
                  </div>
                  <Badge variant={dashboard.pharmacy.isValidated ? 'success' : 'warning'}>
                    {dashboard.pharmacy.isValidated ? '✅ Validée' : '⏳ En attente'}
                  </Badge>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Médicaments', value: dashboard?.stats?.totalMedications, icon: '💊' },
                { label: 'Disponibles', value: dashboard?.stats?.availableMedications, icon: '✅' },
                { label: 'Stock faible', value: alerts?.totalAlerts, icon: '⚠️' },
                { label: 'Ruptures', value: alerts?.outOfStock?.length, icon: '❌' },
              ].map(stat => (
                <div key={stat.label} className="card text-center">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-2xl font-bold text-primary-600">{stat.value ?? 0}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Alertes */}
            {alerts?.lowStock?.length > 0 && (
              <div className="card mb-6 border-l-4 border-yellow-400">
                <h3 className="font-semibold text-yellow-700 mb-3">
                  ⚠️ Alertes stock faible ({alerts.lowStock.length})
                </h3>
                <div className="space-y-2">
                  {alerts.lowStock.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.medication.name}</span>
                      <span className="text-yellow-600 font-medium">
                        {item.quantity} restant(s) / Seuil: {item.threshold}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Onglets */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-600 border'
                }`}
              >
                Vue générale
              </button>
              <button
                onClick={() => setActiveTab('stock')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'stock'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-600 border'
                }`}
              >
                Gestion Stock
              </button>
            </div>

            {activeTab === 'stock' && <StockManagement />}

            {activeTab === 'overview' && (
              <div className="card">
                <h3 className="font-semibold text-gray-700 mb-4">
                  Médicaments en stock
                </h3>
                {dashboard?.pharmacy?.medications?.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    Aucun médicament — allez dans "Gestion Stock" pour en ajouter
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dashboard?.pharmacy?.medications?.map((m: any) => (
                      <div key={m.id} className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-700">{m.medication?.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-primary-600 font-medium">
                            {Number(m.price).toFixed(2)} HTG
                          </span>
                          <Badge variant={m.isAvailable ? 'success' : 'error'}>
                            {m.quantity} unités
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}