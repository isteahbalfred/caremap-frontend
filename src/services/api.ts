import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur requête — ajoute le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur réponse — gère les 401 SANS forcer de redirection globale.
// On nettoie juste les tokens invalides ; c'est ProtectedRoute (via le
// state Redux `isAuthenticated`) qui décide s'il faut renvoyer vers /login,
// et seulement pour les routes qui l'exigent réellement.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register');

      // Ne nettoie les tokens que si ce n'est pas une tentative de login/register
      // qui a simplement échoué (mauvais mot de passe, par ex.)
      if (!isAuthRoute) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

export default api;