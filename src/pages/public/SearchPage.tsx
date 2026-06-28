import { Medication, Category, MedicationStock } from "../../types";
import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { medicationService } from "../../services/medicationService";
import { Spinner } from "../../components/ui/Spinner";
import { Badge } from "../../components/ui/Badge";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");
  const LIMIT = 10;

  useEffect(() => {
    medicationService.getCategories().then(res => setCategories(res.data.data));
    const q = searchParams.get("q") || "";
    doSearch(q, "", "", 1, false, "");
  }, []);

  const doSearch = async (s: string, c: string, cat: string, p: number, stock: boolean, price: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await medicationService.getAll({ search: s, city: c, categoryId: cat, page: p, limit: LIMIT });
      let results: Medication[] = res.data.data;
      if (stock) {
        results = results.filter(med => med.stocks && med.stocks.some(s => s.quantity > 0));
      }
      if (price && Number(price) > 0) {
        results = results.filter(med => med.stocks && med.stocks.some(s => Number(s.price) <= Number(price)));
      }
      setMedications(results);
      setTotal(res.data.meta ? res.data.meta.total : 0);
      setTotalPages(res.data.meta ? res.data.meta.pages : 1);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    doSearch(search, city, categoryId, 1, inStockOnly, maxPrice);
  };

  const handleCategory = (id: string) => {
    setCategoryId(id);
    doSearch(search, city, id, 1, inStockOnly, maxPrice);
  };

  const handlePageChange = (newPage: number) => {
    doSearch(search, city, categoryId, newPage, inStockOnly, maxPrice);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStockFilter = () => {
    const newValue = !inStockOnly;
    setInStockOnly(newValue);
    doSearch(search, city, categoryId, 1, newValue, maxPrice);
  };

  const handleMaxPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxPrice(e.target.value);
  };

  const handleApplyPrice = () => {
    doSearch(search, city, categoryId, 1, inStockOnly, maxPrice);
  };

  const getStockLabel = (stock: MedicationStock) => {
    if (stock.quantity === 0) return "Rupture";
    if (stock.quantity <= stock.threshold) return "Stock faible";
    return "En stock";
  };

  const getStockVariant = (stock: MedicationStock) => {
    if (stock.quantity === 0) return "error";
    if (stock.quantity <= stock.threshold) return "warning";
    return "success";
  };

  const sortedMeds = [...medications].sort((a, b) => {
    if (sortBy === "price") {
      const aMin = a.stocks && a.stocks.length ? Math.min(...a.stocks.map(s => Number(s.price))) : 0;
      const bMin = b.stocks && b.stocks.length ? Math.min(...b.stocks.map(s => Number(s.price))) : 0;
      return aMin - bMin;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-primary-700 to-blue-600 text-white px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/" className="text-white/70 hover:text-white text-sm">Accueil</Link>
            <span className="text-white/40">/</span>
            <span className="text-white text-sm">Recherche medicaments</span>
          </div>
          <h1 className="text-3xl font-bold mb-6">Rechercher un medicament</h1>
          <form onSubmit={handleSearch}>
            <div className="bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl">
              <input
                type="text"
                className="flex-1 px-4 py-3 text-gray-800 rounded-xl outline-none text-base"
                placeholder="Nom du medicament..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <input
                type="text"
                className="md:w-44 px-4 py-3 text-gray-800 rounded-xl outline-none text-base"
                placeholder="Ville..."
                value={city}
                onChange={e => setCity(e.target.value)}
              />
              <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
                Rechercher
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <span className="text-sm text-gray-500 font-medium">Categorie :</span>
          <button
            onClick={() => handleCategory("")}
            className={"px-4 py-1.5 rounded-full text-sm font-medium transition-colors " + (!categoryId ? "bg-primary-600 text-white" : "bg-white text-gray-600 border border-gray-200")}
          >
            Toutes
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategory(cat.id)}
              className={"px-4 py-1.5 rounded-full text-sm font-medium transition-colors " + (categoryId === cat.id ? "bg-primary-600 text-white" : "bg-white text-gray-600 border border-gray-200")}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 mb-6 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="inStock"
              checked={inStockOnly}
              onChange={handleStockFilter}
              className="w-4 h-4 accent-primary-600 cursor-pointer"
            />
            <label htmlFor="inStock" className="text-sm text-gray-600 font-medium cursor-pointer">
              En stock uniquement
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Prix max :</span>
            <input
              type="number"
              className="w-28 px-3 py-1.5 text-gray-800 border border-gray-200 rounded-lg outline-none text-sm"
              placeholder="ex: 500"
              value={maxPrice}
              onChange={handleMaxPrice}
            />
            <span className="text-sm text-gray-400">HTG</span>
            <button
              onClick={handleApplyPrice}
              className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
            >
              Appliquer
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">Trier :</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none bg-white"
            >
              <option value="name">Nom A-Z</option>
              <option value="price">Prix croissant</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size="lg" />
            <p className="text-gray-500">Recherche en cours...</p>
          </div>
        )}

        {!loading && searched && (
          <div>
            <p className="text-gray-500 text-sm mb-4">
              <span className="font-semibold text-gray-700">{total}</span> medicament(s) trouve(s)
              {search && (
                <span> pour <span className="text-primary-600 font-medium">{search}</span></span>
              )}
              <span className="ml-2 text-gray-400">- Page {page} sur {totalPages}</span>
              {inStockOnly && <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">En stock uniquement</span>}
              {maxPrice && <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">Max {maxPrice} HTG</span>}
            </p>

            {medications.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun resultat</h3>
                <p className="text-gray-500">Aucun medicament trouve. Essayez avec un autre nom.</p>
              </div>
            )}

            {medications.length > 0 && (
              <div>
                <div className="space-y-4">
                  {sortedMeds.map(med => {
                    const minPrice = med.stocks && med.stocks.length
                      ? Math.min(...med.stocks.map(s => Number(s.price)))
                      : null;
                    return (
                      <div key={med.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div
                          className="p-5 border-b border-gray-50 cursor-pointer hover:bg-gray-50"
                          onClick={() => navigate("/medications/" + med.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-gray-900 text-xl">{med.name}</h3>
                                <Badge variant="info">{med.category ? med.category.name : ""}</Badge>
                              </div>
                              {med.genericName && (
                                <p className="text-sm text-gray-500">
                                  Generique : <span className="font-medium">{med.genericName}</span>
                                </p>
                              )}
                              <p className="text-xs text-primary-500 mt-2 font-medium">Voir le detail</p>
                            </div>
                            <div className="text-right">
                              {minPrice !== null ? (
                                <div>
                                  <div className="text-xs text-gray-400 mb-1">A partir de</div>
                                  <div className="text-2xl font-bold text-primary-600">
                                    {minPrice.toFixed(2)}
                                    <span className="text-sm font-normal text-gray-400"> HTG</span>
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="error">Non disponible</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {med.stocks && med.stocks.length > 0 ? (
                          <div className="divide-y divide-gray-50">
                            {med.stocks.map(stock => (
                              <div key={stock.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                  <p className="font-semibold text-gray-800">{stock.pharmacy ? stock.pharmacy.name : ""}</p>
                                  <p className="text-xs text-gray-500">{stock.pharmacy ? stock.pharmacy.city : ""} - {stock.pharmacy ? stock.pharmacy.address : ""}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-primary-600">{Number(stock.price).toFixed(2)} HTG</p>
                                  <Badge variant={getStockVariant(stock)}>{getStockLabel(stock)} ({stock.quantity})</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-5 py-4 text-sm text-red-400">Non disponible actuellement</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                    >
                      Precedent
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={"w-10 h-10 rounded-xl font-semibold " + (page === p ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-600")}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
