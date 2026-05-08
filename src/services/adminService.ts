import api from './api';

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getPendingPharmacies: () => api.get('/admin/pharmacies/pending'),
  validatePharmacy: (id: string, validate: boolean) =>
    api.patch(`/admin/pharmacies/${id}/validate`, { validate }),
  toggleUser: (id: string) => api.patch(`/admin/users/${id}/toggle`),
};