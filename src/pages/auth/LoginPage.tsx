import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearError } from '../../store/slices/authSlice';
import { Button } from '../../components/ui/Button';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated, user } = useAppSelector(s => s.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Pré-remplir l'email si on vient de la page Register
  useEffect(() => {
    if (location.state?.email) {
      setForm(f => ({ ...f, email: location.state.email }));
    }
  }, [location.state]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'SUPER_ADMIN') navigate('/admin');
      else if (user.role === 'PHARMACY_ADMIN') navigate('/pharmacy');
      else navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(login(form));
  };

  const handleGoogleLogin = () => {
    // Redirection vers l'endpoint OAuth Google du backend
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex bg-[#f7f7fb] relative overflow-hidden">
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes scaleIn { from { opacity:0; transform: scale(.95); } to { opacity:1; transform: scale(1); } }
        @keyframes blobMove1 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(40px,-60px) scale(1.15); } 66% { transform: translate(-30px,30px) scale(.9); } }
        @keyframes blobMove2 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(-50px,40px) scale(1.2); } 66% { transform: translate(35px,-25px) scale(.85); } }
        @keyframes blobMove3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(25px,35px) scale(1.1); } }
        @keyframes glowPulse { 0%,100% { opacity:.5; transform: scale(1); } 50% { opacity:.9; transform: scale(1.08); } }
        @keyframes particleRise { 0% { transform: translateY(0); opacity:0; } 10% { opacity:.5; } 90% { opacity:.2; } 100% { transform: translateY(-340px); opacity:0; } }
        @keyframes gridPan { from { background-position: 0 0; } to { background-position: 64px 64px; } }

        .anim-fade-up { opacity:0; animation: fadeInUp .7s cubic-bezier(.16,1,.3,1) forwards; }
        .anim-fade-in { opacity:0; animation: fadeIn .8s ease forwards; }
        .anim-scale-in { opacity:0; animation: scaleIn .5s cubic-bezier(.16,1,.3,1) forwards; }
        .d1 { animation-delay: .05s } .d2 { animation-delay: .12s } .d3 { animation-delay: .2s }
        .d4 { animation-delay: .28s } .d5 { animation-delay: .36s } .d6 { animation-delay: .44s }
        .d7 { animation-delay: .52s } .d8 { animation-delay: .6s }

        .blob-1 { animation: blobMove1 16s ease-in-out infinite; }
        .blob-2 { animation: blobMove2 20s ease-in-out infinite; }
        .blob-3 { animation: blobMove3 14s ease-in-out infinite; }
        .glow-pulse { animation: glowPulse 3s ease-in-out infinite; }
        .grid-pan { animation: gridPan 6s linear infinite; }

        .particle { position:absolute; bottom:-10px; border-radius:50%; background:rgba(255,255,255,.8); animation: particleRise linear infinite; }

        .shine-on-hover { position:relative; overflow:hidden; }
        .shine-on-hover::after { content:''; position:absolute; top:0; left:-75%; width:50%; height:100%; background:linear-gradient(120deg, transparent, rgba(255,255,255,.5), transparent); transform:skewX(-20deg); transition: left .7s ease; }
        .shine-on-hover:hover::after { left:125%; }
      `}</style>

      {/* Blobs décoratifs côté formulaire (clair) */}
      <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-violet-200 opacity-40 blur-3xl blob-1 pointer-events-none" />
      <div className="absolute -bottom-40 left-10 w-[380px] h-[380px] rounded-full bg-fuchsia-200 opacity-30 blur-3xl blob-2 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 w-[300px] h-[300px] rounded-full bg-cyan-200 opacity-20 blur-3xl blob-3 pointer-events-none" />

      {/* Panneau gauche — visible desktop */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12 bg-gradient-to-br from-[#0b0f2a] via-[#1e1147] to-[#3a1257]">

        {/* Texture grille */}
        <div
          className="absolute inset-0 opacity-[0.07] grid-pan"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Blobs animés */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-violet-500 opacity-20 blur-3xl blob-1" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-fuchsia-500 opacity-25 blur-3xl blob-2 translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 rounded-full bg-cyan-400 opacity-10 blur-3xl blob-3" />

        {/* Particules flottantes */}
        {[...Array(8)].map((_, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left: `${8 + i * 11}%`,
              width: `${4 + (i % 3) * 2}px`,
              height: `${4 + (i % 3) * 2}px`,
              animationDuration: `${8 + i}s`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16 anim-fade-up d1">
            <span className="relative flex items-center justify-center w-11 h-11">
              <span className="absolute inset-0 rounded-full bg-violet-400 blur-md opacity-60 glow-pulse" />
              <span className="relative text-3xl">🗺️</span>
            </span>
            <span className="bg-gradient-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-transparent text-2xl font-bold tracking-tight">
              CareMap
            </span>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4 anim-fade-up d2">
            La santé en Haïti,<br />
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent">
              à portée de main.
            </span>
          </h2>
          <p className="text-violet-200/80 text-lg leading-relaxed anim-fade-up d3">
            Trouvez des médicaments, des pharmacies et des cliniques proches de vous en temps réel.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '200+', label: 'Pharmacies' },
            { value: '50+', label: 'Cliniques' },
            { value: '5 000+', label: 'Médicaments' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`anim-fade-up d${4 + i} bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10 hover:bg-white/15 hover:-translate-y-1 hover:border-violet-300/30 transition-all duration-300 cursor-default`}
            >
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-violet-200/70 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-[400px]">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-10 anim-fade-up d1">
            <span className="text-2xl">🗺️</span>
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent text-xl font-bold">
              CareMap
            </span>
          </div>

          {/* En-tête */}
          <div className="mb-8 anim-fade-up d2">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h1>
            <p className="text-gray-500">Bienvenue, entrez vos identifiants.</p>
          </div>

          {/* Message succès après inscription */}
          {location.state?.success && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl mb-6 text-sm anim-scale-in">
              <span className="text-lg">✅</span>
              <span>{location.state.success}</span>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-6 text-sm anim-scale-in">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Bouton Google */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="shine-on-hover w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-700 font-medium text-sm hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5 hover:border-violet-300 transition-all duration-300 mb-6 anim-fade-up d3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </button>

          {/* Séparateur */}
          <div className="flex items-center gap-3 mb-6 anim-fade-in d3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="anim-fade-up d4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Adresse email
              </label>
              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-violet-500/15 focus:border-violet-500 focus:bg-white transition-all duration-300 placeholder-gray-400"
                  placeholder="votre@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="anim-fade-up d5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Mot de passe
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-violet-500/15 focus:border-violet-500 focus:bg-white transition-all duration-300 placeholder-gray-400"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600 hover:scale-110 transition-all duration-200"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="anim-fade-up d6">
              <Button
                type="submit"
                loading={loading}
                className="shine-on-hover w-full py-3.5 text-sm font-semibold rounded-2xl mt-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                Se connecter
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6 anim-fade-up d7">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-violet-600 hover:text-violet-700 font-semibold transition-colors">
              Créer un compte
            </Link>
          </p>

          <div className="mt-8 text-center anim-fade-up d8">
            <Link to="/" className="text-xs text-gray-400 hover:text-violet-500 transition-colors">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}