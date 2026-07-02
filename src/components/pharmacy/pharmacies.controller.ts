import { useState } from 'react';
import { pharmacyService } from '../../services/pharmacyService';
import { clinicService } from '../../services/clinicService';
import { HAITI_DEPARTMENTS, citiesForDepartment } from '../../constants/haiti';

type ClinicOption = {
  id: string;
  name: string;
  city?: string;
  department?: string;
};

interface Props {
  onCreated: () => void;
}

export default function CreatePharmacyForm({ onCreated }: Props) {
  const [mode, setMode] = useState<'independent' | 'branch'>('independent');

  const [clinicSearch, setClinicSearch] = useState('');
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<ClinicOption | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    department: '',
    city: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const searchClinics = async (term: string) => {
    setClinicSearch(term);
    setLoadingClinics(true);
    try {
      const res = await clinicService.getAll({ search: term, limit: 20 });
      setClinics(res.data.data ?? []);
    } catch {
      setClinics([]);
    } finally {
      setLoadingClinics(false);
    }
  };

  const handleSelectClinic = (c: ClinicOption) => {
    setSelectedClinic(c);
    setForm((f) => ({
      ...f,
      department: f.department || c.department || '',
      city: f.city || c.city || '',
    }));
  };

  const handleModeChange = (m: 'independent' | 'branch') => {
    setMode(m);
    if (m === 'branch' && clinics.length === 0 && !loadingClinics) {
      searchClinics('');
    }
    if (m === 'independent') {
      setSelectedClinic(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Le nom de la pharmacie est obligatoire.');
    if (!form.phone.trim()) return setError('Le numéro de téléphone est obligatoire.');
    if (!form.address.trim()) return setError('L\'adresse est obligatoire.');
    if (!form.department) return setError('Choisis le département.');
    if (!form.city) return setError('Choisis la ville.');
    if (mode === 'branch' && !selectedClinic) {
      return setError('Sélectionne la clinique dont cette pharmacie est une branche, ou passe en mode indépendant.');
    }

    setSaving(true);
    try {
      await pharmacyService.create({
        name: form.name,
        phone: form.phone,
        address: form.address,
        department: form.department,
        city: form.city,
        clinicId: mode === 'branch' ? selectedClinic!.id : null,
      });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Une erreur est survenue lors de la création.");
    } finally {
      setSaving(false);
    }
  };

  const cities = citiesForDepartment(form.department);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏪</div>
          <h2 className="text-xl font-bold text-gray-900">Enregistrer votre pharmacie</h2>
          <p className="text-gray-500 text-sm mt-1">
            Complète ces informations pour créer votre fiche pharmacie sur CareMap.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 text-sm font-medium px-4 py-3 rounded-xl mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type de pharmacie */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cette pharmacie est-elle une branche d'une clinique existante ?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleModeChange('independent')}
                className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  mode === 'independent'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                🏪 Pharmacie indépendante
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('branch')}
                className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  mode === 'branch'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                🏥 Branche d'une clinique
              </button>
            </div>
          </div>

          {/* Recherche clinique */}
          {mode === 'branch' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Rechercher la clinique *
              </label>
              {selectedClinic ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-semibold text-emerald-800 text-sm">🏥 {selectedClinic.name}</p>
                    <p className="text-xs text-emerald-600">{selectedClinic.city}, {selectedClinic.department}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedClinic(null)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <>
                  <input
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                    placeholder="Nom de la clinique..."
                    value={clinicSearch}
                    onChange={(e) => searchClinics(e.target.value)}
                  />
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
                    {loadingClinics ? (
                      <p className="text-sm text-gray-400 text-center py-4">Recherche…</p>
                    ) : clinics.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">Aucune clinique trouvée.</p>
                    ) : (
                      clinics.map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => handleSelectClinic(c)}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-800">🏥 {c.name}</p>
                          <p className="text-xs text-gray-400">{c.city}, {c.department}</p>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Infos générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom de la pharmacie *</label>
              <input
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                placeholder="ex: Pharmacie du Centre"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Département *</label>
              <select
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                value={form.department}
                onChange={(e) => { set('department', e.target.value); set('city', ''); }}
              >
                <option value="">Choisir…</option>
                {HAITI_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ville *</label>
              <select
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                disabled={!form.department}
              >
                <option value="">{form.department ? 'Choisir…' : "Choisis d'abord un département"}</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse précise *</label>
              <input
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                placeholder="ex: Angle rue X et rue Y"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone *</label>
              <input
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                placeholder="+509 ..."
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Création…' : 'Créer ma pharmacie'}
          </button>
          <p className="text-xs text-gray-400 text-center">
            Ta pharmacie sera visible publiquement après validation par un administrateur CareMap.
          </p>
        </form>
      </div>
    </div>
  );
}