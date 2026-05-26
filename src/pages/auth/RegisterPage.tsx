import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.register(form);
      setSuccess(true);

      setTimeout(() => navigate('/login'), 1800);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Une erreur est survenue lors de l'inscription"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-100 flex items-center justify-center p-4">
      
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700">
            🗺️ CareMap
          </h1>

          <p className="text-gray-600 mt-2 text-sm">
            Créez votre compte en quelques secondes
          </p>

          {/* Slogan */}
          <p className="text-primary-500 mt-3 text-sm font-medium">
            “Localisez rapidement les médicaments essentiels près de vous.”
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            ✅ Compte créé avec succès. Redirection vers la connexion...
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* First + Last name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                placeholder="Jean"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 transition"
                value={form.firstName}
                onChange={e =>
                  setForm(f => ({ ...f, firstName: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                placeholder="Pierre"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 transition"
                value={form.lastName}
                onChange={e =>
                  setForm(f => ({ ...f, lastName: e.target.value }))
                }
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <input
              type="email"
              placeholder="votre@email.com"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 transition"
              value={form.email}
              onChange={e =>
                setForm(f => ({ ...f, email: e.target.value }))
              }
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 transition"
              value={form.password}
              onChange={e =>
                setForm(f => ({ ...f, password: e.target.value }))
              }
              required
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            loading={loading}
            className="w-full mt-2"
          >
            Créer mon compte
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link
            to="/login"
            className="text-primary-600 hover:underline font-medium"
          >
            Se connecter
          </Link>
        </p>

        {/* Trust line */}
        <p className="text-center text-xs text-gray-400 mt-4">
          🔒 Vos données sont sécurisées et protégées
        </p>
      </div>
    </div>
  );
}