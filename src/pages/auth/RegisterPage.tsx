import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';

type Role = 'PATIENT' | 'PHARMACY_ADMIN' | 'CLINIC_ADMIN';

const ROLES = [
  {
    id: 'PATIENT' as Role,
    icon: '👤',
    title: 'Patient',
    desc: 'Je cherche des médicaments et des soins médicaux',
    color: 'border-blue-200 hover:border-blue-500',
    selected: 'border-blue-500 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'PHARMACY_ADMIN' as Role,
    icon: '🏪',
    title: 'Pharmacien',
    desc: 'Je gère une pharmacie et mes stocks de médicaments',
    color: 'border-green-200 hover:border-green-500',
    selected: 'border-green-500 bg-green-50',
    badge: 'bg-green-100 text-green-700',
  },
  {
    id: 'CLINIC_ADMIN' as Role,
    icon: '🏥',
    title: 'Clinique',
    desc: 'Je gère une clinique ou un cabinet médical',
    color: 'border-purple-200 hover:border-purple-500',
    selected: 'border-purple-500 bg-purple-50',
    badge: 'bg-purple-100 text-purple-700',
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

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError('Le mot de passe doit contenir au moins une majuscule');
      return;
    }
    if (!/[0-9]/.test(form.password)) {
      setError('Le mot de passe doit contenir au moins un chiffre');
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
      const msg = err.response?.data?.error?.message || 'Erreur lors de l\'inscription';
      setError(msg);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Côté gauche */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-800 via-primary-700 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-16 text-center">
          <div className="text-8xl mb-8">🗺️</div>
          <h1 className="text-4xl font-bold mb-4">CareMap</h1>
          <p className="text-xl text-blue-200 mb-10">
            Rejoignez la plateforme médicale d'Haïti
          </p>

          {/* Étapes visuelles */}
          <div className="w-full max-w-xs space-y-4">
            {[
              { num: 1, title: 'Informations personnelles', active: step === 1 },
              { num: 2, title: 'Choisir votre rôle', active: step === 2 },
            ].map(s => (
              <div
                key={s.num}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  s.active ? 'bg-white/20' : 'opacity-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  s.active ? 'bg-yellow-400 text-gray-900' : 'bg-white/20 text-white'
                }`}>
                  {s.num}
                </div>
                <span className="text-white font-medium">{s.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Côté droit */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-5xl mb-2">🗺️</div>
            <h1 className="text-2xl font-bold text-primary-700">CareMap</h1>
          </div>

          {/* Indicateur d'étapes mobile */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            {[1, 2].map(s => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition-all ${
                  s <= step ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* ÉTAPE 1 — Informations */}
          {step === 1 && (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="mb-8">
                <div className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-1">
                  Étape 1 sur 2
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Créer votre compte
                </h2>
                <p className="text-gray-500">
                  Rejoignez CareMap gratuitement
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleNextStep} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white transition-all"
                      placeholder="Jean"
                      value={form.firstName}
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white transition-all"
                      placeholder="Pierre"
                      value={form.lastName}
                      onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white transition-all"
                    placeholder="votre@email.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white transition-all pr-12"
                      placeholder="Min. 8 caractères"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>

                  {/* Indicateur force mot de passe */}
                  {form.password && (
                    <div className="mt-2 space-y-1">
                      {[
                        { test: form.password.length >= 8, label: 'Au moins 8 caractères' },
                        { test: /[A-Z]/.test(form.password), label: 'Une majuscule' },
                        { test: /[0-9]/.test(form.password), label: 'Un chiffre' },
                      ].map(rule => (
                        <div key={rule.label} className="flex items-center gap-2 text-xs">
                          <span className={rule.test ? 'text-green-500' : 'text-gray-300'}>
                            {rule.test ? '✅' : '○'}
                          </span>
                          <span className={rule.test ? 'text-green-600' : 'text-gray-400'}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white transition-all ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-200'
                    }`}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    required
                  />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      Les mots de passe ne correspondent pas
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full py-3 text-base font-semibold mt-2">
                  Continuer →
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Déjà un compte ?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Se connecter
                </Link>
              </p>
            </div>
          )}

          {/* ÉTAPE 2 — Choix du rôle */}
          {step === 2 && (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="mb-8">
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4"
                >
                  ← Retour
                </button>
                <div className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-1">
                  Étape 2 sur 2
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Votre profil
                </h2>
                <p className="text-gray-500">
                  Choisissez votre rôle sur CareMap
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-3 mb-6">
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                      role === r.id ? r.selected : r.color + ' bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{r.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{r.title}</span>
                          {role === r.id && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.badge}`}>
                              Sélectionné
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{r.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        role === r.id ? 'border-current bg-current' : 'border-gray-300'
                      }`}>
                        {role === r.id && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Note pour pharmacien/clinique */}
              {(role === 'PHARMACY_ADMIN' || role === 'CLINIC_ADMIN') && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-700">
                  ℹ️ Votre compte sera créé en tant que <strong>Patient</strong>. 
                  Après connexion, contactez l'administrateur pour activer votre rôle {role === 'PHARMACY_ADMIN' ? 'Pharmacien' : 'Clinique'}.
                </div>
              )}

              {/* Résumé */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
                  Résumé du compte
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nom</span>
                    <span className="font-medium text-gray-800">
                      {form.firstName} {form.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-800">{form.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Profil</span>
                    <span className="font-medium text-gray-800">
                      {selectedRole.icon} {selectedRole.title}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                loading={loading}
                className="w-full py-3 text-base font-semibold"
              >
                Créer mon compte
              </Button>

              <p className="text-center text-xs text-gray-400 mt-4">
                En créant un compte, vous acceptez les conditions d'utilisation de CareMap
              </p>
            </div>
          )}

          <div className="text-center mt-4">
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}