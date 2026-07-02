import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { clinicService } from '../../services/clinicService';
import { pharmacyService } from '../../services/pharmacyService';

/* ============================================================================
   DONNÉES ATTENDUES — côté backend (Prisma).

   model Clinic {
     ...
     department      String?
     services        String[]
     description      String?
     whatsapp         String?
     rating           Float?
     openingHours     Json?
     promotions       Promotion[]
   }

   model Pharmacy {
     ...
     department      String?
     services        String[]        // ex: ["Livraison","Garde 24h","Vaccination"]
     products        Product[]       // médicaments vendus
     description      String?
     whatsapp         String?
     rating           Float?
     openingHours     Json?
     promotions       Promotion[]
   }

   // Un Product/Service peut être rattaché à une Clinic, une Pharmacy, ou les deux
   model Product {
     id          String
     name        String
     clinicId    String?
     pharmacyId  String?
     ...
   }

   model Promotion {
     id             String
     clinicId       String?
     pharmacyId     String?
     title          String
     description?
     discountPercent Int?
     validUntil     DateTime
   }
   ============================================================================ */

type OpeningHours = Record<
  string,
  { open: string; close: string } | null | undefined
>;

type Promotion = {
  id: string;
  title: string;
  description?: string;
  discountPercent?: number;
  validUntil: string; // ISO date
};

type BaseEntity = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  department?: string;
  phone?: string;
  whatsapp?: string;
  latitude?: number;
  longitude?: number;
  services?: string[];
  description?: string;
  rating?: number;
  openingHours?: OpeningHours;
  promotions?: Promotion[];
  isValidated?: boolean;
  admin?: { firstName?: string; lastName?: string };
};

type Clinic = BaseEntity;

type Pharmacy = BaseEntity & {
  productsCount?: number;
  products?: string[]; // noms de médicaments vedettes, pour la recherche
};

type EntityKind = 'clinics' | 'pharmacies';

/* ----------------------------- Référentiels ------------------------------ */

const DEPARTMENTS = [
  'Ouest',
  'Nord',
  'Nord-Est',
  'Nord-Ouest',
  'Artibonite',
  'Centre',
  'Sud',
  'Sud-Est',
  "Grand'Anse",
  'Nippes',
];

// Recherche par symptôme / besoin -> mots-clés de services associés
const SYMPTOM_MAP: { label: string; emoji: string; keywords: string[] }[] = [
  { label: 'Mal de tête', emoji: '🤕', keywords: ['neurologie', 'médecine générale', 'urgences'] },
  { label: 'Fièvre', emoji: '🌡️', keywords: ['médecine générale', 'urgences', 'pédiatrie'] },
  { label: 'Test VIH', emoji: '🧪', keywords: ['vih', 'sida', 'dépistage', 'laboratoire'] },
  { label: 'Tension', emoji: '❤️', keywords: ['cardiologie', 'médecine générale', 'tension'] },
  { label: 'Diabète', emoji: '💉', keywords: ['endocrinologie', 'diabète', 'médecine générale'] },
  { label: 'Grossesse', emoji: '🤰', keywords: ['gynécologie', 'obstétrique', 'maternité'] },
  { label: 'Dentaire', emoji: '🦷', keywords: ['dentisterie', 'dentaire'] },
  { label: 'Enfant', emoji: '🧒', keywords: ['pédiatrie'] },
  { label: 'Vaccination', emoji: '💊', keywords: ['vaccination', 'vaccin'] },
  { label: 'Urgence', emoji: '🚑', keywords: ['urgences', 'urgence'] },
];

const DAYS: { key: string; label: string }[] = [
  { key: 'sun', label: 'Dim' },
  { key: 'mon', label: 'Lun' },
  { key: 'tue', label: 'Mar' },
  { key: 'wed', label: 'Mer' },
  { key: 'thu', label: 'Jeu' },
  { key: 'fri', label: 'Ven' },
  { key: 'sat', label: 'Sam' },
];

/* ------------------------------- Utilitaires ------------------------------ */

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isOpenNow(hours?: OpeningHours): boolean | null {
  if (!hours) return null;
  const now = new Date();
  const dayKey = DAYS[now.getDay()].key;
  const today = hours[dayKey];
  if (!today) return false;
  const [oh, om] = today.open.split(':').map(Number);
  const [ch, cm] = today.close.split(':').map(Number);
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
}

