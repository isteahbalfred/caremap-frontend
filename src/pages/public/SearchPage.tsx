import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { medicationService } from '../../services/medicationService';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');

  useEffect(() => {
    medicationService.getCategories().then(res => setCategories(res.data.data));
    // Recherche auto si paramètre URL
    if (searchParams.get('q')) {
      handleSearch(undefined, searchParams.get('q') || '');
    } else {
      // Charger tous les médicaments par défaut
      loadAll();
    }
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await medicationService.getAll({ limit: 20 });
      setMedications(res.data.data);
      setTotal(res.data.meta?.total || res.data.data.length);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, forceSearch?: string) => {
    e?.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const res = await medicationService.getAll({
        search: forceSearch ?? search,
        city,
        categoryId,
        limit: 50,
      });
      setMedications(res.data.data);
      setTotal(res.data.meta?.total || res.data.data.length);
    } finally {
      setLoading(false);
    }
  };

  const sortedMeds = [...medications].sort((a, b) => {
    if (sortBy === 'price') {
      const aMin = Math.min(...(a.stocks?.map((s: any) => Number(s.price)) || [0]));
      const bMin = Math.min(...(b.stocks?.map((s: any) => Number(s.price)) || [0]));
      return aMin - bMin;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-primary-700 to-blue-600 text-white px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/" className="text-white/70 hover:text-white text-sm transition-colors">
              ← Accueil
            </Link>
            <span className="text-white/40">›</span>
            <span className="text-white text-sm">Recherche médicaments</span>
          </div>
          <h1 className="text-3xl font-bold mb-6">
            💊 Rechercher un médicament
          </h1>

          {/* Barre de recherche principale */}
          <form onSubmit={handleSearch}>
            <div className="bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl">
              <input
                type="text"
                className="flex-1 px-4 py-3 text-gray-800 rounded-xl outline-none text-base"
                placeholder="Nom du médicament (ex: Doliprane, Amoxicilline...)"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <input
                type="text"
                className="md:w-44 px-4 py-3 text-gray-800 rounded-xl outline-none text-base border-l border-gray-100"
                placeholder="📍 Ville..."
                value={city}
                onChange={e => setCity(e.target.value)}
              />
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
              >
                Rechercher
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ── FILTRES ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <span className="text-sm text-gray-500 font-medium">Filtrer par :</span>

          {/* Catégories */}
          <button
            onClick={() => { setCategoryId(''); handleSearch(); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !categoryId
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
            }`}
          >
            Toutes
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setCategoryId(cat.id);
                setLoading(true);
                medicationService.getAll({ categoryId: cat.id, search, city, limit: 50 })
                  .then(res => { setMedications(res.data.data); setSearched(true); })
                  .finally(() => setLoading(false));
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoryId === cat.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
              }`}
            >
              {cat.name}
            </button>
          ))}

          {/* Tri */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">Trier :</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'name' | 'price')}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none bg-white"
            >
              <option value="name">Nom A-Z</option>
              <option value="price">Prix croissant</option>
            </select>
          </div>
        </div>

        {/* ── RÉSULTATS ───────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size="lg" />
            <p className="text-gray-500">Recherche en cours...</p>
          </div>
        ) : (
          <>
            {searched && (
              <p className="text-gray-500 text-sm mb-4">
                <span className="font-semibold text-gray-700">{medications.length}</span> médicament(s) trouvé(s)
                {search && <span> pour "<span className="text-primary-600 font-medium">{search}</span>"</span>}
              </p>
            )}

            {medications.length === 0 && searched ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun résultat</h3>
                <p className="text-gray-500">
                  Aucun médicament trouvé pour "{search}". Essayez avec un autre nom.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedMeds.map(med => (
                  <div key={med.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">

                    {/* En-tête médicament */}
                    <div className="p-5 border-b border-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-gray-900 text-xl">{med.name}</h3>
                            <Badge variant="info">{med.category?.name}</Badge>
                          </div>
                          {med.genericName && (
                            <p className="text-sm text-gray-500">
                              Générique : <span className="font-medium">{med.genericName}</span>
                            </p>
                          )}
                          {med.description && (
                            <p className="text-sm text-gray-400 mt-1">{med.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {med.stocks?.length > 0 ? (
                            <>
                              <div className="text-xs text-gray-400 mb-1">À partir de</div>
                              <div className="text-2xl font-bold text-primary-600">
                                {Math.min(...med.stocks.map((s: any) => Number(s.price))).toFixed(2)}
                                <span className="text-sm font-normal text-gray-400"> HTG</span>
                              </div>
                            </>
                          ) : (
                            <Badge variant="error">Non disponible</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pharmacies disponibles */}
                    {med.stocks?.length > 0 ? (
                      <div className="divide-y divide-gray-50">
                        {med.stocks.map((stock: any) => (
                          <div key={stock.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-lg">
                                🏪
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{stock.pharmacy?.name}</p>
                                <p className="text-xs text-gray-500">
                                  📍 {stock.pharmacy?.city} — {stock.pharmacy?.address}
                                </p>
                                <p className="text-xs text-gray-400">📞 {stock.pharmacy?.phone}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary-600">
                                  {Number(stock.price).toFixed(2)} HTG
                                </p>
                                <Badge variant={
                                  stock.quantity === 0 ? 'error' :
                                  stock.quantity <= stock.threshold ? 'warning' : 'success'
                                }>
                                  {stock.quantity === 0 ? '❌ Rupture' :
                                   stock.quantity <= stock.threshold ? `⚠️ Stock faible (${stock.quantity})` :
                                   `✅ En stock (${stock.quantity})`}
                                </Badge>
                              </div>
                              
                                href={`https://maps.google.com/?q=${stock.pharmacy?.latitude},${stock.pharmacy?.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-100 hover:bg-primary-100 rounded-lg transition-colors text-lg"
                                title="Voir sur Google Maps"
                              >
                                🗺️
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-5 py-4 text-sm text-red-400 flex items-center gap-2">
                        ❌ Non disponible dans les pharmacies partenaires actuellement
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}