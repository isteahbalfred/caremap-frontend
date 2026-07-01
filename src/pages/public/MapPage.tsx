import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayersControl, useMap } from 'react-leaflet';
import { Link, useSearchParams } from 'react-router-dom';
import { pharmacyService } from '../../services/pharmacyService';
import { Spinner } from '../../components/ui/Spinner';
import { clinicService } from '../../services/clinicService';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const { BaseLayer } = LayersControl;

// Fix icônes Leaflet avec Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// -- Icônes personnalisées -------------------------------------------------
const pharmacyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const clinicIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 0 5px rgba(37,99,235,0.28);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// -- Modes de transport ------------------------------------------------------
type TransportKey = 'foot' | 'bike' | 'moto' | 'car';

interface TransportMode {
  key: TransportKey;
  label: string;
  emoji: string;
  // Vitesse moyenne (km/h) utilisée pour estimer la durée localement.
  // Le serveur OSRM public gratuit ne fournit fiablement que le profil "voiture" ;
  // pour les autres modes on calcule donc la durée à partir de la distance réelle
  // (issue de l'itinéraire routier) et d'une vitesse moyenne réaliste.
  avgSpeedKmh?: number;
  // Au-delà de cette distance (km), on avertit que ce mode est peu réaliste
  warnBeyondKm?: number;
}

const TRANSPORT_MODES: TransportMode[] = [
  { key: 'foot', label: 'À pied', emoji: '🚶', avgSpeedKmh: 4.5, warnBeyondKm: 12 },
  { key: 'bike', label: 'Vélo', emoji: '🚲', avgSpeedKmh: 14, warnBeyondKm: 40 },
  { key: 'moto', label: 'Moto', emoji: '🏍️', avgSpeedKmh: 35 },
  { key: 'car', label: 'Voiture', emoji: '🚗' }, // pas de avgSpeedKmh => durée réelle OSRM utilisée
];

interface RouteStep {
  instruction: string;
  distanceM: number;
}

interface BaseRoute {
  distanceKm: number;
  carDurationMin: number; // durée réelle renvoyée par OSRM (profil voiture)
  geometry: [number, number][];
  steps: RouteStep[];
}

interface SearchItem {
  id: string;
  type: 'pharmacy' | 'clinic' | 'medication';
  name: string;
  subtitle: string;
  latitude: number;
  longitude: number;
}

// -- Aide au routage OSRM -----------------------------------------------------
const MANEUVER_FR: Record<string, string> = {
  depart: 'Démarrez',
  arrive: 'Vous êtes arrivé à destination',
  turn: 'Tournez',
  'new name': 'Continuez sur',
  continue: 'Continuez',
  merge: 'Rejoignez',
  roundabout: 'Prenez le rond-point',
  'exit roundabout': 'Sortez du rond-point',
  fork: 'Prenez la bifurcation',
  'end of road': 'Au bout de la route, tournez',
};

const MODIFIER_FR: Record<string, string> = {
  left: 'à gauche',
  right: 'à droite',
  straight: 'tout droit',
  'slight left': 'légèrement à gauche',
  'slight right': 'légèrement à droite',
  'sharp left': 'fortement à gauche',
  'sharp right': 'fortement à droite',
  uturn: 'et faites demi-tour',
};

function buildInstruction(step: any): string {
  const type = step.maneuver?.type;
  const modifier = step.maneuver?.modifier;
  const name = step.name?.trim();
  let base = MANEUVER_FR[type] || 'Continuez';
  if (modifier && MODIFIER_FR[modifier]) base += ` ${MODIFIER_FR[modifier]}`;
  if (type !== 'arrive' && name) base += ` sur ${name}`;
  return base;
}

function formatDuration(min: number): string {
  if (min < 1) return '< 1 min';
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

// Le serveur OSRM public gratuit (router.project-osrm.org) ne sert fiablement
// que le profil "voiture" (driving) — demander foot/bike renvoie silencieusement
// le même itinéraire routier. On ne fait donc qu'un seul appel, et on dérive
// les durées des autres modes localement via des vitesses moyennes (voir
// computeDisplayDuration ci-dessous).
async function fetchBaseRoute(
  from: [number, number],
  to: [number, number]
): Promise<BaseRoute | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;
    const route = data.routes[0];
    const distanceKm = route.distance / 1000;
    const carDurationMin = route.duration / 60;
    const geometry: [number, number][] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]]
    );
    const steps: RouteStep[] = (route.legs?.[0]?.steps || []).map((s: any) => ({
      instruction: buildInstruction(s),
      distanceM: s.distance,
    }));
    return { distanceKm, carDurationMin, geometry, steps };
  } catch {
    return null;
  }
}

