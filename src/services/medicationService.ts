import api from './api';

export const medicationService = {
  // Récupérer tous les médicaments avec filtres et pagination
  getAll: (params?: {
    search?: string;
    city?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
  }) => api.get('/medications', { params }),

  // Récupérer un médicament par son ID
  getById: (id: string) => api.get(`/medications/${id}`),

  // Récupérer toutes les catégories
  getCategories: () => api.get('/medications/categories'),

  // Créer un médicament (admin seulement)
  create: (data: {
    name: string;
    genericName?: string;
    description?: string;
    imageUrl?: string;
    categoryId: string;
  }) => api.post('/medications', data),

  // Modifier un médicament (admin seulement)
  update: (id: string, data: {
    name?: string;
    genericName?: string;
    description?: string;
    imageUrl?: string;
    categoryId?: string;
  }) => api.put(`/medications/${id}`, data),
};