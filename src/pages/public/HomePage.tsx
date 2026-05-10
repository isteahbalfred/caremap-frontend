import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

export default function HomePage() {
  const { user, isAuthenticated } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/caremap-logo.png"
              alt="CareMap"
              className="h-10 w-10 object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-2xl font-bold text-primary-700">CareMap</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/search" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Médicaments
            </Link>
            <Link to="/map" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Carte
            </Link>
            <Link to="/clinics" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Cliniques
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-500 hidden md:block">
                  {user?.firstName} {user?.lastName}
                </span>
                {user?.role === 'SUPER_ADMIN' && (
                  <Link to="/admin" className="btn-primary text-sm px-4 py-2">
                    Dashboard Admin
                  </Link>
                )}
                {user?.role === 'PHARMACY_ADMIN' && (
                  <Link to="/pharmacy" className="btn-primary text-sm px-4 py-2">
                    Ma Pharmacie
                  </Link>
                )}
                <button
                  onClick={() => dispatch(logout())}
                  className="text-sm text-red-500 hover:text-red-700 font-medium"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                  Connexion
                </Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-blue-500 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            🇭🇹 Plateforme médicale pour Haïti
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Trouvez vos médicaments<br />
            <span className="text-yellow-300">près de vous, en un clic</span>
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            CareMap connecte les patients aux pharmacies et cliniques d'Haïti.
            Comparez les prix, vérifiez les stocks et localisez les soins dont vous avez besoin.
          </p>

          {/* Barre de recherche rapide */}
          <div className="bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 max-w-2xl mx-auto shadow-2xl">
            <input
              type="text"
              placeholder="🔍 Rechercher un médicament..."
              className="flex-1 px-4 py-3 text-gray-800 rounded-xl outline-none text-base"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value;
                  window.location.href = `/search?q=${val}`;
                }
              }}
            />
            <Link
              to="/search"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-xl text-center transition-colors"
            >
              Rechercher
            </Link>
          </div>

          {/* Stats rapides */}
          <div className="flex justify-center gap-8 mt-12 flex-wrap">
            {[
              { value: '500+', label: 'Pharmacies' },
              { value: '1000+', label: 'Médicaments' },
              { value: '10+', label: 'Villes couvertes' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-yellow-300">{s.value}</div>
                <div className="text-blue-200 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi choisir CareMap ?
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Une solution complète pour améliorer l'accès aux soins en Haïti
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '📍',
                title: 'Localiser',
                desc: 'Trouvez les pharmacies et cliniques proches de vous sur une carte interactive.',
                color: 'bg-blue-50 border-blue-100',
                iconBg: 'bg-blue-100',
              },
              {
                icon: '💊',
                title: 'Disponibilité',
                desc: 'Vérifiez en temps réel si un médicament est disponible avant de vous déplacer.',
                color: 'bg-green-50 border-green-100',
                iconBg: 'bg-green-100',
              },
              {
                icon: '💰',
                title: 'Comparer',
                desc: 'Comparez les prix des médicaments entre différentes pharmacies facilement.',
                color: 'bg-yellow-50 border-yellow-100',
                iconBg: 'bg-yellow-100',
              },
              {
                icon: '✅',
                title: 'Fiable',
                desc: 'Données vérifiées et mises à jour par les pharmacies elles-mêmes.',
                color: 'bg-purple-50 border-purple-100',
                iconBg: 'bg-purple-100',
              },
            ].map(f => (
              <div key={f.title} className={`border rounded-2xl p-6 ${f.color}`}>
                <div className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ──────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '🔍', title: 'Recherchez', desc: 'Tapez le nom de votre médicament dans la barre de recherche.' },
              { step: '2', icon: '📍', title: 'Localisez', desc: 'Consultez la liste des pharmacies qui ont le médicament disponible.' },
              { step: '3', icon: '🏪', title: 'Visitez', desc: 'Choisissez la pharmacie la plus proche ou au meilleur prix.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-primary-600 mb-1">ÉTAPE {s.step}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-primary-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Vous êtes pharmacien ou clinique ?
          </h2>
          <p className="text-blue-200 mb-8 text-lg">
            Rejoignez CareMap et rendez vos services visibles à des milliers de patients en Haïti.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/register"
              className="bg-white text-primary-700 hover:bg-gray-100 font-bold px-8 py-3 rounded-xl transition-colors"
            >
              Inscrire ma pharmacie
            </Link>
            <Link
              to="/map"
              className="border border-white/30 hover:bg-white/10 text-white font-medium px-8 py-3 rounded-xl transition-colors"
            >
              Voir la carte
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white font-bold text-xl">🗺️ CareMap</span>
            </div>
            <p className="text-sm leading-relaxed">
              Plateforme médicale intelligente pour Haïti. Trouvez vos médicaments, près de vous, en un clic.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Navigation</h4>
            <div className="space-y-2 text-sm">
              <div><Link to="/search" className="hover:text-white transition-colors">Rechercher</Link></div>
              <div><Link to="/map" className="hover:text-white transition-colors">Carte</Link></div>
              <div><Link to="/clinics" className="hover:text-white transition-colors">Cliniques</Link></div>
              <div><Link to="/register" className="hover:text-white transition-colors">S'inscrire</Link></div>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Projet</h4>
            <div className="space-y-2 text-sm">
              <div>Stage universitaire ISTEAH</div>
              <div>Stack: React + Express + PostgreSQL</div>
              <div>Déployé sur Vercel + Render</div>
              <div className="pt-2">
                
                  href="https://github.com/isteahbalfred"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub →
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          © 2026 CareMap — Projet de stage universitaire ISTEAH — Haïti
        </div>
      </footer>
    </div>
  );
}