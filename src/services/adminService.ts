import api from './api';

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getPendingPharmacies: () => api.get('/admin/pharmacies/pending'),
  validatePharmacy: (id: string, validate: boolean) =>
    api.patch(`/admin/pharmacies/${id}/validate`, { validate }),
  toggleUser: (id: string) => api.patch(`/admin/users/${id}/toggle`),

 getPharmacies: (params?: { search?: string; department?: string; city?: string; status?: string }) =>
     api.get('/admin/pharmacies', { params }),
  togglePharmacyStatus: (id: string, isActive: boolean) =>
    api.patch(`/admin/pharmacies/${id}/status`, { isActive }),
  deletePharmacy: (id: string) => api.delete(`/admin/pharmacies/${id}`),
 };
