import { DashboardStats, PendingPharmacy, User, Medication, Category } from "../../types";
import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import { adminService } from "../../services/adminService";
import { medicationService } from "../../services/medicationService";
import { clinicService, ClinicPayload } from "../../services/clinicService";
import { Link, useNavigate } from "react-router-dom";
import { Spinner } from "../../components/ui/Spinner";

import ReportGenerator from "./ReportGenerator";
import ClinicFormModal from "../../components/admin/ClinicFormModal";

type Clinic = ClinicPayload & {
  id: string;
  isValidated?: boolean;
  isBlocked?: boolean;
  createdAt?: string;
};

type Pharmacy = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  department?: string;
  phone?: string;
  isValidated?: boolean;
  isActive?: boolean;
  clinic?: { id: string; name: string; city?: string; department?: string } | null;
  admin?: { firstName?: string; lastName?: string; email?: string };
};

// -- Modal confirmation ---------------------------------------
function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <p className="text-gray-800 font-medium mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors">Annuler</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors">Confirmer</button>
        </div>
      </div>
    </div>
  );
}

// -- Dashboard principal --------------------------------------
export default function AdminDashboard() {
  const { user } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pending, setPending] = useState<PendingPharmacy[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stats");

  // Médicaments
  const [medForm, setMedForm] = useState({ name: "", genericName: "", description: "", categoryId: "" });
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [medLoading, setMedLoading] = useState(false);
  const [medMessage, setMedMessage] = useState("");
  const [medSearch, setMedSearch] = useState("");

  // Users
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("ALL");

  // Cliniques
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [clinicsLoading, setClinicsLoading] = useState(false);
  const [clinicSearch, setClinicSearch] = useState("");
  const [clinicDeptFilter, setClinicDeptFilter] = useState("ALL");
  const [showClinicForm, setShowClinicForm] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [clinicMessage, setClinicMessage] = useState("");

  // Pharmacies (vue complète)
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [pharmaciesLoading, setPharmaciesLoading] = useState(false);
  const [pharmacySearch, setPharmacySearch] = useState("");
  const [pharmacyDeptFilter, setPharmacyDeptFilter] = useState("ALL");
  const [pharmacyStatusFilter, setPharmacyStatusFilter] = useState<"ALL" | "validated" | "pending" | "blocked">("ALL");
  const [pharmacyMessage, setPharmacyMessage] = useState("");

  const [confirmAction, setConfirmAction] = useState<{ message: string; fn: () => void } | null>(null);

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

  const loadClinics = async () => {
    setClinicsLoading(true);
    try {
      const res = await clinicService.adminGetAll();
      setClinics(res.data.data ?? []);
    } catch {
      setClinicMessage("❌ Impossible de charger les cliniques.");
    } finally {
      setClinicsLoading(false);
    }
  };

  const loadPharmacies = async () => {
    setPharmaciesLoading(true);
    try {
      const res = await adminService.getPharmacies();
      setPharmacies(res.data.data ?? []);
    } catch {
      setPharmacyMessage("❌ Impossible de charger les pharmacies.");
    } finally {
      setPharmaciesLoading(false);
    }
  };

  useEffect(() => { loadData(); loadMedications(); loadClinics(); loadPharmacies(); }, []);

  const handleValidate = async (id: string, validate: boolean) => {
    await adminService.validatePharmacy(id, validate);
    loadData();
    loadPharmacies();
  };

  const handleToggleUser = async (id: string) => {
    await adminService.toggleUser(id);
    loadData();
  };

  const handleDeleteUser = async (id: string) => {
    setConfirmAction({
      message: 'Supprimer définitivement cet utilisateur ? Cette action est irréversible.',
      fn: async () => {
        try { await adminService.toggleUser(id); } catch {}
        setConfirmAction(null);
        loadData();
      }
    });
  };

  const handleMedSubmit = async () => {
    if (!medForm.name || !medForm.categoryId) { setMedMessage("Le nom et la catégorie sont obligatoires."); return; }
    setMedLoading(true); setMedMessage("");
    try {
      if (editingMed) {
        await medicationService.update(editingMed.id, medForm);
        setMedMessage("✅ Médicament modifié avec succès.");
      } else {
        await medicationService.create(medForm);
        setMedMessage("✅ Médicament ajouté avec succès.");
      }
      setMedForm({ name: "", genericName: "", description: "", categoryId: "" });
      setEditingMed(null);
      loadMedications();
    } catch { setMedMessage("❌ Une erreur est survenue."); }
    finally { setMedLoading(false); }
  };

  const handleEditMed = (med: Medication) => {
    setEditingMed(med);
    setMedForm({ name: med.name, genericName: med.genericName || "", description: med.description || "", categoryId: med.category?.id || "" });
    setMedMessage("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteMed = async (id: string) => {
    setConfirmAction({
      message: 'Supprimer ce médicament ?',
      fn: async () => {
        try { await medicationService.update(id, { name: "__deleted__" }); setMedMessage("✅ Médicament supprimé."); loadMedications(); }
        catch { setMedMessage("❌ Erreur lors de la suppression."); }
        setConfirmAction(null);
      }
    });
  };

  // -- Cliniques : handlers --------------------------------------
  const handleOpenAddClinic = () => { setEditingClinic(null); setShowClinicForm(true); };
  const handleOpenEditClinic = (c: Clinic) => { setEditingClinic(c); setShowClinicForm(true); };

  const handleSaveClinic = async (payload: ClinicPayload) => {
    if (editingClinic) {
      await clinicService.update(editingClinic.id, payload);
      setClinicMessage("✅ Clinique modifiée avec succès.");
    } else {
      await clinicService.create(payload);
      setClinicMessage("✅ Clinique ajoutée avec succès.");
    }
    setShowClinicForm(false);
    setEditingClinic(null);
    loadClinics();
  };

  const handleToggleBlockClinic = (c: Clinic) => {
    setConfirmAction({
      message: `${c.isBlocked ? 'Débloquer' : 'Bloquer'} la clinique « ${c.name} » ?${!c.isBlocked ? ' Elle ne sera plus visible publiquement.' : ''}`,
      fn: async () => {
        try {
          await clinicService.toggleBlock(c.id, !c.isBlocked);
          setClinicMessage(c.isBlocked ? "✅ Clinique débloquée." : "✅ Clinique bloquée.");
        } catch { setClinicMessage("❌ Une erreur est survenue."); }
        setConfirmAction(null);
        loadClinics();
      }
    });
  };

  const handleDeleteClinic = (c: Clinic) => {
    setConfirmAction({
      message: `Supprimer définitivement « ${c.name} » ? Cette action est irréversible.`,
      fn: async () => {
        try {
          await clinicService.remove(c.id);
          setClinicMessage("✅ Clinique supprimée.");
        } catch { setClinicMessage("❌ Une erreur est survenue."); }
        setConfirmAction(null);
        loadClinics();
      }
    });
  };

  // -- Pharmacies (vue complète) : handlers --------------------------------------
  const handleTogglePharmacyStatus = (p: Pharmacy) => {
    setConfirmAction({
      message: `${p.isActive === false ? 'Débloquer' : 'Bloquer'} la pharmacie « ${p.name} » ?${p.isActive !== false ? ' Elle ne sera plus visible publiquement.' : ''}`,
      fn: async () => {
        try {
          await adminService.togglePharmacyStatus(p.id, p.isActive === false);
          setPharmacyMessage(p.isActive === false ? "✅ Pharmacie débloquée." : "✅ Pharmacie bloquée.");
        } catch { setPharmacyMessage("❌ Une erreur est survenue."); }
        setConfirmAction(null);
        loadPharmacies();
      }
    });
  };

  const handleDeletePharmacyAdmin = (p: Pharmacy) => {
    setConfirmAction({
      message: `Supprimer définitivement « ${p.name} » ? Cette action est irréversible.`,
      fn: async () => {
        try {
          await adminService.deletePharmacy(p.id);
          setPharmacyMessage("✅ Pharmacie supprimée.");
        } catch { setPharmacyMessage("❌ Une erreur est survenue."); }
        setConfirmAction(null);
        loadPharmacies();
        loadData();
      }
    });
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Filtres
  const filteredUsers = users.filter(u => {
    const matchSearch = (u.firstName + ' ' + u.lastName + ' ' + u.email).toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userFilter === 'ALL' || u.role === userFilter;
    return matchSearch && matchRole;
  });

  const filteredMeds = medications.filter(m =>
    (m.name + (m.genericName || '')).toLowerCase().includes(medSearch.toLowerCase())
  );

  const clinicDepartments = Array.from(new Set(clinics.map(c => c.department).filter(Boolean))) as string[];

  const filteredClinics = clinics.filter(c => {
    const term = clinicSearch.trim().toLowerCase();
    const matchSearch = !term || (c.name + ' ' + (c.city ?? '') + ' ' + (c.department ?? '')).toLowerCase().includes(term);
    const matchDept = clinicDeptFilter === 'ALL' || c.department === clinicDeptFilter;
    return matchSearch && matchDept;
  });

  const pharmacyDepartments = Array.from(new Set(pharmacies.map(p => p.department).filter(Boolean))) as string[];

  const filteredPharmacies = pharmacies.filter(p => {
    const term = pharmacySearch.trim().toLowerCase();
    const matchSearch = !term || (p.name + ' ' + (p.city ?? '') + ' ' + (p.department ?? '')).toLowerCase().includes(term);
    const matchDept = pharmacyDeptFilter === 'ALL' || p.department === pharmacyDeptFilter;
    const matchStatus =
      pharmacyStatusFilter === 'ALL' ? true :
      pharmacyStatusFilter === 'validated' ? p.isValidated === true :
      pharmacyStatusFilter === 'pending' ? p.isValidated === false :
      p.isActive === false;
    return matchSearch && matchDept && matchStatus;
  });

  const tabs = [
    { key: "stats", label: "Vue d'ensemble", icon: "📊" },
    { key: "pharmacies", label: `Validations`, badge: pending.length, icon: "🏪" },
    { key: "allpharmacies", label: "Pharmacies", badge: pharmacies.length, icon: "🏬" },
    { key: "clinics", label: "Cliniques", badge: clinics.length, icon: "🏥" },
    { key: "users", label: "Utilisateurs", icon: "👥" },
    { key: "medications", label: "Médicaments", icon: "💊" },
    { key: "report", label: "Rapport", icon: "📄" },
  ];

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-700',
    PHARMACY_ADMIN: 'bg-blue-100 text-blue-700',
    CLINIC_ADMIN: 'bg-purple-100 text-purple-700',
    PATIENT: 'bg-green-100 text-green-700',
  };

  const contractLabels: Record<string, string> = {
    GRATUIT: 'Référencement gratuit',
    STANDARD: 'Standard',
    PREMIUM: 'Premium',
    PARTENARIAT: 'Partenariat officiel',
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            <span className="text-lg font-bold text-primary-700">CareMap</span>
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-700">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-red-500 font-medium">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === t.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.badge !== undefined && t.badge > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === t.key ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div>

            {/* -- STATS -- */}
            {activeTab === "stats" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Utilisateurs", value: stats?.totalUsers ?? 0, icon: "👥", color: "bg-blue-50 text-blue-600 border-blue-100" },
                    { label: "Pharmacies totales", value: stats?.totalPharmacies ?? 0, icon: "🏪", color: "bg-green-50 text-green-600 border-green-100" },
                    { label: "Pharmacies validées", value: stats?.validatedPharmacies ?? 0, icon: "✅", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                    { label: "En attente", value: stats?.pendingPharmacies ?? 0, icon: "⏳", color: "bg-amber-50 text-amber-600 border-amber-100" },
                    { label: "Cliniques", value: stats?.totalClinics ?? clinics.length, icon: "🏥", color: "bg-purple-50 text-purple-600 border-purple-100" },
                    { label: "Médicaments", value: stats?.totalMedications ?? 0, icon: "💊", color: "bg-red-50 text-red-600 border-red-100" },
                  ].map(stat => (
                    <div key={stat.label} className={`bg-white rounded-2xl p-5 border ${stat.color.split(' ')[2]} shadow-sm`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{stat.icon}</span>
                        <span className={`text-3xl font-bold ${stat.color.split(' ')[1]}`}>{stat.value}</span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Activité rapide */}
                {pending.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⏳</span>
                        <div>
                          <p className="font-semibold text-amber-800">
                            {pending.length} pharmacie{pending.length > 1 ? 's' : ''} en attente de validation
                          </p>
                          <p className="text-sm text-amber-600">Action requise</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('pharmacies')}
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
                      >
                        Traiter →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* -- PHARMACIES (Validations en attente) -- */}
            {activeTab === "pharmacies" && (
              <div className="space-y-4">
                {pending.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                    <div className="text-5xl mb-3">✅</div>
                    <p className="text-gray-500 font-medium">Aucune pharmacie en attente</p>
                    <p className="text-gray-400 text-sm mt-1">Toutes les demandes ont été traitées</p>
                  </div>
                ) : pending.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🏪</div>
                        <div>
                          <h3 className="font-bold text-gray-900">{p.name}</h3>
                          <p className="text-sm text-gray-500">{p.address}, {p.city}</p>
                          <p className="text-sm text-gray-500">{p.phone}</p>
                          {p.admin && (
                            <p className="text-xs text-gray-400 mt-1.5 bg-gray-50 px-2 py-1 rounded-lg inline-block">
                              👤 {p.admin.firstName} {p.admin.lastName} • {p.admin.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleValidate(p.id, true)}
                          className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => handleValidate(p.id, false)}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* -- PHARMACIES (vue complète) -- */}
            {activeTab === "allpharmacies" && (
              <div className="space-y-4">
                {pharmacyMessage && (
                  <div className={`px-4 py-3 rounded-xl text-sm font-medium ${pharmacyMessage.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {pharmacyMessage}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                      placeholder="Rechercher une pharmacie, ville, département…"
                      value={pharmacySearch}
                      onChange={e => setPharmacySearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    value={pharmacyDeptFilter}
                    onChange={e => setPharmacyDeptFilter(e.target.value)}
                  >
                    <option value="ALL">Tous les départements</option>
                    {pharmacyDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    value={pharmacyStatusFilter}
                    onChange={e => setPharmacyStatusFilter(e.target.value as any)}
                  >
                    <option value="ALL">Tous les statuts</option>
                    <option value="validated">Validées</option>
                    <option value="pending">En attente</option>
                    <option value="blocked">Bloquées</option>
                  </select>
                </div>

                <p className="text-sm text-gray-400">{filteredPharmacies.length} pharmacie{filteredPharmacies.length > 1 ? 's' : ''}</p>

                {pharmaciesLoading ? (
                  <div className="flex justify-center py-16"><Spinner size="lg" /></div>
                ) : filteredPharmacies.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                    <div className="text-5xl mb-3">🏬</div>
                    <p className="text-gray-500 font-medium">Aucune pharmacie trouvée</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredPharmacies.map(p => (
                      <div
                        key={p.id}
                        className={`bg-white rounded-2xl p-5 shadow-sm border ${p.isActive === false ? 'border-red-200 opacity-75' : 'border-gray-100'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-gray-900 truncate">🏪 {p.name}</h3>
                              {p.isValidated ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Validée</span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">En attente</span>
                              )}
                              {p.isActive === false && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">Bloquée</span>
                              )}
                              {p.clinic && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold">
                                  🏥 Branche de {p.clinic.name}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              📍 {p.address ? `${p.address}, ` : ''}{p.city}{p.department ? `, ${p.department}` : ''}
                            </p>
                            {p.phone && <p className="text-sm text-gray-500">📞 {p.phone}</p>}
                            {p.admin && (
                              <p className="text-xs text-gray-400 mt-1.5 bg-gray-50 px-2 py-1 rounded-lg inline-block">
                                👤 {p.admin.firstName} {p.admin.lastName}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-gray-100">
                          {p.phone && (
                            <a href={`tel:${p.phone}`} title="Appeler" className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors">
                              📞
                            </a>
                          )}
                          {p.admin?.email && (
                            <a href={`mailto:${p.admin.email}?subject=CareMap - Message de l'administration`} title="Email" className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                              ✉️
                            </a>
                          )}

                          {!p.isValidated && (
                            <button
                              onClick={() => handleValidate(p.id, true)}
                              className="ml-auto px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
                            >
                              Valider
                            </button>
                          )}
                          <button
                            onClick={() => handleTogglePharmacyStatus(p)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              p.isActive === false ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            } ${p.isValidated ? 'ml-auto' : ''}`}
                          >
                            {p.isActive === false ? 'Débloquer' : 'Bloquer'}
                          </button>
                          <button
                            onClick={() => handleDeletePharmacyAdmin(p)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* -- CLINIQUES -- */}
            {activeTab === "clinics" && (
              <div className="space-y-4">
                {clinicMessage && (
                  <div className={`px-4 py-3 rounded-xl text-sm font-medium ${clinicMessage.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {clinicMessage}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                      placeholder="Rechercher une clinique, ville, département…"
                      value={clinicSearch}
                      onChange={e => setClinicSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    value={clinicDeptFilter}
                    onChange={e => setClinicDeptFilter(e.target.value)}
                  >
                    <option value="ALL">Tous les départements</option>
                    {clinicDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <button
                    onClick={handleOpenAddClinic}
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors whitespace-nowrap"
                  >
                    ➕ Ajouter une clinique
                  </button>
                </div>

                <p className="text-sm text-gray-400">{filteredClinics.length} clinique{filteredClinics.length > 1 ? 's' : ''}</p>

                {clinicsLoading ? (
                  <div className="flex justify-center py-16"><Spinner size="lg" /></div>
                ) : filteredClinics.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                    <div className="text-5xl mb-3">🏥</div>
                    <p className="text-gray-500 font-medium">Aucune clinique trouvée</p>
                    <p className="text-gray-400 text-sm mt-1">Ajoute la première clinique pour commencer.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredClinics.map(c => {
                      const whatsappNumber = (c.whatsapp || c.phone || '').replace(/[^\d+]/g, '').replace('+', '');
                      return (
                        <div
                          key={c.id}
                          className={`bg-white rounded-2xl p-5 shadow-sm border ${c.isBlocked ? 'border-red-200 opacity-75' : 'border-gray-100'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-gray-900 truncate">🏥 {c.name}</h3>
                                {c.isValidated && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Validée</span>
                                )}
                                {c.isBlocked && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">Bloquée</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                📍 {c.address ? `${c.address}, ` : ''}{c.city}, {c.department}
                              </p>
                              {c.phone && <p className="text-sm text-gray-500">📞 {c.phone}</p>}
                              {c.contract?.type && (
                                <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold">
                                  📄 {contractLabels[c.contract.type] ?? c.contract.type}
                                  {c.contract.endDate ? ` · jusqu'au ${new Date(c.contract.endDate).toLocaleDateString('fr-FR')}` : ''}
                                </span>
                              )}
                              {(c.additionalLocations?.length ?? 0) > 0 && (
                                <p className="text-xs text-gray-400 mt-1.5">
                                  + {c.additionalLocations!.length} autre{c.additionalLocations!.length > 1 ? 's' : ''} localisation{c.additionalLocations!.length > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>

                          {c.services && c.services.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {c.services.slice(0, 5).map(s => (
                                <span key={s} className="text-xs font-medium px-2 py-1 rounded-full bg-primary-50 text-primary-700">{s}</span>
                              ))}
                              {c.services.length > 5 && (
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-50 text-gray-500">+{c.services.length - 5}</span>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-gray-100">
                            {c.phone && (
                              <a href={`tel:${c.phone}`} title="Appeler" className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors">
                                📞
                              </a>
                            )}
                            {whatsappNumber && (
                              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" title="WhatsApp" className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                                💬
                              </a>
                            )}
                            {c.email && (
                              <a href={`mailto:${c.email}?subject=CareMap - Message de l'administration`} title="Email" className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                ✉️
                              </a>
                            )}
                            <button
                              onClick={() => handleOpenEditClinic(c)}
                              className="ml-auto px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleToggleBlockClinic(c)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                c.isBlocked ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                              }`}
                            >
                              {c.isBlocked ? 'Débloquer' : 'Bloquer'}
                            </button>
                            <button
                              onClick={() => handleDeleteClinic(c)}
                              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* -- USERS -- */}
            {activeTab === "users" && (
              <div className="space-y-4">
                {/* Barre de recherche + filtres */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                      placeholder="Rechercher un utilisateur…"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    value={userFilter}
                    onChange={e => setUserFilter(e.target.value)}
                  >
                    <option value="ALL">Tous les rôles</option>
                    <option value="PATIENT">Patients</option>
                    <option value="PHARMACY_ADMIN">Pharmaciens</option>
                    <option value="CLINIC_ADMIN">Cliniques</option>
                    <option value="SUPER_ADMIN">Admins</option>
                  </select>
                </div>

                <p className="text-sm text-gray-400">{filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}</p>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">Aucun résultat</div>
                  ) : filteredUsers.map(u => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>
                          {u.role === 'SUPER_ADMIN' ? 'Admin' : u.role === 'PHARMACY_ADMIN' ? 'Pharmacien' : u.role === 'CLINIC_ADMIN' ? 'Clinique' : 'Patient'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {u.isActive ? 'Actif' : 'Inactif'}
                        </span>

                        {u.role !== 'SUPER_ADMIN' && (
                          <div className="flex gap-1 ml-2">
                            {/* Toggle actif/inactif */}
                            <button
                              onClick={() => setConfirmAction({
                                message: `${u.isActive ? 'Révoquer' : 'Réactiver'} le compte de ${u.firstName} ${u.lastName} ?`,
                                fn: () => { handleToggleUser(u.id); setConfirmAction(null); }
                              })}
                              className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                              title={u.isActive ? 'Révoquer' : 'Réactiver'}
                            >
                              {u.isActive ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                            {/* Contacter par email */}
                            <a
                              href={`mailto:${u.email}?subject=CareMap - Message de l'administration`}
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                              title="Contacter par email"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </a>

                            {/* Supprimer */}
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                              title="Supprimer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* -- MÉDICAMENTS -- */}
            {activeTab === "medications" && (
              <div className="space-y-6">
                {/* Formulaire */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-base font-bold text-gray-800 mb-5">
                    {editingMed ? `✏️ Modifier « ${editingMed.name} »` : '➕ Ajouter un médicament'}
                  </h3>

                  {medMessage && (
                    <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${medMessage.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {medMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Nom du médicament *', key: 'name', placeholder: 'ex: Amoxicilline 500mg' },
                      { label: 'Nom générique', key: 'genericName', placeholder: 'ex: Amoxicilline' },
                      { label: 'Description', key: 'description', placeholder: 'ex: Antibiotique à large spectre' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                          placeholder={f.placeholder}
                          value={(medForm as any)[f.key]}
                          onChange={e => setMedForm({ ...medForm, [f.key]: e.target.value })}
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catégorie *</label>
                      <select
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                        value={medForm.categoryId}
                        onChange={e => setMedForm({ ...medForm, categoryId: e.target.value })}
                      >
                        <option value="">Choisir une catégorie…</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={handleMedSubmit}
                      disabled={medLoading}
                      className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {medLoading ? 'En cours…' : editingMed ? 'Enregistrer les modifications' : 'Ajouter le médicament'}
                    </button>
                    {editingMed && (
                      <button
                        onClick={() => { setEditingMed(null); setMedForm({ name: "", genericName: "", description: "", categoryId: "" }); setMedMessage(""); }}
                        className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>

                {/* Liste */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
                    <h3 className="text-base font-bold text-gray-800">Médicaments ({medications.length})</h3>
                    <div className="relative flex-1 max-w-xs">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                        placeholder="Rechercher…"
                        value={medSearch}
                        onChange={e => setMedSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {filteredMeds.map(med => (
                      <div key={med.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center text-base">💊</div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{med.name}</p>
                            <p className="text-xs text-gray-400">
                              {med.category?.name}{med.genericName ? ` • ${med.genericName}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleEditMed(med)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteMed(med.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
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

            {activeTab === "report" && <ReportGenerator />}
          </div>
        )}
      </div>

      {/* Modal ajout / édition clinique */}
      {showClinicForm && (
        <ClinicFormModal
          initialData={editingClinic}
          onClose={() => { setShowClinicForm(false); setEditingClinic(null); }}
          onSubmit={handleSaveClinic}
        />
      )}

      {/* Modal de confirmation */}
      {confirmAction && (
        <ConfirmModal
          message={confirmAction.message}
          onConfirm={confirmAction.fn}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}