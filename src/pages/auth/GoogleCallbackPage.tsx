import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';

/**
 * GoogleCallbackPage
 * Route : /auth/google/callback
 *
 * Le backend redirige ici après l'authentification Google avec :
 * ?accessToken=xxx&refreshToken=yyy
 *
 * Cette page stocke les tokens dans Redux + localStorage
 * puis redirige vers le bon dashboard.
 */
export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const error = params.get('error');

    if (error === 'google_cancelled') {
      navigate('/login', { state: { error: 'Connexion Google annulée.' } });
      return;
    }

    if (!accessToken || !refreshToken) {
      navigate('/login', { state: { error: 'Erreur lors de la connexion Google.' } });
      return;
    }

    // Décoder le JWT pour récupérer le rôle (sans librairie externe)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));

      dispatch(setCredentials({
        accessToken,
        refreshToken,
        user: {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          firstName: payload.firstName || '',
          lastName: payload.lastName || '',
        },
      }));

      // Redirection selon le rôle
      if (payload.role === 'SUPER_ADMIN') navigate('/admin');
      else if (payload.role === 'PHARMACY_ADMIN') navigate('/pharmacy');
      else navigate('/');
    } catch {
      navigate('/login', { state: { error: 'Token invalide, veuillez réessayer.' } });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm font-medium">Connexion en cours…</p>
      </div>
    </div>
  );
}