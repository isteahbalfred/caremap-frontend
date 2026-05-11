import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const { user, isAuthenticated } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* ── NAVBAR PREMIUM ─────────────────────────────────────────── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-2xl border-b border-slate-200/50' 
          : 'bg-transparent backdrop-blur-sm border-b border-white/20'
      }`}>
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <img
                src="/caremap-logo.png"
                alt="CareMap"
                className="relative h-11 w-11 object-contain rounded-full bg-white shadow-lg"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              CareMap
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {[
              { to: "/search", label: "Médicaments", icon: "💊" },
              { to: "/map", label: "Carte", icon: "🗺️" },
              { to: "/clinics", label: "Cliniques", icon: "🏥" },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="group relative text-slate-600 hover:text-indigo-600 font-medium transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
                {user?.role === 'SUPER_ADMIN' && (
                  <Link to="/admin" className="btn-premium-primary text-sm px-5 py-2.5">
                    Dashboard Admin
                  </Link>
                )}
                {user?.role === 'PHARMACY_ADMIN' && (
                  <Link to="/pharmacy" className="btn-premium-primary text-sm px-5 py-2.5">
                    Ma Pharmacie
                  </Link>
                )}
                <button
                  onClick={() => dispatch(logout())}
                  className="text-sm text-red-500 hover:text-red-700 font-medium transition-all duration-300 hover:scale-105"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-slate-600 hover:text-indigo-600 font-medium text-sm transition-all duration-300">
                  Connexion
                </Link>
                <Link to="/register" className="btn-premium-primary text-sm px-5 py-2.5">
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION PREMIUM ───────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          {/* Animated particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/10 animate-float"
                style={{
                  width: `${Math.random() * 4 + 2}px`,
                  height: `${Math.random() * 4 + 2}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${Math.random() * 10 + 10}s`
                }}
              ></div>
            ))}
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-8 py-32 text-center z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-full px-5 py-2 mb-8 animate-slideDown">
            <span className="text-2xl">🇭🇹</span>
            <span className="text-white/90 text-sm font-medium">Plateforme médicale Haïti</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight animate-slideUp">
            Trouvez vos médicaments
            <br />
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
              près de vous
            </span>
          </h1>
          
          <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto animate-fadeIn">
            CareMap connecte les patients aux pharmacies et cliniques d'Haïti avec une technologie de pointe.
            Comparez les prix, vérifiez les stocks et localisez les soins en temps réel.
          </p>

          {/* Premium Search Bar */}
          <div className="max-w-3xl mx-auto animate-slideUp">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl border border-white/20">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="🔍 Rechercher un médicament..."
                  className="w-full px-6 py-4 bg-white rounded-xl text-slate-800 outline-none text-base transition-all duration-300 focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      window.location.href = `/search?q=${val}`;
                    }
                  }}
                />
              </div>
              <Link
                to="/search"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-10 py-4 rounded-xl text-center transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Rechercher
              </Link>
            </div>
          </div>

          {/* Premium Stats */}
          <div className="flex justify-center gap-16 mt-20 flex-wrap">
            {[
              { value: '500+', label: 'Pharmacies partenaires', icon: '🏪' },
              { value: '1000+', label: 'Médicaments référencés', icon: '💊' },
              { value: '10+', label: 'Villes desservies', icon: '🌆' },
              { value: '99%', label: 'Taux de satisfaction', icon: '⭐' },
            ].map(s => (
              <div key={s.label} className="text-center group cursor-pointer">
                <div className="text-4xl mb-2 transition-transform group-hover:scale-110">{s.icon}</div>
                <div className="text-4xl font-bold text-white mb-1">{s.value}</div>
                <div className="text-white/60 text-sm font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white/50 rounded-full mt-2 animate-scroll"></div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION PREMIUM ───────────────────────────────── */}
      <section className="py-28 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full text-indigo-600 text-sm font-semibold mb-4">
              Pourquoi nous choisir
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Une plateforme d'exception
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Découvrez une expérience unique pour améliorer l'accès aux soins
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '📍',
                title: 'Géolocalisation précise',
                desc: 'Trouvez les pharmacies et cliniques les plus proches grâce à notre carte interactive.',
                color: 'from-blue-500 to-cyan-500',
                gradient: 'from-blue-50 to-cyan-50',
              },
              {
                icon: '💊',
                title: 'Stocks en temps réel',
                desc: 'Vérifiez la disponibilité des médicaments avant de vous déplacer.',
                color: 'from-green-500 to-emerald-500',
                gradient: 'from-green-50 to-emerald-50',
              },
              {
                icon: '💰',
                title: 'Comparaison de prix',
                desc: 'Comparez les prix et trouvez la meilleure offre près de chez vous.',
                color: 'from-orange-500 to-amber-500',
                gradient: 'from-orange-50 to-amber-50',
              },
              {
                icon: '🔒',
                title: 'Données certifiées',
                desc: 'Informations vérifiées et mises à jour quotidiennement par nos partenaires.',
                color: 'from-purple-500 to-pink-500',
                gradient: 'from-purple-50 to-pink-50',
              },
            ].map(f => (
              <div
                key={f.title}
                className="group relative bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-100"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <div className="relative">
                  <div className={`w-16 h-16 bg-gradient-to-r ${f.color} rounded-xl flex items-center justify-center text-3xl mb-6 shadow-lg transform group-hover:scale-110 transition duration-300`}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 text-xl mb-3">{f.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="py-28 px-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 bg-indigo-600/10 rounded-full text-indigo-600 text-sm font-semibold mb-4">
              Processus simple
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Trouvez vos médicaments en 3 étapes
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: '01', icon: '🔍', title: 'Recherchez', desc: 'Tapez le nom de votre médicament dans notre moteur de recherche intelligent.', gradient: 'from-indigo-500 to-purple-500' },
              { step: '02', icon: '📍', title: 'Localisez', desc: 'Découvrez toutes les pharmacies qui ont le médicament en stock près de chez vous.', gradient: 'from-purple-500 to-pink-500' },
              { step: '03', icon: '🏪', title: 'Visitez', desc: 'Choisissez la pharmacie la plus proche ou au meilleur prix et rendez-vous sur place.', gradient: 'from-pink-500 to-rose-500' },
            ].map((s, idx) => (
              <div key={s.step} className="relative group">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className={`w-24 h-24 mx-auto bg-gradient-to-r ${s.gradient} rounded-2xl flex items-center justify-center text-4xl shadow-2xl transform group-hover:scale-110 transition duration-500`}>
                      {s.icon}
                    </div>
                    <div className="absolute -top-3 -right-3 w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {s.step}
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-2xl mb-3">{s.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden lg:block absolute top-1/3 -right-12 w-12">
                    <div className="text-4xl text-indigo-300">→</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION PREMIUM ────────────────────────────────── */}
      <section className="relative py-28 px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-800">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto text-center z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Rejoignez l'écosystème CareMap
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Professionnels de santé, pharmacies et cliniques : rendez vos services visibles à des milliers de patients en Haïti.
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <Link
              to="/register"
              className="bg-white text-indigo-700 hover:bg-slate-100 font-bold px-10 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Commencer maintenant
            </Link>
            <Link
              to="/map"
              className="border-2 border-white/30 hover:bg-white/10 text-white font-medium px-10 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            >
              Explorer la carte
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER PREMIUM ──────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg"></div>
                <span className="text-white font-bold text-2xl">CareMap</span>
              </div>
              <p className="text-sm leading-relaxed">
                Plateforme médicale intelligente révolutionnant l'accès aux soins en Haïti.
              </p>
              <div className="flex gap-4 mt-4">
                {['📘', '🐦', '📷', '💼'].map((social, i) => (
                  <div key={i} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-lg cursor-pointer hover:bg-indigo-600 transition-colors">
                    {social}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">Navigation</h4>
              <div className="space-y-3 text-sm">
                {['Rechercher', 'Carte', 'Cliniques', 'S\'inscrire', 'Médicaments'].map(item => (
                  <div key={item}>
                    <Link to={`/${item.toLowerCase() === 'rechercher' ? 'search' : item.toLowerCase() === 'carte' ? 'map' : item.toLowerCase() === 'cliniques' ? 'clinics' : item.toLowerCase() === 's\'inscrire' ? 'register' : 'search'}`} className="hover:text-white transition-colors">
                      {item}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">Ressources</h4>
              <div className="space-y-3 text-sm">
                <div className="hover:text-white transition-colors cursor-pointer">À propos</div>
                <div className="hover:text-white transition-colors cursor-pointer">Contact</div>
                <div className="hover:text-white transition-colors cursor-pointer">FAQ</div>
                <div className="hover:text-white transition-colors cursor-pointer">Blog</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">Informations</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>📍</span> Saint Marc, Haïti
                </div>
                <div className="flex items-center gap-2">
                  <span>📧</span> contact@caremap.ht
                </div>
                <div className="flex items-center gap-2">
                  <span>📞</span> +509 4270 4652
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>© 2026 CareMap</p>
            <p className="mt-2">
              A votre service pour améliorer l'accès aux soins en Haïti. Conçu avec ❤️ par une équipe passionnée.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scroll {
          0% { transform: translateY(0px); opacity: 1; }
          100% { transform: translateY(8px); opacity: 0; }
        }
        
        .animate-float {
          animation: float linear infinite;
        }
        
        .animate-slideDown {
          animation: slideDown 0.6s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }
        
        .animate-scroll {
          animation: scroll 1.5s ease-in-out infinite;
        }
        
        .btn-premium-primary {
          background: linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(139, 92, 246) 100%);
          color: white;
          font-weight: 600;
          border-radius: 0.75rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .btn-premium-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
}