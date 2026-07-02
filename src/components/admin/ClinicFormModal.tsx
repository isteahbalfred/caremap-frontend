import { useEffect, useState } from 'react';
import { HAITI_DEPARTMENTS, citiesForDepartment } from '../../constants/haiti';
import type { ClinicLocation, ClinicPayload } from '../../services/clinicService';

type Clinic = ClinicPayload & { id?: string };

interface Props {
  initialData?: Clinic | null;
  onClose: () => void;
  onSubmit: (payload: ClinicPayload) => Promise<void>;
}

type ClinicContract = NonNullable<ClinicPayload['contract']>;

const CONTRACT_TYPES: { value: ClinicContract['type']; label: string }[] = [
  { value: 'GRATUIT', label: 'Référencement gratuit' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'PARTENARIAT', label: 'Partenariat officiel' },
];

const emptyLocation: ClinicLocation = { department: '', city: '', address: '', phone: '' };

export default function ClinicFormModal({ initialData, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<ClinicPayload>({
    name: '',
    description: '',
    email: '',
    phone: '',
    whatsapp: '',
    department: '',
    city: '',
    address: '',
    services: [],
    additionalLocations: [],
    contract: { type: 'GRATUIT', startDate: '', endDate: '', notes: '' },
  });
  const [serviceInput, setServiceInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name ?? '',
        description: initialData.description ?? '',
        email: initialData.email ?? '',
        phone: initialData.phone ?? '',
        whatsapp: initialData.whatsapp ?? '',
        department: initialData.department ?? '',
        city: initialData.city ?? '',
        address: initialData.address ?? '',
        services: initialData.services ?? [],
        additionalLocations: initialData.additionalLocations ?? [],
        contract: initialData.contract ?? { type: 'GRATUIT', startDate: '', endDate: '', notes: '' },
      });
    }
  }, [initialData]);

  const set = <K extends keyof ClinicPayload>(key: K, value: ClinicPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addService = () => {
    const v = serviceInput.trim();
    if (!v) return;
    if (!form.services?.includes(v)) {
      set('services', [...(form.services ?? []), v]);
    }
    setServiceInput('');
  };

  const removeService = (s: string) =>
    set('services', (form.services ?? []).filter((x) => x !== s));

  const addLocation = () =>
    set('additionalLocations', [...(form.additionalLocations ?? []), { ...emptyLocation }]);

  const updateLocation = (index: number, patch: Partial<ClinicLocation>) => {
    const list = [...(form.additionalLocations ?? [])];
    list[index] = { ...list[index], ...patch };
    set('additionalLocations', list);
  };

  const removeLocation = (index: number) =>
    set('additionalLocations', (form.additionalLocations ?? []).filter((_, i) => i !== index));

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim()) return setError('Le nom de la clinique est obligatoire.');
    if (!form.department) return setError('Choisis le département principal.');
    if (!form.city) return setError('Choisis la ville principale.');
    if (!form.phone?.trim()) return setError('Le numéro de téléphone est obligatoire.');

    setSaving(true);
    try {
      await onSubmit(form);
    } catch {
      setError("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const cities = citiesForDepartment(form.department);
  const contract = form.contract ?? { type: 'GRATUIT' as const };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">
            {initialData?.id ? `✏️ Modifier « ${initialData.name} »` : '➕ Ajouter une clinique'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-rose-50 text-rose-700 text-sm font-medium px-4 py-3 rounded-xl">{error}</div>
          )}

          {/* Infos générales */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Informations générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom de la clinique *</label>
                <input
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                  placeholder="ex: Clinique Bon Secours"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all resize-none"
                  rows={2}
                  placeholder="Brève présentation de la clinique..."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Localisation principale */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Localisation principale</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Département *</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                  value={form.department}
                  onChange={(e) => { set('department', e.target.value); set('city', ''); }}
                >
                  <option value="">Choisir un département…</option>
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
                  <option value="">{form.department ? 'Choisir une ville…' : "Choisis d'abord un département"}</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse précise</label>
                <input
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                  placeholder="ex: Angle rue X et rue Y"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Autres localisations (succursales) */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Autres localisations / succursales
              </h3>
              <button
                type="button"
                onClick={addLocation}
                className="text-xs font-semibold text-primary-700 hover:text-primary-800"
              >
                + Ajouter une localisation
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Si cette clinique possède des succursales dans d'autres villes ou départements, ajoute-les ici — elles seront toutes prises en compte dans les filtres de recherche.
            </p>
            {(form.additionalLocations ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucune localisation additionnelle.</p>
            ) : (
              <div className="space-y-3">
                {(form.additionalLocations ?? []).map((loc, i) => {
                  const locCities = citiesForDepartment(loc.department);
                  return (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-gray-50 rounded-xl p-3">
                      <select
                        className="md:col-span-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-400"
                        value={loc.department}
                        onChange={(e) => updateLocation(i, { department: e.target.value, city: '' })}
                      >
                        <option value="">Département…</option>
                        {HAITI_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select
                        className="md:col-span-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50"
                        value={loc.city}
                        onChange={(e) => updateLocation(i, { city: e.target.value })}
                        disabled={!loc.department}
                      >
                        <option value="">Ville…</option>
                        {locCities.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input
                        className="md:col-span-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-400"
                        placeholder="Adresse de cette succursale"
                        value={loc.address}
                        onChange={(e) => updateLocation(i, { address: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <input
                          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-400"
                          placeholder="Téléphone"
                          value={loc.phone}
                          onChange={(e) => updateLocation(i, { phone: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => removeLocation(i)}
                          className="px-2 text-rose-500 hover:text-rose-700"
                          title="Retirer cette localisation"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Contact */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone *</label>
                <input
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                  placeholder="+509 ..."
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">WhatsApp</label>
                <input
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                  placeholder="+509 ... (si différent)"
                  value={form.whatsapp}
                  onChange={(e) => set('whatsapp', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                  placeholder="contact@clinique.ht"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Services */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Services disponibles</h3>
            <div className="flex gap-2">
              <input
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all"
                placeholder="ex: Urgences, Pédiatrie, Cardiologie..."
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addService(); } }}
              />
              <button
                type="button"
                onClick={addService}
                className="px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
              >
                Ajouter
              </button>
            </div>
            {(form.services ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {(form.services ?? []).map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 ring-1 ring-primary-100"
                  >
                    {s}
                    <button type="button" onClick={() => removeService(s)} className="text-primary-400 hover:text-primary-700">✕</button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Contrat avec CareMap */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Contrat avec CareMap</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type de contrat</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                  value={contract.type}
                  onChange={(e) => set('contract', { ...contract, type: e.target.value as ClinicContract['type'] })}
                >
                  {CONTRACT_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Début</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                  value={contract.startDate ?? ''}
                  onChange={(e) => set('contract', { ...contract, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fin / renouvellement</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                  value={contract.endDate ?? ''}
                  onChange={(e) => set('contract', { ...contract, endDate: e.target.value })}
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes internes sur le contrat</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                  rows={2}
                  placeholder="Conditions particulières, commission, engagement..."
                  value={contract.notes ?? ''}
                  onChange={(e) => set('contract', { ...contract, notes: e.target.value })}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : initialData?.id ? 'Enregistrer les modifications' : 'Ajouter la clinique'}
          </button>
        </div>
      </div>
    </div>
  );
}