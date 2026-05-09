import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { pharmacyService } from '../../services/pharmacyService';
import { Spinner } from '../../components/ui/Spinner';
import { clinicService } from '../../services/clinicService';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix icônes Leaflet avec Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapPage() {
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [clinics, setClinics] = useState<any[]>([]);

  useEffect(() => {
    pharmacyService.getAll({ limit: 50 })
      .then(res => setPharmacies(res.data.data))
      .finally(() => setLoading(false));
  }, []);
  clinicService.getAll({ limit: 50 })
  .then(res => setClinics(res.data.data))
  .catch(() => {});

  // Centre par défaut : Port-au-Prince
  const center: [number, number] = [18.5425, -72.3386];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-2xl font-bold text-primary-700">🗺️ CareMap</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-600">Carte des pharmacies</span>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar pharmacies */}
        <div className="w-80 bg-white shadow-sm overflow-y-auto p-4">
          <h2 className="font-bold text-gray-800 mb-3">
            🏪 Pharmacies ({pharmacies.length})
          </h2>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="space-y-2">
              {pharmacies.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelected(p)}
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
        {clinics.map(c => (
            <Marker
                key={c.id}
                position={[c.latitude, c.longitude]}
                icon={new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                })}
            >
            <Popup>
            <div className="min-w-40">
                <p className="font-bold text-red-700">🏥 {c.name}</p>
                <p className="text-sm text-gray-500">{c.address}</p>
                <p className="text-sm text-gray-500">{c.city}</p>
                <p className="text-sm font-medium text-primary-600 mt-1">
                📞 {c.phone}
                </p>
            </div>
            </Popup>
        </Marker>
        ))}

        {/* Carte */}
        <div className="flex-1">
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {pharmacies.map(p => (
              <Marker
                key={p.id}
                position={[p.latitude, p.longitude]}
                eventHandlers={{ click: () => setSelected(p) }}
              >
                <Popup>
                  <div className="min-w-40">
                    <p className="font-bold text-gray-800">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.address}</p>
                    <p className="text-sm text-gray-500">{p.city}</p>
                    <p className="text-sm font-medium text-primary-600 mt-1">
                      📞 {p.phone}
                    </p>
                    <p className="text-xs text-green-600">
                      💊 {p.medications?.length || 0} médicament(s) disponible(s)
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}