function activePromotions(promotions?: Promotion[]) {
  if (!promotions?.length) return [];
  const now = Date.now();
  return promotions.filter((p) => new Date(p.validUntil).getTime() > now);
}

function daysLeft(validUntil: string) {
  const diff = new Date(validUntil).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Fonctionne pour Clinic et Pharmacy : cherche aussi dans `products` s'il existe
function matchesKeywords(entity: BaseEntity & { products?: string[] }, term: string) {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  const haystacks = [
    entity.name,
    entity.description,
    entity.city,
    entity.department,
    ...(entity.services ?? []),
    ...(entity.products ?? []),
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  if (haystacks.some((h) => h.includes(t))) return true;

  const symptom = SYMPTOM_MAP.find((s) => s.label.toLowerCase() === t);
  const keywordSet = symptom ? symptom.keywords : [t];
  return keywordSet.some((kw) => haystacks.some((h) => h.includes(kw)));
}

/* --------------------------------- UI bits -------------------------------- */

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm overflow-hidden relative">
      <div className="animate-pulse space-y-3">
        <div className="h-5 w-2/3 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
        <div className="h-3 w-3/4 rounded bg-gray-200" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-16 rounded-full bg-gray-200" />
          <div className="h-6 w-20 rounded-full bg-gray-200" />
          <div className="h-6 w-14 rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="shimmer absolute inset-0" />
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400 text-sm" aria-label={`Note ${value}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < full ? '★' : '☆'}</span>
      ))}
      <span className="ml-1 text-xs text-gray-500">{value.toFixed(1)}</span>
    </span>
  );
}

function EntityBadges({ entity }: { entity: BaseEntity }) {
  const open = isOpenNow(entity.openingHours);
  return (
    <>
      {entity.isValidated && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-0.5 ring-1 ring-emerald-200">
          ✓ Validée
        </span>
      )}
      {open !== null && (
        <span
          className={`inline-flex items-center gap-1 rounded-full text-xs font-medium px-2.5 py-0.5 ring-1 ${
            open
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              : 'bg-gray-100 text-gray-500 ring-gray-200'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
          {open ? 'Ouvert maintenant' : 'Fermé'}
        </span>
      )}
    </>
  );
}

function ClinicCard({
  clinic,
  distanceKm,
  index,
}: {
  clinic: Clinic;
  distanceKm?: number | null;
  index: number;
}) {
  const promos = activePromotions(clinic.promotions);
  const whatsappNumber = (clinic.whatsapp || clinic.phone || '').replace(/[^\d+]/g, '');

  return (
    <div
      className="group relative rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden animate-riseIn"
      style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
    >
      {promos.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            🔥 {promos[0].title}
            {promos[0].discountPercent ? ` · -${promos[0].discountPercent}%` : ''}
          </span>
          <span className="opacity-90">Expire dans {daysLeft(promos[0].validUntil)} j</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-gray-900 text-lg truncate">🏥 {clinic.name}</h3>
              <EntityBadges entity={clinic} />
            </div>

            <p className="text-gray-600 text-sm mt-1.5 flex items-center gap-1">
              📍 {clinic.address ? `${clinic.address}, ` : ''}
              {clinic.city}
              {clinic.department ? ` · ${clinic.department}` : ''}
            </p>

            {clinic.rating != null && (
              <div className="mt-1.5">
                <StarRating value={clinic.rating} />
              </div>
            )}

            {clinic.description && (
              <p className="text-gray-500 text-sm mt-2 line-clamp-2">{clinic.description}</p>
            )}
          </div>

          {distanceKm != null && (
            <div className="shrink-0 text-center rounded-xl bg-primary-50 text-primary-700 px-3 py-2">
              <p className="text-lg font-bold leading-none">{distanceKm.toFixed(1)}</p>
              <p className="text-[10px] uppercase tracking-wide">km</p>
            </div>
          )}
        </div>

        {clinic.services && clinic.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {clinic.services.slice(0, 6).map((s) => (
              <span
                key={s}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 ring-1 ring-primary-100"
              >
                {s}
              </span>
            ))}
            {clinic.services.length > 6 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 ring-1 ring-gray-200">
                +{clinic.services.length - 6}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          {clinic.phone && (
            <a
              href={`tel:${clinic.phone}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              📞 Appeler
            </a>
          )}
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber.replace('+', '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            >
              💬 WhatsApp
            </a>
          )}
          {clinic.latitude != null && clinic.longitude != null && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              🧭 Itinéraire
            </a>
          )}
          <Link
            to={`/clinics/${clinic.id}`}
            className="ml-auto text-sm font-medium text-primary-700 hover:text-primary-800 hover:underline"
          >
            Voir détails →
          </Link>
        </div>
      </div>
    </div>
  );
}

