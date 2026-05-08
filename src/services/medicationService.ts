import api from './api';

export const medicationService = {
  getAll: (params?: any) => api.get('/medications', { params }),
  getById: (id: string) => api.get(`/medications/${id}`),
  getCategories: () => api.get('/medications/categories'),
};