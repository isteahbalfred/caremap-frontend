import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clinicService } from '../../services/clinicService';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  const loadClinics = (s = '', c = '') => {
    setLoading(true);
    clinicService.getAll({ search: s, city: c, limit: 20 })
      .then(res => setClinics(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadClinics(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadClinics(search, city);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-2xl font-bold text-primary-700">🗺️ CareMap</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-600">Cliniques</span>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Recherche */}
        <form onSubmit={handleSearch} className="card mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🏥 Trouver une clinique
          </h2>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              className="input flex-1"
              placeholder="Nom de la clinique..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <input
              type="text"
              className="input md:w-48"
              placeholder="Ville..."
              value={city}
              onChange={e => setCity(e.target.value)}
            />
            <button type="submit" className="btn-primary px-6">
              Rechercher
            </button>
          </div>
        </form>

        {/* Résultats */}
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">{clinics.length} clinique(s) trouvée(s)</p>
            {clinics.length === 0 ? (
              <div className="card text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">🏥</p>
                <p>Aucune clinique trouvée</p>
              </div>
            ) : (
              clinics.map(clinic => (
                <div key={clinic.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900 text-lg">
                          🏥 {clinic.name}
                        </h3>
                        <Badge variant="success">Validée</Badge>
                      </div>
                      <p className="text-gray-600">
                        📍 {clinic.address}, {clinic.city}
                      </p>
                      <p className="text-gray-600">📞 {clinic.phone}</p>
                      {clinic.admin && (
                        <p className="text-sm text-gray-400 mt-1">
                          Contact : {clinic.admin.firstName} {clinic.admin.lastName}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <p>Lat: {clinic.latitude?.toFixed(4)}</p>
                      <p>Lng: {clinic.longitude?.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}