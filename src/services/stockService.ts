import api from './api';

export const stockService = {
  getStock: () => api.get('/stock'),
  addMedication: (data: any) => api.post('/stock', data),
  updateStock: (id: string, data: any) => api.put(`/stock/${id}`, data),
  getAlerts: () => api.get('/stock/alerts'),
};