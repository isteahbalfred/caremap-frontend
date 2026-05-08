import api from './api';

export const pharmacyService = {
  getAll: (params?: any) => api.get('/pharmacies', { params }),
  getById: (id: string) => api.get(`/pharmacies/${id}`),
  create: (data: any) => api.post('/pharmacies', data),
  update: (id: string, data: any) => api.put(`/pharmacies/${id}`, data),
  getDashboard: () => api.get('/pharmacies/my/dashboard'),
};