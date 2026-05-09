import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { adminService } from '../../services/adminService';
import { Link } from 'react-router-dom';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import ReportGenerator from './ReportGenerator';

export default function AdminDashboard() {
  const { user } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'pharmacies' | 'users'>('stats');

  const loadData = async () => {
    try {
      const [dashRes, pendingRes, usersRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getPendingPharmacies(),
        adminService.getUsers(),
      ]);
      setStats(dashRes.data.data.stats);
      setPending(pendingRes.data.data);
      setUsers(usersRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleValidate = async (id: string, validate: boolean) => {
    await adminService.validatePharmacy(id, validate);
    loadData();
  };

  const handleToggleUser = async (id: string) => {
    await adminService.toggleUser(id);
    loadData();
  };

  const tabs = [
    { key: 'stats', label: '📊 Statistiques' },
    { key: 'pharmacies', label: `🏪 Validations (${pending.length})` },
    { key: 'users', label: '👥 Utilisateurs' },
    { key: 'report', label: '📄 Rapport de Stage' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary-700">🗺️ CareMap</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">👑 {user?.firstName} — Super Admin</span>
          <button onClick={() => dispatch(logout())} className="text-sm text-red-500">
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Administrateur</h2>

        {/* Onglets */}
        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === t.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 border'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Stats */}
            {activeTab === 'stats' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Utilisateurs', value: stats?.totalUsers, icon: '👥' },
                  { label: 'Pharmacies totales', value: stats?.totalPharmacies, icon: '🏪' },
                  { label: 'Pharmacies validées', value: stats?.validatedPharmacies, icon: '✅' },
                  { label: 'En attente validation', value: stats?.pendingPharmacies, icon: '⏳' },
                  { label: 'Cliniques', value: stats?.totalClinics, icon: '🏥' },
                  { label: 'Médicaments', value: stats?.totalMedications, icon: '💊' },
                ].map(stat => (
                  <div key={stat.label} className="card text-center">
                    <div className="text-3xl mb-2">{stat.icon}</div>
                    <div className="text-3xl font-bold text-primary-600">{stat.value ?? 0}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Validation pharmacies */}
            {activeTab === 'pharmacies' && (
              <div className="space-y-4">
                {pending.length === 0 ? (
                  <div className="card text-center py-8 text-gray-400">
                    ✅ Aucune pharmacie en attente de validation
                  </div>
                ) : (
                  pending.map(p => (
                    <div key={p.id} className="card">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-800">{p.name}</h3>
                          <p className="text-sm text-gray-500">
                            📍 {p.address}, {p.city}
                          </p>
                          <p className="text-sm text-gray-500">📞 {p.phone}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            👤 {p.admin?.firstName} {p.admin?.lastName} — {p.admin?.email}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleValidate(p.id, true)}
                            className="text-sm"
                          >
                            ✅ Valider
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleValidate(p.id, false)}
                            className="text-sm"
                          >
                            ❌ Rejeter
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'report' && <ReportGenerator />}
            
            {/* Utilisateurs */}
            {activeTab === 'users' && (
              <div className="card">
                <div className="space-y-3">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium text-gray-800">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          u.role === 'SUPER_ADMIN' ? 'error' :
                          u.role === 'PHARMACY_ADMIN' ? 'info' : 'success'
                        }>
                          {u.role}
                        </Badge>
                        <Badge variant={u.isActive ? 'success' : 'error'}>
                          {u.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                        {u.role !== 'SUPER_ADMIN' && (
                          <Button
                            variant="secondary"
                            onClick={() => handleToggleUser(u.id)}
                            className="text-xs px-2 py-1"
                          >
                            Toggle
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}