// Durée affichée pour le mode sélectionné : durée réelle OSRM pour la voiture,
// estimation distance/vitesse-moyenne pour les autres modes.
function computeDisplayDuration(base: BaseRoute, mode: TransportMode): number {
  if (!mode.avgSpeedKmh) return base.carDurationMin;
  return (base.distanceKm / mode.avgSpeedKmh) * 60;
}

// -- Petit composant utilitaire pour recentrer la carte -----------------------
function FlyTo({ position, zoom = 16 }: { position: [number, number] | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, zoom, { duration: 1.1 });
  }, [position]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function MapPage() {
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  // Géolocalisation
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(true);

  // Recherche
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Destination + itinéraire
  const [destination, setDestination] = useState<SearchItem | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [selectedMode, setSelectedMode] = useState<TransportKey>('car');
  const [baseRoute, setBaseRoute] = useState<BaseRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showDirections, setShowDirections] = useState(false);

  const currentMode = TRANSPORT_MODES.find((m) => m.key === selectedMode)!;
  const displayDurationMin = baseRoute ? computeDisplayDuration(baseRoute, currentMode) : null;
  const isUnrealistic =
    baseRoute != null &&
    currentMode.warnBeyondKm != null &&
    baseRoute.distanceKm > currentMode.warnBeyondKm;

  const center: [number, number] = [18.5425, -72.3386]; // Port-au-Prince par défaut

  // -- Chargement des données --------------------------------------------
  useEffect(() => {
    pharmacyService.getAll({ limit: 50 })
      .then(res => setPharmacies(res.data.data))
      .finally(() => setLoading(false));
    clinicService.getAll({ limit: 50 })
      .then(res => setClinics(res.data.data))
      .catch(() => {});
  }, []);

  // -- Géolocalisation utilisateur ----------------------------------------
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // -- Fermer les résultats de recherche au clic extérieur -----------------
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // -- Index de recherche : pharmacies + cliniques + médicaments -----------
  const searchIndex: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = [];
    pharmacies.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return;
      items.push({
        id: `pharm-${p.id}`, type: 'pharmacy', name: p.name,
        subtitle: `Pharmacie · ${p.city}`, latitude: p.latitude, longitude: p.longitude,
      });
      (p.medications || []).forEach((m: any) => {
        items.push({
          id: `med-${p.id}-${m.id || m.name}`, type: 'medication', name: m.name,
          subtitle: `Disponible à ${p.name} · ${p.city}`, latitude: p.latitude, longitude: p.longitude,
        });
      });
    });
    clinics.forEach((c) => {
      if (c.latitude == null || c.longitude == null) return;
      items.push({
        id: `clinic-${c.id}`, type: 'clinic', name: c.name,
        subtitle: `Clinique · ${c.city}`, latitude: c.latitude, longitude: c.longitude,
      });
    });
    return items;
  }, [pharmacies, clinics]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchIndex.filter((item) => item.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, searchIndex]);

  // -- Sélection d'une destination (recherche ou liste) ---------------------
  const chooseDestination = (item: SearchItem) => {
    setDestination(item);
    setFlyTarget([item.latitude, item.longitude]);
    setQuery('');
    setSearchOpen(false);
    setShowDirections(false);
    setBaseRoute(null);
  };

  const clearDestination = () => {
    setDestination(null);
    setBaseRoute(null);
    setShowDirections(false);
  };

  // -- Auto-sélection via lien externe : /map?focus=pharmacy-12 ou clinic-7 --
  // Permet au chatbot ou à une fiche médicament d'envoyer un lien qui ouvre
  // directement la carte avec l'itinéraire déjà calculé vers ce lieu.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const focus = searchParams.get('focus');
    if (!focus || (!pharmacies.length && !clinics.length)) return;
    const separatorIdx = focus.indexOf('-');
    const type = focus.slice(0, separatorIdx);
    const rawId = focus.slice(separatorIdx + 1);
    if (type === 'pharmacy') {
      const p = pharmacies.find((x) => String(x.id) === rawId);
      if (p && p.latitude != null && p.longitude != null) {
        chooseDestination({
          id: `pharm-${p.id}`, type: 'pharmacy', name: p.name,
          subtitle: `Pharmacie · ${p.city}`, latitude: p.latitude, longitude: p.longitude,
        });
      }
    } else if (type === 'clinic') {
      const c = clinics.find((x) => String(x.id) === rawId);
      if (c && c.latitude != null && c.longitude != null) {
        chooseDestination({
          id: `clinic-${c.id}`, type: 'clinic', name: c.name,
          subtitle: `Clinique · ${c.city}`, latitude: c.latitude, longitude: c.longitude,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pharmacies, clinics]);

  // -- Calcul de l'itinéraire : un seul appel réseau, réutilisé pour tous les modes --
  useEffect(() => {
    if (!destination || !userPosition) return;
    let cancelled = false;
    setRouteLoading(true);
    fetchBaseRoute(userPosition, [destination.latitude, destination.longitude]).then((result) => {
      if (!cancelled) {
        setBaseRoute(result);
        setRouteLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [destination, userPosition]);

  // Changer de mode ne refait aucune requête : la durée est recalculée localement
  const handleModeChange = (modeKey: TransportKey) => setSelectedMode(modeKey);

  const recenterOnUser = () => {
    if (userPosition) setFlyTarget(userPosition);
  };

  const typeLabel: Record<SearchItem['type'], string> = {
    pharmacy: '🏪', clinic: '🏥', medication: '💊',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-2xl font-bold text-primary-700">🗺️ CareMap</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-600">Carte des pharmacies</span>
      </nav>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-sm overflow-y-auto p-4 flex flex-col gap-4">
          {/* Barre de recherche */}
          <div ref={searchRef} className="relative">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Rechercher un médicament, une pharmacie, une clinique…"
                className="w-full px-3 py-2.5 pl-9 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute z-[1000] mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => chooseDestination(item)}
                    className="w-full text-left px-3 py-2.5 hover:bg-primary-50 flex items-start gap-2 border-b border-gray-50 last:border-b-0"
                  >
                    <span className="text-lg leading-none mt-0.5">{typeLabel[item.type]}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchOpen && query.trim() && searchResults.length === 0 && (
              <div className="absolute z-[1000] mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-3 text-sm text-gray-500">
                Aucun résultat pour « {query} »
              </div>
            )}
          </div>

          {/* Carte destination + itinéraire */}
          {destination && (
            <div className="border border-primary-100 bg-primary-50/50 rounded-xl p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-primary-600 font-semibold">Destination</p>
                  <p className="text-sm font-semibold text-gray-800">{destination.name}</p>
                  <p className="text-xs text-gray-500">{destination.subtitle}</p>
                </div>
                <button onClick={clearDestination} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
              </div>

              {/* Sélecteur de mode de transport */}
              <div className="grid grid-cols-4 gap-1.5">
                {TRANSPORT_MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => handleModeChange(m.key)}
                    className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-xs transition-colors ${
                      selectedMode === m.key
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <span className="text-base leading-none">{m.emoji}</span>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Résultat distance / temps */}
              {!userPosition && !locating && (
                <p className="text-xs text-amber-600">
                  Position non disponible. Autorisez la géolocalisation pour calculer l'itinéraire.
                </p>
              )}
              {routeLoading && (
                <div className="flex items-center gap-2 text-xs text-gray-500 py-1">
                  <Spinner /> Calcul de l'itinéraire…
                </div>
              )}
              {!routeLoading && baseRoute && displayDurationMin != null && (
                <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{baseRoute.distanceKm.toFixed(1)} km</p>
                    <p className="text-xs text-gray-500">Distance</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary-600">{formatDuration(displayDurationMin)}</p>
                    <p className="text-xs text-gray-500">Durée estimée</p>
                  </div>
                </div>
              )}
              {isUnrealistic && (
                <p className="text-xs text-amber-600">
                  ⚠️ Ce trajet est très long pour le mode « {currentMode.label} ». Essayez la voiture ou la moto.
                </p>
              )}
              {!routeLoading && !baseRoute && userPosition && (
                <p className="text-xs text-red-500">Itinéraire indisponible pour ce trajet.</p>
              )}

              {baseRoute && (
                <button
                  onClick={() => setShowDirections((s) => !s)}
                  className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {showDirections ? 'Masquer l\'aide 🧭' : 'Aide pour arriver 🧭'}
                </button>
              )}

              {/* Étapes de navigation (basées sur le trajet routier) */}
              {showDirections && baseRoute && (
                <div className="max-h-56 overflow-y-auto space-y-1.5 pt-1">
                  {baseRoute.steps.map((s, i) => (
                    <div key={i} className="flex gap-2 text-xs bg-white rounded-lg px-2.5 py-2 border border-gray-100">
                      <span className="font-semibold text-primary-600 shrink-0">{i + 1}.</span>
                      <div>
                        <p className="text-gray-700">{s.instruction}</p>
                        {s.distanceM > 0 && (
                          <p className="text-gray-400">
                            {s.distanceM >= 1000 ? `${(s.distanceM / 1000).toFixed(1)} km` : `${Math.round(s.distanceM)} m`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Liste des pharmacies */}
          <div>
            <h2 className="font-bold text-gray-800 mb-3">🏪 Pharmacies ({pharmacies.length})</h2>
            {loading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <div className="space-y-2">
                {pharmacies.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelected(p);
                      chooseDestination({
                        id: `pharm-${p.id}`, type: 'pharmacy', name: p.name,
                        subtitle: `Pharmacie · ${p.city}`, latitude: p.latitude, longitude: p.longitude,
                      });
                    }}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                      selected?.id === p.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 hover:border-primary-200'
                    }`}
                  >
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-500">📍 {p.city}</p>
                    <p className="text-xs text-gray-500">{p.address}</p>
                    <p className="text-xs text-green-600 mt-1">
                      💊 {p.medications?.length || 0} médicament(s)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Carte */}
        <div className="flex-1 relative">
          {/* Bouton "Me localiser" style Google Maps */}
          <button
            onClick={recenterOnUser}
            disabled={!userPosition}
            title="Me localiser"
            className="absolute z-[1000] bottom-6 right-4 w-11 h-11 bg-white shadow-md rounded-full flex items-center justify-center text-lg hover:bg-gray-50 disabled:opacity-40 border border-gray-200"
          >
            🎯
          </button>

          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
            <LayersControl position="topright">
              <BaseLayer checked name="🗺️ Rue">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </BaseLayer>
              <BaseLayer name="🛰️ Satellite">
                <TileLayer
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </BaseLayer>
              <BaseLayer name="⛰️ Relief">
                <TileLayer
                  attribution='Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                />
              </BaseLayer>
            </LayersControl>

            <FlyTo position={flyTarget} />

            {/* Position de l'utilisateur */}
            {userPosition && (
              <Marker position={userPosition} icon={userIcon}>
                <Popup>Vous êtes ici</Popup>
              </Marker>
            )}

            {/* Pharmacies */}
            {pharmacies.map((p) => (
              p.latitude != null && p.longitude != null && (
                <Marker
                  key={p.id}
                  position={[p.latitude, p.longitude]}
                  icon={pharmacyIcon}
                  eventHandlers={{
                    click: () => {
                      setSelected(p);
                      chooseDestination({
                        id: `pharm-${p.id}`, type: 'pharmacy', name: p.name,
                        subtitle: `Pharmacie · ${p.city}`, latitude: p.latitude, longitude: p.longitude,
                      });
                    },
                  }}
                >
                  <Popup>
                    <div className="min-w-40">
                      <p className="font-bold text-gray-800">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.address}</p>
                      <p className="text-sm text-gray-500">{p.city}</p>
                      <p className="text-sm font-medium text-primary-600 mt-1">📞 {p.phone}</p>
                      <p className="text-xs text-green-600">
                        💊 {p.medications?.length || 0} médicament(s) disponible(s)
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}

            {/* Cliniques */}
            {clinics.map((c) => (
              c.latitude != null && c.longitude != null && (
                <Marker
                  key={c.id}
                  position={[c.latitude, c.longitude]}
                  icon={clinicIcon}
                  eventHandlers={{
                    click: () => chooseDestination({
                      id: `clinic-${c.id}`, type: 'clinic', name: c.name,
                      subtitle: `Clinique · ${c.city}`, latitude: c.latitude, longitude: c.longitude,
                    }),
                  }}
                >
                  <Popup>
                    <div className="min-w-40">
                      <p className="font-bold text-red-700">🏥 {c.name}</p>
                      <p className="text-sm text-gray-500">{c.address}</p>
                      <p className="text-sm text-gray-500">{c.city}</p>
                      <p className="text-sm font-medium text-primary-600 mt-1">📞 {c.phone}</p>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}

            {/* Marqueur destination sélectionnée */}
            {destination && (
              <Marker position={[destination.latitude, destination.longitude]} icon={destinationIcon}>
                <Popup>{destination.name}</Popup>
              </Marker>
            )}

            {/* Tracé de l'itinéraire */}
            {baseRoute && (
              <Polyline
                positions={baseRoute.geometry}
                pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.75 }}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}