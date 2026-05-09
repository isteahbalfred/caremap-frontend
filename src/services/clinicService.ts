import api from './api';

export const clinicService = {
  getAll: (params?: any) => api.get('/clinics', { params }),
  getById: (id: string) => api.get(`/clinics/${id}`),
  create: (data: any) => api.post('/clinics', data),
  update: (id: string, data: any) => api.put(`/clinics/${id}`, data),
  getMy: () => api.get('/clinics/my/clinic'),
};