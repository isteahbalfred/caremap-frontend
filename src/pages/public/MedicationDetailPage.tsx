import { Medication, MedicationStock } from "../../types";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { medicationService } from "../../services/medicationService";
import { Spinner } from "../../components/ui/Spinner";
import { Badge } from "../../components/ui/Badge";
import { ContactButtons } from "../../components/common/ContactButtons";
import { AskAssistantButton } from "../../components/common/AskAssistantButton";
import { RecentSearches } from "../../components/common/RecentSearches";
import { searchHistoryService, getActiveUserId } from "../../services/searchHistoryService";

export default function MedicationDetailPage() {
  const { id } = useParams();
  const [medication, setMedication] = useState<Medication | null>(null);
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

  // Historique de recherche : on enregistre la consultation de cette fiche
  // une fois le médicament chargé avec succès (uniquement si connecté).
  useEffect(() => {
    if (!medication || !id) return;
    const userId = getActiveUserId();
    if (userId === 'guest') return;
    searchHistoryService.add(userId, {
      type: 'medication',
      label: medication.name,
      subtitle: medication.category ? medication.category.name : undefined,
      url: `/medication/${id}`,
    });
  }, [medication, id]);

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
  const isTotallyUnavailable = !medication.stocks || medication.stocks.length === 0 || availableStocks.length === 0;

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
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <Badge variant="info">{medication.category ? medication.category.name : ""}</Badge>
                <span className="text-white/60 text-sm">
                  {medication.stocks ? medication.stocks.length : 0} pharmacie(s)
                </span>
                {/* Point 6 : bouton pour demander à l'assistant des infos sur ce médicament */}
                <AskAssistantButton
                  message={`Parle-moi du médicament "${medication.name}" : à quoi sert-il, et où puis-je le trouver ?`}
                  label="Demander à l'assistant"
                  className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20"
                />
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

        {/* Point 3 : si le médicament n'est disponible nulle part, on propose une alternative */}
        {isTotallyUnavailable && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
            <p className="text-2xl">😕</p>
            <p className="font-semibold text-gray-800">
              {medication.name} n'est actuellement disponible dans aucune pharmacie partenaire.
            </p>
            <p className="text-sm text-gray-600">
              L'assistant peut vous proposer un équivalent ou une pharmacie susceptible de le commander.
            </p>
            <div className="flex justify-center">
              <AskAssistantButton
                message={`Le médicament "${medication.name}" n'est disponible nulle part sur CareMap. Peux-tu me proposer une alternative ou un équivalent générique ?`}
                label="Proposer une alternative"
              />
            </div>
          </div>
        )}

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
                <div key={stock.id} className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 hover:bg-gray-50">
                  <div>
                    {stock.pharmacy ? (
                      <Link
                        to={`/map?focus=pharmacy-${stock.pharmacy.id}`}
                        className="font-semibold text-gray-800 text-lg hover:text-primary-600 transition-colors"
                        title="Voir sur la carte et calculer l'itinéraire"
                      >
                        {stock.pharmacy.name} 📍
                      </Link>
                    ) : (
                      <p className="font-semibold text-gray-800 text-lg"></p>
                    )}
                    <p className="text-sm text-gray-500">
                      {stock.pharmacy ? stock.pharmacy.city : ""} —{" "}
                      {stock.pharmacy ? stock.pharmacy.address : ""}
                    </p>
                    {stock.pharmacy?.phone && (
                      <div className="mt-2">
                        <ContactButtons phone={stock.pharmacy.phone} name={stock.pharmacy.name} size="sm" />
                      </div>
                    )}
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

        {/* Point 1 & 4 : historique de recherche cliquable, du plus récent au plus ancien */}
        <RecentSearches />

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