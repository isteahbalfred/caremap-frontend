import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { medicationService } from "../../services/medicationService";
import { Spinner } from "../../components/ui/Spinner";
import { Badge } from "../../components/ui/Badge";

export default function MedicationDetailPage() {
  const { id } = useParams();
  const [medication, setMedication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    medicationService.getById(id)
      .then(res => setMedication(res.data.data))
      .catch(() => setError("Medicament introuvable."))
      .finally(() => setLoading(false));
  }, [id]);

  const getStockLabel = (stock) => {
    if (stock.quantity === 0) return "Rupture";
    if (stock.quantity <= stock.threshold) return "Stock faible";
    return "En stock";
  };

  const getStockVariant = (stock) => {
    if (stock.quantity === 0) return "error";
    if (stock.quantity <= stock.threshold) return "warning";
    return "success";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !medication) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Medicament introuvable</h2>
          <Link to="/search" className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold">
            Retour a la recherche
          </Link>
        </div>
      </div>
    );
  }

  const minPrice = medication.stocks && medication.stocks.length > 0
    ? Math.min(...medication.stocks.map(s => Number(s.price)))
    : null;

  const availableStocks = medication.stocks ? medication.stocks.filter(s => s.quantity > 0) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-primary-700 to-blue-600 text-white px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6 text-sm">
            <Link to="/" className="text-white/70 hover:text-white">Accueil</Link>
            <span className="text-white/40">/</span>
            <Link to="/search" className="text-white/70 hover:text-white">Recherche</Link>
            <span className="text-white/40">/</span>
            <span className="text-white">{medication.name}</span>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">{medication.name}</h1>
              {medication.genericName && (
                <p className="text-white/70 text-sm mt-1">
                  Generique : {medication.genericName}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3">
                <Badge variant="info">{medication.category ? medication.category.name : ""}</Badge>
                <span className="text-white/60 text-sm">
                  {medication.stocks ? medication.stocks.length : 0} pharmacie(s)
                </span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl px-6 py-4 text-right">
              {minPrice !== null ? (
                <div>
                  <p className="text-white/60 text-sm mb-1">Prix le plus bas</p>
                  <p className="text-4xl font-bold">
                    {minPrice.toFixed(2)}
                    <span className="text-lg font-normal text-white/70"> HTG</span>
                  </p>
                </div>
              ) : (
                <Badge variant="error">Non disponible</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {medication.description && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Description</h2>
            <p className="text-gray-600 leading-relaxed">{medication.description}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="text-xl font-bold text-green-600">{availableStocks.length}</div>
            <div className="text-xs text-gray-400 mt-1">Pharmacies disponibles</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="text-xl font-bold text-primary-600">
              {minPrice ? minPrice.toFixed(2) + " HTG" : "N/A"}
            </div>
            <div className="text-xs text-gray-400 mt-1">Prix minimum</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="text-xl font-bold text-purple-600">
              {medication.category ? medication.category.name : "N/A"}
            </div>
            <div className="text-xs text-gray-400 mt-1">Categorie</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">
              Disponibilite dans les pharmacies
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {availableStocks.length} pharmacie(s) en stock
            </p>
          </div>
          {!medication.stocks || medication.stocks.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-500">Aucune pharmacie disponible.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {medication.stocks.map(stock => (
                <div key={stock.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">
                      {stock.pharmacy ? stock.pharmacy.name : ""}
                    </p>
                    <p className="text-sm text-gray-500">
                      {stock.pharmacy ? stock.pharmacy.city : ""} —{" "}
                      {stock.pharmacy ? stock.pharmacy.address : ""}
                    </p>
                    <p className="text-sm text-gray-400">
                      {stock.pharmacy ? stock.pharmacy.phone : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-600">
                      {Number(stock.price).toFixed(2)} HTG
                    </p>
                    <Badge variant={getStockVariant(stock)}>
                      {getStockLabel(stock)} ({stock.quantity})
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center pb-8">
          <Link
            to="/search"
            className="bg-white border border-gray-200 text-gray-600 font-semibold px-8 py-3 rounded-xl shadow-sm hover:bg-primary-50"
          >
            Retour a la recherche
          </Link>
        </div>
      </div>
    </div>
  );
}
