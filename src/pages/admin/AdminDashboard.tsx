import { DashboardStats, PendingPharmacy, User, Medication, Category } from "../../types";
import { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import { adminService } from "../../services/adminService";
import { medicationService } from "../../services/medicationService";
import { Link, useNavigate } from "react-router-dom";
import { Spinner } from "../../components/ui/Spinner";


import ReportGenerator from "./ReportGenerator";

// -- Chatbot -------------------------------------------------
interface ChatMsg { role: 'user' | 'bot'; text: string; }

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: 'bot', text: 'Bonjour ! Je suis l\'assistant CareMap. Comment puis-je vous aider ?' }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMsgs(m => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: `Tu es l'assistant administrateur de CareMap, une plateforme m?dicale ha?tienne. 
Tu aides l'administrateur ? g?rer les utilisateurs, pharmacies, m?dicaments et cliniques.
R?ponds toujours en fran?ais, de mani?re concise et utile. 
Si on te demande comment faire quelque chose dans l'interface, explique les ?tapes clairement.`,
          messages: [{ role: 'user', content: text }],
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || 'D?sol?, je n\'ai pas pu r?pondre.';
      setMsgs(m => [...m, { role: 'bot', text: reply }]);
    } catch {
      setMsgs(m => [...m, { role: 'bot', text: 'Erreur de connexion. R?essayez.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        title="Assistant CareMap"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Fen?tre chat */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ height: '420px' }}>
          {/* Header */}
          <div className="bg-primary-600 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Assistant CareMap</p>
              <p className="text-primary-200 text-xs">Toujours disponible</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
                  <div className="flex gap-1 items-center h-4">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              placeholder="Posez votre question?"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-9 h-9 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

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

  // M?dicaments
  const [medForm, setMedForm] = useState({ name: "", genericName: "", description: "", categoryId: "" });
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [medLoading, setMedLoading] = useState(false);
  const [medMessage, setMedMessage] = useState("");
  const [medSearch, setMedSearch] = useState("");

  // Users
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("ALL");

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

  useEffect(() => { loadData(); loadMedications(); }, []);

  const handleValidate = async (id: string, validate: boolean) => {
    await adminService.validatePharmacy(id, validate);
    loadData();
  };

  const handleToggleUser = async (id: string) => {
    await adminService.toggleUser(id);
    loadData();
  };

  const handleDeleteUser = async (id: string) => {
    setConfirmAction({
      message: 'Supprimer d?finitivement cet utilisateur ? Cette action est irr?versible.',
      fn: async () => {
        try { await adminService.toggleUser(id); } catch {}
        setConfirmAction(null);
        loadData();
      }
    });
  };

  const handleMedSubmit = async () => {
    if (!medForm.name || !medForm.categoryId) { setMedMessage("Le nom et la cat?gorie sont obligatoires."); return; }
    setMedLoading(true); setMedMessage("");
    try {
      if (editingMed) {
        await medicationService.update(editingMed.id, medForm);
        setMedMessage("? M?dicament modifi? avec succ?s.");
      } else {
        await medicationService.create(medForm);
        setMedMessage("? M?dicament ajout? avec succ?s.");
      }
      setMedForm({ name: "", genericName: "", description: "", categoryId: "" });
      setEditingMed(null);
      loadMedications();
    } catch { setMedMessage("? Une erreur est survenue."); }
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
      message: 'Supprimer ce m?dicament ?',
      fn: async () => {
        try { await medicationService.update(id, { name: "__deleted__" }); setMedMessage("? M?dicament supprim?."); loadMedications(); }
        catch { setMedMessage("? Erreur lors de la suppression."); }
        setConfirmAction(null);
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

  const tabs = [
    { key: "stats", label: "Vue d'ensemble", icon: "??" },
    { key: "pharmacies", label: `Validations`, badge: pending.length, icon: "??" },
    { key: "users", label: "Utilisateurs", icon: "??" },
    { key: "medications", label: "M?dicaments", icon: "??" },
    { key: "report", label: "Rapport", icon: "??" },
  ];

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-700',
    PHARMACY_ADMIN: 'bg-blue-100 text-blue-700',
    CLINIC_ADMIN: 'bg-purple-100 text-purple-700',
    PATIENT: 'bg-green-100 text-green-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">???</span>
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
            D?connexion
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
                    { label: "Utilisateurs", value: stats?.totalUsers ?? 0, icon: "??", color: "bg-blue-50 text-blue-600 border-blue-100" },
                    { label: "Pharmacies totales", value: stats?.totalPharmacies ?? 0, icon: "??", color: "bg-green-50 text-green-600 border-green-100" },
                    { label: "Pharmacies valid?es", value: stats?.validatedPharmacies ?? 0, icon: "?", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                    { label: "En attente", value: stats?.pendingPharmacies ?? 0, icon: "?", color: "bg-amber-50 text-amber-600 border-amber-100" },
                    { label: "Cliniques", value: stats?.totalClinics ?? 0, icon: "??", color: "bg-purple-50 text-purple-600 border-purple-100" },
                    { label: "M?dicaments", value: stats?.totalMedications ?? 0, icon: "??", color: "bg-red-50 text-red-600 border-red-100" },
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

                {/* Activit? rapide */}
                {pending.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">?</span>
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
                        Traiter ?
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* -- PHARMACIES -- */}
            {activeTab === "pharmacies" && (
              <div className="space-y-4">
                {pending.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                    <div className="text-5xl mb-3">?</div>
                    <p className="text-gray-500 font-medium">Aucune pharmacie en attente</p>
                    <p className="text-gray-400 text-sm mt-1">Toutes les demandes ont ?t? trait?es</p>
                  </div>
                ) : pending.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">??</div>
                        <div>
                          <h3 className="font-bold text-gray-900">{p.name}</h3>
                          <p className="text-sm text-gray-500">{p.address}, {p.city}</p>
                          <p className="text-sm text-gray-500">{p.phone}</p>
                          {p.admin && (
                            <p className="text-xs text-gray-400 mt-1.5 bg-gray-50 px-2 py-1 rounded-lg inline-block">
                              ?? {p.admin.firstName} {p.admin.lastName} ? {p.admin.email}
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
                      placeholder="Rechercher un utilisateur?"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    value={userFilter}
                    onChange={e => setUserFilter(e.target.value)}
                  >
                    <option value="ALL">Tous les r?les</option>
                    <option value="PATIENT">Patients</option>
                    <option value="PHARMACY_ADMIN">Pharmaciens</option>
                    <option value="CLINIC_ADMIN">Cliniques</option>
                    <option value="SUPER_ADMIN">Admins</option>
                  </select>
                </div>

                <p className="text-sm text-gray-400">{filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}</p>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">Aucun r?sultat</div>
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
                                message: `${u.isActive ? 'R?voquer' : 'R?activer'} le compte de ${u.firstName} ${u.lastName} ?`,
                                fn: () => { handleToggleUser(u.id); setConfirmAction(null); }
                              })}
                              className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                              title={u.isActive ? 'R?voquer' : 'R?activer'}
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

            {/* -- M?DICAMENTS -- */}
            {activeTab === "medications" && (
              <div className="space-y-6">
                {/* Formulaire */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-base font-bold text-gray-800 mb-5">
                    {editingMed ? `?? Modifier ? ${editingMed.name}` : '? Ajouter un m?dicament'}
                  </h3>

                  {medMessage && (
                    <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${medMessage.includes('?') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {medMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Nom du m?dicament *', key: 'name', placeholder: 'ex: Amoxicilline 500mg' },
                      { label: 'Nom g?n?rique', key: 'genericName', placeholder: 'ex: Amoxicilline' },
                      { label: 'Description', key: 'description', placeholder: 'ex: Antibiotique ? large spectre' },
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
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cat?gorie *</label>
                      <select
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                        value={medForm.categoryId}
                        onChange={e => setMedForm({ ...medForm, categoryId: e.target.value })}
                      >
                        <option value="">Choisir une cat?gorie?</option>
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
                      {medLoading ? 'En cours?' : editingMed ? 'Enregistrer les modifications' : 'Ajouter le m?dicament'}
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
                    <h3 className="text-base font-bold text-gray-800">M?dicaments ({medications.length})</h3>
                    <div className="relative flex-1 max-w-xs">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                        placeholder="Rechercher?"
                        value={medSearch}
                        onChange={e => setMedSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {filteredMeds.map(med => (
                      <div key={med.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center text-base">??</div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{med.name}</p>
                            <p className="text-xs text-gray-400">
                              {med.category?.name}{med.genericName ? ` ? ${med.genericName}` : ''}
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

      {/* Chatbot flottant */}
      <Chatbot />

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