function PharmacyCard({
  pharmacy,
  distanceKm,
  index,
}: {
  pharmacy: Pharmacy;
  distanceKm?: number | null;
  index: number;
}) {
  const promos = activePromotions(pharmacy.promotions);
  const whatsappNumber = (pharmacy.whatsapp || pharmacy.phone || '').replace(/[^\d+]/g, '');

  return (
    <div
      className="group relative rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden animate-riseIn"
      style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
    >
      {promos.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            🔥 {promos[0].title}
            {promos[0].discountPercent ? ` · -${promos[0].discountPercent}%` : ''}
          </span>
          <span className="opacity-90">Expire dans {daysLeft(promos[0].validUntil)} j</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-gray-900 text-lg truncate">💊 {pharmacy.name}</h3>
              <EntityBadges entity={pharmacy} />
            </div>

            <p className="text-gray-600 text-sm mt-1.5 flex items-center gap-1">
              📍 {pharmacy.address ? `${pharmacy.address}, ` : ''}
              {pharmacy.city}
              {pharmacy.department ? ` · ${pharmacy.department}` : ''}
            </p>

            {pharmacy.rating != null && (
              <div className="mt-1.5">
                <StarRating value={pharmacy.rating} />
              </div>
            )}

            {pharmacy.description && (
              <p className="text-gray-500 text-sm mt-2 line-clamp-2">{pharmacy.description}</p>
            )}

            {pharmacy.productsCount != null && (
              <p className="text-primary-700 text-xs font-medium mt-2">
                💊 {pharmacy.productsCount} médicament(s) référencé(s)
              </p>
            )}
          </div>

          {distanceKm != null && (
            <div className="shrink-0 text-center rounded-xl bg-primary-50 text-primary-700 px-3 py-2">
              <p className="text-lg font-bold leading-none">{distanceKm.toFixed(1)}</p>
              <p className="text-[10px] uppercase tracking-wide">km</p>
            </div>
          )}
        </div>

        {pharmacy.services && pharmacy.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {pharmacy.services.slice(0, 6).map((s) => (
              <span
                key={s}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 ring-1 ring-primary-100"
              >
                {s}
              </span>
            ))}
            {pharmacy.services.length > 6 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 ring-1 ring-gray-200">
                +{pharmacy.services.length - 6}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          {pharmacy.phone && (
            <a
              href={`tel:${pharmacy.phone}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              📞 Appeler
            </a>
          )}
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber.replace('+', '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            >
              💬 WhatsApp
            </a>
          )}
          {pharmacy.latitude != null && pharmacy.longitude != null && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              🧭 Itinéraire
            </a>
          )}
          <Link
            to={`/pharmacies/${pharmacy.id}`}
            className="ml-auto text-sm font-medium text-primary-700 hover:text-primary-800 hover:underline"
          >
            Voir les produits →
          </Link>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Composant -------------------------------- */

export default function ClinicsPage() {
  const [activeTab, setActiveTab] = useState<EntityKind>('clinics');

  const [allClinics, setAllClinics] = useState<Clinic[]>([]);
  const [clinicsLoaded, setClinicsLoaded] = useState(false);
  const [allPharmacies, setAllPharmacies] = useState<Pharmacy[]>([]);
  const [pharmaciesLoaded, setPharmaciesLoaded] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [promoOnly, setPromoOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'distance' | 'rating'>('name');

  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Chargement paresseux : on charge les cliniques au montage, les pharmacies
  // seulement au premier passage sur l'onglet "Pharmacies".
  useEffect(() => {
    setLoading(true);
    setError(null);
    clinicService
      .getAll({ limit: 100 })
      .then((res) => setAllClinics(res.data.data ?? []))
      .catch(() => setError("Impossible de charger les cliniques. Vérifie ta connexion."))
      .finally(() => {
        setClinicsLoaded(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (activeTab !== 'pharmacies' || pharmaciesLoaded) return;
    setLoading(true);
    setError(null);
    pharmacyService
      .getAll({ limit: 100 })
      .then((res) => setAllPharmacies(res.data.data ?? []))
      .catch(() => setError("Impossible de charger les pharmacies. Vérifie ta connexion."))
      .finally(() => {
        setPharmaciesLoaded(true);
        setLoading(false);
      });
  }, [activeTab, pharmaciesLoaded]);

  const handleTabChange = (tab: EntityKind) => {
    setActiveTab(tab);
    // le filtre "ville/département" reste pertinent, mais un symptôme sélectionné
    // n'a de sens que côté cliniques ; on garde la recherche telle quelle.
    if (tab === 'pharmacies' && !pharmaciesLoaded) setLoading(true);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortBy('distance');
        setLocating(false);
      },
      () => {
        setLocError('Localisation refusée ou indisponible.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const clinicResults = useMemo(() => {
    let list = allClinics.filter((c) => {
      if (!matchesKeywords(c, search)) return false;
      if (city.trim() && !(c.city ?? '').toLowerCase().includes(city.trim().toLowerCase())) return false;
      if (department && c.department !== department) return false;
      if (openNowOnly && isOpenNow(c.openingHours) !== true) return false;
      if (promoOnly && activePromotions(c.promotions).length === 0) return false;
      return true;
    });

    const withDistance = list.map((c) => ({
      entity: c,
      distance:
        userLoc && c.latitude != null && c.longitude != null
          ? haversineKm(userLoc.lat, userLoc.lng, c.latitude, c.longitude)
          : null,
    }));

    withDistance.sort((a, b) => {
      if (sortBy === 'distance') {
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      }
      if (sortBy === 'rating') return (b.entity.rating ?? 0) - (a.entity.rating ?? 0);
      return a.entity.name.localeCompare(b.entity.name);
    });

    return withDistance;
  }, [allClinics, search, city, department, openNowOnly, promoOnly, sortBy, userLoc]);

  const pharmacyResults = useMemo(() => {
    let list = allPharmacies.filter((p) => {
      if (!matchesKeywords(p, search)) return false;
      if (city.trim() && !(p.city ?? '').toLowerCase().includes(city.trim().toLowerCase())) return false;
      if (department && p.department !== department) return false;
      if (openNowOnly && isOpenNow(p.openingHours) !== true) return false;
      if (promoOnly && activePromotions(p.promotions).length === 0) return false;
      return true;
    });

    const withDistance = list.map((p) => ({
      entity: p,
      distance:
        userLoc && p.latitude != null && p.longitude != null
          ? haversineKm(userLoc.lat, userLoc.lng, p.latitude, p.longitude)
          : null,
    }));

    withDistance.sort((a, b) => {
      if (sortBy === 'distance') {
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      }
      if (sortBy === 'rating') return (b.entity.rating ?? 0) - (a.entity.rating ?? 0);
      return a.entity.name.localeCompare(b.entity.name);
    });

    return withDistance;
  }, [allPharmacies, search, city, department, openNowOnly, promoOnly, sortBy, userLoc]);

  const results = activeTab === 'clinics' ? clinicResults : pharmacyResults;
  const showLoading = activeTab === 'clinics' ? loading && !clinicsLoaded : loading && !pharmaciesLoaded;

  const activeFilterCount = [
    search,
    city,
    department,
    openNowOnly && 'openNow',
    promoOnly && 'promo',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch('');
    setCity('');
    setDepartment('');
    setOpenNowOnly(false);
    setPromoOnly(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <style>{`
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-riseIn { animation: riseIn 0.45s ease-out both; }

        @keyframes shimmerMove {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          animation: shimmerMove 1.4s infinite;
        }

        @keyframes chipPop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-chipPop { animation: chipPop 0.3s ease-out both; }
      `}</style>

      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-30 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-2xl font-bold text-primary-700">🗺️ CareMap</Link>
        <span className="text-gray-300">›</span>
        <span className="text-gray-600 font-medium">
          {activeTab === 'clinics' ? 'Cliniques' : 'Pharmacies'}
        </span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* En-tête + onglets */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {activeTab === 'clinics' ? 'Trouver une clinique' : 'Trouver une pharmacie'}
          </h1>
          <p className="text-gray-500 mt-1">
            {activeTab === 'clinics'
              ? 'Par nom, symptôme, service, ville ou département — partout en Haïti.'
              : 'Par nom, médicament, service, ville ou département — partout en Haïti.'}
          </p>

          <div className="mt-5 inline-flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => handleTabChange('clinics')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === 'clinics'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🏥 Cliniques
              {clinicsLoaded && (
                <span className="text-xs font-normal text-gray-400">({allClinics.length})</span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('pharmacies')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === 'pharmacies'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              💊 Pharmacies
              {pharmaciesLoaded && (
                <span className="text-xs font-normal text-gray-400">({allPharmacies.length})</span>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
              <input
                type="text"
                className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder={
                  activeTab === 'clinics'
                    ? 'Rechercher un nom, un service, un symptôme (ex: fièvre, tension, test VIH)...'
                    : 'Rechercher un nom, un médicament, un service (ex: paracétamol, livraison)...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 lg:w-52"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">Tous les départements</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <input
              type="text"
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 lg:w-48"
              placeholder="Ville..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <button
              onClick={handleLocate}
              disabled={locating}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 transition-colors"
            >
              {locating ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                '📍'
              )}
              Près de moi
            </button>
          </div>

          {/* Chips symptômes : pertinents surtout pour les cliniques */}
          {activeTab === 'clinics' && (
            <div className="flex flex-wrap gap-2 mt-4">
              {SYMPTOM_MAP.map((s, i) => {
                const active = search.toLowerCase() === s.label.toLowerCase();
                return (
                  <button
                    key={s.label}
                    onClick={() => setSearch(active ? '' : s.label)}
                    style={{ animationDelay: `${i * 30}ms` }}
                    className={`animate-chipPop text-xs font-medium px-3 py-1.5 rounded-full ring-1 transition-all ${
                      active
                        ? 'bg-primary-600 text-white ring-primary-600 shadow-sm scale-105'
                        : 'bg-gray-50 text-gray-600 ring-gray-200 hover:bg-gray-100 hover:ring-gray-300'
                    }`}
                  >
                    {s.emoji} {s.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Filtres secondaires */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={openNowOnly}
                onChange={(e) => setOpenNowOnly(e.target.checked)}
              />
              Ouvert maintenant
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={promoOnly}
                onChange={(e) => setPromoOnly(e.target.checked)}
              />
              🔥 Promotions actives
            </label>

            <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
              <span>Trier par</span>
              <select
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="name">Nom</option>
                <option value="rating">Note</option>
                <option value="distance" disabled={!userLoc}>
                  Distance {userLoc ? '' : '(active "Près de moi")'}
                </option>
              </select>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-rose-600 hover:text-rose-700"
              >
                ✕ Réinitialiser
              </button>
            )}
          </div>

          {locError && (
            <p className="mt-3 text-xs text-rose-600 flex items-center gap-1">⚠️ {locError}</p>
          )}
        </div>

        {/* Résultats */}
        {showLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 text-rose-700 text-center py-12 px-6">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="font-medium">{error}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm">
                <span className="font-semibold text-gray-800">{results.length}</span>{' '}
                {activeTab === 'clinics' ? 'clinique(s)' : 'pharmacie(s)'} trouvée(s)
              </p>
              {userLoc && (
                <span className="text-xs text-emerald-600 inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Localisation active
                </span>
              )}
            </div>

            {results.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white text-center py-16 px-6">
                <p className="text-5xl mb-3">{activeTab === 'clinics' ? '🏥' : '💊'}</p>
                <p className="text-gray-700 font-semibold">
                  {activeTab === 'clinics'
                    ? 'Aucune clinique ne correspond à ta recherche'
                    : 'Aucune pharmacie ne correspond à ta recherche'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Essaie un autre terme, une autre ville, ou réinitialise les filtres.
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTab === 'clinics'
                  ? clinicResults.map(({ entity, distance }, i) => (
                      <ClinicCard key={entity.id} clinic={entity} distanceKm={distance} index={i} />
                    ))
                  : pharmacyResults.map(({ entity, distance }, i) => (
                      <PharmacyCard key={entity.id} pharmacy={entity} distanceKm={distance} index={i} />
                    ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}