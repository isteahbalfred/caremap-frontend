import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import { adminService } from "../../services/adminService";
import { medicationService } from "../../services/medicationService";
import { Link } from "react-router-dom";
import { Spinner } from "../../components/ui/Spinner";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import ReportGenerator from "./ReportGenerator";

export default function AdminDashboard() {
  const { user } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [medications, setMedications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stats");
  const [medForm, setMedForm] = useState({ name: "", genericName: "", description: "", categoryId: "" });
  const [editingMed, setEditingMed] = useState(null);
  const [medLoading, setMedLoading] = useState(false);
  const [medMessage, setMedMessage] = useState("");

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

  const loadMedications = async () => {
    const [medsRes, catsRes] = await Promise.all([
      medicationService.getAll({ limit: 100 }),
      medicationService.getCategories(),
    ]);
    setMedications(medsRes.data.data);
    setCategories(catsRes.data.data);
  };

  useEffect(() => {
    loadData();
    loadMedications();
  }, []);

  const handleValidate = async (id, validate) => {
    await adminService.validatePharmacy(id, validate);
    loadData();
  };

  const handleToggleUser = async (id) => {
    await adminService.toggleUser(id);
    loadData();
  };

  const handleMedSubmit = async () => {
    if (!medForm.name || !medForm.categoryId) {
      setMedMessage("Le nom et la categorie sont obligatoires.");
      return;
    }
    setMedLoading(true);
    setMedMessage("");
    try {
      if (editingMed) {
        await medicationService.update(editingMed.id, medForm);
        setMedMessage("Medicament modifie avec succes.");
      } else {
        await medicationService.create(medForm);
        setMedMessage("Medicament ajoute avec succes.");
      }
      setMedForm({ name: "", genericName: "", description: "", categoryId: "" });
      setEditingMed(null);
      loadMedications();
    } catch (e) {
      setMedMessage("Une erreur est survenue.");
    } finally {
      setMedLoading(false);
    }
  };

  const handleEditMed = (med) => {
    setEditingMed(med);
    setMedForm({
      name: med.name,
      genericName: med.genericName || "",
      description: med.description || "",
      categoryId: med.category ? med.category.id : "",
    });
    setMedMessage("");
  };

  const handleDeleteMed = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce medicament ?")) return;
    try {
      await medicationService.update(id, { name: "__deleted__" });
      setMedMessage("Medicament supprime.");
      loadMedications();
    } catch (e) {
      setMedMessage("Erreur lors de la suppression.");
    }
  };

  const handleCancelEdit = () => {
    setEditingMed(null);
    setMedForm({ name: "", genericName: "", description: "", categoryId: "" });
    setMedMessage("");
  };

  const tabs = [
    { key: "stats", label: "Statistiques" },
    { key: "pharmacies", label: "Validations (" + pending.length + ")" },
    { key: "users", label: "Utilisateurs" },
    { key: "medications", label: "Medicaments" },
    { key: "report", label: "Rapport de Stage" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary-700">CareMap</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user ? user.firstName : ""} - Super Admin</span>
          <button onClick={() => dispatch(logout())} className="text-sm text-red-500">
            Deconnexion
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Administrateur</h2>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={"px-4 py-2 rounded-lg font-medium transition-colors " + (activeTab === t.key ? "bg-primary-500 text-white" : "bg-white text-gray-600 border")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <div>
            {activeTab === "stats" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Utilisateurs", value: stats ? stats.totalUsers : 0 },
                  { label: "Pharmacies totales", value: stats ? stats.totalPharmacies : 0 },
                  { label: "Pharmacies validees", value: stats ? stats.validatedPharmacies : 0 },
                  { label: "En attente validation", value: stats ? stats.pendingPharmacies : 0 },
                  { label: "Cliniques", value: stats ? stats.totalClinics : 0 },
                  { label: "Medicaments", value: stats ? stats.totalMedications : 0 },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-primary-600">{stat.value}</div>
                    <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "pharmacies" && (
              <div className="space-y-4">
                {pending.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">
                    Aucune pharmacie en attente de validation
                  </div>
                ) : (
                  pending.map(p => (
                    <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-800">{p.name}</h3>
                          <p className="text-sm text-gray-500">{p.address}, {p.city}</p>
                          <p className="text-sm text-gray-500">{p.phone}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {p.admin ? p.admin.firstName + " " + p.admin.lastName : ""} - {p.admin ? p.admin.email : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleValidate(p.id, true)} className="text-sm">Valider</Button>
                          <Button variant="danger" onClick={() => handleValidate(p.id, false)} className="text-sm">Rejeter</Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "report" && <ReportGenerator />}

            {activeTab === "users" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="space-y-3 p-5">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={u.role === "SUPER_ADMIN" ? "error" : u.role === "PHARMACY_ADMIN" ? "info" : "success"}>
                          {u.role}
                        </Badge>
                        <Badge variant={u.isActive ? "success" : "error"}>
                          {u.isActive ? "Actif" : "Inactif"}
                        </Badge>
                        {u.role !== "SUPER_ADMIN" && (
                          <Button variant="secondary" onClick={() => handleToggleUser(u.id)} className="text-xs px-2 py-1">
                            Toggle
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "medications" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    {editingMed ? "Modifier le medicament" : "Ajouter un medicament"}
                  </h3>

                  {medMessage && (
                    <div className={"mb-4 px-4 py-3 rounded-lg text-sm font-medium " + (medMessage.includes("succes") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                      {medMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du medicament *
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm"
                        placeholder="ex: Amoxicilline 500mg"
                        value={medForm.name}
                        onChange={e => setMedForm({ ...medForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom generique
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm"
                        placeholder="ex: Amoxicilline"
                        value={medForm.genericName}
                        onChange={e => setMedForm({ ...medForm, genericName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categorie *
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm bg-white"
                        value={medForm.categoryId}
                        onChange={e => setMedForm({ ...medForm, categoryId: e.target.value })}
                      >
                        <option value="">Choisir une categorie...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm"
                        placeholder="ex: Antibiotique a large spectre"
                        value={medForm.description}
                        onChange={e => setMedForm({ ...medForm, description: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleMedSubmit}
                      disabled={medLoading}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {medLoading ? "En cours..." : (editingMed ? "Modifier" : "Ajouter")}
                    </button>
                    {editingMed && (
                      <button
                        onClick={handleCancelEdit}
                        className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">
                      Liste des medicaments ({medications.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {medications.map(med => (
                      <div key={med.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <p className="font-semibold text-gray-800">{med.name}</p>
                          <p className="text-sm text-gray-500">
                            {med.category ? med.category.name : ""} 
                            {med.genericName ? " - " + med.genericName : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditMed(med)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteMed(med.id)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
