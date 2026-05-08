import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { medicationService } from '../../services/medicationService';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';

export default function SearchPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const res = await medicationService.getAll({ search, city, limit: 20 });
      setMedications(res.data.data);
    } catch {
      setMedications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    medicationService.getAll({ limit: 10 }).then(res => {
      setMedications(res.data.data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-2xl font-bold text-primary-700">🗺️ CareMap</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-600">Recherche médicaments</span>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Formulaire recherche */}
        <form onSubmit={handleSearch} className="card mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🔍 Rechercher un médicament
          </h2>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              className="input flex-1"
              placeholder="Nom du médicament (ex: Doliprane)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <input
              type="text"
              className="input md:w-48"
              placeholder="Ville (ex: Port-au-Prince)"
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
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-4">
            {searched && (
              <p className="text-gray-500 text-sm">
                {medications.length} résultat(s) trouvé(s)
              </p>
            )}
            {medications.map(med => (
              <div key={med.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{med.name}</h3>
                    {med.genericName && (
                      <p className="text-sm text-gray-500">
                        Générique : {med.genericName}
                      </p>
                    )}
                    <Badge variant="info">{med.category?.name}</Badge>
                  </div>
                  <span className="text-sm text-gray-400">
                    {med.stocks?.length || 0} pharmacie(s)
                  </span>
                </div>

                {/* Pharmacies avec stock */}
                {med.stocks?.length > 0 ? (
                  <div className="space-y-2 mt-3">
                    {med.stocks.map((stock: any) => (
                      <div
                        key={stock.id}
                        className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {stock.pharmacy?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            📍 {stock.pharmacy?.city} — {stock.pharmacy?.address}
                          </p>
                          <p className="text-sm text-gray-500">
                            📞 {stock.pharmacy?.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary-600">
                            {Number(stock.price).toFixed(2)} HTG
                          </p>
                          <Badge variant={stock.quantity > stock.threshold ? 'success' : 'warning'}>
                            Stock: {stock.quantity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-red-400 mt-2">
                    ❌ Non disponible en pharmacie actuellement
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}