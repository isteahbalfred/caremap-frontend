import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';

type Role = 'PATIENT' | 'PHARMACY_ADMIN' | 'CLINIC_ADMIN';

const ROLES = [
  {
    id: 'PATIENT' as Role,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: 'Patient',
    desc: 'Je cherche des médicaments et des soins',
    accent: 'text-blue-600 bg-blue-50 border-blue-200',
    selectedBorder: 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg shadow-blue-500/15',
    dot: 'bg-blue-500',
    glow: 'shadow-blue-400/40',
  },
  {
    id: 'PHARMACY_ADMIN' as Role,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: 'Pharmacien',
    desc: 'Je gère une pharmacie et mes stocks',
    accent: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    selectedBorder: 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg shadow-emerald-500/15',
    dot: 'bg-emerald-500',
    glow: 'shadow-emerald-400/40',
  },
  {
    id: 'CLINIC_ADMIN' as Role,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: 'Clinique',
    desc: 'Je gère une clinique ou un cabinet médical',
    accent: 'text-violet-600 bg-violet-50 border-violet-200',
    selectedBorder: 'border-violet-500 bg-gradient-to-br from-violet-50 to-fuchsia-50 shadow-lg shadow-violet-500/15',
    dot: 'bg-violet-500',
    glow: 'shadow-violet-400/40',
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>('PATIENT');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const selectedRole = ROLES.find(r => r.id === role)!;

  const passwordRules = [
    { test: form.password.length >= 8, label: 'Au moins 8 caractères' },
    { test: /[A-Z]/.test(form.password), label: 'Une lettre majuscule' },
    { test: /[0-9]/.test(form.password), label: 'Un chiffre' },
  ];
  const passwordStrength = passwordRules.filter(r => r.test).length;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (passwordStrength < 3) {
      setError('Le mot de passe ne respecte pas tous les critères.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await authService.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      navigate('/login', {
        state: {
          success: 'Compte créé avec succès ! Connectez-vous maintenant.',
          email: form.email,
        }
      });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Erreur lors de l\'inscription.';
      setError(msg);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  const strengthColor = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][passwordStrength] || 'bg-gray-200';

  return (
    <div className="min-h-screen flex bg-[#f7f7fb] relative overflow-hidden">
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes scaleIn { from { opacity:0; transform: scale(.95); } to { opacity:1; transform: scale(1); } }
        @keyframes slideRight { from { opacity:0; transform: translateX(-16px); } to { opacity:1; transform: translateX(0); } }
        @keyframes blobMove1 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(40px,-60px) scale(1.15); } 66% { transform: translate(-30px,30px) scale(.9); } }
        @keyframes blobMove2 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(-50px,40px) scale(1.2); } 66% { transform: translate(35px,-25px) scale(.85); } }
        @keyframes blobMove3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(25px,35px) scale(1.1); } }
        @keyframes glowPulse { 0%,100% { opacity:.5; transform: scale(1); } 50% { opacity:.9; transform: scale(1.08); } }
        @keyframes particleRise { 0% { transform: translateY(0); opacity:0; } 10% { opacity:.5; } 90% { opacity:.2; } 100% { transform: translateY(-340px); opacity:0; } }
        @keyframes gridPan { from { background-position: 0 0; } to { background-position: 64px 64px; } }
        @keyframes checkPop { 0% { transform: scale(0); } 60% { transform: scale(1.3); } 100% { transform: scale(1); } }

        .anim-fade-up { opacity:0; animation: fadeInUp .7s cubic-bezier(.16,1,.3,1) forwards; }
        .anim-fade-in { opacity:0; animation: fadeIn .8s ease forwards; }
        .anim-scale-in { opacity:0; animation: scaleIn .5s cubic-bezier(.16,1,.3,1) forwards; }
        .anim-slide-right { opacity:0; animation: slideRight .5s cubic-bezier(.16,1,.3,1) forwards; }
        .d1 { animation-delay: .05s } .d2 { animation-delay: .12s } .d3 { animation-delay: .2s }
        .d4 { animation-delay: .28s } .d5 { animation-delay: .36s } .d6 { animation-delay: .44s }
        .d7 { animation-delay: .52s } .d8 { animation-delay: .6s } .d9 { animation-delay: .68s }

        .blob-1 { animation: blobMove1 16s ease-in-out infinite; }
        .blob-2 { animation: blobMove2 20s ease-in-out infinite; }
        .blob-3 { animation: blobMove3 14s ease-in-out infinite; }
        .glow-pulse { animation: glowPulse 3s ease-in-out infinite; }
        .grid-pan { animation: gridPan 6s linear infinite; }
        .check-pop { animation: checkPop .3s cubic-bezier(.34,1.56,.64,1) forwards; }

        .particle { position:absolute; bottom:-10px; border-radius:50%; background:rgba(255,255,255,.8); animation: particleRise linear infinite; }

        .shine-on-hover { position:relative; overflow:hidden; }
        .shine-on-hover::after { content:''; position:absolute; top:0; left:-75%; width:50%; height:100%; background:linear-gradient(120deg, transparent, rgba(255,255,255,.5), transparent); transform:skewX(-20deg); transition: left .7s ease; }
        .shine-on-hover:hover::after { left:125%; }

        .role-card { transition: all .3s cubic-bezier(.16,1,.3,1); }
        .role-card:hover { transform: translateY(-3px); }
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
            Rejoignez la{' '}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent">
              plateforme médicale
            </span>{' '}
            d'Haïti.
          </h2>
          <p className="text-violet-200/80 text-lg leading-relaxed mb-12 anim-fade-up d3">
            Créez votre compte gratuitement et accédez à des milliers de ressources médicales.
          </p>

          {/* Étapes visuelles */}
          <div className="space-y-3">
            {[
              { num: 1, label: 'Informations personnelles', done: step > 1 },
              { num: 2, label: 'Choisir votre profil', done: false },
            ].map((s, i) => (
              <div
                key={s.num}
                className={`anim-fade-up d${4 + i} flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 border ${
                  s.num === step
                    ? 'bg-white/15 border-violet-300/30 shadow-lg shadow-violet-900/30'
                    : s.done
                    ? 'bg-white/10 border-white/10'
                    : 'opacity-40 border-transparent'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all duration-300 ${
                  s.done
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                    : s.num === step
                    ? 'bg-gradient-to-br from-fuchsia-400 to-violet-400 text-gray-900 glow-pulse'
                    : 'bg-white/20 text-white'
                }`}>
                  {s.done ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s.num}
                </div>
                <span className="text-white font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-violet-300/70 text-sm anim-fade-in d6">
          © {new Date().getFullYear()} CareMap — Tous droits réservés
        </div>
      </div>

      {/* Panneau droit */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto relative z-10">
        <div className="w-full max-w-[420px]">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8 anim-fade-up d1">
            <span className="text-2xl">🗺️</span>
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent text-xl font-bold">
              CareMap
            </span>
          </div>

          {/* Barre de progression mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8 anim-fade-up d2">
            {[1, 2].map(s => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  s <= step ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* ── ÉTAPE 1 ── */}
          {step === 1 && (
            <div>
              <div className="mb-8 anim-fade-up d2">
                <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Étape 1 / 2</p>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
                <p className="text-gray-500">Gratuit, sans engagement.</p>
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-6 text-sm anim-scale-in">
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Google */}
              <button
                onClick={handleGoogleRegister}
                type="button"
                className="shine-on-hover anim-fade-up d3 w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-700 font-medium text-sm hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5 hover:border-violet-300 transition-all duration-300 mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuer avec Google
              </button>

              <div className="flex items-center gap-3 mb-6 anim-fade-in d3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <form onSubmit={handleNextStep} className="space-y-4">
                <div className="grid grid-cols-2 gap-3 anim-fade-up d4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-violet-500/15 focus:border-violet-500 focus:bg-white transition-all duration-300 placeholder-gray-400"
                      placeholder="Jean"
                      value={form.firstName}
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-violet-500/15 focus:border-violet-500 focus:bg-white transition-all duration-300 placeholder-gray-400"
                      placeholder="Pierre"
                      value={form.lastName}
                      onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="anim-fade-up d5">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse email</label>
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

                <div className="anim-fade-up d6">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe</label>
                  <div className="relative group">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-violet-500/15 focus:border-violet-500 focus:bg-white transition-all duration-300 placeholder-gray-400"
                      placeholder="Min. 8 caractères"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      required
                      autoComplete="new-password"
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

                  {/* Barre de force */}
                  {form.password && (
                    <div className="mt-2 anim-fade-in">
                      <div className="flex gap-1 mb-2">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              i < passwordStrength ? strengthColor : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="space-y-1">
                        {passwordRules.map(rule => (
                          <div key={rule.label} className="flex items-center gap-2 text-xs">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                              rule.test ? 'bg-green-500' : 'bg-gray-200'
                            }`}>
                              {rule.test && (
                                <svg className="w-2.5 h-2.5 text-white check-pop" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`transition-colors duration-300 ${rule.test ? 'text-green-600' : 'text-gray-400'}`}>{rule.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="anim-fade-up d7">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-2xl text-sm outline-none focus:ring-4 focus:bg-white transition-all duration-300 placeholder-gray-400 ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? 'border-red-300 focus:ring-red-400/15'
                        : 'border-gray-200 focus:ring-violet-500/15 focus:border-violet-500'
                    }`}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    required
                    autoComplete="new-password"
                  />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 anim-fade-in">
                      <span>⚠️</span> Les mots de passe ne correspondent pas
                    </p>
                  )}
                </div>

                <div className="anim-fade-up d8">
                  <Button type="submit" className="shine-on-hover w-full py-3.5 text-sm font-semibold rounded-2xl mt-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-300">
                    Continuer
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6 anim-fade-up d9">
                Déjà un compte ?{' '}
                <Link to="/login" className="text-violet-600 hover:text-violet-700 font-semibold transition-colors">
                  Se connecter
                </Link>
              </p>
            </div>
          )}

          {/* ── ÉTAPE 2 ── */}
          {step === 2 && (
            <div>
              <div className="mb-8 anim-fade-up d1">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-violet-600 transition-colors mb-4 group"
                >
                  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Retour
                </button>
                <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Étape 2 / 2</p>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Votre profil</h1>
                <p className="text-gray-500">Quel est votre rôle sur CareMap ?</p>
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-6 text-sm anim-scale-in">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}

              <div className="space-y-3 mb-6">
                {ROLES.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`anim-slide-right d${2 + i} role-card w-full p-4 rounded-2xl border-2 text-left ${
                      role === r.id
                        ? r.selectedBorder
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all duration-300 ${r.accent} ${role === r.id ? `shadow-md ${r.glow}` : ''}`}>
                        {r.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">{r.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        role === r.id ? `border-current ${r.dot}` : 'border-gray-300'
                      }`}>
                        {role === r.id && <div className="w-2 h-2 rounded-full bg-white check-pop" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Note pour rôles pro */}
              {(role === 'PHARMACY_ADMIN' || role === 'CLINIC_ADMIN') && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-2xl mb-6 text-sm anim-scale-in">
                  <span className="mt-0.5 flex-shrink-0">ℹ️</span>
                  <span>
                    Votre compte sera créé en tant que <strong>Patient</strong>. Après connexion, contactez l'administrateur pour activer votre accès{' '}
                    {role === 'PHARMACY_ADMIN' ? 'Pharmacien' : 'Clinique'}.
                  </span>
                </div>
              )}

              {/* Résumé */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 anim-fade-up d5">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-3">Récapitulatif</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Nom</span>
                    <span className="font-semibold text-gray-800">{form.firstName} {form.lastName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Email</span>
                    <span className="font-semibold text-gray-800 truncate ml-4 max-w-[180px]">{form.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Profil</span>
                    <span className="font-semibold text-gray-800">{selectedRole.title}</span>
                  </div>
                </div>
              </div>

              <div className="anim-fade-up d6">
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  className="shine-on-hover w-full py-3.5 text-sm font-semibold rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Créer mon compte
                </Button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed anim-fade-in d7">
                En créant un compte, vous acceptez les{' '}
                <Link to="/terms" className="underline hover:text-violet-600 transition-colors">conditions d'utilisation</Link>{' '}
                de CareMap.
              </p>
            </div>
          )}

          <div className="text-center mt-8 anim-fade-in">
            <Link to="/" className="text-xs text-gray-400 hover:text-violet-500 transition-colors">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}